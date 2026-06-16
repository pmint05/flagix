import { IsString, Length, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Example Organization' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({ example: 'example-organization' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @Length(1, 100)
  slug?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Example Organization' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ example: 'example-organization' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @Length(1, 100)
  slug?: string;
}
