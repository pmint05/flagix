import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
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
