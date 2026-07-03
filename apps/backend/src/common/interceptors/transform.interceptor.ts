import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

export interface Response<T> {
  success: true;
  message: string;
  data: T;
}

const SENSITIVE_FIELDS = ['deletedAt', 'deletedBy'];

function stripSensitiveFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((v) => stripSensitiveFields(v));
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        continue;
      }
      result[key] = stripSensitiveFields(obj[key]);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | T> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isRaw) {
      return next.handle().pipe(
        map((data) => stripSensitiveFields(data)),
      );
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: data?.message || 'Operation successful',
        data: stripSensitiveFields(
          data?.data !== undefined && !('total' in data) ? data.data : data,
        ),
      })),
    );
  }
}
