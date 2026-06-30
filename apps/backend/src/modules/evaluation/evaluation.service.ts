import { Injectable, Logger } from '@nestjs/common';
import type { EvaluationContext, EvaluationResult } from '@flagix/shared';
import { FlagLoader } from './flag-loader';
import { evaluate } from './evaluation.engine';
import { buildSafeDefault } from './safe-default.util';
import { simulate, SimulationResult } from './evaluation.simulator';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(private readonly flagLoader: FlagLoader) {}

  async evaluateFlag(
    environmentId: string,
    flagKey: string,
    context: EvaluationContext,
    keyType?: 'client' | 'server',
  ): Promise<EvaluationResult> {
    try {
      const flag = await this.flagLoader.loadFlag(environmentId, flagKey);
      if (!flag) {
        return buildSafeDefault(null, flagKey, 'FLAG_NOT_FOUND');
      }
      if (keyType === 'client' && flag.visibility === 'server_only') {
        return buildSafeDefault(null, flagKey, 'FLAG_NOT_FOUND');
      }
      if (keyType === 'server' && flag.visibility === 'client_only') {
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
    keyType?: 'client' | 'server',
  ): Promise<EvaluationResult[]> {
    try {
      let flags = await this.flagLoader.loadAllActiveFlags(environmentId);
      if (keyType === 'client') {
        flags = flags.filter((f) => f.visibility !== 'server_only');
      } else if (keyType === 'server') {
        flags = flags.filter((f) => f.visibility !== 'client_only');
      }
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

  async simulateFlag(
    environmentId: string,
    flagKey: string,
    context: EvaluationContext,
    flagConfig?: {
      isEnabled?: boolean;
      status?: string;
      defaultVariationId?: string | null;
      offVariationId?: string | null;
      variations?: any[];
      rules?: any[];
      bypassDraft?: boolean;
    },
  ): Promise<SimulationResult> {
    try {
      const flag = await this.flagLoader.loadFlag(environmentId, flagKey);
      if (!flag) {
        throw new Error(`Flag ${flagKey} not found`);
      }

      // If draft config is passed, merge/override the LoadedFlag values
      if (flagConfig) {
        if (flagConfig.isEnabled !== undefined) {
          flag.isEnabled = flagConfig.isEnabled;
        }
        if (flagConfig.status !== undefined) {
          flag.status = flagConfig.status as any;
        }
        if (flagConfig.defaultVariationId !== undefined) {
          flag.defaultVariationId = flagConfig.defaultVariationId;
        }
        if (flagConfig.offVariationId !== undefined) {
          flag.offVariationId = flagConfig.offVariationId;
        }
        if (flagConfig.variations !== undefined) {
          flag.variations = flagConfig.variations.map((v) => ({
            id: v.id,
            key: v.key,
            value: v.value,
            isDefault: v.isDefault || false,
          }));
        }
        if (flagConfig.rules !== undefined) {
          flag.rules = flagConfig.rules.map((r, idx) => ({
            id: r.id || `draft_rule_${idx}`,
            ruleType: r.ruleType,
            priority: String(idx).padStart(4, '0'),
            variationId: r.variationId || null,
            conditions: r.conditions || {},
            isEnabled: r.isEnabled ?? true,
          }));
        }
      }

      return simulate(flag, context, { bypassDraft: flagConfig?.bypassDraft });
    } catch (error) {
      this.logger.error(
        `Simulation error for flag "${flagKey}" in env "${environmentId}"`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
