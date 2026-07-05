import {
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SdkKeysRepository } from './sdk-keys.repository';
import { hashSdkKey, generateRawKey } from '@/common/utils/crypto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getActorId } from '@/common/audit/audit-context';
import { resolveSdkKeyAction } from '@/common/audit/resolve-action';
import { sanitizeSdkKey } from '@/common/audit/sanitize';
import { environments } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { CreateSdkKeyDto } from './dto/create-sdk-key.dto';
import { IOREDIS_CACHE } from '@/modules/bullmq/bullmq.module';
import Redis from 'ioredis';

function maskKey(type: 'client' | 'server', hint: string): string {
  const prefix = type === 'client' ? 'sdk_client_' : 'sdk_server_';
  return `${prefix}${hint}${'•'.repeat(24)}`;
}

@Injectable()
export class SdkKeysService {
  constructor(
    private readonly sdkKeysRepo: SdkKeysRepository,
    @Inject(DATABASE) private readonly db: Database,
    @Inject(IOREDIS_CACHE) private readonly redis: Redis,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(orgId: string, envId: string, input: CreateSdkKeyDto) {
    const rawKey = generateRawKey().replace(
      'fkx_',
      `sdk_${input.type === 'client' ? 'client' : 'server'}_`,
    );
    const keyHash = hashSdkKey(rawKey);
    // Prefix is 11 characters (sdk_client_ or sdk_server_), take keyHint from random string part (length 8)
    const keyHint = rawKey.slice(11, 19);

    const actorId = getActorId();
    const sdkKey = await this.sdkKeysRepo.create(
      {
        organizationId: orgId,
        environmentId: envId,
        name: input.name,
        keyHash,
        keyHint,
        type: input.type,
        rawKey: input.type === 'client' ? rawKey : null,
      },
      actorId,
    );

    const [env] = await this.db
      .select({ projectId: environments.projectId })
      .from(environments)
      .where(eq(environments.id, envId))
      .limit(1);

    // Save to Redis cache
    const cacheVal = {
      id: sdkKey.id,
      organizationId: orgId,
      projectId: env?.projectId,
      environmentId: envId,
      type: sdkKey.type,
      isActive: sdkKey.isActive,
    };
    await this.redis.set(`sdk_key:${keyHash}`, JSON.stringify(cacheVal));

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: env?.projectId,
        environmentId: envId,
        entityType: 'sdk_key',
        entityId: sdkKey.id,
        before: null,
        after: sdkKey,
        resolveAction: resolveSdkKeyAction,
        sanitize: sanitizeSdkKey,
      });
    }

    return {
      id: sdkKey.id,
      environmentId: sdkKey.environmentId,
      name: sdkKey.name,
      type: sdkKey.type,
      keyHint: sdkKey.keyHint,
      maskedKey: maskKey(sdkKey.type, sdkKey.keyHint),
      rawKey,
      isActive: sdkKey.isActive,
      createdAt: sdkKey.createdAt,
    };
  }

  async findAllForEnv(orgId: string, envId: string) {
    const keys = await this.sdkKeysRepo.findAllForEnv(envId);
    return keys.map((key) => ({
      ...key,
      maskedKey: maskKey(key.type, key.keyHint),
    }));
  }

  async toggleActive(
    orgId: string,
    envId: string,
    keyId: string,
    isActive: boolean,
  ) {
    const key = await this.sdkKeysRepo.findById(keyId);
    if (!key || key.organizationId !== orgId || key.environmentId !== envId)
      throw new NotFoundException('SDK key not found');

    const actorId = getActorId();
    const updated = await this.sdkKeysRepo.updateStatus(
      keyId,
      isActive,
      actorId,
    );

    if (updated) {
      const [env] = await this.db
        .select({ projectId: environments.projectId })
        .from(environments)
        .where(eq(environments.id, envId))
        .limit(1);

      // Update Redis cache
      const cacheVal = {
        id: updated.id,
        organizationId: orgId,
        projectId: env?.projectId,
        environmentId: envId,
        type: updated.type,
        isActive: updated.isActive,
      };
      await this.redis.set(`sdk_key:${updated.keyHash}`, JSON.stringify(cacheVal));

      if (this.auditLogsService) {
        await this.auditLogsService.recordChange({
          organizationId: orgId,
          projectId: env?.projectId,
          environmentId: envId,
          entityType: 'sdk_key',
          entityId: keyId,
          before: key,
          after: updated,
          resolveAction: resolveSdkKeyAction,
          sanitize: sanitizeSdkKey,
        });
      }
    }

    return {
      success: true,
      sdkKey: updated
        ? {
            ...updated,
            maskedKey: maskKey(updated.type, updated.keyHint),
          }
        : null,
    };
  }

  async revoke(orgId: string, envId: string, keyId: string) {
    const key = await this.sdkKeysRepo.findById(keyId);
    if (!key || key.organizationId !== orgId || key.environmentId !== envId)
      throw new NotFoundException('SDK key not found');

    const actorId = getActorId();
    const deleted = await this.sdkKeysRepo.softDelete(keyId, actorId);

    if (deleted) {
      // Evict from Redis
      await this.redis.del(`sdk_key:${key.keyHash}`);

      if (this.auditLogsService) {
        const [env] = await this.db
          .select({ projectId: environments.projectId })
          .from(environments)
          .where(eq(environments.id, envId))
          .limit(1);

        await this.auditLogsService.recordChange({
          organizationId: orgId,
          projectId: env?.projectId,
          environmentId: envId,
          entityType: 'sdk_key',
          entityId: keyId,
          before: key,
          after: deleted,
          resolveAction: resolveSdkKeyAction,
          sanitize: sanitizeSdkKey,
        });
      }
    }

    return { success: true };
  }
}
