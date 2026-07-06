import { useEffect, useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { XIcon, ShuffleIcon, CaretDownIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { JsonEditor } from "@/components/ui/json-editor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CONTEXT_PRESETS } from "@/lib/constants";
import type { EvaluationContext } from "@flagix/sdk-core";

export type ContextFormValues = z.infer<typeof contextFormSchema>;

const contextFormSchema = z.object({
	sdkKey: z.string().min(10, "SDK Key must be at least 10 characters"),
	baseUrl: z.string().url("Must be a valid URL"),
	userId: z.string().min(1, "User ID is required"),
	role: z.string().optional(),
	customAttributesJson: z.string(),
});

interface ContextPanelProps {
	onClose: () => void;
	sdkKey: string;
	baseUrl: string;
	activeContext: EvaluationContext;
	onApply: (
		sdkKey: string,
		baseUrl: string,
		context: EvaluationContext,
	) => void;
}

function CollapsibleSection({
	title,
	defaultOpen = true,
	children,
}: {
	title: string;
	defaultOpen?: boolean;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="border-b border-border last:border-b-0">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
				{title}
				<motion.span
					animate={{ rotate: open ? 0 : -90 }}
					transition={{ duration: 0.15 }}>
					<CaretDownIcon className="h-3.5 w-3.5" weight="bold" />
				</motion.span>
			</button>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden">
						<div className="px-5 pb-5">{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export function ContextPanel({
	onClose,
	sdkKey,
	baseUrl,
	activeContext,
	onApply,
}: ContextPanelProps) {
	const {
		register,
		handleSubmit,
		setValue,
		control,
		formState: { errors },
	} = useForm<ContextFormValues>({
		defaultValues: {
			sdkKey,
			baseUrl,
			userId: activeContext.userId || "",
			role: activeContext.role || "",
			customAttributesJson: activeContext.attributes
				? JSON.stringify(activeContext.attributes, null, 2)
				: "{}",
		},
	});

	useEffect(() => {
		setValue("sdkKey", sdkKey);
		setValue("baseUrl", baseUrl);
		setValue("userId", activeContext.userId || "");
		setValue("role", activeContext.role || "");
		setValue(
			"customAttributesJson",
			activeContext.attributes
				? JSON.stringify(activeContext.attributes, null, 2)
				: "{}",
		);
	}, [sdkKey, baseUrl, activeContext, setValue]);

	const handleApplyPreset = useCallback(
		(preset: (typeof CONTEXT_PRESETS)[number]) => {
			setValue("userId", preset.context.userId || "");
			setValue("role", preset.context.role || "");
			setValue(
				"customAttributesJson",
				preset.context.attributes
					? JSON.stringify(preset.context.attributes, null, 2)
					: "{}",
			);
		},
		[setValue],
	);

	const randomizeUserId = useCallback(() => {
		const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
		const id =
			"user_" +
			Array.from(
				{ length: 8 },
				() => chars[Math.floor(Math.random() * chars.length)],
			).join("");
		setValue("userId", id);
	}, [setValue]);

	const onSubmit = handleSubmit((data) => {
		const attributes = data.customAttributesJson.trim()
			? JSON.parse(data.customAttributesJson)
			: undefined;

		const context: EvaluationContext = {
			userId: data.userId,
			role: data.role || undefined,
			attributes,
		};

		onApply(data.sdkKey, data.baseUrl, context);
	});

	return (
		<>
			{/* Header */}
			<div className="flex items-center justify-between px-5 py-3">
				<span className="text-sm font-semibold">Context Controller</span>
				<button
					onClick={onClose}
					className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground transition-colors hover:text-foreground">
					<XIcon className="h-3 w-3" weight="bold" />
				</button>
			</div>

			{/* Accordion body */}
			<form onSubmit={onSubmit}>
				<div className="max-h-[65vh] overflow-y-auto">
					{/* Presets */}
					<CollapsibleSection title="Context Presets" defaultOpen={false}>
						<div className="grid grid-cols-2 gap-2">
							{CONTEXT_PRESETS.map((preset) => (
								<button
									key={preset.name}
									type="button"
									onClick={() => handleApplyPreset(preset)}
									className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left text-xs transition-colors hover:border-accent/30 hover:bg-accent/5">
									<div className="font-medium">{preset.name}</div>
									<div className="mt-0.5 text-muted-foreground">
										{preset.description}
									</div>
								</button>
							))}
						</div>
					</CollapsibleSection>

					{/* Connection */}
					<CollapsibleSection title="Connection" defaultOpen={false}>
						<div className="space-y-3">
							<div className="space-y-1.5">
								<Label
									htmlFor="sdkKey"
									className="text-xs text-muted-foreground">
									SDK Key
								</Label>
								<Input
									id="sdkKey"
									{...register("sdkKey", {
										validate: (v) => {
											const r = z
												.string()
												.min(10, "Must be at least 10 characters")
												.safeParse(v);
											return r.success ? true : r.error.issues[0].message;
										},
									})}
									placeholder="sdk_client_..."
									className="font-mono text-xs"
								/>
								{errors.sdkKey && (
									<p className="text-xs text-destructive">
										{errors.sdkKey.message}
									</p>
								)}
							</div>
							<div className="space-y-1.5">
								<Label
									htmlFor="baseUrl"
									className="text-xs text-muted-foreground">
									Base API URL
								</Label>
								<Input
									id="baseUrl"
									{...register("baseUrl", {
										validate: (v) => {
											const r = z
												.string()
												.url("Must be a valid URL")
												.safeParse(v);
											return r.success ? true : r.error.issues[0].message;
										},
									})}
									placeholder="http://localhost:9000/api/v1"
									className="font-mono text-xs"
								/>
								{errors.baseUrl && (
									<p className="text-xs text-destructive">
										{errors.baseUrl.message}
									</p>
								)}
							</div>
						</div>
					</CollapsibleSection>

					{/* User Context */}
					<CollapsibleSection title="User Context" defaultOpen={true}>
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label
										htmlFor="userId"
										className="text-xs text-muted-foreground">
										User ID
									</Label>
									<div className="flex gap-1">
										<Input
											id="userId"
											{...register("userId", {
												validate: (v) => {
													const r = z.string().min(1, "Required").safeParse(v);
													return r.success ? true : r.error.issues[0].message;
												},
											})}
											placeholder="user_..."
											className="flex-1 text-xs"
										/>
										<button
											type="button"
											onClick={randomizeUserId}
											title="Randomize for rollout testing"
											className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:text-accent hover:border-accent/30">
											<ShuffleIcon className="h-3.5 w-3.5" weight="bold" />
										</button>
									</div>
									{errors.userId && (
										<p className="text-xs text-destructive">
											{errors.userId.message}
										</p>
									)}
								</div>

								<div className="space-y-1.5">
									<Label
										htmlFor="role"
										className="text-xs text-muted-foreground">
										Role
									</Label>
									<Controller
										control={control}
										name="role"
										render={({ field }) => (
											<Select
												value={field.value || ""}
												onValueChange={(v) =>
													field.onChange(v === "none" ? "" : v)
												}>
												<SelectTrigger className="h-8 w-full text-xs">
													<SelectValue placeholder="None (Visitor)" />
												</SelectTrigger>
												<SelectContent position="popper">
													<SelectItem value="none">None (Visitor)</SelectItem>
													<SelectItem value="guest">Guest</SelectItem>
													<SelectItem value="member">Member</SelectItem>
													<SelectItem value="admin">Admin</SelectItem>
													<SelectItem value="developer">Developer</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor="customAttributesJson"
									className="text-xs text-muted-foreground">
									Custom Attributes (JSON)
								</Label>
								<Controller
									control={control}
									name="customAttributesJson"
									rules={{
										validate: (v) => {
											if (!v.trim()) return true;
											try {
												const parsed = JSON.parse(v);
												if (
													typeof parsed !== "object" ||
													parsed === null ||
													Array.isArray(parsed)
												) {
													return "Must be a valid JSON object";
												}
												return true;
											} catch {
												return "Must be a valid JSON object";
											}
										},
									}}
									render={({ field }) => (
										<JsonEditor
											value={field.value}
											onChange={field.onChange}
											minHeight="100px"
										/>
									)}
								/>
								{errors.customAttributesJson && (
									<p className="text-xs text-destructive">
										{errors.customAttributesJson.message}
									</p>
								)}
							</div>
						</div>
					</CollapsibleSection>
				</div>

				{/* Footer with Apply button */}
				<div className="border-t border-border p-4">
					<Button type="submit" className="w-full">
						Apply Context &amp; Fetch Flags
					</Button>
				</div>
			</form>
		</>
	);
}
