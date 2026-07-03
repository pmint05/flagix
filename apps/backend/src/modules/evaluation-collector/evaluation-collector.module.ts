import { Module } from '@nestjs/common';
import { EvaluationEventsModule } from '@/modules/evaluation-events/evaluation-events.module';
import { EvaluationCollectorService } from './evaluation-collector.service';
import { EvaluationCollectorWorker } from './evaluation-collector.worker';

@Module({
  imports: [EvaluationEventsModule],
  providers: [EvaluationCollectorService, EvaluationCollectorWorker],
  exports: [EvaluationCollectorService],
})
export class EvaluationCollectorModule {}
