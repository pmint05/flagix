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

@Injectable()
export class SdkKeysService {
  constructor(
    private readonly sdkKeysRepo: SdkKeysRepository,
    @Inject(DATABASE) private readonly db: Database,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(orgId: string, envId: string, input: CreateSdkKeyDto) {
    const rawKey = generateRawKey();
    const keyHash = hashSdkKey(rawKey);
    const keyHint = rawKey.slice(0, 8);

    const actorId = getActorId();
    const sdkKey = await this.sdkKeysRepo.create(
      {
        organizationId: orgId,
        environmentId: envId,
        name: input.name,
        keyHash,
        keyHint,
        type: input.type,
      },
      actorId,
    );

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
        entityId: sdkKey.id,
        before: null,
        after: sdkKey,
        resolveAction: resolveSdkKeyAction,
        sanitize: sanitizeSdkKey,
      });
    }

    return {
      id: sdkKey.id,
      name: sdkKey.name,
      type: sdkKey.type,
      keyHint: sdkKey.keyHint,
      rawKey,
      isActive: sdkKey.isActive,
      createdAt: sdkKey.createdAt,
    };
  }

  async findAllForEnv(orgId: string, envId: string) {
    return this.sdkKeysRepo.findAllForEnv(envId);
  }

  async revoke(orgId: string, envId: string, keyId: string) {
    const key = await this.sdkKeysRepo.findById(keyId);
    if (!key || key.organizationId !== orgId || key.environmentId !== envId)
      throw new NotFoundException('SDK key not found');

    const actorId = getActorId();
    const revoked = await this.sdkKeysRepo.revoke(keyId, actorId);

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
        after: revoked,
        resolveAction: resolveSdkKeyAction,
        sanitize: sanitizeSdkKey,
      });
    }

    return { success: true };
  }
}
