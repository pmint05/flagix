import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TagsRepository } from './tags.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [TagsController],
  providers: [TagsService, TagsRepository],
  exports: [TagsService, TagsRepository],
})
export class TagsModule {}
