import { Module } from '@nestjs/common';
import { EvaluationAnalyticsService } from './evaluation-analytics.service';
import { EvaluationAnalyticsController } from './evaluation-analytics.controller';

@Module({
  providers: [EvaluationAnalyticsService],
  controllers: [EvaluationAnalyticsController],
  exports: [EvaluationAnalyticsService],
})
export class EvaluationAnalyticsModule {}
