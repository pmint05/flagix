"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Button,
	Card,
	Form,
	FieldError,
	Label,
	TextField,
	Input,
	TextArea,
	toast,
	Chip,
	Separator,
	Tooltip,
	RadioGroup,
	Radio,
	Description,
	cn,
} from "@heroui/react";
import {
	TrashIcon,
	CheckCircleIcon,
	ArchiveIcon,
	ArrowClockwiseIcon,
	ShieldWarningIcon,
	QuestionIcon,
	BrowserIcon,
	TerminalIcon,
	GlobeSimpleIcon,
} from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import { useUpdateFlag, useUpdateFlagState, useDeleteFlag } from "../api";
import { useContextStore } from "@/stores";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ActionButton } from "#/components/ui/action-button";

const flagMetadataSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().optional(),
	visibility: z.enum(["all", "client_only", "server_only"]),
});

const visibilityOptions = [
	{
		value: "all",
		title: "All SDKs",
		description: "Available for both client and server evaluations.",
		icon: GlobeSimpleIcon,
	},
	{
		value: "client_only",
		title: "Client Only",
		description: "Visible to client-side SDKs only. Restricted on backend.",
		icon: BrowserIcon,
	},
	{
		value: "server_only",
		title: "Server Only",
		description: "Secret flags, accessible by server/backend keys only.",
		icon: TerminalIcon,
	},
] as const;

type FlagMetadataValues = z.infer<typeof flagMetadataSchema>;

interface SettingsTabProps {
	flag: FeatureFlag;
	projectSlug: string;
}

export function SettingsTab({ flag, projectSlug }: SettingsTabProps) {
	const currentEnv = useContextStore((s) => s.selectedEnvironment);
	const navigate = useNavigate();

	const updateFlag = useUpdateFlag();
	const updateFlagState = useUpdateFlagState();
	const deleteFlag = useDeleteFlag();
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const defaultFlagState = flag.states?.find(
		(s) => s.environmentId === currentEnv?.id,
	);
	const currentStatus = defaultFlagState?.status ?? "draft";

	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty, errors },
	} = useForm<FlagMetadataValues>({
		resolver: zodResolver(flagMetadataSchema),
		defaultValues: {
			name: flag.name || "",
			description: flag.description || "",
			visibility: flag.visibility || "all",
		},
	});

	// Reset form when flag changes
	useEffect(() => {
		reset({
			name: flag.name || "",
			description: flag.description || "",
			visibility: flag.visibility || "all",
		});
	}, [flag, reset]);

	const onSubmit = (data: FlagMetadataValues) => {
		updateFlag.mutate(
			{
				flagId: flag.id,
				name: data.name,
				description: data.description,
				visibility: data.visibility,
			},
			{
				onSuccess: () => {
					toast.success("Flag metadata updated successfully");
					reset(data);
				},
				onError: (err: any) => {
					toast.danger("Failed to update flag info", {
						description: err.message || "An unexpected error occurred.",
					});
				},
			},
		);
	};

	const handleStatusTransition = (status: "active" | "archived" | "draft") => {
		updateFlagState.mutate(
			{
				flagId: flag.id,
				status,
			},
			{
				onSuccess: () => {
					toast.success(
						`Flag status transitioned to ${status.toUpperCase()} in ${currentEnv?.name}`,
					);
				},
				onError: (err: any) => {
					toast.danger("Failed to transition flag status", {
						description: err.message || "Invalid status transition.",
					});
				},
			},
		);
	};

	const handleDelete = async () => {
		try {
			await deleteFlag.mutateAsync(flag.id);
			toast.success("Feature flag deleted successfully");
			navigate({
				to: "/projects/$projectSlug/flags",
				params: { projectSlug },
			});
		} catch (err: any) {
			toast.danger("Failed to delete flag", {
				description:
					err.message || "Make sure you have permissions to delete flags.",
			});
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "success";
			case "archived":
				return "default";
			case "draft":
			default:
				return "warning";
		}
	};

	return (
		<div className="py-6 max-w-4xl mx-auto space-y-8">
			{/* Metadata Settings Card */}
			<Card className="border border-divider shadow-sm rounded-3xl p-6">
				<div className="mb-6">
					<h2 className="text-base font-semibold text-foreground">
						General Settings
					</h2>
					<p className="text-default-500">
						Edit the display name and description of this feature flag.
					</p>
				</div>

				<Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<TextField variant="secondary" isDisabled>
							<Label>Flag Key</Label>
							<Input value={flag.key} />
							<p className="text-[10px] text-default-400 mt-1">
								Unique key used in your SDKs. Cannot be changed.
							</p>
						</TextField>

						<TextField variant="secondary" isDisabled>
							<Label>Flag Type</Label>
							<Input value={flag.flagType.toUpperCase()} />
							<p className="text-[10px] text-default-400 mt-1">
								Configuration type of the flag. Cannot be changed.
							</p>
						</TextField>
					</div>

					<Controller
						name="name"
						control={control}
						render={({ field }) => (
							<TextField
								isInvalid={!!errors.name}
								variant="secondary"
								value={field.value}
								onChange={field.onChange}
								onBlur={field.onBlur}
								isRequired>
								<Label>Flag Name</Label>
								<Input placeholder="e.g. New Checkout Page" />
								{errors.name && <FieldError>{errors.name.message}</FieldError>}
							</TextField>
						)}
					/>

					<Controller
						name="description"
						control={control}
						render={({ field }) => (
							<TextField
								isInvalid={!!errors.description}
								variant="secondary"
								value={field.value}
								onChange={field.onChange}
								onBlur={field.onBlur}>
								<Label>Description</Label>
								<TextArea
									placeholder="Explain what this flag controls..."
									rows={3}
								/>
								{errors.description && (
									<FieldError>{errors.description.message}</FieldError>
								)}
							</TextField>
						)}
					/>

					<Controller
						name="visibility"
						control={control}
						render={({ field }) => (
							<RadioGroup
								value={field.value}
								onChange={field.onChange}
								variant="secondary"
								className="w-full">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<Label>Visibility Scope</Label>
								</div>
								<div className="grid gap-3 md:grid-cols-3">
									{visibilityOptions.map((option) => {
										const IconComponent = option.icon;
										return (
											<Radio
												key={option.value}
												value={option.value}
												className="w-full">
												<Radio.Content
													className={cn(
														"group relative flex w-full flex-col items-start justify-start gap-2.5 rounded-xl border border-transparent bg-default-soft p-4 transition-all hover:bg-default cursor-pointer text-left h-full",
														"data-[selected=true]:border-accent data-[selected=true]:bg-accent-soft/10",
													)}>
													<Radio.Control className="absolute top-3 right-4 size-4">
														<Radio.Indicator />
													</Radio.Control>
													<IconComponent className="size-5 text-default-500 group-data-[selected=true]:text-accent" />
													<div className="flex flex-col gap-1 pr-4">
														<span className="text-sm font-semibold text-foreground">
															{option.title}
														</span>
														<Description className="text-xs text-default-400 font-normal leading-relaxed">
															{option.description}
														</Description>
													</div>
												</Radio.Content>
											</Radio>
										);
									})}
								</div>
								{errors.visibility && (
									<FieldError>{errors.visibility.message}</FieldError>
								)}
							</RadioGroup>
						)}
					/>

					<div className="flex justify-end pt-2">
						<ActionButton
							type="submit"
							variant="primary"
							isDisabled={!isDirty || updateFlag.isPending}
							isPending={updateFlag.isPending}>
							Update Settings
						</ActionButton>
					</div>
				</Form>
			</Card>

			{/* Lifecycle and Danger Zone Card */}
			<Card className="border border-danger/30 bg-danger-soft/5 shadow-sm rounded-3xl p-6">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-base font-semibold text-danger flex items-center gap-2">
							<ShieldWarningIcon className="size-5" />
							Flag Lifecycle & Danger Zone
						</h2>
						<p className="text-default-500 mt-1">
							Manage the status and lifecycle of this flag in environment:{" "}
							<span className="font-semibold text-foreground">
								{currentEnv?.name}
							</span>
							.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Chip
							variant="soft"
							color={getStatusColor(currentStatus)}
							className="capitalize font-semibold">
							{currentStatus}
						</Chip>
						<Tooltip delay={0}>
							<Tooltip.Trigger>
								<QuestionIcon />
							</Tooltip.Trigger>
							<Tooltip.Content showArrow>
								<Tooltip.Arrow />
								<div className="grid grid-cols-[max-content_1fr] items-start gap-x-2 gap-y-3 text-sm">
									<Chip variant="soft" color="warning" className="size-fit">
										Draft
									</Chip>
									<span className="break-normal text-wrap">
										The flag is inactive and ignored by SDKs. Safe to test in
										the simulator.
									</span>
									<Chip variant="soft" color="success" className="size-fit">
										Active
									</Chip>
									<span className="break-normal text-wrap">
										The flag is live. Targeting rules and default variations are
										evaluated in real-time.
									</span>
									<Chip variant="soft" color="default" className="size-fit">
										Archived
									</Chip>
									<span className="break-normal text-wrap">
										The flag is retired. SDKs immediately receive the
										off-fallback variation.
									</span>
								</div>
							</Tooltip.Content>
						</Tooltip>
					</div>
				</div>

				<div className="space-y-6">
					<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
						<div>
							<p className="text-sm font-semibold text-foreground">
								Environment Status Actions
							</p>
							<p className="text-default-500">
								Transition flag state in the current environment.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							{currentStatus === "draft" && (
								<Button
									variant="primary"
									onPress={() => handleStatusTransition("active")}
									isPending={updateFlagState.isPending}
									className="gap-2">
									<CheckCircleIcon className="size-4" />
									Activate Flag
								</Button>
							)}

							{currentStatus === "active" && (
								<Button
									variant="danger-soft"
									onPress={() => handleStatusTransition("archived")}
									isPending={updateFlagState.isPending}
									className="gap-2">
									<ArchiveIcon className="size-4" />
									Archive Flag
								</Button>
							)}

							{currentStatus === "archived" && (
								<Button
									variant="outline"
									onPress={() => handleStatusTransition("draft")}
									isPending={updateFlagState.isPending}
									className="gap-2">
									<ArrowClockwiseIcon className="size-4" />
									Restore to Draft
								</Button>
							)}
						</div>
					</div>
					<Separator />
					<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
						<div>
							<p className="text-sm font-semibold text-danger">
								Delete Feature Flag
							</p>
							<p className="text-default-500">
								Permanently delete this flag and all configs globally from all
								environments.
							</p>
						</div>
						<Button
							variant="danger"
							onPress={() => setIsDeleteOpen(true)}
							className="gap-2">
							<TrashIcon className="size-4" />
							Delete Globally
						</Button>
					</div>
				</div>
			</Card>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onOpenChange={setIsDeleteOpen}
				title="Delete Feature Flag Globally"
				description={`This action is permanent and cannot be undone. This will permanently delete the feature flag "${flag.name}" (${flag.key}) across ALL environments.`}
				variant="danger"
				confirmText="Delete Globally"
				requireRetypeContent={flag.key}
				retypeLabel={`Type "${flag.key}" to confirm global deletion:`}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
