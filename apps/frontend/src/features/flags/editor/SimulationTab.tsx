"use client";

import { useState } from "react";
import {
	Panel,
	Group as PanelGroup,
	Separator as ResizableSeparator,
} from "react-resizable-panels";
import type { FeatureFlag } from "@/types/feature-flag";
import { useFormContext } from "react-hook-form";
import type { FlagEditorFormValues } from "./schema";
import { useSimulateFlag } from "../api";
import { useContextStore, useThemeStore } from "@/stores";
import { toast } from "sonner";
import { SimulationLeftPanel } from "./components/simulation/SimulationLeftPanel";
import { SimulationRightPanel } from "./components/simulation/SimulationRightPanel";
import { CodeSnippetModal } from "@/features/keys/components/CodeSnippetModal";
import { getPresets } from "./components/simulation/constants";
import { useSimulationStore, DEFAULT_SIMULATION_STATE } from "./store/simulation-store";

interface SimulationTabProps {
	flag: FeatureFlag;
}

export function SimulationTab({ flag }: SimulationTabProps) {
	const currentEnv = useContextStore((s) => s.selectedEnvironment);
	const { getValues } = useFormContext<FlagEditorFormValues>();

	const [isSnippetOpen, setIsSnippetOpen] = useState(false);
	
	const cachedState = useSimulationStore((s) => s.statesByFlagId[flag.id]) || DEFAULT_SIMULATION_STATE(flag.key);
	const setSimulationState = useSimulationStore((s) => s.setSimulationState);

	const jsonValue = cachedState.jsonValue;
	const jsonError = cachedState.jsonError;
	const simulationResult = cachedState.simulationResult;
	const simulationOptions = cachedState.simulationOptions;

	const { mutate: runSimulation, isPending } = useSimulateFlag();

	const handleEditorChange = (val: string) => {
		let error: string | null = null;
		try {
			if (val.trim()) {
				JSON.parse(val);
			} else {
				error = "Context cannot be empty";
			}
		} catch (err: any) {
			error = err.message;
		}
		setSimulationState(flag.id, { jsonValue: val, jsonError: error });
	};

	const formatJson = () => {
		try {
			const parsed = JSON.parse(jsonValue);
			setSimulationState(flag.id, {
				jsonValue: JSON.stringify(parsed, null, 2),
				jsonError: null,
			});
		} catch (err: any) {
			toast.error("Format Failed", {
				description: "JSON syntax is invalid, cannot format.",
			});
		}
	};

	const mapFormToFlagConfig = (data: FlagEditorFormValues) => {
		return {
			isEnabled: data.isFlagOn,
			defaultVariationId: data.defaultVariationId || null,
			offVariationId: data.offVariationId || null,
			variations: data.variations.map((v) => ({
				id: v.id,
				key: v.key,
				value: v.value,
				isDefault: v.id === data.defaultVariationId,
			})),
			rules: data.rules.map((rule) => {
				const baseRule: any = {
					id: rule.id,
					ruleType: rule.ruleType,
					isEnabled: rule.isEnabled,
					variationId: rule.variationId || undefined,
					conditions: {},
				};
				if (rule.ruleType === "percentage") {
					baseRule.conditions = {
						rollouts:
							rule.conditions?.rollouts?.map((r: any) => ({
								variationId: r.variationId,
								percentage: Number(r.percentage),
							})) || [],
					};
				} else if (rule.ruleType === "user") {
					baseRule.conditions = {
						operator: rule.conditions.operator,
						userIds: rule.conditions.userIds,
					};
				} else if (rule.ruleType === "role") {
					baseRule.conditions = {
						operator: rule.conditions.operator,
						roles: rule.conditions.roles,
					};
				} else if (rule.ruleType === "custom") {
					baseRule.conditions = {
						conditions: rule.conditions.conditions,
					};
				}
				return baseRule;
			}),
		};
	};

	const handleSimulate = () => {
		try {
			const parsed = JSON.parse(jsonValue);
			setSimulationState(flag.id, { jsonError: null });
			if (!currentEnv) {
				toast.error("Simulation Failed", {
					description: "Please select an environment first.",
				});
				return;
			}

			const context = parsed.context ?? parsed;

			const formData = getValues();
			const flagConfig = {
				...mapFormToFlagConfig(formData),
				bypassDraft: simulationOptions.bypassDraft,
			};

			runSimulation(
				{
					flagId: flag.id,
					envId: currentEnv.id,
					context,
					flagConfig,
				},
				{
					onSuccess: (data) => {
						setSimulationState(flag.id, { simulationResult: data });
						toast.success("Simulation Complete");
					},
					onError: (err: any) => {
						toast.error("Simulation Failed", {
							description: err.message || "Failed to resolve flag evaluation.",
						});
					},
				},
			);
		} catch (err: any) {
			setSimulationState(flag.id, { jsonError: err.message });
			toast.error("Validation Error", {
				description: "JSON syntax is invalid.",
			});
		}
	};

	const handleOptionsChange = (opts: { bypassDraft: boolean }) => {
		setSimulationState(flag.id, { simulationOptions: opts });
	};

	const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
	const editorTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

	const getContextJson = (): string => {
		try {
			const parsed = JSON.parse(jsonValue);
			return JSON.stringify(parsed.context ?? parsed, null, 2);
		} catch {
			return jsonValue;
		}
	};

	return (
		<div className="py-6 h-[calc(100vh-280px)] min-h-125">
			<PanelGroup
				orientation="horizontal"
				className="flex h-full border border-divider rounded-3xl overflow-hidden shadow-sm">
				{/* Left Panel: Editor & Controls */}
				<Panel defaultSize="45%" minSize="35%">
					<SimulationLeftPanel
						jsonValue={jsonValue}
						onChange={handleEditorChange}
						onFormatJson={formatJson}
						onSimulate={handleSimulate}
						isPending={isPending}
						jsonError={jsonError}
						onOpenSnippet={() => setIsSnippetOpen(true)}
						editorTheme={editorTheme}
						presets={getPresets(flag.key)}
						options={simulationOptions}
						onOptionsChange={handleOptionsChange}
					/>
				</Panel>

				<ResizableSeparator className="group mx-0 relative bg-border/50 w-1 hover:bg-border transition-colors" id="simulation-separator">
					<div className="absolute inset-y-0 -left-3 -right-3 z-10 cursor-col-resize flex items-center justify-center">
						<div className="w-2 h-12 bg-default opacity-0 group-hover:opacity-100 group-data-[resize-handle-state=drag]:opacity-100 rounded-full transition-opacity" />
					</div>
				</ResizableSeparator>

				{/* Right Panel: Result Visualizer */}
				<Panel defaultSize="55%" minSize="45%">
					<SimulationRightPanel
						simulationResult={simulationResult}
						flag={flag}
						onClear={() => setSimulationState(flag.id, { simulationResult: null })}
					/>
				</Panel>
			</PanelGroup>

			<CodeSnippetModal
				isOpen={isSnippetOpen}
				onClose={() => setIsSnippetOpen(false)}
				flagKey={flag.key}
				contextJson={getContextJson()}
			/>
		</div>
	);
}
