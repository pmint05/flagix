import { Injectable, NotFoundException } from '@nestjs/common';
import { SdkKeysRepository } from './sdk-keys.repository';
import { hashSdkKey, generateRawKey } from '@/common/utils/crypto';
import { CreateSdkKeyDto } from './dto/create-sdk-key.dto';

@Injectable()
export class SdkKeysService {
  constructor(private readonly sdkKeysRepo: SdkKeysRepository) {}

  async create(orgId: string, envId: string, input: CreateSdkKeyDto) {
    const rawKey = generateRawKey();
    const keyHash = hashSdkKey(rawKey);
    const keyHint = rawKey.slice(0, 8);

    const sdkKey = await this.sdkKeysRepo.create({
      organizationId: orgId,
      environmentId: envId,
      name: input.name,
      keyHash,
      keyHint,
      type: input.type,
    });

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

    await this.sdkKeysRepo.softDelete(keyId);
    return { success: true };
  }
}
