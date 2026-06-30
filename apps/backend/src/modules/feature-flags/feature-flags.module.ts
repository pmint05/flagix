import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagItemController } from './feature-flag-item.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsRepository } from './feature-flags.repository';
import { EnvironmentsModule } from '../environments/environments.module';
import { FlagChangesModule } from '../flag-changes/flag-changes.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
  imports: [EnvironmentsModule, FlagChangesModule, AuditLogsModule, EvaluationModule],
  controllers: [FeatureFlagsController, FeatureFlagItemController],
  providers: [FeatureFlagsService, FeatureFlagsRepository],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
