import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import {
	Button,
	Input,
	TextArea,
	TextField,
	Label,
	Skeleton,
	toast
} from "@heroui/react";
import {
	ArrowLeftIcon,
	ArrowCounterClockwiseIcon,
	PencilSimpleIcon,
	UserIcon,
	ShieldCheckIcon,
	SlidersIcon,
} from "@phosphor-icons/react";
import { useSegment, useUpdateSegment } from "@/features/flags/api";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
	SegmentConditionContent,
	type SegmentCondition,
	type ConditionClause,
	defaultCustomCondition,
	defaultUserCondition,
	defaultRoleCondition,
	NO_VALUE_OPERATORS,
	MULTI_VALUE_OPERATORS,
} from "#/features/flags/editor/components/rule-contents/SegmentConditionContent";
import { ActionButton } from "#/components/ui/action-button";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/segments/$segmentSlug",
)({
	component: SegmentEditorPage,
});



// ─── Semver helper ───────────────────────────────────────────────────────────
const compareSemver = (a: string, b: string): number => {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		const na = pa[i] ?? 0;
		const nb = pb[i] ?? 0;
		if (na < nb) return -1;
		if (na > nb) return 1;
	}
	return 0;
};

// ─── Between validation ───────────────────────────────────────────────────────
interface BetweenError { message: string }

const validateBetween = (cond: ConditionClause): BetweenError | null => {
	if (cond.operator !== "between") return null;
	const v0 = cond.values?.[0];
	const v1 = cond.values?.[1];
	if (v0 === undefined || v1 === undefined || v0 === "" || v1 === "") return null;
	if (cond.type === "number") {
		const a = Number(v0), b = Number(v1);
		if (isNaN(a) || isNaN(b)) return null;
		if (a >= b) return { message: "Min must be less than Max" };
	} else if (cond.type === "semver") {
		if (typeof v0 === "string" && typeof v1 === "string" && compareSemver(v0, v1) >= 0)
			return { message: "Min must be less than Max" };
	} else if (cond.type === "date") {
		const a = new Date(v0).getTime(), b = new Date(v1).getTime();
		if (!isNaN(a) && !isNaN(b) && a >= b)
			return { message: "Min must be less than Max" };
	}
	return null;
};

// ─── Zod schema ───────────────────────────────────────────────────────────────
// We store SegmentCondition (discriminated union) in the form.
// Zod validates the discriminated union loosely — deep validation happens
// in the between-error helper above for custom conditions.
const segmentFormSchema = z.object({
	conditions: z.array(z.any()).min(0),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

function SegmentEditorPage() {
	const match = Route.useMatch();
	const { projectSlug, segmentSlug } = match.params;

	const { data: segment, isLoading, isError } = useSegment(segmentSlug);
	const updateSegment = useUpdateSegment();

	const [metadataModalOpen, setMetadataModalOpen] = useState(false);
	const [conditionErrors, setConditionErrors] = useState<
		Record<number, string>
	>({});

	// Zod + react-hook-form for conditions
	const {
		control,
		reset,
		watch,
		setValue,
	} = useForm<z.infer<typeof segmentFormSchema>>({
		resolver: standardSchemaResolver(segmentFormSchema),
		defaultValues: {
			conditions: [],
			name: "",
			description: "",
		},
	});

	const {
		append: appendCondition,
		remove: removeCondition,
		update: updateCondition,
	} = useFieldArray({
		control,
		name: "conditions",
	});

	const conditionsValue = watch("conditions");

	// Sync form when segment data loads
	useEffect(() => {
		if (segment) {
			const conds = Array.isArray(segment.conditions)
				? segment.conditions
				: (segment.conditions as any)?.conditions || [];
			reset({
				conditions: conds,
				name: segment.name,
				description: segment.description || "",
			});
		}
	}, [segment, reset]);

	const handleAddCondition = (type: "custom" | "user" | "role" = "custom") => {
		if (type === "user") appendCondition(defaultUserCondition() as any);
		else if (type === "role") appendCondition(defaultRoleCondition() as any);
		else appendCondition(defaultCustomCondition() as any);
	};

	const handleRemoveCondition = (index: number) => {
		removeCondition(index);
		setConditionErrors((prev) => {
			const next = { ...prev };
			delete next[index];
			return next;
		});
	};

	const handleConditionChange = (index: number, updated: SegmentCondition) => {
		updateCondition(index, updated as any);
		// Validate between for custom conditions
		if (updated.conditionType === "custom" && updated.operator === "between") {
			const err = validateBetween(updated);
			setConditionErrors((prev) => {
				const next = { ...prev };
				if (err) next[index] = err.message;
				else delete next[index];
				return next;
			});
		} else {
			setConditionErrors((prev) => {
				const next = { ...prev };
				delete next[index];
				return next;
			});
		}
	};

	const hasChanges = useMemo(() => {
		if (!segment) return false;
		const originalConditions = Array.isArray(segment.conditions)
			? segment.conditions
			: (segment.conditions as any)?.conditions || [];
		const originalString = JSON.stringify(originalConditions);
		const localString = JSON.stringify(conditionsValue);
		return originalString !== localString;
	}, [segment, conditionsValue]);

	const handleReset = () => {
		if (segment) {
			const conds = Array.isArray(segment.conditions)
				? segment.conditions
				: (segment.conditions as any)?.conditions || [];
			reset({
				conditions: conds,
				name: segment.name,
				description: segment.description || "",
			});
			setConditionErrors({});
			toast.info("Unsaved changes discarded");
		}
	};

	const handleSaveConditions = async () => {
		if (!segment) return;

		const allErrors: Record<number, string> = {};
		conditionsValue.forEach((cond: any, idx: number) => {
			const condType: string = cond.conditionType ?? "custom";

			// Validate empty rules
			if (condType === "custom") {
				const c = cond as ConditionClause;
				if (!c.contextKey?.trim()) {
					allErrors[idx] = "Context key is required";
				} else if (NO_VALUE_OPERATORS.has(c.operator)) {
					// is_empty / is_not_empty — no value needed
				} else if (MULTI_VALUE_OPERATORS.has(c.operator)) {
					if (!c.values || c.values.length === 0) allErrors[idx] = "At least one value is required";
				} else if (c.operator === "between") {
					const err = validateBetween(c);
					if (err) allErrors[idx] = err.message;
					else if (!c.values || c.values.length < 2 || c.values.some((v: any) => v === "" || v === undefined)) {
						allErrors[idx] = "Both min and max values are required";
					}
				} else if (c.operator === "equals_json") {
					if (!c.value?.trim()) allErrors[idx] = "JSON value is required";
				} else {
					if (c.value === undefined || c.value === "" || c.value === null) {
						allErrors[idx] = "Value is required";
					}
				}
			} else if (condType === "user") {
				if (!cond.userIds || cond.userIds.length === 0) {
					allErrors[idx] = "At least one user ID is required";
				}
			} else if (condType === "role") {
				if (!cond.roles || cond.roles.length === 0) {
					allErrors[idx] = "At least one role is required";
				}
			}
		});

		setConditionErrors(allErrors);
		if (Object.keys(allErrors).length > 0) {
			toast.danger("Please fix validation errors before saving");
			return;
		}

		try {
			await updateSegment.mutateAsync({
				segmentId: segment.id,
				conditions: conditionsValue,
			});
			reset({
				conditions: conditionsValue,
				name: watch("name"),
				description: watch("description") || "",
			});
			toast.success("Segment targeting conditions updated successfully");
		} catch (error) {
			toast.danger("Failed to save targeting conditions");
		}
	};

	const handleSaveMetadata = async () => {
		if (!segment) return;
		const currentName = watch("name");
		const currentDescription = watch("description");
		try {
			await updateSegment.mutateAsync({
				segmentId: segment.id,
				segmentSlug,
				name: currentName,
				description: currentDescription,
			});
			setMetadataModalOpen(false);
			toast.success("Segment settings updated successfully");
		} catch (error) {
			toast.danger("Failed to update segment settings");
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64 rounded-lg" />
				<Skeleton className="h-48 w-full rounded-lg" />
			</div>
		);
	}

	if (isError || !segment) {
		return (
			<div className="p-6 space-y-6 text-left">
				<h1 className="text-2xl font-bold text-foreground">
					Segment Not Found
				</h1>
				<p className="text-sm text-muted">
					The segment you are looking for does not exist or has been deleted.
				</p>
				<Link to="/projects/$projectSlug/segments" params={{ projectSlug }}>
					<Button variant="outline">
						<ArrowLeftIcon className="mr-2 size-4" /> Back to Segments
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6 text-left">
			{/* Breadcrumbs & Actions Header */}
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold tracking-tight">
							{segment.name}
						</h1>
						<span className="font-mono text-xs p-1 px-2 rounded-2xl bg-default text-muted-foreground">
							{segment.key}
						</span>
					</div>
					{segment.description && (
						<p className="text-sm text-muted mt-1 max-w-2xl">
							{segment.description}
						</p>
					)}
				</div>

				<div className="flex items-center gap-2 mt-4 md:mt-0">
					<Button variant="outline" onPress={() => setMetadataModalOpen(true)}>
						<PencilSimpleIcon className="size-4 mr-1.5" /> Edit Info
					</Button>
					<Button
						variant="ghost"
						onPress={handleReset}
						isDisabled={!hasChanges || updateSegment.isPending}>
						<ArrowCounterClockwiseIcon className="size-4 mr-1.5" /> Discard
					</Button>
					<ActionButton
						variant="primary"
						onPress={handleSaveConditions}
						isDisabled={!hasChanges || updateSegment.isPending}
						isPending={updateSegment.isPending}>
						{updateSegment.isPending ? "Saving..." : "Save Rules"}
					</ActionButton>
				</div>
			</div>

			{/* Main Editor Card */}
			<div className="border border-divider rounded-3xl bg-surface p-6 space-y-4 shadow-sm">
				<div className="flex justify-between items-start pb-4 border-b border-divider gap-4">
					<div>
						<h3 className="font-semibold text-base text-foreground">
							Targeting Conditions
						</h3>
						<p className="text-xs text-muted-foreground mt-0.5">
							Users matching <span className="font-medium text-foreground">all</span> conditions will be included in this segment.
						</p>
					</div>
					{/* Add condition buttons */}
					<div className="flex items-center gap-2 shrink-0">
						<Button variant="outline" size="sm" onPress={() => handleAddCondition("custom")}>
							<SlidersIcon className="size-3.5 mr-1.5" /> Custom
						</Button>
						<Button variant="outline" size="sm" onPress={() => handleAddCondition("user")}>
							<UserIcon className="size-3.5 mr-1.5" /> User
						</Button>
						<Button variant="outline" size="sm" onPress={() => handleAddCondition("role")}>
							<ShieldCheckIcon className="size-3.5 mr-1.5" /> Role
						</Button>
					</div>
				</div>

				{conditionsValue.length === 0 ? (
					<div className="text-center py-12 border border-dashed border-divider rounded-2xl text-sm text-muted-foreground">
						No targeting conditions configured. This segment will match all users.
					</div>
				) : (
					<div className="space-y-3">
						{(() => {
							const counts: Record<string, number> = {};
							return conditionsValue.map((cond: any, idx: number) => {
								const type: string = cond.conditionType ?? "custom";
								counts[type] = (counts[type] || 0) + 1;
								const typeLabel =
									type === "user" ? "User Rule" : type === "role" ? "Role Rule" : "Custom Rule";
								const label = `${typeLabel} ${counts[type]}`;
								return (
									<SegmentConditionContent
										key={idx}
										index={idx}
										label={label}
										condition={cond as SegmentCondition}
										onChange={handleConditionChange}
										onRemove={handleRemoveCondition}
										error={conditionErrors[idx]}
									/>
								);
							});
						})()}
					</div>
				)}
			</div>

			{/* Edit Metadata Modal */}
			<ConfirmModal
				isOpen={metadataModalOpen}
				onCancel={() => setMetadataModalOpen(false)}
				onConfirm={handleSaveMetadata}
				title="Edit Segment Info"
				confirmText="Save"
				description="">
				<div className="space-y-4 pt-2 text-left">
					<TextField variant="secondary">
						<Label>Name</Label>
						<Input
							placeholder="Beta Users"
							value={watch("name")}
							onChange={(e) => setValue("name", e.target.value)}
						/>
					</TextField>

					<TextField variant="secondary">
						<Label>Description</Label>
						<TextArea
							placeholder="Segment description..."
							value={watch("description") ?? ""}
							onChange={(e) => setValue("description", e.target.value)}
							rows={3}
						/>
					</TextField>
				</div>
			</ConfirmModal>
		</div>
	);
}
