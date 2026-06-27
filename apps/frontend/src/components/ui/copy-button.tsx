import { Button, cn, Tooltip } from "@heroui/react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useState, useRef } from "react";

interface CopyButtonProps {
	text: string;
	className?: string;
	timeout?: number;
	showLabel?: boolean;
	onCopy?: () => void;
	buttonProps?: React.ComponentProps<typeof Button>;
}

const CopyButton: React.FC<CopyButtonProps> = ({
	text,
	className,
	onCopy,
	timeout = 1000,
	showLabel = false,
	buttonProps,
}) => {
	const [copied, setCopied] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const handleCopy = () => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		if (onCopy) onCopy();

		if (timerRef.current) clearTimeout(timerRef.current);

		timerRef.current = setTimeout(() => {
			setCopied(false);
		}, timeout);
	};

	return (
		<Tooltip
			isOpen={copied && !showLabel}
			onOpenChange={(open) => !copied && open && setCopied(false)}>
			<Tooltip.Trigger>
				<Button
					onClick={handleCopy}
					className={cn("flex items-center gap-2", className)}
					variant="ghost"
					size="sm"
					{...buttonProps}>
					{showLabel && (
						<div className="grid grid-cols-1 grid-rows-1 place-items-center min-w-0">
							<span
								className={cn(
									"col-start-1 row-start-1 transition-all duration-200 transform text-center whitespace-nowrap",
									copied
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-2 pointer-events-none",
								)}>
								Copied!
							</span>
							<span
								className={cn(
									"col-start-1 row-start-1 transition-all duration-200 transform text-center whitespace-nowrap",
									copied
										? "opacity-0 -translate-y-2 pointer-events-none"
										: "opacity-100 translate-y-0",
								)}>
								Copy
							</span>
						</div>
					)}

					<div className="relative size-4 flex items-center justify-center shrink-0">
						<CheckIcon
							className={cn("size-4 absolute transition-all duration-200", {
								"opacity-0 scale-75 pointer-events-none": !copied,
								"opacity-100 scale-100": copied,
							})}
						/>
						<CopyIcon
							className={cn("size-4 absolute transition-all duration-200", {
								"opacity-0 scale-75 pointer-events-none": copied,
								"opacity-100 scale-100": !copied,
							})}
						/>
					</div>
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>Copied!</p>
			</Tooltip.Content>
		</Tooltip>
	);
};

export default CopyButton;
