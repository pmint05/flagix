import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { sdkKeys, environments } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { hashSdkKey } from '@/common/utils/crypto';
import { IOREDIS_CACHE } from '@/modules/bullmq/bullmq.module';
import Redis from 'ioredis';

interface RequestWithSdkEnv {
  headers: Record<string, string | string[] | undefined>;
  sdkEnvironment?: {
    environmentId: string;
    organizationId: string;
    projectId: string;
    keyType?: 'client' | 'server';
    sdkKeyId?: string;
  };
}

@Injectable()
export class SdkKeyGuard implements CanActivate {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(IOREDIS_CACHE) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();

    let rawKey = request.headers['x-sdk-key'] as string | undefined;

    // Special case: Allow query param for SSE stream endpoint (browser EventSource support)
    const isSseStream =
      request.path?.endsWith('/flags/stream') ||
      request.url?.includes('/flags/stream');
    if (!rawKey && isSseStream) {
      rawKey = request.query?.sdkKey as string | undefined;
    }

    if (!rawKey) {
      throw new UnauthorizedException(
        isSseStream
          ? 'Missing X-SDK-Key header or sdkKey query parameter.'
          : 'Missing X-SDK-Key header.',
      );
    }

    const keyHash = hashSdkKey(rawKey);

    // 1. Try to fetch from Redis Cache
    const cached = await this.redis.get(`sdk_key:${keyHash}`);
    if (cached) {
      const cachedKey = JSON.parse(cached);
      if (!cachedKey.isActive) {
        throw new UnauthorizedException('SDK key is inactive.');
      }

      request.sdkEnvironment = {
        environmentId: cachedKey.environmentId,
        organizationId: cachedKey.organizationId,
        projectId: cachedKey.projectId,
        keyType: cachedKey.type,
        sdkKeyId: cachedKey.id,
      };

      // Asynchronously update lastUsedAt in the background
      this.db
        .update(sdkKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(sdkKeys.id, cachedKey.id))
        .execute()
        .catch((err) => {
          console.error('Failed to update SDK key lastUsedAt:', err);
        });

      return true;
    }

    // 2. Cache Miss: Query Database
    const [sdkKey] = await this.db
      .select()
      .from(sdkKeys)
      .where(and(eq(sdkKeys.keyHash, keyHash), isNull(sdkKeys.deletedAt)))
      .limit(1);

    if (!sdkKey) {
      throw new UnauthorizedException('Invalid SDK key.');
    }

    const [env] = await this.db
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.id, sdkKey.environmentId),
          isNull(environments.deletedAt),
        ),
      )
      .limit(1);

    if (!env) {
      throw new UnauthorizedException('Environment not found');
    }

    // Save to Redis cache
    const cacheVal = {
      id: sdkKey.id,
      organizationId: sdkKey.organizationId,
      projectId: env.projectId,
      environmentId: sdkKey.environmentId,
      type: sdkKey.type,
      isActive: sdkKey.isActive,
    };
    await this.redis.set(`sdk_key:${keyHash}`, JSON.stringify(cacheVal));

    if (!sdkKey.isActive) {
      throw new UnauthorizedException('SDK key is inactive.');
    }

    request.sdkEnvironment = {
      environmentId: sdkKey.environmentId,
      organizationId: sdkKey.organizationId,
      projectId: env.projectId,
      keyType: sdkKey.type,
      sdkKeyId: sdkKey.id,
    };

    // Asynchronously update lastUsedAt in the background
    this.db
      .update(sdkKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(sdkKeys.id, sdkKey.id))
      .execute()
      .catch((err) => {
        console.error('Failed to update SDK key lastUsedAt:', err);
      });

    return true;
  }
}
