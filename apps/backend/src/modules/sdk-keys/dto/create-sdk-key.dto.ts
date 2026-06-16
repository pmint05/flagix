import { IsString, IsEnum, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSdkKeyDto {
  @ApiProperty({
    description: 'Human-readable name for the SDK key',
    example: 'Production Web Key',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @ApiProperty({
    description: 'Type of SDK key',
    enum: ['client', 'server'],
    example: 'client',
  })
  @IsEnum(['client', 'server'])
  type!: 'client' | 'server';
}
