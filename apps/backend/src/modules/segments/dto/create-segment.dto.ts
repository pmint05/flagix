import { IsString, Length, Matches, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSegmentDto {
  @ApiProperty({ example: 'Beta Users' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiProperty({ example: 'beta-users' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  @Length(1, 255)
  key!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsArray()
  conditions!: Record<string, unknown>[];
}
