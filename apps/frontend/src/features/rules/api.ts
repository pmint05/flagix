import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
	type TargetingRule,
	targetingRuleSchema,
} from "@/types/targeting-rule";
import { z } from "zod";
import { useContextStore } from "@/stores";

export interface CreateRuleInput {
	ruleType: "kill_switch" | "user" | "role" | "percentage";
	environmentId: string;
	variationId?: string;
	conditions: Record<string, unknown>;
	isEnabled?: boolean;
}

export interface UpdateRuleInput {
	variationId?: string;
	conditions?: Record<string, unknown>;
	isEnabled?: boolean;
	priority?: string;
}

export const createRulesApi = (orgId: string, flagId: string) => {
	const basePath = `organizations/${orgId}/flags/${flagId}/rules`;
	return {
		list: (envId?: string): Promise<TargetingRule[]> =>
			api.get(basePath, {
				searchParams: envId ? { envId } : {},
				schema: z.object({
					rules: z.array(targetingRuleSchema),
					total: z.number(),
				}),
			}).then((res) => res.rules),
		get: (ruleId: string): Promise<TargetingRule> =>
			api.get(`${basePath}/${ruleId}`, {
				schema: targetingRuleSchema,
			}),
		create: (input: CreateRuleInput): Promise<TargetingRule> =>
			api.post(basePath, {
				json: input,
				schema: targetingRuleSchema,
			}),
		update: (ruleId: string, input: UpdateRuleInput): Promise<TargetingRule> =>
			api.patch(`${basePath}/${ruleId}`, {
				json: input,
				schema: targetingRuleSchema,
			}),
		delete: (ruleId: string): Promise<void> =>
			api.delete(`${basePath}/${ruleId}`).then(() => {}),
	};
};

// --- Query Hooks ---

export const RULES_KEY = ["rules"] as const;

export function useRules(flagId: string, envId?: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useQuery({
		queryKey: [...RULES_KEY, orgId, flagId, envId],
		queryFn: () => {
			if (!orgId) throw new Error("No organization selected");
			return createRulesApi(orgId, flagId).list(envId);
		},
		enabled: !!orgId && !!flagId && !!envId,
	});
}

export function useRule(flagId: string, ruleId: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useQuery({
		queryKey: [...RULES_KEY, "detail", orgId, flagId, ruleId],
		queryFn: () => {
			if (!orgId) throw new Error("No organization selected");
			return createRulesApi(orgId, flagId).get(ruleId);
		},
		enabled: !!orgId && !!flagId && !!ruleId,
	});
}

export function useCreateRule() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useMutation({
		mutationFn: ({ flagId, ...input }: CreateRuleInput & { flagId: string }) => {
			if (!orgId) throw new Error("No organization selected");
			return createRulesApi(orgId, flagId).create(input);
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...RULES_KEY, orgId, variables.flagId],
			});
		},
	});
}

export function useUpdateRule() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useMutation({
		mutationFn: ({
			flagId,
			ruleId,
			...input
		}: UpdateRuleInput & { flagId: string; ruleId: string }) => {
			if (!orgId) throw new Error("No organization selected");
			return createRulesApi(orgId, flagId).update(ruleId, input);
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...RULES_KEY, orgId, variables.flagId],
			});
		},
	});
}

export function useDeleteRule() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useMutation({
		mutationFn: ({ flagId, ruleId }: { flagId: string; ruleId: string }) => {
			if (!orgId) throw new Error("No organization selected");
			return createRulesApi(orgId, flagId).delete(ruleId);
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...RULES_KEY, orgId, variables.flagId],
			});
		},
	});
}
