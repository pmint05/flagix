import { Inject, Injectable } from '@nestjs/common';
import { evaluationEvents } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';

export interface InsertEvaluationEvent {
  organizationId: string;
  projectId: string;
  environmentId: string;
  featureFlagId: string | null;
  flagKey: string;
  variationId: string | null;
  variationKey: string | null;
  resolvedValue: unknown;
  evaluationReason: string;
  contextUserHash: string | null;
  sdkKeyId: string | null;
  clientIpHash: string | null;
}

@Injectable()
export class EvaluationEventsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async batchInsert(events: InsertEvaluationEvent[]): Promise<number> {
    if (events.length === 0) return 0;

    const result = await this.db.insert(evaluationEvents).values(events);

    return events.length;
  }
}
