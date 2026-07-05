import { useState } from "react";
import { useCreateSdkKey } from "@/features/keys";
import { KeyModal } from "@/features/keys/KeyModal";
import { KeyDisplay } from "@/features/keys/KeyDisplay";
import { useUIStore } from "@/stores";
import type { CreateSdkKeyInput, CreateSdkKeyResponse } from "@/features/keys/api";

export function CreateSDKKeyModal() {
	const { isCreateSDKKeyOpen, closeCreateSDKKey } = useUIStore();
	const createMutation = useCreateSdkKey();
	const [displayedKey, setDisplayedKey] = useState<CreateSdkKeyResponse | null>(null);
	const [isDisplayOpen, setIsDisplayOpen] = useState(false);

	const handleCreate = (data: CreateSdkKeyInput) => {
		createMutation.mutate(data, {
			onSuccess: (res) => {
				closeCreateSDKKey();
				if (data.type === "server") {
					setDisplayedKey(res);
					setIsDisplayOpen(true);
				} else {
					setDisplayedKey(null);
				}
			},
		});
	};

	return (
		<>
			<KeyModal
				isOpen={isCreateSDKKeyOpen}
				onClose={closeCreateSDKKey}
				onSubmit={handleCreate}
				isLoading={createMutation.isPending}
			/>
			<KeyDisplay
				isOpen={isDisplayOpen}
				onClose={() => {
					setIsDisplayOpen(false);
					setDisplayedKey(null);
				}}
				createdKey={displayedKey}
			/>
		</>
	);
}
