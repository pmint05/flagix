import React from "react";
import { Card, cn } from "@heroui/react";
// Import type chung của Phosphor Icons để ép kiểu chuẩn chỉnh
import {
	ArrowDownIcon,
	ArrowUpIcon,
	type IconProps,
} from "@phosphor-icons/react";

export interface StatCardProps {
	title: string;
	value: string | number;
	// Định nghĩa icon là một React Component nhận các thuộc tính của Phosphor
	icon: React.ComponentType<IconProps>;
	iconClassName?: string;
	className?: string;
	trend?: {
		value: number;
		isPositive: boolean;
		label?: string;
	};
}

export function StatCard({
	title,
	value,
	icon: Icon, // Viết hoa để Render như một Component
	iconClassName,
	className,
	trend,
}: StatCardProps) {
	return (
		<Card className={cn("p-0", "rounded-3xl", className)}>
			<Card.Content className="flex flex-row items-center justify-between p-5 gap-4 overflow-hidden">
				<div className="flex flex-col gap-1">
					<p className="text-xs font-semibold uppercase tracking-wider">
						{title}
					</p>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-bold tracking-tight text-foreground">
							{value}
						</span>
						{trend && (
							<span
								className={cn(
									"text-xs font-bold px-1.5 py-0.5 rounded-md",
									trend.isPositive
										? "text-success bg-success-soft"
										: "text-danger bg-danger-soft",
								)}>
								{trend.isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}{" "}
								{Math.abs(trend.value)}%
							</span>
						)}
					</div>
					{trend?.label && <p className="text-tiny">{trend.label}</p>}
				</div>

				<div
					className={cn(
						"flex items-center justify-center p-3 rounded-3xl",
						iconClassName,
					)}>
					<Icon size={24} weight="regular" />
				</div>
			</Card.Content>
		</Card>
	);
}
