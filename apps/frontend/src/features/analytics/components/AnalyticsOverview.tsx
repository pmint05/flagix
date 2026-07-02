import { useState, useMemo } from "react";
import { Card, Skeleton, Button } from "@heroui/react";
import type { RangeValue } from "@react-types/shared";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { useAnalyticsOverview } from "../hooks/useAnalyticsOverview";
import { MetricCard } from "./MetricCard";
import { EvaluationTrendChart } from "./EvaluationTrendChart";
import { EnvironmentComparisonChart } from "./EnvironmentComparisonChart";
import type { AnalyticsTimeRange } from "../types/analytics";

function calendarRangeToIso(
	range: RangeValue<CalendarDate> | null,
): AnalyticsTimeRange {
	if (!range) return {};
	const tz = getLocalTimeZone();
	return {
		from: range.start.toDate(tz).toISOString(),
		to: range.end.add({ days: 1 }).toDate(tz).toISOString(),
		granularity: "hour",
	};
}

export function AnalyticsOverview() {
	const [dateRange, setDateRange] = useState<RangeValue<CalendarDate> | null>(
		() => {
			const tz = getLocalTimeZone();
			const todayDate = today(tz);
			return { start: todayDate.subtract({ days: 7 }), end: todayDate };
		},
	);
	const range = useMemo(() => calendarRangeToIso(dateRange), [dateRange]);
	const { data, isPending, isError, refetch } = useAnalyticsOverview(range);

	if (isPending) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48 rounded-lg" />
				<Skeleton className="h-8 w-48 rounded-lg" />
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<MetricCard key={i} label="" value="" isLoading />
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
						<h2 className="text-xl font-semibold text-foreground">
							Analytics Overview
						</h2>
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

	const errorPct = (data.errorRate * 100).toFixed(2);
	const hasData = data.totalEvaluations > 0;

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold text-foreground">
						Analytics Overview
					</h2>
				</div>
				<div className="flex items-center gap-3">
					<DateRangeFilter value={dateRange} onChange={setDateRange} />
				</div>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					label="Total Evaluations"
					value={data.totalEvaluations.toLocaleString()}
				/>
				<MetricCard
					label="Unique Users"
					value={data.uniqueUsers.toLocaleString()}
				/>
				<MetricCard
					label="Error Rate"
					value={`${errorPct}%`}
					variant={Number(errorPct) > 0 ? "danger" : "default"}
				/>
				<MetricCard
					label="Active Flags"
					value={data.activeFlags.toLocaleString()}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card className="p-4">
					<h4 className="text-sm font-medium text-foreground mb-4">
						Evaluation Trend
					</h4>
					<EvaluationTrendChart
						data={data.evaluationTrend.map((d) => ({ ...d, byVariation: {} }))}
					/>
				</Card>
				<Card className="p-4">
					<h4 className="text-sm font-medium text-foreground mb-4">
						By Environment
					</h4>
					<EnvironmentComparisonChart data={data.byEnvironment} />
				</Card>
			</div>

			{data.topFlags.length > 0 && (
				<Card className="p-4">
					<h4 className="text-sm font-medium text-foreground mb-3">
						Top Evaluated Flags
					</h4>
					<div className="space-y-2">
						{data.topFlags.map((f, i) => (
							<div
								key={f.flagKey}
								className="flex items-center justify-between py-1">
								<div className="flex items-center gap-3">
									<span className="text-xs font-mono text-default-400 w-4">
										{i + 1}.
									</span>
									<span className="text-sm font-medium text-foreground">
										{f.flagKey}
									</span>
								</div>
								<span className="text-xs text-default-500">
									{f.totalCount.toLocaleString()} evaluations
								</span>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
