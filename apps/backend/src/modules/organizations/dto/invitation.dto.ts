import { IsString, IsEmail, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'viewer', enum: ['admin', 'editor', 'viewer'] })
  @IsString()
  @IsIn(['admin', 'editor', 'viewer'])
  role!: 'admin' | 'editor' | 'viewer';
}

export class UpdateMemberRoleDto {
  @ApiProperty({ example: 'viewer', enum: ['admin', 'editor', 'viewer'] })
  @IsString()
  @IsIn(['admin', 'editor', 'viewer'])
  role!: 'admin' | 'editor' | 'viewer';
}
