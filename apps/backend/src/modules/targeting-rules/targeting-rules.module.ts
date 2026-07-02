import { Module } from '@nestjs/common';
import { TargetingRulesController } from './targeting-rules.controller';
import { TargetingRulesService } from './targeting-rules.service';
import { TargetingRulesRepository } from './targeting-rules.repository';
import { FlagChangesModule } from '../flag-changes/flag-changes.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { FlagConfigCacheModule } from '../evaluation/flag-config-cache.module';

@Module({
  imports: [FlagChangesModule, AuditLogsModule, FlagConfigCacheModule],
  controllers: [TargetingRulesController],
  providers: [TargetingRulesService, TargetingRulesRepository],
  exports: [TargetingRulesService],
})
export class TargetingRulesModule {}
