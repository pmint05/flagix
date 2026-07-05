import { useState, useMemo } from "react";
import { Card, Skeleton, Button, Tag, TagGroup } from "@heroui/react";
import type { RangeValue } from "@react-types/shared";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { useContextStore } from "@/stores";
import { useProjectAnalytics } from "../hooks/useProjectAnalytics";
import { useProjectEnvironments } from "@/features/environments/api";
import { MetricCard } from "./MetricCard";
import { EvaluationTrendChart } from "./EvaluationTrendChart";
import { EnvironmentComparisonChart } from "./EnvironmentComparisonChart";
import { HorizontalBarChart } from "./HorizontalBarChart";
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

export function ProjectAnalyticsOverview() {
	const project = useContextStore((s) => s.selectedProject);
	const projectId = project?.id;

	const { data: envs = [] } = useProjectEnvironments(projectId);
	const activeEnvs = useMemo(() => envs.filter((e) => e.isActive), [envs]);

	const [dateRange, setDateRange] = useState<RangeValue<CalendarDate> | null>(
		() => {
			const tz = getLocalTimeZone();
			const d = today(tz);
			return { start: d.subtract({ days: 7 }), end: d };
		},
	);

	const [selectedEnvIds, setSelectedEnvIds] = useState<string[]>([]);

	const range = useMemo(() => calendarRangeToIso(dateRange), [dateRange]);

	const { data, isPending, isError, refetch } = useProjectAnalytics(
		projectId,
		range,
		selectedEnvIds.length > 0 ? selectedEnvIds : undefined,
	);

	const showMultiEnv = selectedEnvIds.length > 1;

	if (isError) {
		return (
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold text-foreground">
							Project Analytics
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

	const errorPct = data ? (data.errorRate * 100).toFixed(2) : "0.00";

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold text-foreground">
						Project Analytics
					</h2>
					{project && (
						<p className="text-sm text-default-400">{project.name}</p>
					)}
				</div>
				<DateRangeFilter value={dateRange} onChange={setDateRange} />
			</div>

			{activeEnvs.length > 0 && (
				<Card className="p-4">
					<h4 className="text-sm font-medium text-foreground mb-2">
						Compare Environments
					</h4>
					<TagGroup
						selectionMode="multiple"
						selectionBehavior="toggle"
						selectedKeys={new Set(selectedEnvIds)}
						onSelectionChange={(keys) => {
							const ids = Array.from(keys) as string[];
							setSelectedEnvIds(ids);
						}}>
						<TagGroup.List className="flex-wrap gap-2">
							{activeEnvs.map((env) => (
								<Tag key={env.id} id={env.id} textValue={env.name}>
									{env.name}
								</Tag>
							))}
						</TagGroup.List>
					</TagGroup>
				</Card>
			)}

			{showMultiEnv && (isPending ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
					{selectedEnvIds.map((id) => (
						<Card key={id} className="p-3 space-y-2">
							<Skeleton className="h-4 w-1/2 rounded" />
							<Skeleton className="h-6 w-1/3 rounded" />
							<Skeleton className="h-3 w-3/4 rounded" />
						</Card>
					))}
				</div>
			) : data && data.byEnvironment.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
					{data.byEnvironment.map((env) => {
						const envName =
							activeEnvs.find((e) => e.id === env.environmentId)?.name ??
							env.environmentName;
						const envErrorPct =
							env.totalCount > 0
								? ((env.errorCount / env.totalCount) * 100).toFixed(1)
								: "0.0";
						return (
							<Card key={env.environmentId} className="p-3">
								<p className="text-xs text-default-400 truncate">{envName}</p>
								<p className="text-lg font-bold text-foreground mt-1">
									{env.totalCount.toLocaleString()}
								</p>
								<p className="text-xs text-default-500 mt-0.5">
									{envErrorPct}% errors ({env.errorCount})
								</p>
							</Card>
						);
					})}
				</div>
			))}

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					label="Total Evaluations"
					value={data ? data.totalEvaluations.toLocaleString() : ""}
					isLoading={isPending}
				/>
				<MetricCard
					label="Unique Users"
					value={data ? data.uniqueUsers.toLocaleString() : ""}
					isLoading={isPending}
				/>
				<MetricCard
					label="Error Rate"
					value={data ? `${errorPct}%` : ""}
					variant={data && Number(errorPct) > 0 ? "danger" : "default"}
					isLoading={isPending}
				/>
				<MetricCard
					label="Active Flags"
					value={data ? data.activeFlags.toLocaleString() : ""}
					isLoading={isPending}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card className="p-4">
					<h4 className="text-sm font-medium text-foreground mb-4">
						Evaluation Trend
					</h4>
					{isPending ? (
						<Skeleton className="h-48 w-full rounded-lg" />
					) : data ? (
						<EvaluationTrendChart
							data={data.evaluationTrend.map((d) => ({ ...d, byVariation: {} }))}
						/>
					) : (
						<div className="h-48 flex items-center justify-center text-default-400">No data</div>
					)}
				</Card>
				<Card className="p-4">
					<h4 className="text-sm font-medium text-foreground mb-4">
						By Environment
					</h4>
					{isPending ? (
						<Skeleton className="h-48 w-full rounded-lg" />
					) : data ? (
						<EnvironmentComparisonChart data={data.byEnvironment} />
					) : (
						<div className="h-48 flex items-center justify-center text-default-400">No data</div>
					)}
				</Card>
			</div>

			{data && data.topFlags.length > 0 && (
				<Card className="p-4">
					<h4 className="text-sm font-medium text-foreground mb-3">
						Top Evaluated Flags
					</h4>
					<HorizontalBarChart
						data={data.topFlags.map((f) => ({
							label: f.flagKey,
							count: f.totalCount,
						}))}
						maxItems={10}
					/>
				</Card>
			)}
		</div>
	);
}
