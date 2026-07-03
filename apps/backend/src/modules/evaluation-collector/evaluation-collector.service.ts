import { Inject, Injectable, Logger } from '@nestjs/common';
import type { EvaluationResult } from '@flagix/shared';
import { Queue } from 'bullmq';
import { EVALUATION_QUEUE } from '@/modules/bullmq/bullmq.module';
import { hashUserId, hashClientIp } from '@/common/utils/crypto';

export interface EvaluationEventPayload {
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
export class EvaluationCollectorService {
  private readonly logger = new Logger(EvaluationCollectorService.name);

  constructor(@Inject(EVALUATION_QUEUE) private readonly queue: Queue) {}

  async record(
    result: EvaluationResult,
    meta: {
      organizationId: string;
      projectId: string;
      environmentId: string;
      featureFlagId?: string;
      sdkKeyId?: string;
      clientIp?: string;
      contextUserId?: string;
    },
  ): Promise<void> {
    const payload: EvaluationEventPayload = {
      organizationId: meta.organizationId,
      projectId: meta.projectId,
      environmentId: meta.environmentId,
      featureFlagId: meta.featureFlagId ?? null,
      flagKey: result.flagKey,
      variationId: null,
      variationKey: result.variationKey,
      resolvedValue: result.resolvedValue,
      evaluationReason: result.evaluationReason,
      contextUserHash: meta.contextUserId
        ? hashUserId(meta.contextUserId)
        : null,
      sdkKeyId: meta.sdkKeyId ?? null,
      clientIpHash: meta.clientIp ? hashClientIp(meta.clientIp) : null,
      timestamp: new Date().toISOString(),
    };

    await this.queue
      .add('evaluation-event', payload, {
        removeOnComplete: true,
        removeOnFail: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      })
      .catch((err) => {
        this.logger.error(
          `Failed to enqueue evaluation event for flag "${result.flagKey}"`,
          err instanceof Error ? err.stack : String(err),
        );
      });
  }

  async recordBatch(
    results: EvaluationResult[],
    meta: {
      organizationId: string;
      projectId: string;
      environmentId: string;
      sdkKeyId?: string;
      clientIp?: string;
      contextUserId?: string;
      featureFlagIdMap?: Map<string, string>;
    },
  ): Promise<void> {
    const { featureFlagIdMap } = meta;

    for (const result of results) {
      await this.record(result, {
        ...meta,
        featureFlagId: featureFlagIdMap?.get(result.flagKey),
      });
    }
  }
}
