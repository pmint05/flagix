import { useRef, useCallback } from "react";
import { Separator } from "react-resizable-panels";
import { useSidebarStore } from "#/stores";

export function SidebarResizeHandle() {
	const toggleCollapse = useSidebarStore((s) => s.toggleCollapse);

	return (
		<Separator className="sidebar-resize-handle group">
			<div
				onDoubleClick={toggleCollapse}
				className="absolute inset-y-0 -left-1 -right-1 z-10 cursor-col-resize flex items-center justify-center">
				<div className="w-0.5 h-6 bg-border-secondary group-hover:bg-default rounded transition" />
			</div>
		</Separator>
	);
}
