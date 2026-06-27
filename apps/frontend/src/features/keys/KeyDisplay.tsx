"use client";

import { useState } from "react";
import { Modal, Button } from "@heroui/react";
import {
	CheckIcon,
	CopyIcon,
	EyeIcon,
	EyeSlashIcon,
	WarningIcon,
} from "@phosphor-icons/react";
import type { CreateSdkKeyResponse } from "./api";

interface KeyDisplayProps {
	isOpen: boolean;
	onClose: () => void;
	createdKey: CreateSdkKeyResponse | null;
}

export function KeyDisplay({ isOpen, onClose, createdKey }: KeyDisplayProps) {
	const [copied, setCopied] = useState(false);
	const [revealed, setRevealed] = useState(false);

	if (!createdKey) return null;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(createdKey.rawKey);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Modal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop />
			<Modal.Container>
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>SDK Key Created</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<div className="rounded-lg border border-warning-300 bg-warning-50 p-4">
							<div className="flex items-start gap-3">
								<WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
								<div className="text-sm text-warning-700">
									<p className="font-semibold">
										This is the only time you will see the raw key value.
									</p>
									<p className="mt-1">
										Copy and store it securely. After closing this dialog, the
										raw key cannot be retrieved.
									</p>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">Key name</span>
								<span className="font-medium">{createdKey.name}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Type</span>
								<span className="rounded-full px-3 py-1 text-xs font-medium">
									{createdKey.type}
								</span>
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
									<Button
										isIconOnly
										size="sm"
										variant="ghost"
										onPress={handleCopy}>
										{copied ? (
											<CheckIcon className="h-4 w-4 text-success" />
										) : (
											<CopyIcon className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
							<div className="rounded-lg p-3 font-mono text-sm">
								{revealed
									? createdKey.rawKey
									: "••••••••••••••••••••••••••••••••"}
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="primary" onPress={onClose}>
							I have saved my key
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Root>
	);
}
