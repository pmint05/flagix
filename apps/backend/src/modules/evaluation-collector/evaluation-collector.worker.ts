import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { IOREDIS, IOREDIS_PUB, EVALUATION_QUEUE_NAME } from '@/modules/bullmq/bullmq.module';
import { EvaluationEventsRepository } from '@/modules/evaluation-events/evaluation-events.repository';
import type { InsertEvaluationEvent } from '@/modules/evaluation-events/evaluation-events.repository';
import type { EvaluationStreamEvent } from '@/modules/evaluation-stream/evaluation-stream.service';
import Redis from 'ioredis';

interface EvaluationJobPayload {
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
  timestamp: string;
}

@Injectable()
export class EvaluationCollectorWorker implements OnModuleInit {
  private readonly logger = new Logger(EvaluationCollectorWorker.name);
  private worker: Worker | null = null;
  private buffer: InsertEvaluationEvent[] = [];
  private readonly FLUSH_SIZE = 500;
  private readonly FLUSH_INTERVAL_MS = 100;

  constructor(
    @Inject(IOREDIS) private readonly redis: Redis,
    @Inject(IOREDIS_PUB) private readonly redisPub: Redis,
    private readonly repository: EvaluationEventsRepository,
  ) {}

  onModuleInit() {
    this.startWorker();
    setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
  }

  private startWorker() {
    this.worker = new Worker(
      EVALUATION_QUEUE_NAME,
      async (job: Job<EvaluationJobPayload>) => {
        this.buffer.push({
          organizationId: job.data.organizationId,
          projectId: job.data.projectId,
          environmentId: job.data.environmentId,
          featureFlagId: job.data.featureFlagId,
          flagKey: job.data.flagKey,
          variationId: job.data.variationId,
          variationKey: job.data.variationKey,
          resolvedValue: job.data.resolvedValue,
          evaluationReason: job.data.evaluationReason,
          contextUserHash: job.data.contextUserHash,
          sdkKeyId: job.data.sdkKeyId,
          clientIpHash: job.data.clientIpHash,
        });

        if (this.buffer.length >= this.FLUSH_SIZE) {
          await this.flush();
        }

        await this.publishToRedis(job.data);
      },
      {
        connection: this.redis,
        concurrency: 1,
        limiter: { max: 1000, duration: 1000 },
      },
    );

    this.worker.on('error', (err) => {
      this.logger.error('Worker error', err);
    });
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0);
    try {
      await this.repository.batchInsert(batch);
    } catch (err) {
      this.logger.error(
        `Failed to batch insert ${batch.length} evaluation events`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async publishToRedis(job: EvaluationJobPayload): Promise<void> {
    const event: EvaluationStreamEvent = {
      flagKey: job.flagKey,
      variationKey: job.variationKey,
      resolvedValue: job.resolvedValue,
      evaluationReason: job.evaluationReason,
      organizationId: job.organizationId,
      projectId: job.projectId,
      environmentId: job.environmentId,
      contextUserHash: job.contextUserHash,
      timestamp: job.timestamp,
    };

    try {
      await this.redisPub.publish('analytics:evaluations', JSON.stringify(event));
    } catch (err) {
      this.logger.error('Failed to publish to Redis pub/sub', err);
    }
  }
}
