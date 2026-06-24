import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { apiReference } from '@scalar/nestjs-api-reference';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { createFlagixValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.set('trust proxy', true);

  // Request ID — injects X-Request-Id on every request/response
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req: any, res: any, next: any) =>
    requestIdMiddleware.use(req, res, next),
  );

  // Pino Logger Integration
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(
    new LoggerErrorInterceptor(),
    new TransformInterceptor(), // Wrap success responses
  );

  // Global Setup
  app.useGlobalFilters(new AllExceptionsFilter()); // Unified error responses
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableCors({
    origin: process.env.WHITE_LISTED_ORIGINS
      ? process.env.WHITE_LISTED_ORIGINS.split(',').map((origin) =>
          origin.trim(),
        )
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(createFlagixValidationPipe());

  app.enableShutdownHooks();

  // API Documentation (Swagger + Scalar)
  const config = new DocumentBuilder()
    .setTitle('Flagix API')
    .setDescription('The Flagix Feature Flag Management & SDK API.')
    .setExternalDoc('Better Auth Open API', '/api/auth/reference')
    .setVersion('1.0')
    .setBasePath('/api')
    .addTag('flagix')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Scalar UI
  app.use(
    '/api/docs',
    apiReference({
      theme: 'none',
      layout: 'modern',
      spec: {
        content: document,
      },
    }),
  );

  const port = process.env.PORT ?? 9000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger UI: http://localhost:${port}/swagger`);
  logger.log(`Scalar UI: http://localhost:${port}/api/docs`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`ERD UI: http://localhost:${port}/erd`);
  }
}
bootstrap();
