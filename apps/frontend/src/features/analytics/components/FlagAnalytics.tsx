import { useState } from "react";
import { Skeleton, Card, Button } from "@heroui/react";
import type { RangeValue } from "@react-types/shared";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import type { FeatureFlag } from "@/types/feature-flag";
import { useContextStore } from "@/stores";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { useFlagAnalytics } from "../hooks/useFlagAnalytics";
import { EvaluationTrendChart } from "./EvaluationTrendChart";
import { VariationDistributionChart } from "./VariationDistributionChart";
import type { AnalyticsTimeRange } from "../types/analytics";

function calendarRangeToIso(range: RangeValue<CalendarDate> | null): AnalyticsTimeRange {
  if (!range) return {};
  const tz = getLocalTimeZone();
  return {
    from: range.start.toDate(tz).toISOString(),
    to: range.end.add({ days: 1 }).toDate(tz).toISOString(),
    granularity: "hour",
  };
}

interface FlagAnalyticsProps {
  flag: FeatureFlag;
}

export function FlagAnalytics({ flag }: FlagAnalyticsProps) {
  const currentEnv = useContextStore((s) => s.selectedEnvironment);
  const [dateRange, setDateRange] = useState<RangeValue<CalendarDate> | null>(
    () => {
      const tz = getLocalTimeZone();
      const todayDate = today(tz);
      return { start: todayDate.subtract({ days: 7 }), end: todayDate };
    },
  );

  const { data, isPending, isError, refetch } = useFlagAnalytics(
    flag.id,
    calendarRangeToIso(dateRange),
    currentEnv?.id,
  );

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg mt-2" />
          </div>
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{flag.name} Analytics</h3>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-default-400">
          <p className="text-sm">Failed to load analytics data.</p>
          <Button variant="outline" size="sm" onPress={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const total = data.totalEvaluations;
  const errors = data.errorCount;
  const hasData = data.evaluationTrend.length > 0 || data.variationDistribution.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{data.flagName} Analytics</h3>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-default-400">
          <p className="text-lg font-medium">No evaluation data yet</p>
          <p className="text-sm">This flag hasn't been evaluated in the selected time range.</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
