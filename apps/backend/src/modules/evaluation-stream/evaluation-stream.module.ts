import { Module } from '@nestjs/common';
import { EvaluationStreamService } from './evaluation-stream.service';
import { EvaluationStreamController } from './evaluation-stream.controller';

@Module({
  providers: [EvaluationStreamService],
  controllers: [EvaluationStreamController],
  exports: [EvaluationStreamService],
})
export class EvaluationStreamModule {}
