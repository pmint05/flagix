import { FlagixConfig, EvaluationContext, EvaluationResult, CacheUpdateCallback } from './types';
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
  private context: EvaluationContext | null = null;
  private contextHash: string = '';
  private subscribers = new Set<CacheUpdateCallback>();
  private isInitialized = false;

  constructor(config: FlagixConfig) {
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

  /**
   * Initializes the SDK with a user context.
   * Loads cached flags from storage, starts real-time sync, and triggers an eager fetch.
   */
  async init(context: EvaluationContext): Promise<void> {
    this.context = context;
    this.contextHash = hashContext(context);
    
    // Load from storage first for immediate availability (even if stale)
    await this.cacheManager.load();
    this.isInitialized = true;

    // Start real-time sync via SSE
    this.sseClient.connect();

    // Trigger eager fetch (Stale-While-Revalidate pattern)
    await this.fetchFlags();
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
    
    try {
      if (flagKey) {
        const result = await this.evaluationClient.evaluateFlag(flagKey, this.context);
        const currentFlags = this.cacheManager.getFlags(this.contextHash) || {};
        currentFlags[flagKey] = result;
        await this.cacheManager.save(currentFlags, this.contextHash);
        this.notifySubscribers(currentFlags);
      } else {
        const flags = await this.evaluationClient.evaluateAll(this.context);
        await this.cacheManager.save(flags, this.contextHash);
        this.notifySubscribers(flags);
      }
    } catch (e) {
      // Principle VI: Fail-Safe Principle. Log but don't propagate.
      console.error('Flagix: Failed to fetch flags', e);
    }
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
      if (!flag) return defaultValue;
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
    if (!this.isInitialized) return {};
    return this.cacheManager.getFlags(this.contextHash) || {};
  }

  /**
   * Subscribe to cache updates. Returns an unsubscribe function.
   */
  subscribe(callback: CacheUpdateCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Closes the SDK and stops real-time sync.
   */
  close(): void {
    this.sseClient.close();
    this.subscribers.clear();
  }

  private notifySubscribers(flags: Record<string, EvaluationResult>): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(flags);
      } catch (e) {
        console.error('Flagix: Error in subscriber callback', e);
      }
    });
  }
}

