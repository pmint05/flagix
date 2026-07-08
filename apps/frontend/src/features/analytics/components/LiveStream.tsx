import { useCallback, useEffect, useRef, useState } from "react";
import {
	Button,
	SearchField,
	Spinner,
	Skeleton,
	Surface,
	Chip,
} from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useThemeStore } from "#/stores";
import {
	PlayIcon,
	PauseIcon,
	TrashIcon,
	ArrowLeftIcon,
} from "@phosphor-icons/react";
import { useAnalyticsStream } from "../hooks/useAnalyticsStream";
import { format } from "date-fns";

function formatTime(iso: string): string {
	const d = new Date(iso);
	return format(d, "yyyy-MM-dd HH:mm:ss");
}

function formatReason(reason: string): string {
	if (reason === "DEFAULT") return "Default";
	if (reason === "TARGETING_MATCH") return "Targeted";
	if (reason === "PERCENTAGE_ROLLOUT") return "Rollout";
	if (reason === "RULE_MATCH") return "Rule";
	return reason;
}

export function LiveStream() {
	const [filterKey, setFilterKey] = useState("");
	const isDark = useThemeStore((s) => s.resolvedTheme) === "dark";

	const { events, isPaused, isConnected, error, pause, resume, clear } =
		useAnalyticsStream({ flagKey: filterKey || undefined });

	const [missedCount, setMissedCount] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);
	const shouldAutoScroll = useRef(true);

	const handleScroll = useCallback(() => {
		if (!scrollRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
		shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 32;
	}, []);

	useEffect(() => {
		if (!isPaused || !scrollRef.current) return;
		shouldAutoScroll.current = false;
	}, [isPaused]);

	useEffect(() => {
		if (shouldAutoScroll.current && scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
		if (isPaused && events.length > 0) setMissedCount((c) => c + 1);
	}, [events, isPaused]);

	if (!useThemeStore.getState().resolvedTheme) {
		return (
			<div className="space-y-6">
				<div>
					<h2 className="text-xl font-semibold text-foreground">
						Live Evaluation Stream
					</h2>
					<p className="text-sm">Loading...</p>
				</div>
				<Skeleton className="h-96 rounded-lg" />
			</div>
		);
	}

	const hasEvents = events.length > 0;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<div>
					<h2 className="text-2xl font-semibold text-foreground">
						Live Evaluation Stream
					</h2>
					<p className="text-sm mt-1 text-muted">Real-time flag evaluation events</p>
				</div>
				<div className="flex items-center gap-2 ml-auto">
					<Chip size="sm" color={isConnected ? "success" : "danger"}>
						{isConnected ? "Connected" : "Disconnected"}
					</Chip>
					{isPaused ? (
						<Button variant="primary" size="sm" onPress={resume}>
							<PlayIcon weight="fill" /> Resume
						</Button>
					) : (
						<Button variant="outline" size="sm" onPress={pause}>
							<PauseIcon weight="fill" /> Pause
						</Button>
					)}
				</div>
			</div>

			<div className="flex items-center gap-3">
				<SearchField
					value={filterKey}
					onChange={(v) => setFilterKey(v)}
					className="max-w-xs">
					<SearchField.Group>
						<SearchField.SearchIcon>
							<SearchField.SearchIcon />
						</SearchField.SearchIcon>
						<SearchField.Input placeholder="Filter by flag key..." />
						{filterKey && <SearchField.ClearButton />}
					</SearchField.Group>
				</SearchField>

				<div className="flex items-center gap-2 ml-auto">
					{isPaused && missedCount > 0 && (
						<Chip size="sm" color="warning">
							{missedCount} new events
						</Chip>
					)}
					<Chip size="sm" color="default">
						{events.length} events
					</Chip>
					<Button variant="outline" size="sm" onPress={clear}>
						<TrashIcon />
					</Button>
				</div>
			</div>

			{error && (
				<div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm text-warning">
					{error}
				</div>
			)}

			<Surface className="bg-surface-secondary rounded-3xl overflow-hidden">
				<div
					ref={scrollRef}
					onScroll={handleScroll}
					className="min-h-42 max-h-[calc(100vh-200px)] overflow-y-auto">
					<table className="w-full text-sm">
						<thead
							className="sticky top-0 z-10"
							style={{ backgroundColor: isDark ? "#18181b" : "#fafafa" }}>
							<tr className="border-b border-divider text-xs font-medium uppercase">
								<th className="text-left px-4 py-2.5 max-w-10">Time</th>
								<th className="text-left px-4 py-2.5">Flag Key</th>
								<th className="text-left px-4 py-2.5">Variation</th>
								<th className="text-left px-4 py-2.5">Environment</th>
								<th className="text-left px-4 py-2.5">Reason</th>
								<th className="text-left px-4 py-2.5">User</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-divider">
							{!hasEvents && !isConnected && !error && (
								<tr>
									<td colSpan={6} className="text-center py-12">
										<Spinner size="sm" className="mr-2" />
										Waiting for evaluation events...
									</td>
								</tr>
							)}
							{!hasEvents && isConnected && !error && (
								<tr>
									<td colSpan={6} className="text-center py-12 text-sm">
										<Spinner size="sm" className="mr-2" />
										Waiting for evaluation events...
									</td>
								</tr>
							)}
							{!hasEvents && !isConnected && error && (
								<tr>
									<td colSpan={6} className="text-center py-12 text-sm">
										No events received yet
									</td>
								</tr>
							)}
							{events.map((event, idx) => {
								return (
									<tr
										key={`${event.timestamp}-${idx}`}
										className="hover:bg-default/80 transition-colors animate-in fade-in slide-in-from-top-1">
										<td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap max-w-20">
											{formatTime(event.timestamp)}
										</td>
										<td className="px-4 py-2.5 font-mono font-medium text-primary truncate">
											{event.flagKey}
										</td>
										<td className="px-4 py-2.5">
											{event.variationKey ? (
												<Chip color="accent">{event.variationKey}</Chip>
											) : (
												<span className="text-xs">&mdash;</span>
											)}
										</td>
										<td className="px-4 py-2.5 truncate">
											{event.environmentName || event.environmentId}
										</td>
										<td className="px-4 py-2.5">
											<Chip size="sm" className="uppercase">
												{formatReason(event.evaluationReason)}
											</Chip>
										</td>
										<td className="px-4 py-2.5 font-mono text-xs truncate">
											{event.contextUserHash || "\u2014"}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</Surface>
		</div>
	);
}
