import { Module } from '@nestjs/common';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { SegmentsRepository } from './segments.repository';
import { FlagConfigCacheModule } from '../evaluation/flag-config-cache.module';
import { FlagChangesModule } from '../flag-changes/flag-changes.module';

@Module({
  imports: [FlagConfigCacheModule, FlagChangesModule],
  controllers: [SegmentsController],
  providers: [SegmentsService, SegmentsRepository],
  exports: [SegmentsService, SegmentsRepository],
})
export class SegmentsModule {}
