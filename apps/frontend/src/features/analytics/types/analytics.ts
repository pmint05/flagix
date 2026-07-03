export interface FlagAnalyticsResponse {
  flagKey: string;
  flagName: string;
  flagType: string;
  totalEvaluations: number;
  uniqueUsers: number;
  errorCount: number;
  evaluationTrend: {
    timestamp: string;
    count: number;
    byVariation: Record<string, number>;
  }[];
  variationDistribution: {
    variationKey: string;
    count: number;
    percentage: number;
    color: string | null;
  }[];
  byEnvironment: {
    environmentId: string;
    environmentName: string;
    totalCount: number;
  }[];
  byReason: {
    reason: string;
    count: number;
  }[];
  timeRange: {
    from: string;
    to: string;
    granularity: string;
  };
}

export interface OverviewResponse {
  totalEvaluations: number;
  uniqueUsers: number;
  errorRate: number;
  activeFlags: number;
  evaluationTrend: { timestamp: string; count: number }[];
  topFlags: { flagKey: string; flagName: string; flagId: string | null; totalCount: number }[];
  byEnvironment: { environmentId: string; environmentName: string; totalCount: number; errorCount: number }[];
  timeRange: { from: string; to: string; granularity: string };
}

export interface EnvironmentAnalyticsResponse {
  environmentName: string;
  totalEvaluations: number;
  flags: { flagId: string | null; flagKey: string; totalCount: number; variationDistribution: { variationKey: string; count: number; percentage: number; color: string | null }[] }[];
  timeRange: { from: string; to: string };
}

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

export interface AnalyticsTimeRange {
  from?: string;
  to?: string;
  granularity?: 'hour' | 'day';
}
