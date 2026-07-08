import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { EnvironmentsModule } from './modules/environments/environments.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { TargetingRulesModule } from './modules/targeting-rules/targeting-rules.module';
import { SdkKeysModule } from './modules/sdk-keys/sdk-keys.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { HealthModule } from './modules/health/health.module';
import { FlagChangesModule } from './modules/flag-changes/flag-changes.module';
import { BullMQModule } from './modules/bullmq/bullmq.module';
import { EvaluationCollectorModule } from './modules/evaluation-collector/evaluation-collector.module';
import { EvaluationStreamModule } from './modules/evaluation-stream/evaluation-stream.module';
import { EvaluationAnalyticsModule } from './modules/evaluation-analytics/evaluation-analytics.module';
import { EvaluationAggregatorModule } from './modules/evaluation-aggregator/evaluation-aggregator.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { TagsModule } from './modules/tags/tags.module';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuditContextMiddleware } from './common/middleware/audit-context.middleware';
import { AuditContextEnhancerInterceptor } from './common/audit/audit-context.enhancer';

const isProduction = process.env.NODE_ENV === 'production';
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10000,
      },
      {
        name: 'evaluate',
        ttl: 60_000,
        limit: 10000,
        getTracker: (req: Record<string, any>) =>
          Promise.resolve(
            (req.headers?.['x-sdk-key'] as string) || req.ip || 'unknown',
          ),
        generateKey: (context, trackerString, throttlerName) =>
          `${throttlerName}:${trackerString}`,
      },
      {
        name: 'sse',
        ttl: 60_000,
        limit: 10000,
        getTracker: (req: Record<string, any>) =>
          Promise.resolve(
            (req.headers?.['x-sdk-key'] as string) || req.ip || 'unknown',
          ),
        generateKey: (context, trackerString, throttlerName) =>
          `${throttlerName}:${trackerString}`,
      },
    ]),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          transport:
            config.get('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
          level: config.get('NODE_ENV') !== 'production' ? 'debug' : 'info',
          redact: ['req.headers.authorization', 'body.password'],
        },
      }),
    }),
    ...(!isProduction
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'dist-erd'),
            serveRoot: '/erd',
            exclude: ['/api*'],
          }),
        ]
      : []),
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    ProjectsModule,
    EnvironmentsModule,
    FeatureFlagsModule,
    TargetingRulesModule,
    AuditLogsModule,
    SdkKeysModule,
    EvaluationModule,
    HealthModule,
    FlagChangesModule,
    BullMQModule,
    EvaluationCollectorModule,
    EvaluationStreamModule,
    EvaluationAnalyticsModule,
    EvaluationAggregatorModule,
    SegmentsModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextEnhancerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
