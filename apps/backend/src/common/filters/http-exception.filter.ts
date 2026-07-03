import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.error('[EXCEPTION_FILTER]', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const rawMessage =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || (exceptionResponse as any).error
        : exceptionResponse;

    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    const hint = this.getHint(status, request);

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      ...(hint ? { hint } : {}),
      error:
        exception instanceof HttpException
          ? exception.name
          : 'InternalServerError',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }

  private getHint(status: number, request: Request): string | null {
    const path = request.url;

    if (status === HttpStatus.UNAUTHORIZED) {
      if (path.includes('/evaluate')) {
        return 'SDK endpoints require X-SDK-Key header. Get your key from the dashboard → SDK Keys.';
      }
      if (path.includes('/analytics/stream')) {
        return 'SSE endpoint requires a valid session cookie or Authorization: Bearer <token>.';
      }
      if (path.includes('/organizations')) {
        return 'This endpoint requires authentication. Provide a session cookie or Authorization: Bearer <token>.';
      }
      return 'Authentication required. Provide a session cookie or Authorization: Bearer <token>.';
    }

    if (status === HttpStatus.FORBIDDEN) {
      if (path.includes('/organizations')) {
        return 'You do not have access to this organization. Check your membership or ask an admin to invite you.';
      }
      return 'You do not have permission to perform this action.';
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return 'Rate limit exceeded. Retry after the cooldown period.';
    }

    return null;
  }
}
