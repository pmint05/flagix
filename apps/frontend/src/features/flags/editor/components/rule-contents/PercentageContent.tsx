"use client";
import { Controller, useFormContext, useFieldArray } from "react-hook-form";
import { Chip, Slider, Button, ButtonGroup, Tooltip } from "@heroui/react";
import {
	PlusIcon,
	TrashIcon,
	ScalesIcon,
	DivideIcon,
} from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../../schema";
import { VariationSelector } from "../VariationSelector";

interface PercentageContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

export function PercentageContent({ flag, ruleIndex }: PercentageContentProps) {
	const { control, watch, setValue } = useFormContext<FlagEditorFormValues>();

	const { fields, append, remove } = useFieldArray({
		control,
		name: `rules.${ruleIndex}.conditions.rollouts` as any,
	});

	const rollouts = watch(`rules.${ruleIndex}.conditions.rollouts` as any) || [];
	const totalPercentage = rollouts.reduce(
		(sum: number, r: any) => sum + (Number(r.percentage) || 0),
		0,
	);
	const remaining = 100 - totalPercentage;

	const handleAddRollout = () => {
		const variations = watch("variations") || flag.variations || [];
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

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				{fields.map((field, idx) => (
					<div
						key={field.id}
						className="flex items-center gap-4 flex-wrap p-3 rounded-3xl border">
						<span className="text-sm font-medium text-default-600">Serve</span>
						<div className="min-w-48 flex-1">
							<Controller
								name={
									`rules.${ruleIndex}.conditions.rollouts.${idx}.percentage` as any
								}
								control={control}
								render={({ field: pctField }) => (
									<div className="flex items-center gap-3">
										<Slider
											value={pctField.value ?? 0}
											onChange={(v) => pctField.onChange(v)}
											minValue={0}
											maxValue={100}
											step={1}
											className="flex-1">
											<Slider.Track>
												<Slider.Fill />
												<Slider.Thumb />
											</Slider.Track>
										</Slider>
										<Chip
											variant="secondary"
											className="text-sm shrink-0 font-semibold">
											{pctField.value ?? 0}%
										</Chip>
									</div>
								)}
							/>
						</div>
						<span className="text-sm text-default-600">of traffic to</span>
						<VariationSelector
							flag={flag}
							name={`rules.${ruleIndex}.conditions.rollouts.${idx}.variationId`}
						/>
						{fields.length > 1 && (
							<Tooltip>
								<Tooltip.Trigger>
									<Button
										isIconOnly
										variant="ghost"
										className="hover:bg-danger/10 text-danger hover:text-danger"
										size="sm"
										onPress={() => remove(idx)}>
										<TrashIcon className="size-4" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>Remove rollout</Tooltip.Content>
							</Tooltip>
						)}
					</div>
				))}
			</div>

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

			<div className="flex items-center justify-between gap-2 flex-wrap">
				<div className="flex items-center gap-2">
					{totalPercentage > 100 ? (
						<Chip size="sm" variant="soft" color="danger">
							Error: Total percentage is {totalPercentage}% (must not exceed
							100%)
						</Chip>
					) : remaining > 0 ? (
						<Chip size="sm" variant="soft" color="default">
							{remaining}% continues to next rules
						</Chip>
					) : (
						<Chip size="sm" variant="soft" color="warning">
							Warning: 0% of traffic continues to next rules
						</Chip>
					)}
				</div>
			</div>
		</div>
	);
}
