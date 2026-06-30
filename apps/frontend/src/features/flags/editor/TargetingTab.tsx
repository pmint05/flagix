"use client";
import { useState } from "react";
import { Button, Surface } from "@heroui/react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "./schema";
import { FlagStatusCard } from "./components/FlagStatusCard";
import { TargetingRulesEditor } from "./components/TargetingRulesEditor";
import { DefaultRuleCard } from "./components/DefaultRuleCard";

interface TargetingTabProps {
	flag: FeatureFlag;
}

export function TargetingTab({ flag }: TargetingTabProps) {
	const { control } = useFormContext<FlagEditorFormValues>();
	const isFlagOn = useWatch({ name: "isFlagOn", control });
	const [showRulesWhenOff, setShowRulesWhenOff] = useState(false);

	const shouldShowRules = isFlagOn || showRulesWhenOff;

	return (
		<div className="py-6 space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-foreground">Targeting</h2>
				<p className="text-sm text-default-500 mt-1">
					Configure how this flag resolves variations for different users.
				</p>
			</div>

			<Surface className="bg-surface-secondary p-6 rounded-3xl">
				<FlagStatusCard flag={flag} />

				{!isFlagOn && !showRulesWhenOff && (
					<div className="flex items-center justify-between px-4 py-3 bg-surface rounded-3xl border border-divider mt-4">
						<div>
							<p className="text-sm text-default-600">
								Targeting rules are hidden because the flag is OFF. All users
								resolve to the off variation.
							</p>
						</div>
						<Button
							size="sm"
							variant="ghost"
							onPress={() => setShowRulesWhenOff(true)}>
							Show targeting rules
						</Button>
					</div>
				)}

				{!isFlagOn && showRulesWhenOff && (
					<div className="flex items-center justify-between px-4 py-3 bg-surface rounded-3xl border border-divider mt-4">
						<p className="text-sm text-default-500">
							Showing rules for review. Rules are not active while flag is OFF.
						</p>
						<Button
							size="sm"
							variant="ghost"
							onPress={() => setShowRulesWhenOff(false)}>
							Hide rules
						</Button>
					</div>
				)}

				{shouldShowRules && (
					<div className={!isFlagOn ? "opacity-50 pointer-events-none" : ""}>
						<TargetingRulesEditor flag={flag} />
						<DefaultRuleCard flag={flag} />
					</div>
				)}
			</Surface>
		</div>
	);
}
