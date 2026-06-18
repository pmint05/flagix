import { SdkCache, FlagixStorage, EvaluationResult } from './types';

export class CacheManager {
  private cache: SdkCache | null = null;
  private readonly storageKey: string;

  constructor(
    private readonly storage: FlagixStorage,
    sdkKey: string,
    private readonly ttl: number = 5 * 60 * 1000 // 5 minutes default
  ) {
    this.storageKey = `flagix_cache_${sdkKey}`;
  }

  async load(): Promise<SdkCache | null> {
    const stored = await this.storage.get(this.storageKey);
    if (!stored) return null;

    try {
      this.cache = JSON.parse(stored);
      return this.cache;
    } catch (e) {
      console.error('Failed to parse Flagix cache', e);
      return null;
    }
  }

  async save(flags: Record<string, EvaluationResult>, contextHash: string): Promise<void> {
    this.cache = {
      flags,
      lastUpdated: Date.now(),
      contextHash,
    };
    await this.storage.set(this.storageKey, JSON.stringify(this.cache));
  }

  /**
   * Returns flags if context matches. 
   * Returns null if context changed.
   * Note: TTL check is handled by the caller to decide whether to revalidate.
   */
  getFlags(contextHash: string): Record<string, EvaluationResult> | null {
    if (!this.cache) return null;
    if (this.cache.contextHash !== contextHash) return null;
    return this.cache.flags;
  }

  isExpired(): boolean {
    if (!this.cache) return true;
    return Date.now() - this.cache.lastUpdated > this.ttl;
  }

  async clear(): Promise<void> {
    this.cache = null;
    await this.storage.remove(this.storageKey);
  }
}
