import { Inject, Injectable } from '@nestjs/common';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import {
  evaluationEvents,
  evaluationStatsHourly,
  featureFlags,
} from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';

export interface AnalyticsTimeRange {
  from: Date;
  to: Date;
  granularity: 'hour' | 'day';
}

export interface FlagAnalyticsResult {
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

const ERROR_REASONS = [
  'FLAG_NOT_FOUND',
  'FLAG_ARCHIVED',
  'FLAG_DRAFT',
  'FLAG_DISABLED',
  'EVALUATION_ERROR',
];

@Injectable()
export class EvaluationAnalyticsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getFlagAnalytics(
    orgId: string,
    flagId: string,
    range: AnalyticsTimeRange,
    environmentId?: string,
  ): Promise<FlagAnalyticsResult> {
    const flag = await this.db.query.featureFlags.findFirst({
      where: and(
        eq(featureFlags.id, flagId),
        eq(featureFlags.organizationId, orgId),
      ),
    });

    if (!flag) throw new Error('Flag not found');

    const conditions = [
      eq(evaluationEvents.organizationId, orgId),
      gte(evaluationEvents.createdAt, range.from),
      lte(evaluationEvents.createdAt, range.to),
    ];

    const flagKeyEq = eq(evaluationEvents.flagKey, flag.key);

    if (flag.id) {
    }

    conditions.push(flagKeyEq);

    if (environmentId) {
      conditions.push(eq(evaluationEvents.environmentId, environmentId));
    }

    const rows = await this.db
      .select({
        variationKey: evaluationEvents.variationKey,
        evaluationReason: evaluationEvents.evaluationReason,
        environmentId: evaluationEvents.environmentId,
        createdAt: evaluationEvents.createdAt,
      })
      .from(evaluationEvents)
      .where(and(...conditions))
      .orderBy(desc(evaluationEvents.createdAt));

    const trendMap = new Map<string, { count: number; byVariation: Record<string, number> }>();
    const variationTotals = new Map<string, number>();
    const reasonTotals = new Map<string, number>();
    const envTotals = new Map<string, number>();
    let errorCount = 0;
    const envIds = new Set<string>();

    for (const row of rows) {
      let bucketKey: string;
      if (range.granularity === 'hour') {
        const d = new Date(row.createdAt!);
        d.setMinutes(0, 0, 0);
        bucketKey = d.toISOString();
      } else {
        const d = new Date(row.createdAt!);
        d.setHours(0, 0, 0, 0);
        bucketKey = d.toISOString();
      }

      if (!trendMap.has(bucketKey)) {
        trendMap.set(bucketKey, { count: 0, byVariation: {} });
      }
      const trend = trendMap.get(bucketKey)!;
      trend.count++;

      const vk = row.variationKey || 'off';
      trend.byVariation[vk] = (trend.byVariation[vk] || 0) + 1;
      variationTotals.set(vk, (variationTotals.get(vk) || 0) + 1);

      const reason = row.evaluationReason || 'unknown';
      reasonTotals.set(reason, (reasonTotals.get(reason) || 0) + 1);

      if (ERROR_REASONS.includes(reason)) {
        errorCount++;
      }

      if (row.environmentId) {
        envTotals.set(row.environmentId, (envTotals.get(row.environmentId) || 0) + 1);
        envIds.add(row.environmentId);
      }
    }

    const trend = Array.from(trendMap.entries())
      .map(([timestamp, data]) => ({ timestamp, ...data }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const totalEvaluations = rows.length;

    const distribution = Array.from(variationTotals.entries())
      .map(([variationKey, count]) => ({
        variationKey,
        count,
        percentage: totalEvaluations > 0 ? (count / totalEvaluations) * 100 : 0,
      }));

    let byEnv: { environmentId: string; environmentName: string; totalCount: number }[] = [];
    if (envIds.size > 0) {
      const envs = await this.db
        .select({ id: evaluationEvents.environmentId, name: sql<string>`''` })
        .from(evaluationEvents)
        .where(and(eq(evaluationEvents.organizationId, orgId)))
        .groupBy(evaluationEvents.environmentId)
        .limit(0);

      byEnv = Array.from(envTotals.entries()).map(([envId, total]) => ({
        environmentId: envId,
        environmentName: envId.substring(0, 8),
        totalCount: total,
      }));
    }

    return {
      flagKey: flag.key,
      flagName: flag.name,
      flagType: flag.flagType,
      totalEvaluations,
      uniqueUsers: 0,
      errorCount,
      evaluationTrend: trend,
      variationDistribution: distribution,
      byEnvironment: byEnv,
      byReason: Array.from(reasonTotals.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      timeRange: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        granularity: range.granularity,
      },
    };
  }

  async getFlagEnvironmentDetail(
    orgId: string,
    flagId: string,
    envId: string,
    range: AnalyticsTimeRange,
  ): Promise<FlagAnalyticsResult> {
    return this.getFlagAnalytics(orgId, flagId, range, envId);
  }

  async getOverview(
    orgId: string,
    range: AnalyticsTimeRange,
  ): Promise<{
    totalEvaluations: number;
    uniqueUsers: number;
    errorRate: number;
    activeFlags: number;
    evaluationTrend: { timestamp: string; count: number }[];
    topFlags: { flagKey: string; flagName: string; flagId: string | null; totalCount: number }[];
    byEnvironment: { environmentId: string; environmentName: string; totalCount: number; errorCount: number }[];
    timeRange: { from: string; to: string; granularity: string };
  }> {
    const rows = await this.db
      .select({
        flagKey: evaluationEvents.flagKey,
        flagId: evaluationEvents.featureFlagId,
        evaluationReason: evaluationEvents.evaluationReason,
        environmentId: evaluationEvents.environmentId,
        contextUserHash: evaluationEvents.contextUserHash,
        createdAt: evaluationEvents.createdAt,
      })
      .from(evaluationEvents)
      .where(and(
        eq(evaluationEvents.organizationId, orgId),
        gte(evaluationEvents.createdAt, range.from),
        lte(evaluationEvents.createdAt, range.to),
      ));

    const trendMap = new Map<string, number>();
    const flagTotals = new Map<string, { id: string | null; count: number }>();
    const envTotals = new Map<string, { total: number; errors: number }>();
    const uniqueUsers = new Set<string>();
    let totalEvaluations = 0;
    let errorCount = 0;

    for (const row of rows) {
      let bucketKey: string;
      if (range.granularity === 'hour') {
        const d = new Date(row.createdAt!);
        d.setMinutes(0, 0, 0);
        bucketKey = d.toISOString();
      } else {
        const d = new Date(row.createdAt!);
        d.setHours(0, 0, 0, 0);
        bucketKey = d.toISOString();
      }

      trendMap.set(bucketKey, (trendMap.get(bucketKey) || 0) + 1);

      const key = row.flagKey;
      const existing = flagTotals.get(key);
      flagTotals.set(key, {
        id: existing?.id ?? row.flagId,
        count: (existing?.count ?? 0) + 1,
      });

      if (row.contextUserHash) {
        uniqueUsers.add(row.contextUserHash);
      }

      if (ERROR_REASONS.includes(row.evaluationReason || '')) {
        errorCount++;
        if (row.environmentId) {
          const env = envTotals.get(row.environmentId) || { total: 0, errors: 0 };
          env.errors++;
          envTotals.set(row.environmentId, env);
        }
      }

      if (row.environmentId) {
        const env = envTotals.get(row.environmentId) || { total: 0, errors: 0 };
        env.total++;
        envTotals.set(row.environmentId, env);
      }

      totalEvaluations++;
    }

    const trend = Array.from(trendMap.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const topFlags = Array.from(flagTotals.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([flagKey, { id, count }]) => ({
        flagKey,
        flagName: flagKey,
        flagId: id,
        totalCount: count,
      }));

    const errorRate = totalEvaluations > 0 ? errorCount / totalEvaluations : 0;

    const byEnvironment = Array.from(envTotals.entries()).map(([envId, data]) => ({
      environmentId: envId,
      environmentName: envId.substring(0, 8),
      totalCount: data.total,
      errorCount: data.errors,
    }));

    return {
      totalEvaluations,
      uniqueUsers: uniqueUsers.size,
      errorRate,
      activeFlags: flagTotals.size,
      evaluationTrend: trend,
      topFlags,
      byEnvironment,
      timeRange: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        granularity: range.granularity,
      },
    };
  }

  async getEnvironmentAnalytics(
    orgId: string,
    envId: string,
    range: AnalyticsTimeRange,
  ): Promise<{
    environmentName: string;
    totalEvaluations: number;
    flags: { flagId: string | null; flagKey: string; totalCount: number; variationDistribution: { variationKey: string; count: number; percentage: number }[] }[];
    timeRange: { from: string; to: string };
  }> {
    const rows = await this.db
      .select({
        flagKey: evaluationEvents.flagKey,
        flagId: evaluationEvents.featureFlagId,
        variationKey: evaluationEvents.variationKey,
      })
      .from(evaluationEvents)
      .where(and(
        eq(evaluationEvents.organizationId, orgId),
        eq(evaluationEvents.environmentId, envId),
        gte(evaluationEvents.createdAt, range.from),
        lte(evaluationEvents.createdAt, range.to),
      ));

    const flagMap = new Map<string, {
      flagId: string | null;
      total: number;
      variations: Map<string, number>;
    }>();

    for (const row of rows) {
      const key = row.flagKey;
      if (!flagMap.has(key)) {
        flagMap.set(key, {
          flagId: row.flagId,
          total: 0,
          variations: new Map(),
        });
      }
      const entry = flagMap.get(key)!;
      entry.total++;
      const vk = row.variationKey || 'off';
      entry.variations.set(vk, (entry.variations.get(vk) || 0) + 1);
    }

    let totalEvaluations = 0;
    const flags = Array.from(flagMap.entries())
      .map(([flagKey, data]) => {
        totalEvaluations += data.total;
        const distribution = Array.from(data.variations.entries()).map(([vk, count]) => ({
          variationKey: vk,
          count,
          percentage: data.total > 0 ? (count / data.total) * 100 : 0,
        }));
        return {
          flagId: data.flagId,
          flagKey,
          totalCount: data.total,
          variationDistribution: distribution,
        };
      })
      .sort((a, b) => b.totalCount - a.totalCount);

    return {
      environmentName: envId.substring(0, 8),
      totalEvaluations,
      flags,
      timeRange: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
    };
  }
}
