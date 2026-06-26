import { useSyncExternalStore } from "react";

function getSnapshot() {
	return window.matchMedia("(max-width: 768px)").matches;
}

function getServerSnapshot() {
	return false;
}

function subscribe(callback: () => void) {
	const mql = window.matchMedia("(max-width: 768px)");
	mql.addEventListener("change", callback);
	return () => mql.removeEventListener("change", callback);
}

export function useIsMobile() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
