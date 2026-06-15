import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { FlagLoader } from './flag-loader';

@Module({
  controllers: [EvaluationController],
  providers: [EvaluationService, FlagLoader],
  exports: [EvaluationService],
})
export class EvaluationModule {}
