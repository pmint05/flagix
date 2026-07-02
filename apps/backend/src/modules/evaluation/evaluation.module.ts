import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { FlagLoader } from './flag-loader';
import { FlagConfigCacheModule } from './flag-config-cache.module';
import { EvaluationCollectorModule } from '@/modules/evaluation-collector/evaluation-collector.module';

@Module({
  imports: [FlagConfigCacheModule, EvaluationCollectorModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, FlagLoader],
  exports: [EvaluationService, FlagConfigCacheModule],
})
export class EvaluationModule {}
