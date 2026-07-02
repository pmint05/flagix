import {
  IsString,
  Length,
  Matches,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDefined,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateTargetingRuleDto } from '../../targeting-rules/dto/create-targeting-rule.dto';

class VariationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  key!: string;

  @ApiProperty()
  @IsDefined()
  value!: boolean | string | Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 'red' })
  @IsOptional()
  @IsString()
  @IsEnum([
    'red',
    'blue',
    'amber',
    'green',
    'purple',
    'sky',
    'pink',
    'lime',
    'indigo',
    'yellow',
    'teal',
    'fuchsia',
  ])
  color?: string;
}

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'dark-mode' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  @Length(1, 255)
  key!: string;

  @ApiProperty({ example: 'Dark Mode' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['boolean', 'multivariate'] })
  @IsEnum(['boolean', 'multivariate'])
  flagType!: 'boolean' | 'multivariate';

  @ApiPropertyOptional({ type: [VariationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariationDto)
  variations?: VariationDto[];

  @ApiPropertyOptional({ enum: ['all', 'client_only', 'server_only'] })
  @IsOptional()
  @IsEnum(['all', 'client_only', 'server_only'])
  visibility?: 'all' | 'client_only' | 'server_only';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultVariationKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTemporary?: boolean;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: 'draft' | 'active' | 'archived';

  @ApiPropertyOptional({ enum: ['all', 'client_only', 'server_only'] })
  @IsOptional()
  @IsEnum(['all', 'client_only', 'server_only'])
  visibility?: 'all' | 'client_only' | 'server_only';

  @ApiPropertyOptional()
  @IsOptional()
  version?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTemporary?: boolean;
}

export class PatchFeatureFlagConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: 'draft' | 'active' | 'archived';

  @ApiPropertyOptional({ type: [VariationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariationDto)
  variations?: VariationDto[];

  @ApiPropertyOptional({ type: [CreateTargetingRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTargetingRuleDto)
  rules?: CreateTargetingRuleDto[];

  @ApiPropertyOptional({ enum: ['all', 'client_only', 'server_only'] })
  @IsOptional()
  @IsEnum(['all', 'client_only', 'server_only'])
  visibility?: 'all' | 'client_only' | 'server_only';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultVariationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offVariationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTemporary?: boolean;
}
