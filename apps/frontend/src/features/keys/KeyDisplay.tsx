"use client";

import { useState } from "react";
import { Modal, Button, Input, Alert, Chip } from "@heroui/react";
import {
	EyeIcon,
	EyeSlashIcon,
} from "@phosphor-icons/react";
import type { CreateSdkKeyResponse } from "./api";
import CopyButton from "#/components/ui/copy-button";

interface KeyDisplayProps {
	isOpen: boolean;
	onClose: () => void;
	createdKey: CreateSdkKeyResponse | null;
}

export function KeyDisplay({ isOpen, onClose, createdKey }: KeyDisplayProps) {
	const [revealed, setRevealed] = useState(false);

	if (!createdKey) return null;

	return (
		<Modal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop>
				<Modal.Container size="lg">
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>SDK Key Created</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="space-y-4">
							<Alert
								status="warning"
								className="border border-warning bg-warning-soft/10">
								<Alert.Indicator />
								<Alert.Content>
									<Alert.Title>
										This is the only time you will see the raw key value.
									</Alert.Title>
									<Alert.Description>
										Copy and store it securely. After closing this dialog, the
										raw key cannot be retrieved.
									</Alert.Description>
								</Alert.Content>
							</Alert>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm">Key name</span>
									<span className="font-medium">{createdKey.name}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Type</span>
									<Chip
										color={
											createdKey.type === "server"
												? "warning"
												: createdKey.type === "client"
													? "accent"
													: "default"
										}
										variant="soft">
										{createdKey.type}
									</Chip>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Key ID</span>
									<code className="rounded px-2 py-1 text-xs">
										{createdKey.id}
									</code>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm">Raw key</span>
									<div className="flex gap-1">
										<Button
											isIconOnly
											size="sm"
											variant="ghost"
											onPress={() => setRevealed(!revealed)}>
											{revealed ? (
												<EyeSlashIcon className="h-4 w-4" />
											) : (
												<EyeIcon className="h-4 w-4" />
											)}
										</Button>
										<CopyButton text={createdKey.rawKey} />
									</div>
								</div>
								<Input
									variant="secondary"
									fullWidth
									readOnly
									value={createdKey.rawKey}
									type={revealed ? "text" : "password"}
								/>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="primary" onPress={onClose}>
								I have saved my key
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal.Root>
	);
}
