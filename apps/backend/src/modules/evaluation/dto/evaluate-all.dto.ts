import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EvaluationContextDto } from './evaluate-flag.dto';

export class EvaluateAllDto {
  @ApiProperty({ type: EvaluationContextDto })
  @ValidateNested()
  @Type(() => EvaluationContextDto)
  context!: EvaluationContextDto;
}
