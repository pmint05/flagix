import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagItemController } from './feature-flag-item.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsRepository } from './feature-flags.repository';

@Module({
  controllers: [FeatureFlagsController, FeatureFlagItemController],
  providers: [FeatureFlagsService, FeatureFlagsRepository],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
