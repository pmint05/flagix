import { createQueryClient } from "@/lib/queryClient";

export function getContext() {
	const queryClient = createQueryClient();

	return {
		queryClient,
	};
}

export default function TanstackQueryProvider() {}
