import { IsString, Length, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEnvironmentDto {
  @ApiPropertyOptional({ example: 'Production' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    enum: ['development', 'staging', 'production', 'custom'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['development', 'staging', 'production', 'custom'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
