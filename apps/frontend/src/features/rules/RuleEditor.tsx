import { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Form,
	FieldError,
	Label,
	Select,
	SelectTrigger,
	SelectValue,
	SelectPopover,
	SelectIndicator,
	ListBox,
	ListBoxItem,
	Drawer,
	Input,
	toast,
	Slider,
	Chip,
} from "@heroui/react";
import { PlusIcon } from "@phosphor-icons/react";
import { useCreateRule, useUpdateRule } from "./api";
import { ruleFormSchema } from "./schema";
import type { RuleFormValues } from "./schema";
import type { Variation } from "@/types/feature-flag";
import type { Environment } from "@/types";
import type { TargetingRule } from "@/types/targeting-rule";

const RULE_TYPES = [
	{
		key: "kill_switch",
		label: "Kill Switch",
		description: "Disable the flag across all users",
	},
	{
		key: "user",
		label: "User Targeting",
		description: "Target specific users by ID or attribute",
	},
	{ key: "role", label: "Role Targeting", description: "Target users by role" },
	{
		key: "percentage",
		label: "Percentage Rollout",
		description: "Roll out to a percentage of users",
	},
] as const;

interface RuleEditorProps {
	isOpen: boolean;
	onClose: () => void;
	flagId: string;
	variations: Variation[];
	environments: Environment[];
	defaultEnvironmentId?: string;
	rule?: TargetingRule;
}

export function RuleEditor({
	isOpen,
	onClose,
	flagId,
	variations,
	environments,
	defaultEnvironmentId,
	rule,
}: RuleEditorProps) {
	const isEditing = !!rule;
	const createRule = useCreateRule();
	const updateRule = useUpdateRule();
	const [userIdInput, setUserIdInput] = useState("");
	const [roleInput, setRoleInput] = useState("");

	const isPending = createRule.isPending || updateRule.isPending;

	const {
		handleSubmit,
		reset,
		control,
		watch,
		formState: { errors },
	} = useForm<RuleFormValues>({
		resolver: zodResolver(ruleFormSchema),
		defaultValues: {
			ruleType: rule?.ruleType ?? "kill_switch",
			environmentId: rule?.environmentId ?? defaultEnvironmentId ?? "",
			variationId: rule?.variationId ?? "",
			conditions: rule?.conditions ?? {},
			isEnabled: rule?.isEnabled ?? true,
			percentageDistribution:
				rule?.ruleType === "percentage"
					? getDefaultPercentageDist(variations)
					: undefined,
		},
	});

	const ruleType = watch("ruleType");

	useEffect(() => {
		if (isOpen) {
			reset({
				ruleType: rule?.ruleType ?? "kill_switch",
				environmentId: rule?.environmentId ?? defaultEnvironmentId ?? "",
				variationId: rule?.variationId ?? "",
				conditions: rule?.conditions ?? {},
				isEnabled: rule?.isEnabled ?? true,
				percentageDistribution:
					rule?.ruleType === "percentage"
						? getDefaultPercentageDist(variations)
						: undefined,
			});
			setUserIdInput("");
			setRoleInput("");
		}
	}, [isOpen, rule, defaultEnvironmentId, reset, variations]);

	const onSubmit = async (data: RuleFormValues) => {
		try {
			if (isEditing && rule) {
				await updateRule.mutateAsync({
					flagId,
					ruleId: rule.id,
					...data,
				});
				toast.success("Rule updated successfully");
			} else {
				await createRule.mutateAsync({
					...data,
					flagId,
				});
				toast.success("Rule created successfully");
			}
			onClose();
		} catch {
			toast.danger(
				isEditing ? "Failed to update rule" : "Failed to create rule",
			);
		}
	};

	return (
		<Drawer isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Drawer.Backdrop>
				<Drawer.Content placement="right">
					<Drawer.Dialog>
						<Drawer.Header>
							<Drawer.Heading>
								{isEditing ? "Edit Targeting Rule" : "Create Targeting Rule"}
							</Drawer.Heading>
						</Drawer.Header>
						<Drawer.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								{!isEditing && (
									<Controller
										name="ruleType"
										control={control}
										render={({ field }) => (
											<Select
												selectedKey={field.value as string}
												onSelectionChange={(key) => {
													if (key) field.onChange(key);
												}}>
												<Label>Rule Type</Label>
												<SelectTrigger>
													<SelectValue />
													<SelectIndicator />
												</SelectTrigger>
												<SelectPopover>
													<ListBox items={RULE_TYPES}>
														{(t: any) => (
															<ListBoxItem id={t.key} key={t.key}>
																{t.label}
															</ListBoxItem>
														)}
													</ListBox>
												</SelectPopover>
												{errors.ruleType && (
													<FieldError>
														{(errors.ruleType as any).message}
													</FieldError>
												)}
											</Select>
										)}
									/>
								)}

								<Controller
									name="environmentId"
									control={control}
									render={({ field }) => (
										<Select
											selectedKey={field.value as string}
											onSelectionChange={(key) => {
												if (key) field.onChange(key);
											}}
											isDisabled={isEditing}>
											<Label>Environment</Label>
											<SelectTrigger>
												<SelectValue />
												<SelectIndicator />
											</SelectTrigger>
											<SelectPopover>
												<ListBox items={environments}>
													{(env: any) => (
														<ListBoxItem id={env.id} key={env.id}>
															{env.name}
														</ListBoxItem>
													)}
												</ListBox>
											</SelectPopover>
											{errors.environmentId && (
												<FieldError>
													{(errors.environmentId as any).message}
												</FieldError>
											)}
										</Select>
									)}
								/>

								{ruleType === "percentage" ? (
									<PercentageRuleEditor
										control={control}
										variations={variations}
										percentageDist={watch("percentageDistribution")}
									/>
								) : ruleType === "user" ? (
									<UserRuleEditor
										control={control}
										errors={errors}
										variations={variations}
										userIdInput={userIdInput}
										setUserIdInput={setUserIdInput}
									/>
								) : ruleType === "role" ? (
									<RoleRuleEditor
										control={control}
										errors={errors}
										variations={variations}
										roleInput={roleInput}
										setRoleInput={setRoleInput}
									/>
								) : (
									<KillSwitchRuleEditor
										control={control}
										errors={errors}
										variations={variations}
									/>
								)}

								<Controller
									name="isEnabled"
									control={control}
									render={({ field }) => (
										<div className="flex items-center gap-2">
											<input
												type="checkbox"
												checked={field.value}
												onChange={(e) => field.onChange(e.target.checked)}
												className="h-4 w-4 rounded-xl"
											/>
											<Label>Enabled</Label>
										</div>
									)}
								/>

								<Drawer.Footer>
									<Button variant="ghost" onPress={onClose}>
										Cancel
									</Button>
									<Button
										type="submit"
										variant="primary"
										isDisabled={isPending}>
										{isEditing ? "Update Rule" : "Create Rule"}
									</Button>
								</Drawer.Footer>
							</Form>
						</Drawer.Body>
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}

function getDefaultPercentageDist(variations: Variation[]) {
	return variations.map((v) => ({
		variationId: v.id,
		percentage: 0,
	}));
}

interface RuleEditorFieldProps {
	control: any;
	errors: any;
	variations: Variation[];
}

function KillSwitchRuleEditor({
	control,
	errors,
	variations,
}: RuleEditorFieldProps) {
	return (
		<Controller
			name="variationId"
			control={control}
			render={({ field }) => (
				<Select
					selectedKey={field.value as string}
					onSelectionChange={(key) => {
						if (key) field.onChange(key);
					}}>
					<Label>Target Variation</Label>
					<SelectTrigger>
						<SelectValue />
						<SelectIndicator />
					</SelectTrigger>
					<SelectPopover>
						<ListBox items={variations}>
							{(v: any) => (
								<ListBoxItem id={v.id} key={v.id}>
									{v.key}
								</ListBoxItem>
							)}
						</ListBox>
					</SelectPopover>
					{errors.variationId && (
						<FieldError>{errors.variationId.message}</FieldError>
					)}
				</Select>
			)}
		/>
	);
}

function UserRuleEditor({
	control,
	errors,
	variations,
	userIdInput,
	setUserIdInput,
}: RuleEditorFieldProps & {
	userIdInput: string;
	setUserIdInput: (v: string) => void;
}) {
	return (
		<>
			<Controller
				name="variationId"
				control={control}
				render={({ field }) => (
					<Select
						selectedKey={field.value as string}
						onSelectionChange={(key) => {
							if (key) field.onChange(key);
						}}>
						<Label>Target Variation</Label>
						<SelectTrigger>
							<SelectValue />
							<SelectIndicator />
						</SelectTrigger>
						<SelectPopover>
							<ListBox items={variations}>
								{(v: any) => (
									<ListBoxItem id={v.id} key={v.id}>
										{v.key}
									</ListBoxItem>
								)}
							</ListBox>
						</SelectPopover>
						{errors.variationId && (
							<FieldError>{errors.variationId.message}</FieldError>
						)}
					</Select>
				)}
			/>
			<div className="space-y-2">
				<Label>User Identifiers</Label>
				<p className="text-xs">Add user IDs or email addresses to target</p>
				<div className="flex gap-2">
					<Input
						placeholder="Enter user ID or email"
						value={userIdInput}
						onChange={(e) => setUserIdInput(e.target.value)}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onPress={() => {
							if (userIdInput.trim()) {
								setUserIdInput("");
							}
						}}>
						<PlusIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</>
	);
}

function RoleRuleEditor({
	control,
	errors,
	variations,
	roleInput,
	setRoleInput,
}: RuleEditorFieldProps & {
	roleInput: string;
	setRoleInput: (v: string) => void;
}) {
	return (
		<>
			<Controller
				name="variationId"
				control={control}
				render={({ field }) => (
					<Select
						selectedKey={field.value as string}
						onSelectionChange={(key) => {
							if (key) field.onChange(key);
						}}>
						<Label>Target Variation</Label>
						<SelectTrigger>
							<SelectValue />
							<SelectIndicator />
						</SelectTrigger>
						<SelectPopover>
							<ListBox items={variations}>
								{(v: any) => (
									<ListBoxItem id={v.id} key={v.id}>
										{v.key}
									</ListBoxItem>
								)}
							</ListBox>
						</SelectPopover>
						{errors.variationId && (
							<FieldError>{errors.variationId.message}</FieldError>
						)}
					</Select>
				)}
			/>
			<div className="space-y-2">
				<Label>Role Names</Label>
				<p className="text-xs">Add role names to target</p>
				<div className="flex gap-2">
					<Input
						placeholder="Enter role name"
						value={roleInput}
						onChange={(e) => setRoleInput(e.target.value)}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onPress={() => {
							if (roleInput.trim()) {
								setRoleInput("");
							}
						}}>
						<PlusIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</>
	);
}

function PercentageRuleEditor({
	control,
	variations,
	percentageDist,
}: Omit<RuleEditorFieldProps, "errors"> & { percentageDist: any }) {
	useFieldArray({
		control,
		name: "percentageDistribution" as any,
	});

	const totalPercentage =
		percentageDist?.reduce(
			(acc: number, p: any) => acc + (p.percentage ?? 0),
			0,
		) ?? 0;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>Percentage Distribution</Label>
				<Chip
					color={Math.abs(totalPercentage - 100) < 0.01 ? "success" : "danger"}
					variant="soft">
					{totalPercentage.toFixed(1)}%
				</Chip>
			</div>
			{Math.abs(totalPercentage - 100) >= 0.01 && (
				<p className="text-xs text-danger">
					Percentages must sum to exactly 100%
				</p>
			)}
			<div className="space-y-3">
				{variations.map((variation, index) => (
					<div key={variation.id} className="flex items-center gap-3">
						<span className="w-24 text-sm font-medium">{variation.key}</span>
						<Controller
							name={`percentageDistribution.${index}.percentage` as any}
							control={control}
							render={({ field }) => (
								<div className="flex-1">
									<Slider
										step={1}
										minValue={0}
										maxValue={100}
										value={field.value ?? 0}
										onChange={(val) => {
											const newVal = Array.isArray(val) ? val[0] : val;
											field.onChange(newVal);
										}}
										className="flex-1"
									/>
								</div>
							)}
						/>
						<Controller
							name={`percentageDistribution.${index}.variationId` as any}
							control={control}
							render={({ field: variationField }) => (
								<input type="hidden" {...variationField} value={variation.id} />
							)}
						/>
						<span className="w-12 text-right text-sm">
							{percentageDist?.[index]?.percentage ?? 0}%
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
