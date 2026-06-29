"use client";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button, Dropdown, Label, Description, cn } from "@heroui/react";
import { PlusIcon } from "@phosphor-icons/react";
import { RuleCard } from "./RuleCard";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../schema";

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
		description: "Immediately serve a variation to all traffic",
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
		description: "Serve a percentage of traffic",
	},
] as const;

export function TargetingRulesEditor({ flag }: TargetingRulesEditorProps) {
	const { control, watch } = useFormContext<FlagEditorFormValues>();
	const { fields, insert, remove, move } = useFieldArray({
		control,
		name: "rules",
	});

	const fieldIds = fields.map((f) => f.id);

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
				conditions: { userIds: [] },
			},
			role: {
				...baseRule,
				ruleType: "role" as const,
				conditions: { roles: [] },
			},
			percentage: {
				...baseRule,
				ruleType: "percentage" as const,
				conditions: { percentage: 0 },
			},
		};
		insert(index, ruleByType[ruleType] ?? ruleByType.user);
	};

	const isFlagOn = watch("isFlagOn");

	return (
		<div className="relative pt-4 pb-4">
			{/* vertical timeline line */}
			<div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-separator z-0" />

			<div className="relative z-10 w-full flex flex-col">
				<DndContext
					sensors={sensors}
					modifiers={[restrictToVerticalAxis]}
					onDragEnd={handleDragEnd}>
					<SortableContext
						items={fieldIds}
						strategy={verticalListSortingStrategy}>
						{/* Top add-rule button (only when items exist) */}
						{fields.length > 0 && (
							<div className="pb-4 w-full flex justify-center">
								<AddRuleButton
									onAdd={(type) => handleAddRule(0, type)}
									isDisabled={!isFlagOn}
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
							/>
						))}
					</SortableContext>
				</DndContext>

				{/* Empty state add button */}
				{fields.length === 0 && isFlagOn && (
					<div className="w-full flex justify-center">
						<AddRuleButton
							onAdd={(type) => handleAddRule(0, type)}
							isDisabled={!isFlagOn}
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
}: SortableRuleItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: rule.id });

	const style = {
		// Use CSS.Translate to avoid scale distortions (stretching/skewing)
		transform: CSS.Translate.toString(transform),
		transition: isDragging ? undefined : transition,
		opacity: isDragging ? 0.8 : undefined,
		position: "relative" as const,
		zIndex: isDragging ? 50 : undefined,
	};

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
				onMoveUp={
					formIndex > 0 ? () => move(formIndex, formIndex - 1) : undefined
				}
				onMoveDown={
					formIndex < fieldsLength - 1
						? () => move(formIndex, formIndex + 1)
						: undefined
				}
				totalRules={fieldsLength}
				dragHandleProps={{ ...attributes, ...listeners }}
			/>
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
				/>
			</div>
		</div>
	);
}

interface AddRuleButtonProps {
	onAdd: (type: string) => void;
	isDisabled?: boolean;
	isLast?: boolean;
}

export function AddRuleButton({
	onAdd,
	isDisabled,
	isLast,
}: AddRuleButtonProps) {
	return (
		<div className={`flex justify-center py-1 ${isLast ? "pt-2" : ""}`}>
			<Dropdown>
				<Button
					isIconOnly
					size="sm"
					variant="secondary"
					isDisabled={isDisabled}
					className="bg-background hover:border-accent hover:text-accent transition-colors">
					<PlusIcon weight="bold" />
				</Button>
				<Dropdown.Popover placement="bottom">
					<Dropdown.Menu onAction={(key) => onAdd(key as string)}>
						{ADDABLE_RULE_TYPES.map((type) => (
							<Dropdown.Item
								key={type.key}
								id={type.key}
								textValue={type.label}>
								<div className="flex flex-col gap-0.5">
									<Label>{type.label}</Label>
									<Description>{type.description}</Description>
								</div>
							</Dropdown.Item>
						))}
					</Dropdown.Menu>
				</Dropdown.Popover>
			</Dropdown>
		</div>
	);
}
