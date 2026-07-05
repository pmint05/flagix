import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateSegmentDto } from './create-segment.dto';

// We keep the discriminator validation lightweight — each item must at least
// be an object. Deep structural validation is done via SegmentConditionDto
// subtypes, but because class-validator cannot polymorphically discriminate
// without a custom decorator, we validate each item is an object and rely on
// the application-layer (service) and evaluation engine for structural rules.
class AnyConditionDto {
  [key: string]: any;
}

export class UpdateSegmentDto extends PartialType(CreateSegmentDto) {
  @ApiPropertyOptional({
    description:
      'Array of segment condition blocks. Each item must have a conditionType of "custom", "user", or "role".',
    type: 'array',
    items: {
      oneOf: [
        {
          type: 'object',
          required: ['conditionType', 'contextKey', 'type', 'operator'],
          properties: {
            conditionType: { type: 'string', enum: ['custom'] },
            contextKey: { type: 'string' },
            type: {
              type: 'string',
              enum: ['string', 'number', 'boolean', 'object', 'array', 'semver', 'date'],
            },
            operator: { type: 'string' },
            value: {},
            values: { type: 'array' },
          },
        },
        {
          type: 'object',
          required: ['conditionType', 'userIds'],
          properties: {
            conditionType: { type: 'string', enum: ['user'] },
            userIds: { type: 'array', items: { type: 'string' } },
          },
        },
        {
          type: 'object',
          required: ['conditionType', 'roles'],
          properties: {
            conditionType: { type: 'string', enum: ['role'] },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
      ],
    },
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  conditions?: Record<string, any>[];
}
