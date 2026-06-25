import { useState, useMemo } from "react";
import {
	Button,
	Badge,
	Table,
	TableBody,
	TableColumn,
	TableHeader,
	TableRow,
	TableCell,
	toast,
	Tooltip,
	Switch,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useRules, useUpdateRule, useDeleteRule } from "./api";
import { useEnvironments } from "@/features/environments/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { RuleModal } from "./RuleModal";
import type { Variation } from "@/types/feature-flag";

const RULE_TYPE_LABELS: Record<string, string> = {
	kill_switch: "Kill Switch",
	user: "User Targeting",
	role: "Role Targeting",
	percentage: "Percentage Rollout",
};

const RULE_TYPE_BADGE_COLOR: Record<string, "danger" | "warning" | "accent" | "success"> = {
	kill_switch: "danger",
	user: "accent",
	role: "warning",
	percentage: "success",
};

interface TargetingRulesProps {
	flagId: string;
	variations: Variation[];
}

export function TargetingRules({ flagId, variations }: TargetingRulesProps) {
	const { data: rules, isLoading } = useRules(flagId);
	const { data: environments } = useEnvironments();
	const updateRule = useUpdateRule();
	const deleteRule = useDeleteRule();
	const [createModalOpen, setCreateModalOpen] = useState(false);

	const sortedRules = useMemo(() => {
		if (!rules) return [];
		return [...rules].sort((a, b) => {
			const aPriority = Number.parseInt(a.priority) || 0;
			const bPriority = Number.parseInt(b.priority) || 0;
			return aPriority - bPriority;
		});
	}, [rules]);

	const getVariationLabel = (variationId: string): string => {
		const v = variations.find((v) => v.id === variationId);
		return v?.key ?? variationId.slice(0, 8);
	};

	const getEnvironmentLabel = (environmentId: string): string => {
		const env = environments?.find((e) => e.id === environmentId);
		return env?.name ?? environmentId.slice(0, 8);
	};

	const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
		try {
			await updateRule.mutateAsync({
				flagId,
				ruleId,
				isEnabled: !currentEnabled,
			});
			toast.success(`Rule ${currentEnabled ? "disabled" : "enabled"}`);
		} catch {
			toast.danger("Failed to toggle rule");
		}
	};

	const handleDelete = async (ruleId: string) => {
		try {
			await deleteRule.mutateAsync({ flagId, ruleId });
			toast.success("Rule deleted");
		} catch {
			toast.danger("Failed to delete rule");
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="h-6 w-32 rounded bg-default-200" />
					<div className="h-9 w-28 rounded-lg bg-default-200" />
				</div>
				<div className="h-32 w-full rounded-lg bg-default-200" />
			</div>
		);
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-lg font-semibold text-foreground">Targeting Rules</h2>
				<Button
					variant="primary"
					className="gap-2"
					onPress={() => setCreateModalOpen(true)}
				>
					<PlusIcon className="h-4 w-4" />
					Add Rule
				</Button>
			</div>

			{sortedRules.length === 0 ? (
				<EmptyState
					title="No targeting rules"
					description="Create rules to control how this flag is served to different users"
					actionLabel="Add Rule"
					onAction={() => setCreateModalOpen(true)}
				/>
			) : (
				<Table aria-label="Targeting rules">
					<TableHeader>
						<TableColumn>Priority</TableColumn>
						<TableColumn>Type</TableColumn>
						<TableColumn>Variation</TableColumn>
						<TableColumn>Environment</TableColumn>
						<TableColumn>Enabled</TableColumn>
						<TableColumn className="w-12" />
					</TableHeader>
					<TableBody items={sortedRules}>
						{(rule) => (
							<TableRow key={rule.id}>
								<TableCell>
									<span className="text-sm font-medium text-default-700">
										{rule.priority}
									</span>
								</TableCell>
								<TableCell>
									<Badge
										color={RULE_TYPE_BADGE_COLOR[rule.ruleType] ?? "default"}
										variant="soft"
									>
										{RULE_TYPE_LABELS[rule.ruleType] ?? rule.ruleType}
									</Badge>
								</TableCell>
								<TableCell>
									<span className="text-sm text-default-700">
										{getVariationLabel(rule.variationId)}
									</span>
								</TableCell>
								<TableCell>
									<span className="text-sm text-default-500">
										{getEnvironmentLabel(rule.environmentId)}
									</span>
								</TableCell>
								<TableCell>
									<Switch
										size="sm"
										isSelected={rule.isEnabled}
										onChange={() => handleToggle(rule.id, rule.isEnabled)}
									/>
								</TableCell>
								<TableCell>
									<Tooltip>
										<Tooltip.Trigger>
											<Button
												isIconOnly
												variant="ghost"
												size="sm"
												className="text-danger"
												onPress={() => handleDelete(rule.id)}
											>
												<TrashIcon className="h-4 w-4" />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content>Delete rule</Tooltip.Content>
									</Tooltip>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			)}

			<RuleModal
				isOpen={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				flagId={flagId}
				variations={variations}
				environments={environments ?? []}
				defaultEnvironmentId={environments?.[0]?.id}
			/>
		</div>
	);
}
