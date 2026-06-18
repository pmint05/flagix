import { EvaluationResult, EvaluationContext } from '@flagix/shared';

export * from '@flagix/shared';

export interface FlagixConfig {
  sdkKey: string;
  baseUrl?: string;
  ttl?: number;
  persistent?: boolean;
  reconnectJitter?: number;
  initialFlags?: Record<string, EvaluationResult>;
}

export type ReadinessCallback = (isReady: boolean) => void;

export interface SdkCache {
  flags: Record<string, EvaluationResult>;
  lastUpdated: number;
  contextHash: string;
}

export interface FlagixStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export type CacheUpdateCallback = (flags: Record<string, EvaluationResult>) => void;
