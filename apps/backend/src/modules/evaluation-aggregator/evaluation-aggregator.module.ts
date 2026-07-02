import { Module } from '@nestjs/common';
import { EvaluationAggregatorService } from './evaluation-aggregator.service';

@Module({
  providers: [EvaluationAggregatorService],
})
export class EvaluationAggregatorModule {}
