import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsInterceptor } from './audit-logs.interceptor';
import { FlagChangesModule } from '../flag-changes/flag-changes.module';

@Module({
  imports: [FlagChangesModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository, AuditLogsInterceptor],
  exports: [AuditLogsService, AuditLogsInterceptor],
})
export class AuditLogsModule {}
