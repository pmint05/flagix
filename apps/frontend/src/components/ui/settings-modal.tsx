import { Button, Modal, type ModalProps, cn } from "@heroui/react";
import React, { useState } from "react";

export interface SettingsTab {
	id: string;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	content: React.ReactNode;
}

export interface BaseSettingsModalProps extends Omit<ModalProps, "children"> {
	title: string;
	description?: string;
	tabs: SettingsTab[];
	isOpen: boolean;
	onClose: () => void;
}

export function BaseSettingsModal({
	title,
	description,
	tabs,
	isOpen,
	onClose,
	...props
}: BaseSettingsModalProps) {
	const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || "");

	const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

	// Reset to first tab when opening
	React.useEffect(() => {
		if (isOpen && tabs.length > 0) {
			setActiveTabId(tabs[0].id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={(open) => !open && onClose()}
			{...props}>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog className="max-w-4xl min-h-[50vh] flex flex-col p-0 overflow-hidden">
						<Modal.CloseTrigger />

						{/* Header */}
						<div className="px-6 py-4 border-b shrink-0">
							<Modal.Heading className="text-xl font-bold text-foreground">
								{title}
							</Modal.Heading>
							{description && (
								<p className="text-xs text-default-400 mt-0.5">{description}</p>
							)}
						</div>

						{/* Main Content Layout */}
						<div className="flex flex-1 overflow-hidden">
							{/* Sidebar - Tabs List */}
							<div className="w-56 border-r p-3 flex flex-col gap-1 shrink-0 overflow-y-auto">
								{tabs.map((tab) => {
									const Icon = tab.icon;
									const isActive = tab.id === activeTabId;
									return (
										<Button
											key={tab.id}
											onClick={() => setActiveTabId(tab.id)}
											variant={isActive ? "secondary" : "ghost"}
											fullWidth
											className={cn("justify-start gap-2")}>
											{Icon && (
												<Icon
													className={cn(
														"size-4 shrink-0",
														isActive
															? "text-primary-foreground"
															: "text-default-400 group-hover:text-foreground",
													)}
												/>
											)}
											{tab.label}
										</Button>
									);
								})}
							</div>

							{/* Tab Content Panel */}
							<div className="flex-1 p-6 overflow-y-auto bg-surface">
								{activeTab?.content}
							</div>
						</div>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
