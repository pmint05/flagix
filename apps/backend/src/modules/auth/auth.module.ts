import { Module } from '@nestjs/common';
import { AuthModule as NestBetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth.config';

@Module({
  imports: [NestBetterAuthModule.forRoot({ auth })],
  exports: [NestBetterAuthModule],
})
export class AuthModule {}
