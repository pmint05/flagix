import { Module } from '@nestjs/common';
import { EnvironmentsController } from './environments.controller';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsRepository } from './environments.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService, EnvironmentsRepository],
  exports: [EnvironmentsService, EnvironmentsRepository],
})
export class EnvironmentsModule {}
