import { Module } from '@nestjs/common';
import { FlagConfigCacheService } from './flag-config-cache.service';

@Module({
  providers: [FlagConfigCacheService],
  exports: [FlagConfigCacheService],
})
export class FlagConfigCacheModule {}
