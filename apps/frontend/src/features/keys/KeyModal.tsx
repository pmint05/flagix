"use client";

import { useEffect } from "react";
import { Drawer, Button, Form, TextField, Label, Input, FieldError } from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CreateSdkKeyInput } from "./api";

const createSdkKeyFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	type: z.enum(["client", "server"]),
});

interface KeyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: CreateSdkKeyInput) => void;
	isLoading?: boolean;
}

export function KeyModal({
	isOpen,
	onClose,
	onSubmit,
	isLoading,
}: KeyModalProps) {
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CreateSdkKeyInput>({
		resolver: zodResolver(createSdkKeyFormSchema),
		defaultValues: { name: "", type: "client" },
	});

	// Reset form values when modal opens or closes
	useEffect(() => {
		if (isOpen) {
			reset({ name: "", type: "client" });
		}
	}, [isOpen, reset]);

	const handleFormSubmit = (data: CreateSdkKeyInput) => {
		onSubmit(data);
	};

	return (
		<Drawer isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Drawer.Backdrop>
				<Drawer.Content placement="right">
					<Drawer.Dialog>
						<Drawer.Header>
							<Drawer.Heading>
								Generate SDK Key
								<Drawer.CloseTrigger />
							</Drawer.Heading>
						</Drawer.Header>
						<Drawer.Body>
							<Form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
											className="w-full"
										>
											<Label>Key Name</Label>
											<Input placeholder="e.g. production-web-sdk" />
											{errors.name && (
												<FieldError>{errors.name.message}</FieldError>
											)}
										</TextField>
									)}
								/>

								<Controller
									name="type"
									control={control}
									render={({ field }) => (
										<div className="space-y-2">
											<span className="text-sm font-semibold text-foreground/80">Key Type</span>
											<div className="flex gap-3">
												<button
													type="button"
													className={`flex-1 rounded-2xl border p-4 text-left transition text-sm ${
														field.value === "client"
															? "border-primary bg-primary-soft/10 text-primary font-medium"
															: "border-divider bg-background-secondary text-default-600 hover:border-default"
													}`}
													onClick={() => field.onChange("client")}
												>
													<div className="font-bold text-foreground">Client</div>
													<div className="mt-1 text-xs text-default-500 font-normal">
														Public, safe for browser/mobile applications.
													</div>
												</button>
												<button
													type="button"
													className={`flex-1 rounded-2xl border p-4 text-left transition text-sm ${
														field.value === "server"
															? "border-primary bg-primary-soft/10 text-primary font-medium"
															: "border-divider bg-background-secondary text-default-600 hover:border-default"
													}`}
													onClick={() => field.onChange("server")}
												>
													<div className="font-bold text-foreground">Server</div>
													<div className="mt-1 text-xs text-default-500 font-normal">
														Secret, use in backend or secure environments only.
													</div>
												</button>
											</div>
											{errors.type && (
												<p className="text-xs text-danger mt-1">{errors.type.message}</p>
											)}
										</div>
									)}
								/>

								<Drawer.Footer className="pt-4 border-t border-divider">
									<Button variant="outline" onPress={onClose}>
										Cancel
									</Button>
									<Button type="submit" variant="primary" isDisabled={isLoading}>
										{isLoading ? "Generating..." : "Generate"}
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
