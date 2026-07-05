import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EvaluationContextDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @Transform(({ value }) => value)
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
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
