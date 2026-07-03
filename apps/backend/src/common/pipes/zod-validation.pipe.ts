import {
  type PipeTransform,
  type ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { type ZodType, type ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query') {
      return value;
    }

    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(this.formatError(result.error));
    }
    return result.data;
  }

  private formatError(error: ZodError): string {
    return error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
  }
}
