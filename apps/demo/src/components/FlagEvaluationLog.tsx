import { useEffect, useState, useRef } from 'react';
import { useFlags } from '@flagix/sdk-react';
import { ClockIcon, TrashIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { EvaluationLogEntry } from '@/types';

export function FlagEvaluationLog() {
  const allFlags = useFlags();
  const [logs, setLogs] = useState<EvaluationLogEntry[]>([]);
  const prevKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const flagKeys = Object.keys(allFlags);
    if (flagKeys.length === 0) return;

    const newLogs: EvaluationLogEntry[] = [];

    for (const key of flagKeys) {
      const result = allFlags[key];
      if (!result) continue;

      if (!prevKeysRef.current.has(key)) {
        prevKeysRef.current.add(key);
      }

      newLogs.push({
        id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        flagKey: key,
        value: result.resolvedValue,
        reason: result.evaluationReason || 'default',
      });
    }

    if (newLogs.length > 0) {
      setLogs((prev) => [...newLogs, ...prev].slice(0, 30));
    }
  }, [allFlags]);

  const handleClear = () => {
    setLogs([]);
    prevKeysRef.current.clear();
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ClockIcon className="h-4 w-4 text-accent" weight="bold" />
            Evaluation Stream
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Real-time SSE events from the Flagix backend
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <TrashIcon className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      <div className="h-64 overflow-y-auto p-4">
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Waiting for flag evaluations...
          </div>
        ) : (
          <div className="space-y-1.5 font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-1.5"
              >
                <span className="text-muted-foreground">{log.timestamp}</span>
                <span className="rounded bg-accent/10 px-1.5 py-0.5 font-semibold text-accent">
                  {log.flagKey}
                </span>
                <span className="font-medium text-foreground">
                  {JSON.stringify(log.value)}
                </span>
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {log.reason}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
