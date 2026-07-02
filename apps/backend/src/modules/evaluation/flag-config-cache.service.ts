import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { IOREDIS_CACHE } from '@/modules/bullmq/bullmq.module';
import type { LoadedFlag } from './safe-default.util';

const SINGLE_FLAG_PREFIX = 'flagix:config';
const ALL_FLAGS_SUFFIX = 'flags:all';

@Injectable()
export class FlagConfigCacheService {
  private readonly logger = new Logger(FlagConfigCacheService.name);
  private readonly ttl: number;

  constructor(@Inject(IOREDIS_CACHE) private readonly redis: Redis) {
    this.ttl = parseInt(process.env.FLAG_CONFIG_CACHE_TTL || '60', 10);
    if (this.ttl > 0) {
      this.logger.log(`Flag config cache enabled, TTL=${this.ttl}s`);
    } else {
      this.logger.log('Flag config cache disabled (FLAG_CONFIG_CACHE_TTL=0)');
    }
  }

  private singleKey(envId: string, flagKey: string): string {
    return `${SINGLE_FLAG_PREFIX}:${envId}:flag:${flagKey}`;
  }

  private allKey(envId: string): string {
    return `${SINGLE_FLAG_PREFIX}:${envId}:${ALL_FLAGS_SUFFIX}`;
  }

  async getFlagConfig(
    envId: string,
    flagKey: string,
  ): Promise<LoadedFlag | null> {
    if (this.ttl <= 0) return null;

    try {
      const raw = await this.redis.get(this.singleKey(envId, flagKey));
      if (!raw) return null;
      return JSON.parse(raw) as LoadedFlag;
    } catch (err) {
      this.logger.warn(
        `Cache read error for flag "${flagKey}"`,
        err instanceof Error ? err.message : String(err),
      );
      return null;
    }
  }

  async setFlagConfig(
    envId: string,
    flagKey: string,
    data: LoadedFlag,
  ): Promise<void> {
    if (this.ttl <= 0) return;

    try {
      await this.redis.setex(
        this.singleKey(envId, flagKey),
        this.ttl,
        JSON.stringify(data),
      );
    } catch (err) {
      this.logger.warn(
        `Cache write error for flag "${flagKey}"`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async getAllFlagConfigs(
    envId: string,
  ): Promise<LoadedFlag[] | null> {
    if (this.ttl <= 0) return null;

    try {
      const raw = await this.redis.get(this.allKey(envId));
      if (!raw) return null;
      return JSON.parse(raw) as LoadedFlag[];
    } catch (err) {
      this.logger.warn(
        `Cache read error for all flags in env "${envId}"`,
        err instanceof Error ? err.message : String(err),
      );
      return null;
    }
  }

  async setAllFlagConfigs(
    envId: string,
    data: LoadedFlag[],
  ): Promise<void> {
    if (this.ttl <= 0) return;

    try {
      await this.redis.setex(
        this.allKey(envId),
        this.ttl,
        JSON.stringify(data),
      );
    } catch (err) {
      this.logger.warn(
        `Cache write error for all flags in env "${envId}"`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async invalidateFlag(envId: string, flagKey: string): Promise<void> {
    if (this.ttl <= 0) return;

    try {
      await this.redis.del(this.allKey(envId));
      await this.redis.del(this.singleKey(envId, flagKey));
    } catch (err) {
      this.logger.warn(
        `Cache invalidation error for flag "${flagKey}"`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async invalidateEnv(envId: string): Promise<void> {
    if (this.ttl <= 0) return;

    try {
      const pattern = `${SINGLE_FLAG_PREFIX}:${envId}:*`;
      const keys = await this.scanKeys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn(
        `Cache invalidation error for env "${envId}"`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, found] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...found);
    } while (cursor !== '0');
    return keys;
  }
}
