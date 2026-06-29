"use client";
import { useState } from "react";
import {
	Button,
	Card,
	Chip,
	TextField,
	Label,
	InputGroup,
} from "@heroui/react";
import { PlayIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";

import { useFormContext } from "react-hook-form";
import type { FlagEditorFormValues } from "./schema";

interface PreviewTabProps {
	flag: FeatureFlag;
}

export function PreviewTab({}: PreviewTabProps) {
	const { watch } = useFormContext<FlagEditorFormValues>();
	const draftVariations = watch("variations");
	const isFlagOn = watch("isFlagOn");
	const defaultVariationId = watch("defaultVariationId");
	const offVariationId = watch("offVariationId");
	const [context, setContext] = useState({
		userId: "",
		email: "",
		role: "",
		customAttributes: "",
	});

	const [result, setResult] = useState<{
		variation: string;
		reason: string;
	} | null>(null);

	const handleEvaluate = () => {
		// Mock evaluate logic
		if (!isFlagOn) {
			const offVar = draftVariations.find((v) => v.id === offVariationId);
			setResult({
				variation: String(offVar?.value ?? "N/A"),
				reason: "Matched OFF variation (Feature flag is OFF)",
			});
			return;
		}

		const defaultVar = draftVariations.find((v) => v.id === defaultVariationId);
		setResult({
			variation: String(defaultVar?.value ?? "N/A"),
			reason: "Matched Default Rule (Feature flag is ON)",
		});
	};

	return (
		<div className="py-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
			{/* Context Input */}
			<div className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold text-foreground">
						Test Context
					</h2>
					<p className="text-sm text-default-500">
						Provide user context to see how the flag evaluates.
					</p>
				</div>
				<Card className="border border-divider shadow-sm">
					<div className="p-6 space-y-4">
						<TextField>
							<Label>User ID</Label>
							<InputGroup>
								<InputGroup.Input
									placeholder="e.g. user_123"
									value={context.userId}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setContext({ ...context, userId: e.target.value })
									}
								/>
							</InputGroup>
						</TextField>
						<TextField>
							<Label>Email</Label>
							<InputGroup>
								<InputGroup.Input
									placeholder="e.g. user@example.com"
									value={context.email}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setContext({ ...context, email: e.target.value })
									}
								/>
							</InputGroup>
						</TextField>
						<TextField>
							<Label>Role</Label>
							<InputGroup>
								<InputGroup.Input
									placeholder="e.g. admin"
									value={context.role}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setContext({ ...context, role: e.target.value })
									}
								/>
							</InputGroup>
						</TextField>
						<TextField>
							<Label>Custom Attributes (JSON)</Label>
							<InputGroup>
								<InputGroup.Input
									placeholder='{"plan": "premium"}'
									value={context.customAttributes}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setContext({ ...context, customAttributes: e.target.value })
									}
								/>
							</InputGroup>
						</TextField>
						<div className="pt-2">
							<Button
								variant="primary"
								className="w-full"
								onPress={handleEvaluate}>
								<PlayIcon className="h-4 w-4 mr-2" />
								Evaluate Flag
							</Button>
						</div>
					</div>
				</Card>
			</div>

			{/* Evaluation Result */}
			<div className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold text-foreground">
						Evaluation Result
					</h2>
					<p className="text-sm text-default-500">
						See what variation this context resolves.
					</p>
				</div>
				<Card className="border border-divider shadow-sm bg-default-50 h-[380px]">
					<div className="p-8 flex flex-col items-center justify-center text-center">
						{!result ? (
							<div className="text-default-400 space-y-4">
								<PlayIcon className="h-12 w-12 mx-auto opacity-50" />
								<p>
									Fill out the context and click Evaluate to see the result.
								</p>
							</div>
						) : (
							<div className="space-y-6 animate-appearance-in">
								<div>
									<div className="text-sm font-medium text-default-500 mb-2 uppercase tracking-wider">
										Resolved Variation
									</div>
									<Chip
										variant="soft"
										color={
											result.variation === "true"
												? "success"
												: result.variation === "false"
													? "danger"
													: "default"
										}>
										{result.variation}
									</Chip>
								</div>
								<div className="h-px bg-divider w-full" />
								<div>
									<div className="text-sm font-medium text-default-500 mb-2 uppercase tracking-wider">
										Reason
									</div>
									<p className="text-foreground font-medium">{result.reason}</p>
								</div>
							</div>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
