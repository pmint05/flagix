import { FlagModal } from "@/features/flags/FlagModal";
import { useUIStore } from "@/stores";
import { CreateSegmentModal } from "./CreateSegmentModal";
import { CreateSDKKeyModal } from "./CreateSDKKeyModal";

export function GlobalModals() {
	const { isCreateFlagOpen, closeCreateFlag } = useUIStore();

	return (
		<>
			<FlagModal isOpen={isCreateFlagOpen} onClose={closeCreateFlag} />
			<CreateSegmentModal />
			<CreateSDKKeyModal />
		</>
	);
}
