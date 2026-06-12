import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsInterceptor } from './audit-logs.interceptor';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository, AuditLogsInterceptor],
  exports: [AuditLogsService, AuditLogsInterceptor],
})
export class AuditLogsModule {}
