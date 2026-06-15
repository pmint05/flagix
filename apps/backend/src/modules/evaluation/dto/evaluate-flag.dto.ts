import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EvaluationContextDto {
  @ApiProperty({ required: false, example: 'user-123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, example: 'admin' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false, example: { plan: 'pro' } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string | number | boolean>;
}

export class EvaluateFlagDto {
  @ApiProperty({ example: 'dark-mode' })
  @IsString()
  @IsNotEmpty()
  flagKey!: string;

  @ApiProperty({ type: EvaluationContextDto })
  @ValidateNested()
  @Type(() => EvaluationContextDto)
  context!: EvaluationContextDto;
}
