import { Module } from '@nestjs/common';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { SegmentsRepository } from './segments.repository';
import { FlagConfigCacheModule } from '../evaluation/flag-config-cache.module';

@Module({
  imports: [FlagConfigCacheModule],
  controllers: [SegmentsController],
  providers: [SegmentsService, SegmentsRepository],
  exports: [SegmentsService, SegmentsRepository],
})
export class SegmentsModule {}
