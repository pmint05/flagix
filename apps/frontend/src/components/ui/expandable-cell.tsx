import { useState, useEffect, useRef } from "react";
import { Button } from "@heroui/react";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";

interface ExpandableCellProps {
	text: string | null | undefined;
	maxLines?: number;
	className?: string;
}

export function ExpandableCell({
	text,
	maxLines = 1,
	className,
}: ExpandableCellProps) {
	const [expanded, setExpanded] = useState(false);
	const [overflowing, setOverflowing] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = wrapperRef.current;
		if (!el || expanded) return;

		const check = () => {
			if (
				el.scrollHeight - el.clientHeight > 1 ||
				el.scrollWidth - el.clientWidth > 1
			) {
				setOverflowing(true);
			}
		};

		const observer = new ResizeObserver(check);
		observer.observe(el);
		check();

		return () => observer.disconnect();
	}, [text, expanded]);

	if (!text) return <span className="text-muted text-sm">&mdash;</span>;

	if (expanded) {
		return (
			<div className={`max-w-xs ${className}`}>
				<pre className="text-sm whitespace-pre-wrap font-sans max-h-96 overflow-auto">
					{text}
				</pre>
				<Button
					variant="ghost"
					size="sm"
					className="px-1 h-5 text-xs text-muted hover:text-foreground"
					onPress={() => setExpanded(false)}>
					Thu gọn
					<CaretUpIcon className="size-3" />
				</Button>
			</div>
		);
	}

	// Single-line: collapse newlines, inline button, always show toggle
	if (maxLines === 1) {
		return (
			<div className={`flex items-start gap-1 max-w-xs ${className}`}>
				<pre
					ref={wrapperRef as any}
					className="text-sm font-sans truncate flex-1 min-w-0">
					{text}
				</pre>
				{overflowing && (
					<Button
						variant="ghost"
						size="sm"
						className="shrink-0 px-1 h-5 text-xs text-muted hover:text-foreground"
						onPress={() => setExpanded(true)}>
						Xem thêm
						<CaretDownIcon className="size-3" />
					</Button>
				)}
			</div>
		);
	}

	// Multi-line: line-clamp + button below
	return (
		<>
			{overflowing ? (
				<div>
					<div
						ref={wrapperRef}
						style={{
							display: "-webkit-box",
							WebkitBoxOrient: "vertical",
							WebkitLineClamp: maxLines,
							overflow: "hidden",
						}}>
						<pre className="text-sm whitespace-pre-wrap font-sans">{text}</pre>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="px-1 h-5 text-xs text-muted hover:text-foreground"
						onPress={() => setExpanded(true)}>
						Xem thêm
						<CaretDownIcon className="size-3" />
					</Button>
				</div>
			) : (
				<pre className="text-sm whitespace-pre-wrap font-sans">{text}</pre>
			)}
		</>
	);
}
