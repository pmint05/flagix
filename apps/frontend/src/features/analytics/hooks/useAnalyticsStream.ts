import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useContextStore } from "@/stores/context";
import type { EvaluationStreamEvent } from "../types/analytics";

interface UseAnalyticsStreamOptions {
	flagKey?: string;
	environmentId?: string;
	maxEvents?: number;
}

interface UseAnalyticsStreamReturn {
	events: EvaluationStreamEvent[];
	isPaused: boolean;
	isConnected: boolean;
	error: string | null;
	pause: () => void;
	resume: () => void;
	clear: () => void;
}

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const MAX_BACKOFF_RETRIES = 5;

export function useAnalyticsStream(
	options: UseAnalyticsStreamOptions = {},
): UseAnalyticsStreamReturn {
	const { flagKey, environmentId, maxEvents = 500 } = options;
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	const [events, setEvents] = useState<EvaluationStreamEvent[]>([]);
	const [isPaused, setIsPaused] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const pausedRef = useRef(false);
	const eventsRef = useRef<EvaluationStreamEvent[]>([]);
	const retriesRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);
	const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mountedRef = useRef(true);

	const connect = useCallback(() => {
		if (!orgId || !mountedRef.current) return;

		if (abortRef.current) {
			abortRef.current.abort();
			abortRef.current = null;
		}

		const params = new URLSearchParams();
		if (flagKey) params.set("flagKey", flagKey);
		if (environmentId) params.set("environmentId", environmentId);

		const qs = params.toString();
		const url = `${API_BASE_URL}/organizations/${orgId}/analytics/stream${qs ? `?${qs}` : ""}`;

		const controller = new AbortController();
		abortRef.current = controller;

		(async () => {
			try {
				const response = await fetch(url, {
					credentials: "include",
					signal: controller.signal,
					headers: { Accept: "text/event-stream" },
				});

				if (!response.ok) {
					if (response.status === 401) {
						setError("Authentication failed. Please log in again.");
						setIsConnected(false);
						return;
					}
					throw new Error(`HTTP ${response.status}`);
				}

				setIsConnected(true);
				setError(null);
				retriesRef.current = 0;

				const body = response.body;
				if (!body) {
					setError("Streaming not supported in this browser.");
					return;
				}

				const reader = body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (mountedRef.current) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						if (!line.startsWith("data:")) continue;

						const jsonStr = line.slice(5).trim();
						if (!jsonStr) continue;

						try {
							const parsed = JSON.parse(jsonStr) as EvaluationStreamEvent;
							if (pausedRef.current) continue;

							eventsRef.current = [parsed, ...eventsRef.current].slice(
								0,
								maxEvents,
							);
							if (mountedRef.current) setEvents(eventsRef.current);
						} catch {
							// Skip malformed events
						}
					}
				}
			} catch (err: unknown) {
				if (err instanceof DOMException && err.name === "AbortError") return;
				if (!mountedRef.current) return;

				setIsConnected(false);

				if (retriesRef.current >= MAX_BACKOFF_RETRIES) {
					setError(
						"Connection failed after multiple attempts. Refresh to retry.",
					);
					return;
				}

				retriesRef.current++;
				const delay = Math.min(
					INITIAL_RETRY_DELAY * 2 ** (retriesRef.current - 1),
					MAX_RETRY_DELAY,
				);

				if (mountedRef.current) {
					setError(
						`Connection lost. Retrying in ${Math.round(delay / 1000)}s...`,
					);
				}

				retryTimerRef.current = setTimeout(() => {
					if (mountedRef.current) {
						setError(null);
						connect();
					}
				}, delay);
			}
		})();
	}, [orgId, flagKey, environmentId, maxEvents]);

	useEffect(() => {
		mountedRef.current = true;
		if (!orgId) return;

		connect();

		return () => {
			mountedRef.current = false;
			if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
			if (abortRef.current) {
				abortRef.current.abort();
				abortRef.current = null;
			}
		};
	}, [orgId, connect]);

	useEffect(() => {
		if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
		if (abortRef.current) {
			abortRef.current.abort();
			abortRef.current = null;
		}
		retriesRef.current = 0;
		eventsRef.current = [];
		pausedRef.current = false;
		if (mountedRef.current) {
			setEvents([]);
			setIsPaused(false);
			setIsConnected(false);
			setError(null);
		}
		connect();
	}, [flagKey, environmentId, connect]);

	const pause = useCallback(() => {
		pausedRef.current = true;
		setIsPaused(true);
	}, []);

	const resume = useCallback(() => {
		pausedRef.current = false;
		setIsPaused(false);
	}, []);

	const clear = useCallback(() => {
		eventsRef.current = [];
		setEvents([]);
	}, []);

	return { events, isPaused, isConnected, error, pause, resume, clear };
}
