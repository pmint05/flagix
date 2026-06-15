import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { AuditLogsInterceptor } from './modules/audit-logs/audit-logs.interceptor';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { LoggerModule } from 'nestjs-pino';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

const isProduction = process.env.NODE_ENV === 'production';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogsInterceptor,
    },
  ],
})
export class AppModule {}
