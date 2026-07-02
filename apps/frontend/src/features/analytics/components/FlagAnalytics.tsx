import { Skeleton, Card } from "@heroui/react";
import type { FeatureFlag } from "@/types/feature-flag";
import { useContextStore } from "@/stores";
import { useFlagAnalytics } from "../hooks/useFlagAnalytics";
import { EvaluationTrendChart } from "./EvaluationTrendChart";
import { VariationDistributionChart } from "./VariationDistributionChart";

interface FlagAnalyticsProps {
  flag: FeatureFlag;
}

export function FlagAnalytics({ flag }: FlagAnalyticsProps) {
  const currentEnv = useContextStore((s) => s.selectedEnvironment);
  const { data, isPending, isError } = useFlagAnalytics(
    flag.id,
    { granularity: "hour" },
    currentEnv?.id,
  );

  if (isPending) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64 text-default-400">
          Failed to load analytics data. Try again later.
        </div>
      </div>
    );
  }

  const total = data.totalEvaluations;
  const errors = data.errorCount;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{data.flagName} Analytics</h3>
        <p className="text-sm text-default-400">Last 24 hours</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-default-400 uppercase tracking-wide">Evaluations</p>
          <p className="text-2xl font-bold text-foreground mt-1">{total.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-default-400 uppercase tracking-wide">Errors</p>
          <p className={`text-2xl font-bold mt-1 ${errors > 0 ? "text-danger" : "text-foreground"}`}>
            {errors.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-default-400 uppercase tracking-wide">Error Rate</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {total > 0 ? ((errors / total) * 100).toFixed(2) : "0.00"}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-default-400 uppercase tracking-wide">Flag Type</p>
          <p className="text-2xl font-bold text-foreground mt-1 capitalize">{data.flagType}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-4">Evaluation Trend</h4>
          <EvaluationTrendChart data={data.evaluationTrend} />
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-4">Variation Distribution</h4>
          <VariationDistributionChart data={data.variationDistribution} />
        </Card>
      </div>

      {data.byReason.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">By Evaluation Reason</h4>
          <div className="space-y-2">
            {data.byReason.map((r) => (
              <div key={r.reason} className="flex items-center justify-between">
                <span className="text-xs text-default-500 font-mono">{r.reason}</span>
                <span className="text-xs font-medium text-foreground">{r.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
