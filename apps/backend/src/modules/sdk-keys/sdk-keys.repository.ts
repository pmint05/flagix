import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { sdkKeys } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';

@Injectable()
export class SdkKeysRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [key] = await this.db
      .select()
      .from(sdkKeys)
      .where(and(eq(sdkKeys.id, id), isNull(sdkKeys.deletedAt)))
      .limit(1);
    return key ?? null;
  }

  async findByHash(hash: string) {
    const [key] = await this.db
      .select()
      .from(sdkKeys)
      .where(and(eq(sdkKeys.keyHash, hash), isNull(sdkKeys.deletedAt)))
      .limit(1);
    return key ?? null;
  }

  async findAllForEnv(envId: string) {
    return this.db
      .select()
      .from(sdkKeys)
      .where(and(eq(sdkKeys.environmentId, envId), isNull(sdkKeys.deletedAt)));
  }

  async create(
    input: {
      organizationId: string;
      environmentId: string;
      name: string;
      keyHash: string;
      keyHint: string;
      type: string;
    },
    actorId?: string,
  ) {
    const [key] = await this.db
      .insert(sdkKeys)
      .values({
        organizationId: input.organizationId,
        environmentId: input.environmentId,
        name: input.name,
        keyHash: input.keyHash,
        keyHint: input.keyHint,
        type: input.type as 'client' | 'server',
        createdBy: actorId ?? null,
      })
      .returning();
    return key;
  }

  async revoke(id: string, actorId?: string) {
    const [key] = await this.db
      .update(sdkKeys)
      .set({ isActive: false, updatedBy: actorId ?? null })
      .where(eq(sdkKeys.id, id))
      .returning();
    return key ?? null;
  }

  async softDelete(id: string, actorId?: string) {
    const [key] = await this.db
      .update(sdkKeys)
      .set({ deletedAt: new Date(), deletedBy: actorId ?? null })
      .where(eq(sdkKeys.id, id))
      .returning();
    return key ?? null;
  }
}
