"use client";

import { useState } from "react";
import { Modal, Button } from "@heroui/react";
import { useForm } from "react-hook-form";
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

export function KeyModal({ isOpen, onClose, onSubmit, isLoading }: KeyModalProps) {
	const [selectedType, setSelectedType] = useState<"client" | "server">("client");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateSdkKeyInput>({
		resolver: zodResolver(createSdkKeyFormSchema),
		defaultValues: { name: "", type: "client" },
	});

	const handleFormSubmit = (data: CreateSdkKeyInput) => {
		onSubmit({ ...data, type: selectedType });
	};

	return (
		<Modal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop />
			<Modal.Container>
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>Generate SDK Key</Modal.Heading>
					</Modal.Header>
					<form onSubmit={handleSubmit(handleFormSubmit)}>
						<Modal.Body>
							<div className="space-y-2">
								<label className="text-sm font-medium">Key Name</label>
								<input
									type="text"
									className="w-full rounded-lg border border-default-300 bg-transparent px-3 py-2 text-sm"
									placeholder="e.g. production-web-sdk"
									{...register("name")}
								/>
								{errors.name && (
									<p className="text-sm text-danger">{errors.name.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Key Type</label>
								<div className="flex gap-3">
									<button
										type="button"
										className={`flex-1 rounded-lg border p-3 text-left transition ${
											selectedType === "client"
												? "border-primary bg-primary-50"
												: "border-default-300 hover:border-default-400"
										}`}
										onClick={() => setSelectedType("client")}
									>
										<div className="font-medium">Client</div>
										<div className="mt-1 text-xs">
											Public, safe for browser/mobile
										</div>
									</button>
									<button
										type="button"
										className={`flex-1 rounded-lg border p-3 text-left transition ${
											selectedType === "server"
												? "border-primary bg-primary-50"
												: "border-default-300 hover:border-default-400"
										}`}
										onClick={() => setSelectedType("server")}
									>
										<div className="font-medium">Server</div>
										<div className="mt-1 text-xs">
											Secret, backend only
										</div>
									</button>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={onClose}>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="primary"
								isDisabled={isLoading}
							>
								{isLoading ? "Generating..." : "Generate"}
							</Button>
						</Modal.Footer>
					</form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Root>
	);
}
