import { Reorder, useDragControls } from "motion/react";
import {
	Badge,
	Button,
	toast,
	Tooltip,
	Switch,
} from "@heroui/react";
import { DotsSixVerticalIcon, TrashIcon, PencilIcon } from "@phosphor-icons/react";
import { useUpdateRule, useDeleteRule } from "./api";
import type { TargetingRule } from "@/types/targeting-rule";
import type { Variation } from "@/types/feature-flag";
import type { Environment } from "@/types";

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

interface RulesListProps {
	rules: TargetingRule[];
	variations: Variation[];
	environments: Environment[];
	onEdit: (rule: TargetingRule) => void;
	onReorder: (reorderedRules: TargetingRule[]) => void;
}

interface SortableRowProps {
	rule: TargetingRule;
	variations: Variation[];
	environments: Environment[];
	onEdit: (rule: TargetingRule) => void;
	onToggle: (ruleId: string, currentEnabled: boolean) => void;
	onDelete: (ruleId: string) => void;
}

function SortableRow({
	rule,
	variations,
	environments,
	onEdit,
	onToggle,
	onDelete,
}: SortableRowProps) {
	const controls = useDragControls();

	const getVariationLabel = (variationId: string): string => {
		const v = variations.find((v) => v.id === variationId);
		return v?.key ?? variationId.slice(0, 8);
	};

	const getEnvironmentLabel = (environmentId: string): string => {
		const env = environments.find((e) => e.id === environmentId);
		return env?.name ?? environmentId.slice(0, 8);
	};

	return (
		<Reorder.Item
			value={rule}
			dragListener={false}
			dragControls={controls}
			className="flex items-center border-b border-divider bg-content1 px-4 py-3"
		>
			<button
				className="mr-3 cursor-grab touch-none active:cursor-grabbing"
				onPointerDown={(e) => controls.start(e)}
			>
				<DotsSixVerticalIcon className="h-4 w-4 text-default-400" />
			</button>
			<span className="w-12 text-sm font-medium text-default-700">{rule.priority}</span>
			<div className="w-32">
				<Badge color={RULE_TYPE_BADGE_COLOR[rule.ruleType] ?? "default"} variant="soft">
					{RULE_TYPE_LABELS[rule.ruleType] ?? rule.ruleType}
				</Badge>
			</div>
			<span className="flex-1 text-sm text-default-700">{getVariationLabel(rule.variationId)}</span>
			<span className="w-32 text-sm text-default-500">{getEnvironmentLabel(rule.environmentId)}</span>
			<div className="w-20">
				<Switch size="sm" isSelected={rule.isEnabled} onChange={() => onToggle(rule.id, rule.isEnabled)} />
			</div>
			<div className="flex items-center gap-1">
				<Tooltip>
					<Tooltip.Trigger>
						<Button isIconOnly variant="ghost" size="sm" onPress={() => onEdit(rule)}>
							<PencilIcon className="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Edit rule</Tooltip.Content>
				</Tooltip>
				<Tooltip>
					<Tooltip.Trigger>
						<Button isIconOnly variant="ghost" size="sm" className="text-danger" onPress={() => onDelete(rule.id)}>
							<TrashIcon className="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Delete rule</Tooltip.Content>
				</Tooltip>
			</div>
		</Reorder.Item>
	);
}

export function RulesList({
	rules,
	variations,
	environments,
	onEdit,
	onReorder,
}: RulesListProps) {
	const updateRule = useUpdateRule();
	const deleteRule = useDeleteRule();

	const handleReorder = (newOrder: TargetingRule[]) => {
		const withNewPriority = newOrder.map((r, i) => ({
			...r,
			priority: String(i + 1),
		}));
		onReorder(withNewPriority);
	};

	const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
		try {
			await updateRule.mutateAsync({
				flagId: rules[0]?.featureFlagId ?? "",
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
			await deleteRule.mutateAsync({ flagId: rules[0]?.featureFlagId ?? "", ruleId });
			toast.success("Rule deleted");
		} catch {
			toast.danger("Failed to delete rule");
		}
	};

	return (
		<Reorder.Group
			axis="y"
			values={rules}
			onReorder={handleReorder}
			className="divide-y divide-divider rounded-lg border border-divider"
		>
			{rules.map((rule) => (
				<SortableRow
					key={rule.id}
					rule={rule}
					variations={variations}
					environments={environments}
					onEdit={onEdit}
					onToggle={handleToggle}
					onDelete={handleDelete}
				/>
			))}
		</Reorder.Group>
	);
}
