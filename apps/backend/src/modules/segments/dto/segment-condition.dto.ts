import { IsString, IsOptional, IsArray, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ─── Custom condition ────────────────────────────────────────────────────────

export class CustomSegmentConditionDto {
  @ApiProperty({ enum: ['custom'] })
  @IsString()
  @IsIn(['custom'])
  conditionType!: 'custom';

  @ApiProperty({ example: 'user.email' })
  @IsString()
  contextKey!: string;

  @ApiProperty({
    enum: ['string', 'number', 'boolean', 'object', 'array', 'semver', 'date'],
  })
  @IsString()
  @IsIn(['string', 'number', 'boolean', 'object', 'array', 'semver', 'date'])
  type!: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'semver' | 'date';

  @ApiProperty({ example: 'is_one_of' })
  @IsString()
  operator!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  value?: any;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  values?: any[];
}

// ─── User targeting condition ────────────────────────────────────────────────

export class UserSegmentConditionDto {
  @ApiProperty({ enum: ['user'] })
  @IsString()
  @IsIn(['user'])
  conditionType!: 'user';

  @ApiProperty({ type: [String], example: ['user-123', 'alice@example.com'] })
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];
}

// ─── Role targeting condition ────────────────────────────────────────────────

export class RoleSegmentConditionDto {
  @ApiProperty({ enum: ['role'] })
  @IsString()
  @IsIn(['role'])
  conditionType!: 'role';

  @ApiProperty({ type: [String], example: ['admin', 'beta-tester'] })
  @IsArray()
  @IsString({ each: true })
  roles!: string[];
}

// ─── Union type (used for documentation only — runtime uses plain object) ────

export type SegmentConditionDto =
  | CustomSegmentConditionDto
  | UserSegmentConditionDto
  | RoleSegmentConditionDto;
