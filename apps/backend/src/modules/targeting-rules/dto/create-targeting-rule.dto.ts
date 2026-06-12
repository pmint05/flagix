import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTargetingRuleDto {
  @ApiProperty({ enum: ['kill_switch', 'user', 'role', 'percentage'] })
  @IsEnum(['kill_switch', 'user', 'role', 'percentage'])
  ruleType!: 'kill_switch' | 'user' | 'role' | 'percentage';

  @ApiProperty()
  @IsString()
  variationId!: string;

  @ApiProperty()
  @IsObject()
  conditions!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateTargetingRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;
}
