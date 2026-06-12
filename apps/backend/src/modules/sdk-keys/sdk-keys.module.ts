import { Module } from '@nestjs/common';
import { SdkKeysController } from './sdk-keys.controller';
import { SdkKeysService } from './sdk-keys.service';
import { SdkKeysRepository } from './sdk-keys.repository';

@Module({
  controllers: [SdkKeysController],
  providers: [SdkKeysService, SdkKeysRepository],
  exports: [SdkKeysService],
})
export class SdkKeysModule {}
