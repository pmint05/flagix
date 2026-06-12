import {
  IsString,
  Length,
  Matches,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class VariationDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  key!: string;

  @ApiProperty()
  value!: boolean | string | Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isDefault?: boolean;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultVariationKey?: string;
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

  @ApiPropertyOptional()
  @IsOptional()
  version?: number;
}
