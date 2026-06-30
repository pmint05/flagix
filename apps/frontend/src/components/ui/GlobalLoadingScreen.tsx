import { AnimatePresence, motion } from "motion/react";
import { Spinner } from "@heroui/react";
import { useUIStore } from "@/stores/ui";

export function GlobalLoadingScreen() {
	const { isGlobalLoading, globalLoadingMessage } = useUIStore();

	return (
		<AnimatePresence mode="wait">
			{isGlobalLoading && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0 }}
					className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background">
					<Spinner size="lg" color="current" className="text-foreground" />
					<motion.div
						key={globalLoadingMessage}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.15,
							type: "spring",
							damping: 20,
							stiffness: 300,
						}}
						className="mt-4 text-sm font-medium text-foreground/80">
						{globalLoadingMessage}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
