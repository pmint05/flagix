import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { IOREDIS_SUB } from '@/modules/bullmq/bullmq.module';
import { Observable, Subject, finalize } from 'rxjs';

export interface EvaluationStreamEvent {
  flagKey: string;
  variationKey: string | null;
  resolvedValue: unknown;
  evaluationReason: string;
  organizationId: string;
  projectId: string;
  environmentId: string;
  environmentName?: string;
  contextUserHash: string | null;
  timestamp: string;
}

interface OrgEntry {
  subject: Subject<EvaluationStreamEvent>;
  count: number;
}

@Injectable()
export class EvaluationStreamService {
  private readonly logger = new Logger(EvaluationStreamService.name);
  private readonly entries = new Map<string, OrgEntry>();
  private readonly subChannel = 'analytics:evaluations';

  constructor(@Inject(IOREDIS_SUB) private readonly redis: Redis) {
    this.subscribeToRedis();
  }

  private subscribeToRedis(): void {
    this.redis.subscribe(this.subChannel, (err) => {
      if (err) {
        this.logger.error('Failed to subscribe to Redis pub/sub', err);
      }
    });

    this.redis.on('message', (channel, message) => {
      if (channel !== this.subChannel) return;

      try {
        const event: EvaluationStreamEvent = JSON.parse(message);
        const entry = this.entries.get(event.organizationId);
        if (entry) {
          entry.subject.next(event);
        }
      } catch (err) {
        this.logger.error('Failed to parse stream event', err);
      }
    });
  }

  subscribe(organizationId: string): Observable<EvaluationStreamEvent> {
    let entry = this.entries.get(organizationId);
    if (!entry) {
      entry = { subject: new Subject<EvaluationStreamEvent>(), count: 0 };
      this.entries.set(organizationId, entry);
    }

    entry.count++;

    return entry.subject.asObservable().pipe(
      finalize(() => {
        const currentEntry = this.entries.get(organizationId);
        if (currentEntry) {
          currentEntry.count--;
          if (currentEntry.count <= 0) {
            currentEntry.subject.complete();
            this.entries.delete(organizationId);
          }
        }
      }),
    );
  }
}
