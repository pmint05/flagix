"use client";
import React from "react";
import { Button, Chip, Accordion, Dropdown, Label, cn } from "@heroui/react";
import {
	DotsSixVerticalIcon,
	DotsThreeIcon,
	TrashIcon,
	CopyIcon,
	ArrowUpIcon,
	ArrowDownIcon,
	EyeIcon,
	EyeSlashIcon,
	HexagonIcon,
} from "@phosphor-icons/react";
import { useFormContext } from "react-hook-form";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../schema";
import { RULE_TYPE_LABELS, RULE_TYPE_COLORS } from "../schema";
import { KillSwitchContent } from "./rule-contents/KillSwitchContent";
import { UserTargetingContent } from "./rule-contents/UserTargetingContent";
import { RoleTargetingContent } from "./rule-contents/RoleTargetingContent";
import { PercentageContent } from "./rule-contents/PercentageContent";
import { CustomRuleContent } from "./rule-contents/CustomRuleContent";
import { getVariationColor } from "#/lib/variation-colors";

interface RuleCardProps {
	ruleId: string;
	index: number;
	flag: FeatureFlag;
	onRemove: () => void;
	onDuplicate: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	totalRules: number;
	dragHandleProps?: Record<string, any>;
}

function RuleCardComponent({
	ruleId,
	index,
	flag,
	onRemove,
	onDuplicate,
	onMoveUp,
	onMoveDown,
	totalRules,
	dragHandleProps,
}: RuleCardProps) {
	const { watch, setValue } = useFormContext<FlagEditorFormValues>();

	const isEnabled = watch(`rules.${index}.isEnabled`);
	const ruleType = watch(`rules.${index}.ruleType`);
	const variationId = watch(`rules.${index}.variationId`);
	const variations = watch("variations") || [];

	const selectedVariation = variations.find((v) => v.id === variationId);
	const variationName =
		selectedVariation?.key ||
		(selectedVariation?.value !== undefined
			? String(selectedVariation.value)
			: "unknown");
	const variationIndex =
		variations.findIndex((v) => v.id === variationId) ?? -1;
	const variationColor =
		variationIndex !== -1
			? getVariationColor(variationIndex)
			: "text-default-400";

	const toggleEnabled = () => {
		setValue(`rules.${index}.isEnabled`, !isEnabled, { shouldDirty: true });
	};

	const renderContent = () => {
		switch (ruleType) {
			case "kill_switch":
				return <KillSwitchContent flag={flag} ruleIndex={index} />;
			case "user":
				return <UserTargetingContent flag={flag} ruleIndex={index} />;
			case "role":
				return <RoleTargetingContent flag={flag} ruleIndex={index} />;
			case "percentage":
				return <PercentageContent flag={flag} ruleIndex={index} />;
			case "custom":
				return <CustomRuleContent flag={flag} ruleIndex={index} />;
			default:
				return (
					<div className="text-sm text-default-500">Unknown rule type</div>
				);
		}
	};

	return (
		<div
			id={ruleId}
			className={cn("relative group w-full", {
				// "opacity-60": !isEnabled,
			})}>
			<Accordion className="px-0 w-full relative">
				<div
					className={cn(
						"absolute inset-0 z-10 bg-default opacity-0 pointer-events-none",
						{
							"opacity-40": !isEnabled,
						},
					)}
				/>
				<Accordion.Item
					defaultExpanded={true}
					key="1"
					aria-label="Rule Settings"
					className="group/accordion">
					<Accordion.Heading>
						<Accordion.Trigger className="flex items-center min-h-14 w-full justify-start px-0 bg-surface group-data-expanded/accordion:rounded-b-none rounded-3xl border border-divider transition-all p-0">
							{ruleType !== "kill_switch" &&
								dragHandleProps &&
								Object.keys(dragHandleProps).length > 0 && (
									<div
										className={cn(
											"pointer-events-none opacity-20 w-10 h-14 shrink-0 flex items-center justify-center border-r border-divider cursor-grab active:cursor-grabbing hover:bg-surface-secondary rounded-l-3xl transition-colors",
											{
												"pointer-events-auto opacity-100": totalRules > 1,
											},
										)}
										{...dragHandleProps}
										onClick={(e) => e.stopPropagation()}>
										<DotsSixVerticalIcon className="h-4 w-4" weight="bold" />
									</div>
								)}

							<div className="flex-1 px-4 py-3 flex items-center gap-3">
								<Chip
									size="sm"
									color={RULE_TYPE_COLORS[ruleType] as any}
									variant="soft">
									{RULE_TYPE_LABELS[ruleType] ?? ruleType}
								</Chip>
								<span className="truncate flex items-center gap-2">
									<span className="leading-tight">serves</span>
									<Chip
										className="font-medium text-foreground"
										size="sm"
										variant="soft">
										<div className="flex items-center gap-1">
											<HexagonIcon
												weight="fill"
												className={cn("size-3 shrink-0", variationColor)}
											/>
											<span>{variationName}</span>
										</div>
									</Chip>
								</span>
								{!isEnabled && (
									<Chip size="sm" variant="soft">
										Disabled
									</Chip>
								)}
							</div>

							<Accordion.Indicator />
							<div
								className="px-3 flex items-center gap-2 self-stretch shrink-0"
								onClick={(e) => e.stopPropagation()}>
								<Dropdown>
									<Button
										isIconOnly
										variant="ghost"
										size="sm"
										className="text-default-500">
										<DotsThreeIcon className="h-5 w-5" weight="bold" />
									</Button>

									<Dropdown.Popover>
										<Dropdown.Menu
											onAction={(key) => {
												if (key === "toggle") toggleEnabled();
												else if (key === "duplicate") onDuplicate();
												else if (key === "moveUp") onMoveUp?.();
												else if (key === "moveDown") onMoveDown?.();
												else if (key === "delete") onRemove();
											}}>
											<Dropdown.Item
												id="toggle"
												textValue={isEnabled ? "Disable Rule" : "Enable Rule"}>
												{isEnabled ? (
													<EyeSlashIcon className="size-4 text-default-500" />
												) : (
													<EyeIcon className="size-4 text-default-500" />
												)}
												<Label>
													{isEnabled ? "Disable Rule" : "Enable Rule"}
												</Label>
											</Dropdown.Item>
											<Dropdown.Item
												id="duplicate"
												textValue="Duplicate"
												isDisabled={ruleType === "kill_switch"}>
												<CopyIcon className="size-4 text-default-500" />
												<Label>Duplicate</Label>
											</Dropdown.Item>
											<Dropdown.Item
												id="moveUp"
												textValue="Move Up"
												isDisabled={ruleType === "kill_switch" || !onMoveUp}>
												<ArrowUpIcon className="size-4 text-default-500" />
												<Label>Move Up</Label>
											</Dropdown.Item>
											<Dropdown.Item
												id="moveDown"
												textValue="Move Down"
												isDisabled={ruleType === "kill_switch" || !onMoveDown}>
												<ArrowDownIcon className="size-4 text-default-500" />
												<Label>Move Down</Label>
											</Dropdown.Item>
											<Dropdown.Item
												id="delete"
												textValue="Delete"
												variant="danger">
												<TrashIcon className="size-4 text-danger" />
												<Label>Delete</Label>
											</Dropdown.Item>
										</Dropdown.Menu>
									</Dropdown.Popover>
								</Dropdown>
							</div>
						</Accordion.Trigger>
					</Accordion.Heading>
					<Accordion.Panel className="mt-0 border border-t-0 bg-surface rounded-b-3xl overflow-hidden">
						<Accordion.Body className="p-4 ">{renderContent()}</Accordion.Body>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>
		</div>
	);
}

// Optimized Memoization: Prevents heavy react-hook-form re-renders on drag coordinates change.
// We ignore inline functions and dragHandleProps because their listeners are bound at DOM mount time.
export const RuleCard = React.memo(RuleCardComponent, (prev, next) => {
	return (
		prev.ruleId === next.ruleId &&
		prev.index === next.index &&
		prev.totalRules === next.totalRules &&
		prev.flag === next.flag &&
		!!prev.onMoveUp === !!next.onMoveUp &&
		!!prev.onMoveDown === !!next.onMoveDown
	);
});
