"use client";

import {
	cn,
	Modal,
	type ModalProps,
	TextField,
	Label,
	InputGroup,
} from "@heroui/react";
import {
	CheckCircleIcon,
	WarningIcon,
	InfoIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import React from "react";
import { ActionButton } from "./action-button";

export type ConfirmModalVariant =
	| "success"
	| "warning"
	| "info"
	| "danger"
	| "default";

export interface ConfirmModalProps extends Omit<ModalProps, "children"> {
	title: React.ReactNode;
	description?: React.ReactNode;
	children?: React.ReactNode;
	variant?: ConfirmModalVariant;
	onConfirm: () => Promise<void> | void;
	onCancel?: () => void;
	confirmText?: React.ReactNode;
	cancelText?: React.ReactNode;
	showToast?: boolean;
	toastTitle?: React.ReactNode;
	toastMessage?: React.ReactNode;
	requireRetypeContent?: string;
	retypeLabel?: string;
}

const VARIANT_CONFIG = {
	success: {
		icon: CheckCircleIcon,
		iconColor: "text-success",
		iconBg: "bg-success-soft",
		buttonVariant: "primary",
	},
	warning: {
		icon: WarningIcon,
		iconColor: "text-warning",
		iconBg: "bg-warning-soft",
		buttonVariant: "primary",
	},
	info: {
		icon: InfoIcon,
		iconColor: "text-primary",
		iconBg: "bg-primary-soft",
		buttonVariant: "primary",
	},
	danger: {
		icon: WarningCircleIcon,
		iconColor: "text-danger",
		iconBg: "bg-danger-soft",
		buttonVariant: "danger",
	},
	default: {
		icon: null,
		iconColor: "",
		iconBg: "",
		buttonVariant: "primary",
	},
} as const;

export function ConfirmModal({
	title,
	description,
	children,
	variant = "default",
	onConfirm,
	onCancel,
	confirmText = "Confirm",
	cancelText = "Cancel",
	isOpen,
	onOpenChange,
	showToast,
	toastTitle,
	toastMessage,
	requireRetypeContent,
	retypeLabel,
	...props
}: ConfirmModalProps) {
	const config = VARIANT_CONFIG[variant];
	const Icon = config.icon;

	// Freeze dynamic content during exit animation to prevent "undefined" flashes
	const contentRef = React.useRef({
		title,
		description,
		children,
		toastTitle,
		toastMessage,
		requireRetypeContent,
		retypeLabel,
	});
	React.useEffect(() => {
		if (isOpen) {
			contentRef.current = {
				title,
				description,
				children,
				toastTitle,
				toastMessage,
				requireRetypeContent,
				retypeLabel,
			};
		}
	}, [
		isOpen,
		title,
		description,
		children,
		toastTitle,
		toastMessage,
		requireRetypeContent,
		retypeLabel,
	]);

	const display = isOpen
		? {
				title,
				description,
				children,
				toastTitle,
				toastMessage,
				requireRetypeContent,
				retypeLabel,
			}
		: contentRef.current;

	const [retypeValue, setRetypeValue] = React.useState("");

	React.useEffect(() => {
		if (isOpen) {
			setRetypeValue("");
		}
	}, [isOpen]);

	const isRetypeValid =
		!display.requireRetypeContent ||
		retypeValue === display.requireRetypeContent;

	const handleOpenChange = (open: boolean) => {
		if (!open && onCancel) {
			onCancel();
		}
		onOpenChange?.(open);
	};

	const handleConfirm = async () => {
		await onConfirm();
		onOpenChange?.(false);
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={handleOpenChange} {...props}>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.CloseTrigger />
						<Modal.Header>
							{Icon && (
								<Modal.Icon className={cn(config.iconBg)}>
									<Icon
										className={`w-6 h-6 ${config.iconColor}`}
										weight="fill"
									/>
								</Modal.Icon>
							)}
							<Modal.Heading>{display.title}</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							{display.description && (
								<p className="text-default-foreground">{display.description}</p>
							)}
							{display.children}
							{display.requireRetypeContent && (
								<TextField className="w-full mt-3" variant="primary">
									<Label className="font-medium mb-1.5 block">
										{display.retypeLabel ||
											`Type "${display.requireRetypeContent}" to confirm`}
									</Label>
									<InputGroup variant="secondary">
										<InputGroup.Input
											value={retypeValue}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setRetypeValue(e.target.value)
											}
											placeholder={display.requireRetypeContent}
											className="w-full"
										/>
									</InputGroup>
								</TextField>
							)}
						</Modal.Body>
						<Modal.Footer>
							<ActionButton
								variant="outline"
								onPress={() => handleOpenChange(false)}>
								{cancelText}
							</ActionButton>
							<ActionButton
								variant={config.buttonVariant as any}
								action={handleConfirm}
								showToast={showToast}
								toastTitle={display.toastTitle}
								toastMessage={display.toastMessage}
								isDisabled={!isRetypeValid}>
								{confirmText}
							</ActionButton>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
