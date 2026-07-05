import { FlagixConfig, EvaluationContext, EvaluationResult, CacheUpdateCallback, ReadinessCallback } from './types';
import { EvaluationClient } from './api-client';
import { CacheManager } from './cache';
import { InMemoryStorage } from './storage/in-memory';
import { LocalStorageStorage } from './storage/local-storage';
import { hashContext } from './utils/hashing';
import { SseClient } from './sse';

export class FlagixClient {
  private readonly evaluationClient: EvaluationClient;
  private readonly cacheManager: CacheManager;
  private readonly sseClient: SseClient;
  private readonly config: FlagixConfig;
  private context: EvaluationContext | null = null;
  private contextHash: string = '';
  private subscribers = new Set<CacheUpdateCallback>();
  private readinessSubscribers = new Set<ReadinessCallback>();
  private isReady = false;
  private isInitialized = false;
  private pendingFetch: Promise<void> | null = null;
  private snapshot: Record<string, EvaluationResult> = {};
  private static readonly EMPTY_FLAGS: Record<string, EvaluationResult> = {};

  constructor(config: FlagixConfig) {
    this.config = config;
    const storage = config.persistent ? new LocalStorageStorage() : new InMemoryStorage();
    const baseUrl = config.baseUrl || 'http://localhost:9000/api/v1';
    
    this.evaluationClient = new EvaluationClient(config.sdkKey, baseUrl);
    this.cacheManager = new CacheManager(storage, config.sdkKey, config.ttl);
    
    this.sseClient = new SseClient({
      baseUrl: baseUrl,
      sdkKey: config.sdkKey,
      onMessage: (event) => this.handleSseMessage(event),
      reconnectJitter: config.reconnectJitter,
    });
  }

  private setReady(ready: boolean): void {
    this.isReady = ready;
    this.readinessSubscribers.forEach((cb) => {
      try {
        cb(ready);
      } catch (e) {
        console.error('Flagix: Error in readiness callback', e);
      }
    });
  }

  /**
   * Initializes the SDK with a user context.
   * Loads cached flags from storage, starts real-time sync, and triggers an eager fetch.
   */
  async init(context: EvaluationContext): Promise<void> {
    this.context = context;
    this.contextHash = hashContext(context);
    
    if (this.config.initialFlags) {
      await this.cacheManager.save(this.config.initialFlags, this.contextHash);
      this.notifySubscribers(this.config.initialFlags);
      this.isInitialized = true;
      this.setReady(true);
      this.sseClient.connect();
      return;
    }

    await this.cacheManager.load();
    this.isInitialized = true;

    const cachedFlags = this.cacheManager.getFlags(this.contextHash);
    const cacheExpired = this.cacheManager.isExpired();

    if (cachedFlags && !cacheExpired) {
      this.notifySubscribers(cachedFlags);
      this.setReady(true);
      this.sseClient.connect();
      return;
    }

    this.sseClient.connect();

    try {
      await this.fetchFlags();
      this.setReady(true);
    } catch (e) {
      if (cachedFlags) {
        this.notifySubscribers(cachedFlags);
        this.setReady(true);
      } else {
        console.error('Flagix: Failed to initialize and no cached flags available', e);
      }
    }
  }

  /**
   * Updates the evaluation context. 
   * Clears the current cache and triggers a fresh fetch of all flags.
   */
  async setContext(context: EvaluationContext): Promise<void> {
    const newHash = hashContext(context);
    
    if (newHash !== this.contextHash) {
      this.context = context;
      this.contextHash = newHash;
      await this.cacheManager.clear();
      await this.fetchFlags();
    }
  }

  /**
   * Internal method to fetch flags from the backend.
   * If flagKey is provided, performs a targeted re-fetch.
   */
  private async fetchFlags(flagKey?: string): Promise<void> {
    if (!this.context) return;

    if (this.pendingFetch) {
      await this.pendingFetch;
      return;
    }

    this.pendingFetch = (async () => {
      try {
        if (flagKey) {
          const result = await this.evaluationClient.evaluateFlag(flagKey, this.context!);
          const currentFlags = this.cacheManager.getFlags(this.contextHash) || {};
          currentFlags[flagKey] = result;
          await this.cacheManager.save(currentFlags, this.contextHash);
          this.notifySubscribers(currentFlags);
        } else {
          const flags = await this.evaluationClient.evaluateAll(this.context!);
          await this.cacheManager.save(flags, this.contextHash);
          this.notifySubscribers(flags);
        }
      } catch (e) {
        console.error('Flagix: Failed to fetch flags', e);
      } finally {
        this.pendingFetch = null;
      }
    })();

    await this.pendingFetch;
  }

  /**
   * Handles real-time update events from SSE.
   */
  private handleSseMessage(event: any) {
    if (event && event.flagKey) {
      // Trigger targeted re-fetch for the mutated flag
      this.fetchFlags(event.flagKey);
    } else {
      // Fallback to full re-fetch if event payload is missing flagKey
      this.fetchFlags();
    }
  }

  /**
   * Retrieves a flag value. Returns defaultValue if not found or in case of error.
   */
  getFlagValue<T>(key: string, defaultValue: T): T {
    try {
      const flag = this.getFlag(key);
      if (!flag || flag.resolvedValue === null) return defaultValue;
      return flag.resolvedValue as T;
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * Retrieves full evaluation result for a flag.
   */
  getFlag(key: string): EvaluationResult | null {
    if (!this.isInitialized) return null;
    const flags = this.cacheManager.getFlags(this.contextHash);
    return flags ? flags[key] || null : null;
  }

  /**
   * Retrieves all currently evaluated flags.
   */
  getAllFlags(): Record<string, EvaluationResult> {
    if (!this.isInitialized) return FlagixClient.EMPTY_FLAGS;
    return this.snapshot;
  }

  /**
   * Stateless evaluation — fetches a single flag for the given context directly
   * from the backend without touching the cache or requiring prior init().
   * Suitable for server-side per-request usage.
   */
  async evaluate<T>(key: string, context: EvaluationContext, defaultValue: T): Promise<T> {
    try {
      const result = await this.evaluationClient.evaluateFlag(key, context);
      if (!result || result.resolvedValue === null) return defaultValue;
      return result.resolvedValue as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Stateless evaluation — fetches all active flags for the given context directly
   * from the backend without touching the cache or requiring prior init().
   * Suitable for server-side per-request usage.
   */
  async evaluateAll(context: EvaluationContext): Promise<Record<string, EvaluationResult>> {
    return this.evaluationClient.evaluateAll(context);
  }

  /**
   * Subscribe to cache updates. Returns an unsubscribe function.
   */
  subscribe(callback: CacheUpdateCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Subscribe to SDK readiness state changes.
   */
  onReady(callback: ReadinessCallback): () => void {
    this.readinessSubscribers.add(callback);
    if (this.isReady) {
      callback(true);
    }
    return () => this.readinessSubscribers.delete(callback);
  }

  /**
   * Unsubscribe from readiness state changes.
   */
  offReady(callback: ReadinessCallback): void {
    this.readinessSubscribers.delete(callback);
  }

  /**
   * Returns whether the SDK has completed initialization.
   */
  getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * Closes the SDK and stops real-time sync.
   */
  close(): void {
    this.sseClient.close();
    this.subscribers.clear();
  }

  private notifySubscribers(flags: Record<string, EvaluationResult>): void {
    this.snapshot = { ...flags };
    this.subscribers.forEach((cb) => {
      try {
        cb(flags);
      } catch (e) {
        console.error('Flagix: Error in subscriber callback', e);
      }
    });
  }
}

