import { Card, Skeleton } from "@heroui/react";
import { useAnalyticsOverview } from "../hooks/useAnalyticsOverview";
import { MetricCard } from "./MetricCard";
import { EvaluationTrendChart } from "./EvaluationTrendChart";
import { EnvironmentComparisonChart } from "./EnvironmentComparisonChart";

export function AnalyticsOverview() {
	const { data, isPending, isError } = useAnalyticsOverview({
		granularity: "hour",
	});

	if (isPending) {
		return (
			<div className="p-6 space-y-6">
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
			<div className="p-6">
				<div className="flex items-center justify-center h-64 text-default-400">
					Failed to load analytics data. Try again later.
				</div>
			</div>
		);
	}

	const errorPct = (data.errorRate * 100).toFixed(2);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-foreground">
					Analytics Overview
				</h2>
				<p className="text-sm text-default-400">Last 24 hours</p>
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
						data={data.evaluationTrend.map((d) => ({
							...d,
							byVariation: {},
						}))}
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
