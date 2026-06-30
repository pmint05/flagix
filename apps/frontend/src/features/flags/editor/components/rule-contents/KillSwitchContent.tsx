"use client";
import { Chip } from "@heroui/react";
import type { FeatureFlag } from "@/types/feature-flag";
import { VariationSelector } from "../VariationSelector";

interface KillSwitchContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

export function KillSwitchContent({ flag, ruleIndex }: KillSwitchContentProps) {
	return (
		<div className="flex items-center gap-2 flex-wrap">
			<span className="text-sm text-default-600">
				When kill switch is active, resolve
			</span>
			<VariationSelector
				flag={flag}
				name={`rules.${ruleIndex}.variationId`}
				className="w-48"
			/>
			<span className="text-sm text-default-600">to all traffic</span>
			<Chip size="sm" color="danger" variant="soft">
				Overrides all rules
			</Chip>
		</div>
	);
}
