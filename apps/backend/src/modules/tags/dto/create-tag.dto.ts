import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'frontend' })
  @IsString()
  @Length(1, 100)
  name!: string;
}
