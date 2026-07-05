"use client";

import { useEffect } from "react";
import {
	Modal,
	Button,
	Form,
	TextField,
	Label,
	Input,
	FieldError,
	RadioGroup,
	Radio,
	Description,
	cn,
} from "@heroui/react";
import { BrowserIcon, TerminalIcon } from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import type { CreateSdkKeyInput } from "./api";

const createSdkKeyFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	type: z.enum(["client", "server"]),
});

const keyTypeOptions = [
	{
		value: "client",
		title: "Client Key",
		description: "Public, safe for browser/mobile applications.",
		icon: BrowserIcon,
	},
	{
		value: "server",
		title: "Server Key",
		description: (
			<>
				Secret, use in backend or secure environments. Key shown{" "}
				<strong>ONLY ONCE</strong> upon creation.
			</>
		),
		icon: TerminalIcon,
	},
] as const;

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
		resolver: standardSchemaResolver(createSdkKeyFormSchema),
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
		<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Generate SDK Key</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<Form
								onSubmit={handleSubmit(handleFormSubmit)}
								className="space-y-6">
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
											className="w-full">
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
										<RadioGroup
											value={field.value}
											onChange={field.onChange}
											variant="secondary"
											className="w-full">
											<div className="flex flex-wrap items-center justify-between gap-4">
												<Label>Key Type</Label>
											</div>
											<div className="grid gap-3 md:grid-cols-2">
												{keyTypeOptions.map((option) => {
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
																<IconComponent className="size-5 group-data-[selected=true]:text-accent" />
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
											{errors.type && (
												<FieldError>{errors.type.message}</FieldError>
											)}
										</RadioGroup>
									)}
								/>

								<Modal.Footer className="pt-4 border-t border-divider">
									<Button variant="outline" onPress={onClose}>
										Cancel
									</Button>
									<Button
										type="submit"
										variant="primary"
										isDisabled={isLoading}>
										{isLoading ? "Generating..." : "Generate"}
									</Button>
								</Modal.Footer>
							</Form>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
