import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerModule } from 'nestjs-pino';
import { UsersModule } from './modules/users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@thallesp/nestjs-better-auth';

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
    DatabaseModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
