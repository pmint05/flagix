import { IsString, Length, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Project' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({ example: 'my-project' })
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
