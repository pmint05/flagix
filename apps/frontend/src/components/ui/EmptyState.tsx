import { Button } from "@heroui/react";
import { type ReactNode } from "react";

export interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	actionVariant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "danger-soft" | "tertiary";
}

export function EmptyState({
	icon,
	title,
	description,
	actionLabel,
	onAction,
	actionVariant = "secondary",
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
			{icon && (
				<div className="text-default [&_svg]:h-12 [&_svg]:w-12">{icon}</div>
			)}
			<div className="space-y-1">
				<h3 className="text-lg font-medium text-default-foreground">{title}</h3>
				{description && (
					<p className="text-sm">{description}</p>
				)}
			</div>
			{actionLabel && onAction && (
				<Button variant={actionVariant} onPress={onAction}>
					{actionLabel}
				</Button>
			)}
		</div>
	);
}
