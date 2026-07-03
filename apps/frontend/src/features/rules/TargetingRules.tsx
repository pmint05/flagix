import { useState, useMemo, useCallback } from "react";
import { Button, toast } from "@heroui/react";
import { PlusIcon } from "@phosphor-icons/react";
import { useRules, useUpdateRule } from "./api";
import { useEnvironments } from "@/features/environments/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { RuleEditor } from "./RuleEditor";
import { RulesList } from "./RulesList";
import { useContextStore } from "@/stores";
import type { Variation } from "@/types/feature-flag";
import type { TargetingRule } from "@/types/targeting-rule";

interface TargetingRulesProps {
	flagId: string;
	variations: Variation[];
}

export function TargetingRules({ flagId, variations }: TargetingRulesProps) {
	const currentEnv = useContextStore((s) => s.selectedEnvironment);
	const { data: rules, isPending } = useRules(flagId, currentEnv?.id);
	const { data: environments } = useEnvironments();
	const updateRule = useUpdateRule();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editingRule, setEditingRule] = useState<TargetingRule | null>(null);

	const sortedRules = useMemo(() => {
		if (!rules) return [];
		return [...rules].sort((a, b) => {
			const aPriority = Number.parseInt(a.priority) || 0;
			const bPriority = Number.parseInt(b.priority) || 0;
			return aPriority - bPriority;
		});
	}, [rules]);

	const handleEdit = useCallback((rule: TargetingRule) => {
		setEditingRule(rule);
	}, []);

	const handleReorder = useCallback(
		async (reorderedRules: TargetingRule[]) => {
			try {
				await Promise.all(
					reorderedRules.map((rule) =>
						updateRule.mutateAsync({
							flagId,
							ruleId: rule.id,
							priority: rule.priority,
						}),
					),
				);
				toast.success("Rules reordered");
			} catch {
				toast.danger("Failed to reorder rules");
			}
		},
		[flagId, updateRule],
	);

	if (isPending) {
		return (
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="h-6 w-32 rounded" />
					<div className="h-9 w-28 rounded-lg" />
				</div>
				<div className="h-32 w-full rounded-lg" />
			</div>
		);
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-lg font-semibold text-foreground">
					Targeting Rules
				</h2>
				<Button
					variant="primary"
					className="gap-2"
					onPress={() => setCreateModalOpen(true)}>
					<PlusIcon className="h-4 w-4" />
					Add Rule
				</Button>
			</div>

			{sortedRules.length === 0 ? (
				<EmptyState
					title="No targeting rules"
					description="Create rules to control how this flag is evaluated for different users"
					actionLabel="Add Rule"
					onAction={() => setCreateModalOpen(true)}
				/>
			) : (
				<RulesList
					rules={sortedRules}
					variations={variations}
					environments={environments ?? []}
					onEdit={handleEdit}
					onReorder={handleReorder}
				/>
			)}

			<RuleEditor
				isOpen={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				flagId={flagId}
				variations={variations}
				environments={environments ?? []}
				defaultEnvironmentId={environments?.[0]?.id}
			/>

			<RuleEditor
				isOpen={!!editingRule}
				onClose={() => setEditingRule(null)}
				flagId={flagId}
				variations={variations}
				environments={environments ?? []}
				defaultEnvironmentId={environments?.[0]?.id}
				rule={editingRule ?? undefined}
			/>
		</div>
	);
}
