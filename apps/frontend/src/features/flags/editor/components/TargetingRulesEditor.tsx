"use client";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { Button, Dropdown, Label, Description, cn, toast } from "@heroui/react";
import { PlusIcon } from "@phosphor-icons/react";
import { RuleCard } from "./RuleCard";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../schema";
import { useHasPermission } from "@/hooks/usePermission";

import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TargetingRulesEditorProps {
	flag: FeatureFlag;
}

const ADDABLE_RULE_TYPES = [
	{
		key: "kill_switch",
		label: "Kill Switch",
		description: "Immediately resolve a variation for all traffic",
	},
	{
		key: "user",
		label: "Target Users",
		description: "Target specific users by ID",
	},
	{ key: "role", label: "Target Roles", description: "Target users by role" },
	{
		key: "percentage",
		label: "Percentage Rollout",
		description: "Resolve variations by percentage of traffic",
	},
	{
		key: "custom",
		label: "Custom Rule",
		description: "Match custom criteria on user context",
	},
] as const;

export function TargetingRulesEditor({ flag }: TargetingRulesEditorProps) {
	const { control } = useFormContext<FlagEditorFormValues>();
	const { fields, insert, remove, move } = useFieldArray({
		control,
		name: "rules",
	});
	const canEditFlags = useHasPermission("flag:edit");

	const fieldIds = fields.map((f) => f.id);
	const hasKillSwitch = fields.some((f) => f.ruleType === "kill_switch");

	// ---- dnd-kit sensors ----
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = fieldIds.indexOf(active.id as string);
			const newIndex = fieldIds.indexOf(over.id as string);

			if (oldIndex !== -1 && newIndex !== -1) {
				// Block movement if the first rule is a kill switch and we try to drag it or move onto it
				const isFirstKillSwitch = fields[0]?.ruleType === "kill_switch";
				if (isFirstKillSwitch) {
					if (oldIndex === 0 || newIndex === 0) {
						toast.warning("Kill switch rule must always remain at the top.");
						return;
					}
				}
				move(oldIndex, newIndex);
			}
		}
	};

	// ---- add rule ------------------------------------------------------------
	const handleAddRule = (index: number, ruleType: string) => {
		const baseRule = {
			id: crypto.randomUUID(),
			isEnabled: true,
			variationId: flag.variations?.[0]?.id ?? "",
		};
		const ruleByType: Record<string, any> = {
			kill_switch: {
				...baseRule,
				ruleType: "kill_switch" as const,
				conditions: {},
			},
			user: {
				...baseRule,
				ruleType: "user" as const,
				conditions: { operator: "in", userIds: [] },
			},
			role: {
				...baseRule,
				ruleType: "role" as const,
				conditions: { operator: "in", roles: [] },
			},
			percentage: {
				...baseRule,
				ruleType: "percentage" as const,
				conditions: {
					rollouts: [
						{ variationId: flag.variations?.[0]?.id ?? "", percentage: 50 },
					],
				},
			},
			custom: {
				...baseRule,
				ruleType: "custom" as const,
				conditions: {
					conditions: [
						{
							contextKey: "",
							type: "string",
							operator: "is_one_of",
							values: [],
						},
					],
				},
			},
		};

		if (ruleType === "kill_switch") {
			insert(0, ruleByType.kill_switch);
		} else {
			insert(index, ruleByType[ruleType] ?? ruleByType.user);
		}
	};

	const isFlagOn = useWatch({ name: "isFlagOn", control });

	return (
		<div className="relative pt-4">
			{/* vertical timeline line */}
			<div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-border z-0" />

			<div className="relative z-10 w-full flex flex-col">
				<DndContext
					sensors={sensors}
					modifiers={[restrictToVerticalAxis]}
					onDragEnd={handleDragEnd}>
					<SortableContext
						items={fieldIds}
						strategy={verticalListSortingStrategy}>
						{/* Top add-rule button (only when items exist and the first rule is not a kill switch) */}
						{canEditFlags &&
							fields.length > 0 &&
							fields[0]?.ruleType !== "kill_switch" && (
								<div className="pb-4 w-full flex justify-center">
									<AddRuleButton
										onAdd={(type) => handleAddRule(0, type)}
										isDisabled={!isFlagOn}
										hasKillSwitch={hasKillSwitch}
									/>
								</div>
							)}

						{fields.map((rule, formIndex) => (
							<SortableRuleItem
								key={rule.id}
								rule={rule}
								formIndex={formIndex}
								flag={flag}
								remove={remove}
								insert={insert}
								move={move}
								fieldsLength={fields.length}
								handleAddRule={handleAddRule}
								isFlagOn={isFlagOn}
								hasKillSwitch={hasKillSwitch}
								firstRuleType={fields[0]?.ruleType}
							/>
						))}
					</SortableContext>
				</DndContext>

				{/* Empty state add button */}
				{canEditFlags && fields.length === 0 && isFlagOn && (
					<div className="w-full flex justify-center">
						<AddRuleButton
							onAdd={(type) => handleAddRule(0, type)}
							isDisabled={!isFlagOn}
							hasKillSwitch={hasKillSwitch}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

interface SortableRuleItemProps {
	rule: any;
	formIndex: number;
	flag: FeatureFlag;
	remove: (index: number) => void;
	insert: (index: number, value: any) => void;
	move: (from: number, to: number) => void;
	fieldsLength: number;
	handleAddRule: (index: number, ruleType: string) => void;
	isFlagOn: boolean;
	hasKillSwitch: boolean;
	firstRuleType?: string;
}

function SortableRuleItem({
	rule,
	formIndex,
	flag,
	remove,
	insert,
	move,
	fieldsLength,
	handleAddRule,
	isFlagOn,
	hasKillSwitch,
	firstRuleType,
}: SortableRuleItemProps) {
	const canEditFlags = useHasPermission("flag:edit");
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: rule.id,
		disabled: rule.ruleType === "kill_switch" || !canEditFlags,
	});

	const style = {
		// Use CSS.Translate to avoid scale distortions (stretching/skewing)
		transform: CSS.Translate.toString(transform),
		transition: isDragging ? undefined : transition,
		opacity: isDragging ? 0.8 : undefined,
		position: "relative" as const,
		zIndex: isDragging ? 50 : undefined,
	};

	const isFirstKillSwitch = firstRuleType === "kill_switch";

	const onMoveUp = (() => {
		if (formIndex === 0) return undefined;
		if (isFirstKillSwitch && formIndex === 1) return undefined;
		return () => move(formIndex, formIndex - 1);
	})();

	const onMoveDown = (() => {
		if (formIndex === fieldsLength - 1) return undefined;
		if (rule.ruleType === "kill_switch") return undefined;
		return () => move(formIndex, formIndex + 1);
	})();

	return (
		<div ref={setNodeRef} style={style} className="relative w-full">
			<RuleCard
				ruleId={rule.id}
				index={formIndex}
				flag={flag}
				onRemove={() => remove(formIndex)}
				onDuplicate={() => {
					insert(formIndex + 1, {
						...rule,
						id: crypto.randomUUID(),
					});
				}}
				onMoveUp={onMoveUp}
				onMoveDown={onMoveDown}
				totalRules={fieldsLength}
				dragHandleProps={
					canEditFlags && rule.ruleType !== "kill_switch"
						? { ...attributes, ...listeners }
						: undefined
				}
			/>
			{canEditFlags && (
				<div
					className={cn(
						"py-4 w-full flex justify-center transition-opacity duration-150",
						{
							"opacity-0 pointer-events-none": isDragging,
						},
					)}>
					<AddRuleButton
						onAdd={(type) => handleAddRule(formIndex + 1, type)}
						isDisabled={!isFlagOn}
						hasKillSwitch={hasKillSwitch}
					/>
				</div>
			)}
		</div>
	);
}

interface AddRuleButtonProps {
	onAdd: (type: string) => void;
	isDisabled?: boolean;
	isLast?: boolean;
	hasKillSwitch?: boolean;
}

export function AddRuleButton({
	onAdd,
	isDisabled,
	isLast,
	hasKillSwitch,
}: AddRuleButtonProps) {
	return (
		<div className={`flex justify-center py-1 ${isLast ? "pt-2" : ""}`}>
			<Dropdown>
				<Button
					isIconOnly
					size="lg"
					variant="secondary"
					isDisabled={isDisabled}
					className="bg-background hover:border-accent border hover:text-accent transition-all">
					<PlusIcon weight="bold" />
				</Button>
				<Dropdown.Popover placement="bottom">
					<Dropdown.Menu onAction={(key) => onAdd(key as string)}>
						{ADDABLE_RULE_TYPES.map((type) => {
							const isKillSwitchDisabled =
								type.key === "kill_switch" && hasKillSwitch;
							return (
								<Dropdown.Item
									key={type.key}
									id={type.key}
									textValue={type.label}
									isDisabled={isKillSwitchDisabled}>
									<div className="flex flex-col gap-0.5">
										<Label>{type.label}</Label>
										<Description>{type.description}</Description>
									</div>
								</Dropdown.Item>
							);
						})}
					</Dropdown.Menu>
				</Dropdown.Popover>
			</Dropdown>
		</div>
	);
}
