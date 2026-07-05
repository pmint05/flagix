"use client";

import { Button, Spinner, toast, type ButtonProps } from "@heroui/react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface ActionButtonProps extends Omit<ButtonProps, "onPress"> {
	action?: () => Promise<void> | void;
	onPress?: ButtonProps["onPress"];
	showToast?: boolean;
	toastTitle?: React.ReactNode;
	toastMessage?: React.ReactNode;
}

export function ActionButton({
	action,
	onPress,
	showToast,
	toastTitle,
	toastMessage,
	isPending: propPending,
	...props
}: ActionButtonProps) {
	const [localPending, setLocalPending] = useState(false);
	const isPending = propPending !== undefined ? propPending : localPending;

	const handlePress = async (e: any) => {
		if (action) {
			setLocalPending(true);
			try {
				await action();
				if (showToast) {
					if (toastTitle) {
						toast.success(toastTitle as string, {
							description: toastMessage as React.ReactNode,
						});
					} else if (toastMessage) {
						toast.success(toastMessage as string);
					} else {
						toast.success("Success");
					}
				}
			} catch (error) {
				if (showToast) {
					toast.danger("An error occurred", {
						description: (error as Error).message,
					});
				}
				throw error;
			} finally {
				setLocalPending(false);
			}
		} else if (onPress) {
			onPress(e);
		}
	};

	return (
		<Button isPending={isPending} onPress={handlePress} {...props}>
			{({ isPending }) => (
				<div className="flex items-center justify-center relative">
					<AnimatePresence initial={false}>
						{isPending && (
							<motion.div
								initial={{ width: 0, opacity: 0 }}
								animate={{ width: "fit-content", opacity: 1 }}
								exit={{ width: 0, opacity: 0 }}
								transition={{
									type: "tween",
									ease: "easeInOut",
									duration: 0.25,
								}}
								className="overflow-hidden flex items-center justify-start select-none will-change-[width] mr-1.5">
								<div className="size-4 flex items-center justify-center">
									<Spinner size={props.size || "sm"} color="current" />
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					<span className="inline-block transition-transform duration-200">
						<>{props.children}</>
					</span>
				</div>
			)}
		</Button>
	);
}
