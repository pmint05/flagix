import { Module } from '@nestjs/common';
import { EvaluationEventsRepository } from './evaluation-events.repository';

@Module({
  providers: [EvaluationEventsRepository],
  exports: [EvaluationEventsRepository],
})
export class EvaluationEventsModule {}
