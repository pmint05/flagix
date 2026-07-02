import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EnvironmentsModule } from '../environments/environments.module';

@Module({
  imports: [AuditLogsModule, EnvironmentsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository],
  exports: [ProjectsService],
})
export class ProjectsModule {}
