"use client";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { Chip, Slider, Button, ButtonGroup, Tooltip } from "@heroui/react";
import {
	PlusIcon,
	TrashIcon,
	ScalesIcon,
	DivideIcon,
	DotsSixVerticalIcon,
} from "@phosphor-icons/react";
import { Reorder, useDragControls } from "motion/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../../schema";
import { VariationSelector } from "../VariationSelector";
import { useHasPermission } from "@/hooks/usePermission";

interface PercentageContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

interface SortableRolloutRowProps {
	itemId: string;
	idx: number;
	control: any;
	flag: FeatureFlag;
	ruleIndex: number;
	rolloutRange: { start: number; end: number };
	onRemove: () => void;
	isRemoveDisabled: boolean;
	onDragEnd: () => void;
	canEditFlags: boolean;
}

interface RolloutSliderProps {
	value: number;
	onChange: (val: number) => void;
	rolloutRange: { start: number; end: number };
	isDisabled?: boolean;
}

function RolloutSlider({ value, onChange, rolloutRange, isDisabled }: RolloutSliderProps) {
	const [localVal, setLocalVal] = useState(value);

	useEffect(() => {
		setLocalVal(value);
	}, [value]);

	return (
		<div className="flex items-center gap-3">
			<Slider
				value={localVal}
				onChange={(v) => setLocalVal(Array.isArray(v) ? v[0] : v)}
				onChangeEnd={(v) => {
					const finalVal = Array.isArray(v) ? v[0] : v;
					onChange(finalVal);
				}}
				minValue={0}
				maxValue={100}
				step={1}
				isDisabled={isDisabled}
				className="flex-1">
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb />
				</Slider.Track>
			</Slider>
			<Tooltip delay={0}>
				<Tooltip.Trigger>
					<Chip
						variant="secondary"
						className="text-sm shrink-0 font-semibold">
						{localVal}%
					</Chip>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<div className="font-mono font-medium shrink-0 select-none">
						[{rolloutRange?.start}% - {rolloutRange?.end}%)
					</div>
				</Tooltip.Content>
			</Tooltip>
		</div>
	);
}

function SortableRolloutRow({
	itemId,
	idx,
	control,
	flag,
	ruleIndex,
	rolloutRange,
	onRemove,
	isRemoveDisabled,
	onDragEnd,
	canEditFlags,
}: SortableRolloutRowProps) {
	const controls = useDragControls();

	return (
		<Reorder.Item
			value={itemId}
			id={itemId}
			dragListener={false}
			dragControls={controls}
			onDragEnd={onDragEnd}
			className="flex items-center gap-4 flex-wrap p-3 rounded-3xl border border-divider bg-surface select-none"
			layout>
			{canEditFlags && (
				<button
					type="button"
					className="cursor-grab touch-none active:cursor-grabbing p-1.5 hover:bg-default rounded-2xl transition-colors shrink-0"
					onPointerDown={(e) => controls.start(e)}>
					<DotsSixVerticalIcon className="size-4 text-default-400" />
				</button>
			)}
			<span className="text-sm font-semibold text-default-600">Resolve</span>
			<div className="min-w-48 flex-1">
				<Controller
					name={
						`rules.${ruleIndex}.conditions.rollouts.${idx}.percentage` as any
					}
					control={control}
					render={({ field: pctField }) => (
						<RolloutSlider
							value={pctField.value ?? 0}
							onChange={pctField.onChange}
							rolloutRange={rolloutRange}
							isDisabled={!canEditFlags}
						/>
					)}
				/>
			</div>
			<span className="text-sm text-default-600">of traffic to</span>
			<VariationSelector
				flag={flag}
				name={`rules.${ruleIndex}.conditions.rollouts.${idx}.variationId`}
			/>
			{canEditFlags && !isRemoveDisabled && (
				<Tooltip>
					<Tooltip.Trigger>
						<Button
							isIconOnly
							variant="ghost"
							className="hover:bg-danger/10 text-danger hover:text-danger shrink-0"
							size="sm"
							onPress={onRemove}>
							<TrashIcon className="size-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Remove rollout</Tooltip.Content>
				</Tooltip>
			)}
		</Reorder.Item>
	);
}

export function PercentageContent({ flag, ruleIndex }: PercentageContentProps) {
	const { control, getValues, setValue } = useFormContext<FlagEditorFormValues>();
	const canEditFlags = useHasPermission("flag:edit");

	const { fields, append, remove, move } = useFieldArray({
		control,
		name: `rules.${ruleIndex}.conditions.rollouts` as any,
	});

	const rollouts = useWatch({
		name: `rules.${ruleIndex}.conditions.rollouts` as any,
		control,
	}) || [];

	const totalPercentage = rollouts.reduce(
		(sum: number, r: any) => sum + (Number(r.percentage) || 0),
		0,
	);
	const remaining = 100 - totalPercentage;

	const fieldIds = useMemo(() => fields.map((field) => field.id), [fields]);

	const [rolloutOrder, setRolloutOrder] = useState<string[]>(fieldIds);

	useEffect(() => {
		const normalizedOrder = [
			...rolloutOrder.filter((id) => fieldIds.includes(id)),
			...fieldIds.filter((id) => !rolloutOrder.includes(id)),
		];

		const isSameOrder =
			normalizedOrder.length === rolloutOrder.length &&
			normalizedOrder.every((id, index) => id === rolloutOrder[index]);

		if (!isSameOrder) {
			setRolloutOrder(normalizedOrder);
		}
	}, [rolloutOrder, fieldIds]);

	const formIndexById = useMemo(
		() => new Map(fields.map((field, index) => [field.id, index])),
		[fields],
	);

	const rolloutRanges = useMemo(() => {
		let accumulated = 0;
		return rollouts.map((r: any) => {
			const start = accumulated;
			accumulated += Number(r.percentage) || 0;
			return { start, end: accumulated };
		});
	}, [rollouts]);

	const handleAddRollout = () => {
		const variations = getValues("variations") || flag.variations || [];
		const nextVar = variations[fields.length % variations.length]?.id || "";
		append({ variationId: nextVar, percentage: 0 });
	};

	const balancePercentages = (count: number, total: number = 100): number[] => {
		const share = Math.floor(total / count);
		const remainder = total % count;
		const results = Array(count).fill(share);
		for (let i = 0; i < remainder; i++) {
			results[i] += 1;
		}
		return results;
	};

	const handleEqualizeVariations = () => {
		const N = fields.length;
		if (N === 0) return;
		const shares = balancePercentages(N, 100);
		fields.forEach((_, idx) => {
			setValue(
				`rules.${ruleIndex}.conditions.rollouts.${idx}.percentage` as any,
				shares[idx],
				{
					shouldDirty: true,
				},
			);
		});
	};

	const handleEqualizeAll = () => {
		const N = fields.length;
		if (N === 0) return;
		const shares = balancePercentages(N + 1, 100);
		fields.forEach((_, idx) => {
			setValue(
				`rules.${ruleIndex}.conditions.rollouts.${idx}.percentage` as any,
				shares[idx],
				{
					shouldDirty: true,
				},
			);
		});
	};

	const handleReorder = (nextIds: string[]) => {
		setRolloutOrder(nextIds);
	};

	const commitRolloutOrder = () => {
		const currentIds = [...fieldIds];
		rolloutOrder.forEach((id, targetIndex) => {
			const currentIndex = currentIds.indexOf(id);
			if (currentIndex === -1 || currentIndex === targetIndex) {
				return;
			}
			move(currentIndex, targetIndex);
			currentIds.splice(currentIndex, 1);
			currentIds.splice(targetIndex, 0, id);
		});
	};

	return (
		<div className="space-y-4">
			<Reorder.Group
				axis="y"
				values={rolloutOrder}
				onReorder={handleReorder}
				className="space-y-3">
				{rolloutOrder.map((id) => {
					const idx = formIndexById.get(id);
					if (idx === undefined) return null;
					const field = fields[idx];
					return (
						<SortableRolloutRow
							key={field.id}
							itemId={field.id}
							idx={idx}
							control={control}
							flag={flag}
							ruleIndex={ruleIndex}
							rolloutRange={rolloutRanges[idx]}
							onRemove={() => remove(idx)}
							isRemoveDisabled={fields.length <= 1}
							onDragEnd={commitRolloutOrder}
							canEditFlags={canEditFlags}
						/>
					);
				})}
			</Reorder.Group>

			{canEditFlags && (
				<div className="flex items-center justify-between gap-4 pt-2 border-t border-divider/50">
					<Button size="sm" variant="outline" onPress={handleAddRollout}>
						<PlusIcon className="size-4 mr-1.5" weight="bold" />
						Add Rollout Variation
					</Button>

					<ButtonGroup size="sm">
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="secondary"
									className="rounded-r-none"
									onPress={handleEqualizeVariations}>
									<ScalesIcon className="size-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								Equalize set variations (100% total)
							</Tooltip.Content>
						</Tooltip>
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="secondary"
									className="rounded-l-none"
									onPress={handleEqualizeAll}>
									<DivideIcon className="size-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								Equalize variations & next rule (incl. remaining traffic)
							</Tooltip.Content>
						</Tooltip>
					</ButtonGroup>
				</div>
			)}

			<div className="flex items-center justify-between gap-2 flex-wrap">
				<div className="flex items-center gap-2">
					{totalPercentage > 100 ? (
						<Chip size="lg" variant="soft" color="danger">
							Error: Total percentage is {totalPercentage}% (must not exceed
							100%)
						</Chip>
					) : remaining > 0 ? (
						<Tooltip delay={0}>
							<Tooltip.Trigger>
								<Chip size="lg" variant="soft" color="default">
									{remaining}% continues to next rules
								</Chip>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<div className="text-sm select-none font-mono">
									[{100 - remaining}% - 100%)
								</div>
							</Tooltip.Content>
						</Tooltip>
					) : (
						<Chip size="lg" variant="soft" color="warning">
							Warning: 0% of traffic continues to next rules
						</Chip>
					)}
				</div>
			</div>
		</div>
	);
}
