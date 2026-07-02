import { useEffect } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Tabs, toast, Button, Separator, Chip } from "@heroui/react";
import {
	Panel,
	Group as PanelGroup,
	Separator as ResizableSeparator,
} from "react-resizable-panels";
import type { FeatureFlag } from "@/types/feature-flag";
import { TargetingTab } from "./TargetingTab";
import { VariationsTab } from "./VariationsTab";
import { SimulationTab } from "./SimulationTab";
import { MonitoringTab } from "./MonitoringTab";
import { SettingsTab } from "./SettingsTab";
import { FlagEditorProvider } from "./FlagEditorContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { flagEditorFormSchema, type FlagEditorFormValues } from "./schema";
import CopyButton from "#/components/ui/copy-button";
import { useContextStore } from "#/stores";
import { useRules } from "@/features/rules/api";
import { usePatchFlagConfig } from "../api";
import { ActionButton } from "#/components/ui/action-button";

const routeApi = getRouteApi(
	"/_authenticated/projects/$projectSlug/flags/$flagSlug",
);

function EditorContent({ flag, projectSlug }: FlagEditorLayoutProps) {
	const currentEnv = useContextStore((s) => s.selectedEnvironment);
	const search = routeApi.useSearch();
	const navigate = routeApi.useNavigate();
	const isMobile = useIsMobile();
	const { data: rulesData } = useRules(flag.id, currentEnv?.id);

	const activeTab = search.tab ?? "targeting";

	const setActiveTab = (key: string) => {
		navigate({
			search: (prev: any) => ({ ...prev, tab: key as any }),
			replace: true,
		});
	};

	const defaultFlagState = flag.states?.find(
		(s) => s.environmentId === currentEnv?.id,
	);

	const methods = useForm<FlagEditorFormValues>({
		resolver: zodResolver(flagEditorFormSchema),
		defaultValues: {
			isFlagOn: defaultFlagState?.isEnabled ?? false,
			offVariationId: defaultFlagState?.offVariationId ?? "",
			defaultVariationId:
				defaultFlagState?.defaultVariationId ??
				flag.variations?.find((v) => v.isDefault)?.id ??
				"",
			rules: [],
			variations: flag.variations || [],
		},
	});

	useEffect(() => {
		if (rulesData && currentEnv) {
			const envRules = rulesData
				.filter((r) => r.environmentId === currentEnv.id)
				.sort(
					(a, b) => Number.parseInt(a.priority) - Number.parseInt(b.priority),
				);

			methods.reset({
				isFlagOn: defaultFlagState?.isEnabled ?? false,
				offVariationId: defaultFlagState?.offVariationId ?? "",
				defaultVariationId:
					defaultFlagState?.defaultVariationId ??
					flag.variations?.find((v) => v.isDefault)?.id ??
					"",
				variations: flag.variations || [],
				rules: envRules.map((rule) => {
					const ruleType = rule.ruleType as string;
					if (ruleType === "percentage") {
						const conditions: any = rule.conditions || {};
						const rollouts =
							conditions.rollouts ||
							(conditions.percentage !== undefined
								? [
										{
											variationId: rule.variationId || "",
											percentage: conditions.percentage,
										},
									]
								: []);
						return {
							id: rule.id,
							ruleType: "percentage" as const,
							isEnabled: rule.isEnabled,
							variationId: rule.variationId || undefined,
							conditions: { rollouts },
						};
					}
					if (ruleType === "user") {
						const conditions: any = rule.conditions || {};
						return {
							id: rule.id,
							ruleType: "user" as const,
							isEnabled: rule.isEnabled,
							variationId: rule.variationId || "",
							conditions: {
								operator: (conditions.operator as "in" | "not_in") || "in",
								userIds: conditions.userIds || [],
							},
						};
					}
					if (ruleType === "role") {
						const conditions: any = rule.conditions || {};
						return {
							id: rule.id,
							ruleType: "role" as const,
							isEnabled: rule.isEnabled,
							variationId: rule.variationId || "",
							conditions: {
								operator: (conditions.operator as "in" | "not_in") || "in",
								roles: conditions.roles || [],
							},
						};
					}
					if (ruleType === "custom") {
						const conditions: any = rule.conditions || {};
						return {
							id: rule.id,
							ruleType: "custom" as const,
							isEnabled: rule.isEnabled,
							variationId: rule.variationId || "",
							conditions: {
								conditions: conditions.conditions || [],
							},
						};
					}
					return {
						id: rule.id,
						ruleType: "kill_switch" as const,
						isEnabled: rule.isEnabled,
						variationId: rule.variationId || "",
						conditions: {},
					};
				}),
			});
		}
	}, [rulesData, currentEnv, defaultFlagState, flag, methods]);

	const { mutate: patchConfig, isPending: isSaving } = usePatchFlagConfig();

	const {
		handleSubmit,
		formState: { isDirty: isFormDirty, dirtyFields },
	} = methods;

	const handleSave = handleSubmit(
		(data) => {
			const payload: any = {};

			if (dirtyFields.isFlagOn) {
				payload.isEnabled = data.isFlagOn;
			}
			payload.offVariationId = data.offVariationId || null;
			payload.defaultVariationId = data.defaultVariationId || null;
			if (dirtyFields.variations) {
				payload.variations = data.variations.map((v) => ({
					id: v.id,
					key: v.key,
					value: v.value,
					description: v.description,
					color: v.color,
					isDefault: v.id === data.defaultVariationId,
				}));
			}

			if (dirtyFields.rules) {
				payload.rules = data.rules.map((rule) => {
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
				});
			}

			patchConfig(
				{ flagId: flag.id, ...payload },
				{
					onSuccess: () => {
						toast.success("Flag configuration saved successfully");
						methods.reset(data);
					},
					onError: (err: any) => {
						toast.danger("Failed to save changes", {
							description: err.message || "An unexpected error occurred.",
						});
					},
				},
			);
		},
		(errors) => {
			console.warn("Validation failed:", errors);
			toast.danger("Validation failed", {
				description:
					"Please check all fields and fix any errors before saving.",
			});
		},
	);

	const handleDiscard = () => {
		if (isFormDirty) {
			methods.reset();
			toast("Changes discarded");
		} else {
			navigate({
				to: "..",
				replace: true,
			});
		}
	};

	return (
		<FormProvider {...methods}>
			<div className="flex flex-col">
				{/* Sticky Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div>
							<div className="flex items-center gap-3">
								<h1 className="text-xl font-bold text-foreground">
									{flag.name}
								</h1>
								<Chip
									variant="soft"
									color={
										defaultFlagState?.status === "active"
											? "success"
											: defaultFlagState?.status === "archived"
												? "default"
												: "warning"
									}
									className="capitalize font-semibold">
									{defaultFlagState?.status ?? "draft"}
								</Chip>
							</div>
							<div className="mt-1 flex items-center gap-0.5">
								<code className="leading-tight">
									{flag.key}
								</code>
								<CopyButton
									text={flag.key}
									buttonProps={{ className: "size-6 rounded-2xl", isIconOnly: true }}
								/>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" onPress={handleDiscard}>
							Discard
						</Button>
						<ActionButton
							variant="primary"
							onPress={handleSave as any}
							isDisabled={!isFormDirty || isSaving}
							isPending={isSaving}>
							Save Changes
						</ActionButton>
					</div>
				</div>

				<Separator className="my-2" />

				<div className="flex-1 overflow-y-auto">
					{(() => {
						const tabItems = [
							{
								id: "targeting",
								title: isMobile ? "Targeting" : "Targeting & Variations",
							},
							...(isMobile ? [{ id: "variations", title: "Variations" }] : []),
							{ id: "simulation", title: "Simulation" },
							{ id: "monitoring", title: "Monitoring" },
							{ id: "settings", title: "Settings" },
						];

						return (
							<Tabs
								selectedKey={activeTab}
								onSelectionChange={(key) => setActiveTab(key as string)}
								variant="secondary"
								className="w-full">
								<Tabs.ListContainer>
									<Tabs.List
										aria-label="Editor tabs"
										className="gap-6 w-full relative rounded-none p-0 border-b border-divider *:data-[selected=true]:text-primary *:h-12 *:w-fit *:px-0">
										{tabItems.map((item) => (
											<Tabs.Tab id={item.id} key={item.id}>
												{item.title}
												<Tabs.Indicator />
											</Tabs.Tab>
										))}
									</Tabs.List>
								</Tabs.ListContainer>
								<Tabs.Panel id="targeting">
									{isMobile ? (
										<TargetingTab flag={flag} />
									) : (
										<PanelGroup
											orientation="horizontal"
											className="flex h-full">
											<Panel
												defaultSize="70%"
												minSize="40%"
												maxSize="80%"
												className="flex flex-col h-full">
												<TargetingTab flag={flag} />
											</Panel>
											<ResizableSeparator className="group mx-6 relative bg-border/50 w-px">
												<div className="absolute inset-y-0 -left-3 -right-3 z-10 cursor-col-resize flex items-center justify-center">
													<div className="w-1 h-12 bg-default opacity-0 group-hover:opacity-100 group-data-[resize-handle-state=drag]:opacity-100 rounded-full transition-opacity" />
												</div>
											</ResizableSeparator>
											<Panel
												defaultSize="30%"
												minSize="20%"
												maxSize="60%"
												className="flex flex-col h-full">
												<VariationsTab flag={flag} />
											</Panel>
										</PanelGroup>
									)}
								</Tabs.Panel>
								<Tabs.Panel
									id="variations"
									className={!isMobile ? "hidden" : ""}>
									<VariationsTab flag={flag} />
								</Tabs.Panel>
								<Tabs.Panel id="simulation">
									<SimulationTab flag={flag} />
								</Tabs.Panel>
								<Tabs.Panel id="monitoring">
									<MonitoringTab flag={flag} />
								</Tabs.Panel>
								<Tabs.Panel id="settings">
									<SettingsTab flag={flag} projectSlug={projectSlug} />
								</Tabs.Panel>
							</Tabs>
						);
					})()}
				</div>
			</div>
		</FormProvider>
	);
}

interface FlagEditorLayoutProps {
	flag: FeatureFlag;
	projectSlug: string;
}

export function FlagEditorLayout(props: FlagEditorLayoutProps) {
	return (
		<FlagEditorProvider flag={props.flag}>
			<EditorContent {...props} />
		</FlagEditorProvider>
	);
}
