import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleSdkKeyDto {
  @ApiProperty({
    description: 'Active status of the SDK key',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
