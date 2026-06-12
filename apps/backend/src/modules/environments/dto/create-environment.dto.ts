import { IsString, Length, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnvironmentDto {
  @ApiProperty({ example: 'Production' })
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiPropertyOptional({ example: 'production' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @Length(1, 100)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
