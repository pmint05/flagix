import { useState } from "react";
import {
	Button,
	Autocomplete,
	ListBox,
	SearchField,
	Surface,
	Spinner,
	useFilter,
} from "@heroui/react";
import {
	PlayIcon,
	PauseIcon,
	TrashIcon,
	StopIcon,
} from "@phosphor-icons/react";
import { useContextStore } from "@/stores";
import { useProjects } from "@/features/projects/api";
import { useProjectEnvironments } from "@/features/environments/api";
import { useProjectStream } from "../hooks/useProjectStream";
import { useThemeStore } from "#/stores";

const VARIATION_COLORS_LIGHT = [
	"#dbeafe",
	"#dcfce7",
	"#fee2e2",
	"#fef3c7",
	"#f3e8ff",
	"#e0f2fe",
	"#fce7f3",
	"#f0fdf4",
	"#fff7ed",
	"#ecfeff",
];
const VARIATION_COLORS_DARK = [
	"#1e3a5f",
	"#14532d",
	"#7f1d1d",
	"#713f12",
	"#3b0764",
	"#0c4a6e",
	"#701a75",
	"#052e16",
	"#431407",
	"#164e63",
];
const VAR_COLOR_CACHE: Record<string, string> = {};

function getVarColor(key: string | null, isDark: boolean): string {
	if (!key) return isDark ? "#27272a" : "#f4f4f5";
	if (VAR_COLOR_CACHE[key]) return VAR_COLOR_CACHE[key];
	const palette = isDark ? VARIATION_COLORS_DARK : VARIATION_COLORS_LIGHT;
	let hash = 0;
	for (let i = 0; i < key.length; i++)
		hash = (hash * 31 + key.charCodeAt(i)) | 0;
	return (VAR_COLOR_CACHE[key] = palette[Math.abs(hash) % palette.length]);
}

function formatTime(iso: string): string {
	const d = new Date(iso);
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function formatReason(reason: string): string {
	if (reason === "DEFAULT") return "Default";
	if (reason === "TARGETING_MATCH") return "Targeted";
	if (reason === "PERCENTAGE_ROLLOUT") return "Rollout";
	if (reason === "RULE_MATCH") return "Rule";
	return reason;
}

export function ProjectLiveStream() {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const currentProject = useContextStore((s) => s.selectedProject);

	const { data: projects = [] } = useProjects();
	const [selProjectId, setSelProjectId] = useState<string | null>(
		currentProject?.id ?? null,
	);
	const [selEnvId, setSelEnvId] = useState<string | null>(null);

	const { data: envs = [] } = useProjectEnvironments(selProjectId ?? undefined);

	const isDark = useThemeStore((s) => s.resolvedTheme) === "dark";

	const {
		events,
		connectionState,
		isPaused,
		error,
		connect,
		disconnect,
		pause,
		resume,
		clear,
	} = useProjectStream({
		orgId,
		projectId: selProjectId ?? "",
		environmentId: selEnvId ?? undefined,
	});

	const isConnecting = connectionState === "connecting";
	const isConnected = connectionState === "connected";
	const canConnect =
		!!orgId &&
		(connectionState === "idle" || connectionState === "disconnected");
	const scopeLocked = isConnecting || isConnected;

	const { contains } = useFilter({ sensitivity: "base" });

	const selectedProject = projects.find((p) => p.id === selProjectId);

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-xl font-semibold text-foreground">
					Live Evaluation Stream
				</h2>
				<p className="text-sm text-default-400">
					Real-time evaluation events — project & environment are optional
				</p>
			</div>

			<div className="flex flex-wrap gap-3 items-end">
				<div className="flex flex-col gap-1.5 min-w-50">
					<span className="text-xs font-medium text-default-500">
						Project (optional)
					</span>
					<Autocomplete
						variant="secondary"
						placeholder="All Projects"
						isDisabled={scopeLocked}
						value={selProjectId}
						onChange={(key) => {
							setSelProjectId(key ? (key as string) : null);
							setSelEnvId(null);
						}}>
						<Autocomplete.Trigger>
							<Autocomplete.Value>
								{({ isPlaceholder }) =>
									isPlaceholder || !selectedProject
										? "Select Project"
										: selectedProject.name
								}
							</Autocomplete.Value>
							<Autocomplete.ClearButton />
							<Autocomplete.Indicator />
						</Autocomplete.Trigger>
						<Autocomplete.Popover>
							<Autocomplete.Filter filter={contains}>
								<SearchField autoFocus variant="secondary">
									<SearchField.Group>
										<SearchField.SearchIcon>
											<SearchField.SearchIcon />
										</SearchField.SearchIcon>
										<SearchField.Input placeholder="Search projects..." />
										<SearchField.ClearButton />
									</SearchField.Group>
								</SearchField>
								<ListBox>
									{projects.map((p) => (
										<ListBox.Item key={p.id} id={p.id} textValue={p.name}>
											{p.name}
										</ListBox.Item>
									))}
								</ListBox>
							</Autocomplete.Filter>
						</Autocomplete.Popover>
					</Autocomplete>
				</div>

				<div className="flex flex-col gap-1.5 min-w-50">
					<span className="text-xs font-medium text-default-500">
						Environment (optional)
					</span>
					<Autocomplete
						variant="secondary"
						placeholder="Any Environment"
						isDisabled={scopeLocked || !selProjectId}
						value={selEnvId}
						onChange={(key) => setSelEnvId(key as string)}>
						<Autocomplete.Trigger>
							<Autocomplete.Value>
								{({ isPlaceholder }) =>
									isPlaceholder || !selEnvId
										? "Any Environment"
										: (envs.find((e) => e.id === selEnvId)?.name ?? selEnvId)
								}
							</Autocomplete.Value>
							<Autocomplete.ClearButton />
							<Autocomplete.Indicator />
						</Autocomplete.Trigger>
						<Autocomplete.Popover>
							<Autocomplete.Filter filter={contains}>
								<SearchField autoFocus variant="secondary">
									<SearchField.Group>
										<SearchField.SearchIcon>
											<SearchField.SearchIcon />
										</SearchField.SearchIcon>
										<SearchField.Input placeholder="Search environments..." />
										<SearchField.ClearButton />
									</SearchField.Group>
								</SearchField>
								<ListBox>
									{envs.map((e) => (
										<ListBox.Item key={e.id} id={e.id} textValue={e.name}>
											{e.name}
										</ListBox.Item>
									))}
								</ListBox>
							</Autocomplete.Filter>
						</Autocomplete.Popover>
					</Autocomplete>
				</div>

				<div className="flex gap-2">
					{canConnect && (
						<Button
							variant="primary"
							onPress={connect}
							isPending={isConnecting}>
							<PlayIcon weight="fill" /> Connect
						</Button>
					)}
					{isConnected && (
						<>
							{isPaused ? (
								<Button variant="primary" size="sm" onPress={resume}>
									<PlayIcon weight="fill" /> Resume
								</Button>
							) : (
								<Button variant="outline" size="sm" onPress={pause}>
									<PauseIcon weight="fill" /> Pause
								</Button>
							)}
							<Button
								variant="danger"
								size="sm"
								onPress={() => {
									disconnect();
								}}>
								<StopIcon weight="fill" /> Disconnect
							</Button>
						</>
					)}
				</div>

				<div className="flex items-center gap-2 ml-auto">
					{isConnected && (
						<>
							<span
								className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success`}>
								Connected
							</span>
							<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-default-100 text-default-600">
								{events.length} events
							</span>
							<Button variant="outline" size="sm" onPress={clear}>
								<TrashIcon />
							</Button>
						</>
					)}
					{isConnecting && (
						<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning">
							<Spinner size="sm" /> Connecting...
						</span>
					)}
				</div>
			</div>

			{error && (
				<div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm text-warning">
					{error}
				</div>
			)}

			<Surface className="bg-surface-secondary rounded-3xl overflow-hidden">
				<div className="min-h-42 max-h-[calc(100vh-240px)] overflow-y-auto">
					<table className="w-full text-sm">
						<thead
							className="sticky top-0 z-10"
							style={{ backgroundColor: isDark ? "#18181b" : "#fafafa" }}>
							<tr className="border-b border-divider text-xs font-medium uppercase text-default-400">
								<th className="text-left px-4 py-2.5 w-[72px]">Time</th>
								<th className="text-left px-4 py-2.5">Flag Key</th>
								<th className="text-left px-4 py-2.5 w-[140px]">Variation</th>
								<th className="text-left px-4 py-2.5 w-[120px]">Environment</th>
								<th className="text-left px-4 py-2.5 w-[100px]">Reason</th>
								<th className="text-left px-4 py-2.5 w-[90px]">User</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-divider">
							{events.length === 0 && (
								<tr>
									<td
										colSpan={6}
										className="text-center py-12 text-default-400 text-sm">
										{isConnected
											? "Waiting for evaluation events..."
											: "Connect to start receiving events"}
									</td>
								</tr>
							)}
							{events.map((event, idx) => (
								<tr
									key={`${event.timestamp}-${idx}`}
									className="hover:bg-default-100/50 transition-colors">
									<td className="px-4 py-2.5 text-default-500 font-mono text-xs whitespace-nowrap">
										{formatTime(event.timestamp)}
									</td>
									<td className="px-4 py-2.5 font-mono font-medium text-primary truncate max-w-[200px]">
										{event.flagKey}
									</td>
									<td className="px-4 py-2.5">
										{event.variationKey ? (
											<span
												className="inline-block px-2 py-0.5 rounded text-xs font-medium"
												style={{
													backgroundColor: getVarColor(
														event.variationKey,
														isDark,
													),
												}}>
												{event.variationKey}
											</span>
										) : (
											<span className="text-default-400 text-xs">&mdash;</span>
										)}
									</td>
									<td className="px-4 py-2.5 text-default-600 truncate max-w-[120px]">
										{event.environmentName || event.environmentId}
									</td>
									<td className="px-4 py-2.5">
										<span className="text-xs text-default-500 bg-default-100 px-1.5 py-0.5 rounded">
											{formatReason(event.evaluationReason)}
										</span>
									</td>
									<td className="px-4 py-2.5 text-default-400 font-mono text-xs truncate max-w-[90px]">
										{event.contextUserHash || "\u2014"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Surface>
		</div>
	);
}
