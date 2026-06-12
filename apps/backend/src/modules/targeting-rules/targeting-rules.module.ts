import { Module } from '@nestjs/common';
import { TargetingRulesController } from './targeting-rules.controller';
import { TargetingRulesService } from './targeting-rules.service';
import { TargetingRulesRepository } from './targeting-rules.repository';

@Module({
  controllers: [TargetingRulesController],
  providers: [TargetingRulesService, TargetingRulesRepository],
  exports: [TargetingRulesService],
})
export class TargetingRulesModule {}
