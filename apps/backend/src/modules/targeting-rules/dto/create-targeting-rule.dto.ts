import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsEnum,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTargetingRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ enum: ['kill_switch', 'user', 'role', 'percentage', 'custom'] })
  @IsEnum(['kill_switch', 'user', 'role', 'percentage', 'custom'])
  ruleType!: 'kill_switch' | 'user' | 'role' | 'percentage' | 'custom';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  environmentId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.ruleType !== 'percentage')
  @IsString()
  @IsNotEmpty()
  variationId?: string;

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
