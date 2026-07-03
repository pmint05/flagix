import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import type { EvaluationStreamEvent } from "../types/analytics";

type ConnectionState = "idle" | "connecting" | "connected" | "disconnected";

interface UseProjectStreamOptions {
  orgId: string | undefined;
  projectId: string;
  environmentId?: string;
  maxEvents?: number;
}

interface UseProjectStreamReturn {
  events: EvaluationStreamEvent[];
  connectionState: ConnectionState;
  isPaused: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  pause: () => void;
  resume: () => void;
  clear: () => void;
}

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const MAX_BACKOFF_RETRIES = 5;

export function useProjectStream(
  options: UseProjectStreamOptions,
): UseProjectStreamReturn {
  const { orgId, projectId, environmentId, maxEvents = 500 } = options;

  const [events, setEvents] = useState<EvaluationStreamEvent[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pausedRef = useRef(false);
  const eventsRef = useRef<EvaluationStreamEvent[]>([]);
  const retriesRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const shouldConnectRef = useRef(false);

  const startStream = useCallback(() => {
    if (!orgId || !mountedRef.current) return;

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setConnectionState("connecting");
    setError(null);

    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (environmentId) params.set("environmentId", environmentId);

    const url = `${API_BASE_URL}/organizations/${orgId}/analytics/stream?${params.toString()}`;

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
            setConnectionState("disconnected");
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        setConnectionState("connected");
        setError(null);
        retriesRef.current = 0;

        const body = response.body;
        if (!body) {
          setError("Streaming not supported.");
          setConnectionState("disconnected");
          return;
        }

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (mountedRef.current && shouldConnectRef.current) {
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

              eventsRef.current = [parsed, ...eventsRef.current].slice(0, maxEvents);
              if (mountedRef.current) setEvents(eventsRef.current);
            } catch {
              // skip
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!mountedRef.current || !shouldConnectRef.current) return;

        if (retriesRef.current >= MAX_BACKOFF_RETRIES) {
          setError("Connection failed after multiple attempts.");
          setConnectionState("disconnected");
          return;
        }

        retriesRef.current++;
        const delay = Math.min(
          INITIAL_RETRY_DELAY * 2 ** (retriesRef.current - 1),
          MAX_RETRY_DELAY,
        );

        if (mountedRef.current) {
          setError(`Connection lost. Retrying in ${Math.round(delay / 1000)}s...`);
        }

        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current && shouldConnectRef.current) {
            setError(null);
            startStream();
          }
        }, delay);
      }
    })();
  }, [orgId, projectId, environmentId, maxEvents]);

  const connect = useCallback(() => {
    shouldConnectRef.current = true;
    eventsRef.current = [];
    setEvents([]);
    startStream();
  }, [startStream]);

  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setConnectionState("idle");
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      shouldConnectRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

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

  return {
    events,
    connectionState,
    isPaused,
    error,
    connect,
    disconnect,
    pause,
    resume,
    clear,
  };
}
