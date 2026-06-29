"use client";
import { Controller, useFormContext } from "react-hook-form";
import { Chip, Slider } from "@heroui/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../../schema";
import { VariationSelector } from "../VariationSelector";

interface PercentageContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

export function PercentageContent({ flag, ruleIndex }: PercentageContentProps) {
	const { control, watch } = useFormContext<FlagEditorFormValues>();
	const percentage: number =
		watch(`rules.${ruleIndex}.conditions.percentage`) ?? 0;
	const remaining = 100 - percentage;

	return (
		<div className="space-y-3">
			<div className="flex items-end gap-2 flex-wrap">
				<span className="font-medium">Serve</span>
				<div className="min-w-48">
					<Controller
						name={`rules.${ruleIndex}.conditions.percentage`}
						control={control}
						render={({ field }) => (
							<div className="flex items-end gap-2">
								<Slider
									value={field.value ?? 0}
									onChange={(v) => field.onChange(v)}
									minValue={0}
									maxValue={100}
									step={1}>
									<Slider.Track>
										<Slider.Fill />
										<Slider.Thumb />
									</Slider.Track>
								</Slider>
								<Chip variant="secondary" className="text-sm py-0">
									{field.value ?? 0}%
								</Chip>
							</div>
						)}
					/>
				</div>
				<span>of traffic to</span>
				<VariationSelector
					flag={flag}
					name={`rules.${ruleIndex}.variationId`}
				/>
			</div>
			<div className="pl-6">
				<Chip
					size="sm"
					variant="soft"
					color={remaining > 0 ? "default" : "warning"}>
					{remaining > 0
						? `${remaining}% continues to next rules`
						: "100% — no traffic continues"}
				</Chip>
			</div>
		</div>
	);
}
