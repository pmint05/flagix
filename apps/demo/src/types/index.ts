import type { EvaluationContext } from '@flagix/sdk-core';

export interface ContextPreset {
  name: string;
  description: string;
  context: EvaluationContext;
}

export interface EvaluationLogEntry {
  id: string;
  timestamp: string;
  flagKey: string;
  value: unknown;
  reason: string;
}

export interface AppConfig {
  sdkKey: string;
  baseUrl: string;
}
