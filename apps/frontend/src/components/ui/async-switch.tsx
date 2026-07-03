"use client";

import { cn, Spinner, Switch, toast, type SwitchProps } from "@heroui/react";
import { type ReactNode, useCallback, useState } from "react";

export interface AsyncSwitchProps extends Omit<SwitchProps, "onChange"> {
	/** Async action to execute on toggle. Switch auto-manages pending state. */
	action: () => Promise<void> | void;
	/** Whether to show toast notifications. Default: false */
	showToast?: boolean;
	/** Toast message — used as description when actionName is set, or as title otherwise */
	message?: string;
	/** Toast title prefix — appends " Successfully" / " Failed" to the title */
	actionName?: string;
	/** Standard onChange handler. Ignored when action is provided. */
	onChange?: SwitchProps["onChange"];
	/** Label content */
	children?: ReactNode;
}

export function AsyncSwitch({
	action,
	showToast = false,
	message,
	actionName,
	onChange,
	isDisabled,
	children,
	...props
}: AsyncSwitchProps) {
	const [isPending, setIsPending] = useState(false);

	const handleChange = useCallback(
		async (_isSelected: boolean) => {
			if (action) {
				setIsPending(true);
				try {
					await action();
					if (showToast) {
						const title = actionName
							? `${actionName} Successfully`
							: message
								? `${message} Successfully`
								: "Successfully";
						const description = actionName ? message : undefined;
						toast.success(title, { description });
					}
				} catch {
					if (showToast) {
						const title = actionName
							? `${actionName} Failed`
							: message
								? `${message} Failed`
								: "Failed";
						const description = actionName ? message : undefined;
						toast.danger(title, { description });
					}
				} finally {
					setIsPending(false);
				}
			} else if (onChange) {
				onChange(_isSelected);
			}
		},
		[action, onChange, showToast, message, actionName],
	);

	return (
		<Switch
			isDisabled={isPending || isDisabled}
			onChange={handleChange}
			{...props}>
			<Switch.Content>
				<Switch.Control>
					<Switch.Thumb>
						{isPending && (
							<Switch.Icon>
								<Spinner
									size={props.size || "sm"}
									className={cn({
										"size-3": props.size === "sm",
									})}
								/>
							</Switch.Icon>
						)}
					</Switch.Thumb>
				</Switch.Control>
			</Switch.Content>
			{children}
		</Switch>
	);
}
