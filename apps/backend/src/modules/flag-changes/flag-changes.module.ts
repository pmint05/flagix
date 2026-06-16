import { Module } from '@nestjs/common';
import { FlagChangePublisher } from './flag-change.publisher';
import { FlagChangesController } from './flag-changes.controller';

@Module({
  providers: [FlagChangePublisher],
  exports: [FlagChangePublisher],
  controllers: [FlagChangesController],
})
export class FlagChangesModule {}
