"use client";

import { Card, Chip, ScrollShadow, Separator, cn, Button } from "@heroui/react";
import {
	PlayIcon,
	CheckCircleIcon,
	XCircleIcon,
	MinusCircleIcon,
	InfoIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";

interface SimulationRightPanelProps {
	simulationResult: any | null;
	flag: FeatureFlag;
	onClear: () => void;
}

export function SimulationRightPanel({
	simulationResult,
	flag,
	onClear,
}: SimulationRightPanelProps) {
	return (
		<div className="flex flex-col h-full dark:bg-background-tertiary bg-background">
			<div className="p-4 border-b border-divider flex items-center justify-between">
				<span className="font-semibold text-foreground text-sm">
					Simulation Output
				</span>
				{simulationResult && (
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="danger-soft"
							onPress={onClear}>
							<TrashIcon className="size-3.5" />
							Clear
						</Button>
					</div>
				)}
			</div>

			<ScrollShadow className="flex-1 p-6 space-y-6">
				{!simulationResult ? (
					<div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
						<PlayIcon className="h-12 w-12 opacity-30 animate-pulse text-primary" />
						<div className="space-y-1">
							<p className="font-medium text-foreground">Awaiting Simulation</p>
							<p className="max-w-sm">
								Set up target context parameters on the left and run evaluation
								to see how they resolve.
							</p>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						{/* Variation Card */}
						<Card className="border border-divider shadow-sm /50 p-6 rounded-3xl">
							<div className="flex items-center justify-between">
								<div className="space-y-1.5">
									<span className="font-medium uppercase tracking-wider block text-sm">
										Resolved Variation
									</span>
									<div className="flex items-center gap-2">
										<span className="text-2xl font-bold text-foreground">
											{simulationResult.resolvedVariationKey || "None"}
										</span>
										<Chip
											variant="soft"
											color="accent"
											className="font-mono leading-normal text-base"
											size="lg">
											{String(simulationResult.resolvedVariationValue)}
										</Chip>
									</div>
								</div>
							</div>

							<Separator className="my-1" />

							<div className="flex items-end gap-2 text-sm ">
								<span className="font-medium">Reason:</span>
								<code className="font-mono leading-tight">
									{simulationResult.reason}
								</code>
							</div>
						</Card>

						{/* Path Trace */}
						<div className="space-y-3">
							<h3 className="font-semibold text-foreground text-sm">
								Evaluation Path Trace
							</h3>
							<div className="relative border-l border-border-secondary pl-5.75 ml-3 space-y-6 py-2">
								{/* Active State step */}
								<div className="relative">
									<span className="absolute -left-9 top-0.5 bg-background rounded-full p-1 border border-divider">
										<CheckCircleIcon
											className="size-4 text-success"
											weight="fill"
										/>
									</span>
									<div className="space-y-1">
										<p className="font-medium text-sm text-foreground">
											Flag Environment Check
										</p>
										<p className="">
											Flag status is{" "}
											<code className=" rounded px-1">
												{simulationResult.status}
											</code>{" "}
											and{" "}
											<Chip
												variant="soft"
												color={
													simulationResult.isEnabled ? "success" : "warning"
												}
												className="font-mono leading-tight text-sm">
												{simulationResult.isEnabled ? "Flag On" : "Flag Off"}
											</Chip>
											{" "}
											<code>
												(isEnabled: {String(simulationResult.isEnabled)}).
											</code>
										</p>
									</div>
								</div>

								{/* Rules trace step */}
								{simulationResult.ruleTraces.map((trace: any, idx: number) => {
									const isSkipped = !trace.isEnabled;
									const ruleVariation = flag.variations?.find(
										(v: any) => v.id === trace.variationId,
									);
									const variationKey = ruleVariation?.key || trace.variationId;

									return (
										<div key={trace.ruleId} className="relative">
											<span className="absolute -left-8.75 top-0 bg-surface-secondary rounded-full p-1 border border-divider">
												{trace.isMatched ? (
													<CheckCircleIcon
														className="size-4 text-success"
														weight="fill"
													/>
												) : isSkipped ? (
													<MinusCircleIcon className="size-4 text-muted" />
												) : (
													<XCircleIcon
														className="size-4 text-danger"
														weight="fill"
													/>
												)}
											</span>
											<div className="space-y-1.5">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="font-medium text-sm text-foreground">
														Rule #{idx + 1}: {trace.ruleType}
													</span>
													{trace.isMatched && (
														<Chip
															size="sm"
															color="success"
															className="h-5 px-1.5 text-[10px]"
															variant="soft">
															Matched
														</Chip>
													)}
													{isSkipped && (
														<Chip
															size="sm"
															color="default"
															className="h-5 px-1.5 text-[10px]"
															variant="soft">
															Disabled
														</Chip>
													)}
												</div>

												{/* Rule details */}
												{!isSkipped && trace.matchDetail && (
													<div className=" border border-divider/60 rounded-2xl p-3 space-y-2 bg-surface">
														{/* User Detail */}
														{trace.ruleType === "user" &&
															trace.matchDetail.userId && (
																<div className="space-y-1">
																	<div>
																		<span className="">Provided user ID:</span>{" "}
																		<code className=" rounded px-1">
																			{trace.matchDetail.userId.provided ||
																				"null"}
																		</code>
																	</div>
																	<div>
																		<span className="">Target list:</span>{" "}
																		<code className=" rounded px-1">
																			[
																			{trace.matchDetail.userId.expected.join(
																				", ",
																			)}
																			]
																		</code>
																	</div>
																</div>
															)}

														{/* Role Detail */}
														{trace.ruleType === "role" &&
															trace.matchDetail.role && (
																<div className="space-y-1">
																	<div>
																		<span className="">Provided role:</span>{" "}
																		<code className=" rounded px-1">
																			{trace.matchDetail.role.provided ||
																				"null"}
																		</code>
																	</div>
																	<div>
																		<span className="">Target list:</span>{" "}
																		<code className=" rounded px-1">
																			[
																			{trace.matchDetail.role.expected.join(
																				", ",
																			)}
																			]
																		</code>
																	</div>
																</div>
															)}

														{/* Percentage Detail */}
														{trace.ruleType === "percentage" &&
															trace.matchDetail.percentage && (
																<div className="space-y-1">
																	<div>
																		<span className="">Bucket value:</span>{" "}
																		<code className=" rounded px-1">
																			{trace.matchDetail.percentage.bucketValue?.toFixed(
																				2,
																			)}
																			%
																		</code>
																	</div>
																	<div className="space-y-0.5">
																		<span className=" block">
																			Rollout groups:
																		</span>
																		{trace.matchDetail.percentage.rollouts.map(
																			(rollout: any, rIdx: number) => {
																				const varName =
																					flag.variations?.find(
																						(v: any) =>
																							v.id === rollout.variationId,
																					)?.key || rollout.variationId;
																				const range =
																					trace.matchDetail.percentage.ranges?.[
																						rIdx
																					];
																				return (
																					<div
																						key={rollout.variationId}
																						className="pl-3 flex items-center gap-2">
																						<span className="">•</span>
																						<Chip size="sm">{varName}</Chip>:
																						<span className="font-semibold">
																							{rollout.percentage}%
																						</span>
																						{range && (
																							<span className="font-mono">
																								[{range.start}% - {range.end}%)
																							</span>
																						)}
																					</div>
																				);
																			},
																		)}
																	</div>
																	{trace.matchDetail.percentage.explanation && (
																		<div className="font-medium mt-2 p-2 pb-0 border-t">
																			{trace.matchDetail.percentage.explanation}
																		</div>
																	)}
																</div>
															)}

														{/* Custom Detail */}
														{trace.ruleType === "custom" &&
															trace.matchDetail.custom && (
																<div className="space-y-1.5">
																	{trace.matchDetail.custom.map(
																		(clause: any, cIdx: number) => (
																			<div
																				key={cIdx}
																				className="flex items-start gap-2">
																				{clause.isMatched ? (
																					<CheckCircleIcon
																						className="size-3.5 text-success mt-1.5 shrink-0"
																						weight="fill"
																					/>
																				) : (
																					<XCircleIcon
																						className="size-3.5 text-danger mt-1.5 shrink-0"
																						weight="fill"
																					/>
																				)}
																				<div>
																					<span className="text-muted">
																						clause:
																					</span>{" "}
																					<code>{clause.contextKey}</code>{" "}
																					{clause.operator}{" "}
																					<code>
																						{JSON.stringify(clause.expected)}
																					</code>
																					<span className=" block mt-0.5">
																						(provided:{" "}
																						{JSON.stringify(clause.provided)})
																					</span>
																				</div>
																			</div>
																		),
																	)}
																</div>
															)}

														{!isSkipped && trace.ruleType !== "percentage" && (
															<div className="border-t border-divider/60 pt-2 flex items-center gap-1.5">
																<InfoIcon className="size-3.5" />
																<span>
																	Serving variation{" "}
																	<Chip className="py-0.5 -top-0.5 relative">
																		{variationKey}
																	</Chip>{" "}
																	if matched
																</span>
															</div>
														)}
													</div>
												)}
											</div>
										</div>
									);
								})}

								{/* Default Fallback step */}
								<div
									className={cn("relative transition-opacity", {
										"opacity-50": simulationResult.reason !== "DEFAULT",
									})}>
									<span className="absolute -left-9 top-0.5 bg-surface-secondary rounded-full p-1 border border-divider">
										{simulationResult.reason === "DEFAULT" ? (
											<CheckCircleIcon
												className="size-4 text-success"
												weight="fill"
											/>
										) : (
											<MinusCircleIcon className="size-4 " />
										)}
									</span>
									<div className="space-y-1">
										<p
											className={cn("font-medium text-sm", {
												"text-foreground":
													simulationResult.reason === "DEFAULT",
												"": simulationResult.reason !== "DEFAULT",
											})}>
											Default Fallback Rule
										</p>
										{simulationResult.reason === "DEFAULT" ? (
											<p className="">
												Resolved default variation key{" "}
												<code className="rounded px-1 bg-default-100 font-semibold font-mono">
													{simulationResult.resolvedVariationKey}
												</code>{" "}
												because no targeting rules matched above.
											</p>
										) : (
											<p className="">
												{simulationResult.reason === "RULE_MATCH"
													? "Skipped because a targeting rule matched above."
													: "Skipped because flag is not active (Draft, Disabled, or Archived)."}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</ScrollShadow>
		</div>
	);
}
