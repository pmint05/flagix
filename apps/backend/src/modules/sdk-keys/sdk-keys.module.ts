import { Module } from '@nestjs/common';
import { SdkKeysController } from './sdk-keys.controller';
import { SdkKeysService } from './sdk-keys.service';
import { SdkKeysRepository } from './sdk-keys.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [SdkKeysController],
  providers: [SdkKeysService, SdkKeysRepository],
  exports: [SdkKeysService],
})
export class SdkKeysModule {}
