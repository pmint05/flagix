import {
  ValidationPipe,
  BadRequestException,
  type ValidationPipeOptions,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * Maps class-validator constraint names to stable error codes.
 * Format: `{entity}.{field}.{constraint}`
 */
function buildErrorCode(
  dtoName: string,
  field: string,
  constraintKey: string,
): string {
  const entity = dtoName
    .replace(/Dto$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
  return `${entity}.${field}.${constraintKey}`;
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Array<{ field: string; code: string; message: string }> {
  const result: Array<{ field: string; code: string; message: string }> = [];

  for (const error of errors) {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      for (const [constraintKey, message] of Object.entries(
        error.constraints,
      )) {
        const dtoName = error.target?.constructor?.name ?? 'unknown';
        result.push({
          field: fieldPath,
          code: buildErrorCode(dtoName, error.property, constraintKey),
          message: String(message),
        });
      }
    }

    if (error.children && error.children.length > 0) {
      result.push(...flattenValidationErrors(error.children, fieldPath));
    }
  }

  return result;
}

export function createFlagixValidationPipe(
  options?: Partial<ValidationPipeOptions>,
): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    ...options,
    exceptionFactory: (errors: ValidationError[]) => {
      const details = flattenValidationErrors(errors);
      const message =
        details.length > 0 ? details[0].message : 'Validation failed';
      return new BadRequestException({
        statusCode: 400,
        error: 'ValidationException',
        message,
        details,
      });
    },
  });
}
