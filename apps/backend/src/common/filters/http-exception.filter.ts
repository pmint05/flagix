import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
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

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || (exceptionResponse as any).error
        : exceptionResponse;

    const errorResponse = {
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      error:
        exception instanceof HttpException
          ? exception.name
          : 'InternalServerError',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
