import { Module } from '@nestjs/common';
import { TargetingRulesController } from './targeting-rules.controller';
import { TargetingRulesService } from './targeting-rules.service';
import { TargetingRulesRepository } from './targeting-rules.repository';
import { FlagChangesModule } from '../flag-changes/flag-changes.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [FlagChangesModule, AuditLogsModule],
  controllers: [TargetingRulesController],
  providers: [TargetingRulesService, TargetingRulesRepository],
  exports: [TargetingRulesService],
})
export class TargetingRulesModule {}
