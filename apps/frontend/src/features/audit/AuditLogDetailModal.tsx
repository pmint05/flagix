import { lazy, Suspense } from "react";
import { Button, Chip, Modal, Spinner, Surface } from "@heroui/react";
import { useThemeStore } from "@/stores";
import { format } from "date-fns";
import type { AuditLog } from "@/types/audit-log";
import { getActionStyle, sanitizeDiffObject } from "./columns";
import UserAvatar from "#/components/user/user-avatar";
import { formatDate } from "#/lib/date";

const LazyDiffEditor = lazy(() =>
	import("@monaco-editor/react").then((m) => ({ default: m.DiffEditor })),
);

interface AuditLogDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	log: AuditLog | null;
}

export function AuditLogDetailModal({
	isOpen,
	onClose,
	log,
}: AuditLogDetailModalProps) {
	const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
	const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

	return (
		<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop>
				<Modal.Container size="cover">
					<Modal.Dialog className="flex flex-col h-[calc(100vh-80px)] max-h-none">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Audit Log Entry Details</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="overflow-y-auto flex-1 min-h-0 space-y-6">
							{log && (
								<Surface className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0 pb-4">
									{/* Left Metadata Pane */}
									<div className="lg:col-span-1 space-y-4 p-5 rounded-3xl border overflow-y-auto">
										<div>
											<h3 className="text-xs font-semibold uppercase tracking-wider">
												Timestamp
											</h3>
											<p className="text-sm font-medium mt-0.5 text-foreground">
												{formatDate(new Date(log.timestamp))}
											</p>
										</div>

										<div>
											<div className="flex items-center gap-2">
												<h3 className="text-xs font-semibold uppercase tracking-wider">
													Actor
												</h3>
												<Chip variant="soft" className="uppercase">
													{log.actorType}
												</Chip>
											</div>
											<div className="flex items-center gap-2">
												<UserAvatar
													user={{
														name: log.actorName || log.actorEmail || "System",
														email: log.actorEmail || "",
													}}
													size="sm"
												/>
												<div>
													<p className="text-sm font-medium mt-0.5 text-foreground">
														{log.actorName || "System"}
													</p>
													{log.actorEmail && (
														<p className="text-xs font-mono mt-0.5">
															{log.actorEmail}
														</p>
													)}
												</div>
											</div>
										</div>

										<div>
											<h3 className="text-xs font-semibold uppercase tracking-wider">
												Action Type
											</h3>
											<div className="mt-1">
												<Chip
													size="md"
													color={getActionStyle(log.actionType).color}
													variant="secondary">
													{log.actionType}
												</Chip>
											</div>
										</div>

										<div>
											<div className="flex items-center gap-2">
												<h3 className="text-xs font-semibold uppercase tracking-wider">
													Target Entity
												</h3>
												<Chip variant="soft" className="uppercase">
													{log.entityType.replace("_", " ")}
												</Chip>
											</div>
											<p className="text-sm font-medium mt-0.5 text-foreground">
												{log.flagKey ||
													log.projectName ||
													log.environmentName ||
													"—"}
											</p>
											{log.entityId && (
												<p className="text-xs font-mono mt-0.5">
													ID: {log.entityId}
												</p>
											)}
										</div>

										{log.description && (
											<div>
												<h3 className="text-xs font-semibold uppercase tracking-wider">
													Description
												</h3>
												<p className="text-sm mt-0.5 whitespace-pre-wrap">
													{log.description}
												</p>
											</div>
										)}

										<div className="border-t pt-4 space-y-4">
											<div>
												<h3 className="text-xs font-semibold uppercase tracking-wider">
													Source
												</h3>
												<span className="text-xs text-default-700 capitalize">
													{log.source || "—"}
												</span>
											</div>
											<div>
												<h3 className="text-xs font-semibold uppercase tracking-wider">
													IP Address
												</h3>
												<span className="text-xs text-default-700 font-mono">
													{log.actorIp || "—"}
												</span>
											</div>
											<div>
												<h3 className="text-xs font-semibold uppercase tracking-wider">
													HTTP Request
												</h3>
												{log.requestMethod ? (
													<div className="flex items-center gap-1.5 mt-0.5">
														<span className="text-xs font-mono font-bold text-primary">
															{log.requestMethod}
														</span>
														<span
															className="text-xs font-mono truncate"
															title={log.requestPath || ""}>
															{log.requestPath}
														</span>
													</div>
												) : (
													"—"
												)}
											</div>
											{log.userAgent && (
												<div>
													<h3 className="text-xs font-semibold uppercase tracking-wider">
														User Agent
													</h3>
													<p
														className="text-[11px] font-mono break-all mt-1 leading-relaxed"
														title={log.userAgent}>
														{log.userAgent}
													</p>
												</div>
											)}
										</div>
									</div>

									{/* Right Diff Pane */}
									<div className="lg:col-span-2 flex flex-col h-full min-h-0 rounded-3xl border overflow-hidden">
										<div className="px-4 py-3 border-b flex items-center justify-between">
											<span className="text-xs font-semibold uppercase tracking-wider">
												Changes (Before vs After)
											</span>
										</div>
										<div className="flex-1 min-h-0 relative">
											{log.changes ? (
												<Suspense
													fallback={
														<div className="flex flex-col items-center justify-center h-full gap-3">
															<Spinner size="lg" />
														</div>
													}>
													<LazyDiffEditor
														height="100%"
														original={JSON.stringify(
															sanitizeDiffObject(
																(log.changes as any).before || {},
															),
															null,
															2,
														)}
														modified={JSON.stringify(
															sanitizeDiffObject(
																(log.changes as any).after || {},
															),
															null,
															2,
														)}
														language="json"
														theme={monacoTheme}
														options={{
															readOnly: true,
															renderSideBySide: true,
															minimap: { enabled: false },
															scrollBeyondLastLine: false,
															wordWrap: "on",
															automaticLayout: true,
														}}
													/>
												</Suspense>
											) : (
												<div className="flex items-center justify-center h-full text-sm">
													No state changes recorded for this action
												</div>
											)}
										</div>
									</div>
								</Surface>
							)}
						</Modal.Body>
						<Modal.Footer>
							<Button slot="close" variant="outline">
								Close
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
