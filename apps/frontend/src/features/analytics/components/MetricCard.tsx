import { Card, Skeleton } from "@heroui/react";

interface MetricCardProps {
	label: string;
	value: string;
	subtitle?: string;
	variant?: "default" | "danger" | "success";
	isLoading?: boolean;
}

const variantClasses = {
	default: "text-foreground",
	danger: "text-danger",
	success: "text-success",
};

export function MetricCard({
	label,
	value,
	subtitle,
	variant = "default",
	isLoading,
}: MetricCardProps) {
	if (isLoading) {
		return (
			<Card className="p-4">
				<Skeleton className="h-3 w-20 rounded mb-2" />
				<Skeleton className="h-6 w-24 rounded" />
			</Card>
		);
	}

	return (
		<Card className="p-4">
			<p className="text-xs text-default-400 uppercase tracking-wide">
				{label}
			</p>
			<p className={`text-2xl font-bold mt-1 ${variantClasses[variant]}`}>
				{value}
			</p>
			{subtitle && <p className="text-xs text-default-400 mt-1">{subtitle}</p>}
		</Card>
	);
}
