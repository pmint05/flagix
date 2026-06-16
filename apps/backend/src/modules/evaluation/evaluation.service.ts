import { Injectable, Logger } from '@nestjs/common';
import type { EvaluationContext, EvaluationResult } from '@flagix/shared';
import { FlagLoader } from './flag-loader';
import { evaluate } from './evaluation.engine';
import { buildSafeDefault } from './safe-default.util';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(private readonly flagLoader: FlagLoader) {}

  async evaluateFlag(
    environmentId: string,
    flagKey: string,
    context: EvaluationContext,
  ): Promise<EvaluationResult> {
    try {
      const flag = await this.flagLoader.loadFlag(environmentId, flagKey);
      if (!flag) {
        return buildSafeDefault(null, flagKey, 'FLAG_NOT_FOUND');
      }
      return evaluate(flag, context);
    } catch (error) {
      this.logger.error(
        `Evaluation error for flag "${flagKey}" in env "${environmentId}"`,
        error instanceof Error ? error.stack : String(error),
      );
      return buildSafeDefault(null, flagKey, 'EVALUATION_ERROR');
    }
  }

  async evaluateAllFlags(
    environmentId: string,
    context: EvaluationContext,
  ): Promise<EvaluationResult[]> {
    try {
      const flags = await this.flagLoader.loadAllActiveFlags(environmentId);
      return flags.map((flag) => {
        try {
          return evaluate(flag, context);
        } catch (error) {
          this.logger.error(
            `Evaluation error for flag "${flag.key}" in env "${environmentId}"`,
            error instanceof Error ? error.stack : String(error),
          );
          return buildSafeDefault(flag, flag.key, 'EVALUATION_ERROR');
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to load flags for env "${environmentId}"`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }
}
