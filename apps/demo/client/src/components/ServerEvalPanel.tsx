import { useState, useEffect, useCallback } from 'react';
import { useFlags, useFlagixReady } from '@flagix/sdk-react';
import { ArrowsClockwiseIcon, CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DEMO_SERVER_URL } from '@/lib/constants';
import type { EvaluationContext } from '@flagix/sdk-core';

interface ServerEvalPanelProps {
  activeContext: EvaluationContext;
}

interface ServerFlagResult {
  key: string;
  value: unknown;
}

export function ServerEvalPanel({ activeContext }: ServerEvalPanelProps) {
  const clientFlags = useFlags();
  const isClientReady = useFlagixReady();
  const [serverFlags, setServerFlags] = useState<ServerFlagResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const buildQueryString = useCallback(() => {
    const ctx = JSON.stringify(activeContext);
    return `context=${encodeURIComponent(ctx)}`;
  }, [activeContext]);

  const fetchServerFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQueryString();
      const res = await fetch(`${DEMO_SERVER_URL}/api/flags?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();

      const results: ServerFlagResult[] = Object.entries(data.flags ?? {}).map(([key, result]: [string, any]) => ({
        key,
        value: result.resolvedValue ?? result.enabled ?? result,
      }));
      setServerFlags(results);
      setLastFetch(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    if (isClientReady) {
      fetchServerFlags();
    }
  }, [isClientReady, fetchServerFlags]);

  const compareFlags = () => {
    return serverFlags.map((sf) => {
      const clientResult = clientFlags[sf.key];
      let clientValue: unknown = null;
      if (clientResult) {
        clientValue = clientResult.resolvedValue ?? clientResult.enabled ?? null;
      }
      const matches = JSON.stringify(clientValue) === JSON.stringify(sf.value);
      return { ...sf, clientValue, matches };
    });
  };

  const comparison = compareFlags();
  const matchCount = comparison.filter((c) => c.matches).length;
  const totalCount = comparison.length;

  return (
    <section id="server-eval" className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Server-Side vs Client-Side{' '}
            <span className="text-accent">Evaluation</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            The same flags evaluated by the Express server (via <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">@flagix/sdk-core</code>) and the React client (via <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">@flagix/sdk-react</code>) should always match.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchServerFlags}
            disabled={loading}
          >
            <ArrowsClockwiseIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} weight="bold" />
            {loading ? 'Fetching...' : 'Refresh'}
          </Button>
          {lastFetch && (
            <span className="text-xs">
              Last fetch: <span className="font-medium text-foreground">{lastFetch}</span>
            </span>
          )}
          <span className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span>{error ? `Error: ${error}` : 'Server connected'}</span>
          {totalCount > 0 && (
            <>
              <span className="text-border">|</span>
              <span>
                Match:{' '}
                <span className={`font-semibold ${matchCount === totalCount ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {matchCount}/{totalCount}
                </span>
              </span>
            </>
          )}
        </div>

        {totalCount > 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-4 gap-0 border-b border-border bg-card px-6 py-3 text-xs font-semibold text-muted-foreground">
              <div>Flag Key</div>
              <div>Client Value (SDK)</div>
              <div>Server Value (API)</div>
              <div>Match</div>
            </div>
            <div className="divide-y divide-border">
              {comparison.map((row) => (
                <div
                  key={row.key}
                  className={`grid grid-cols-4 gap-0 bg-card px-6 py-3 text-sm ${
                    row.matches ? '' : 'bg-amber-500/5'
                  }`}
                >
                  <div className="font-mono font-medium">{row.key}</div>
                  <div className="font-mono text-muted-foreground">
                    {JSON.stringify(row.clientValue)}
                  </div>
                  <div className="font-mono text-muted-foreground">
                    {JSON.stringify(row.value)}
                  </div>
                  <div>
                    {row.matches ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <CheckCircleIcon className="h-4 w-4" weight="bold" />
                        Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-500">
                        <XCircleIcon className="h-4 w-4" weight="bold" />
                        Diff
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : loading ? (
          <Card className="mt-8 p-12 text-center text-sm text-muted-foreground">
            Fetching server-side evaluation...
          </Card>
        ) : (
          <Card className="mt-8 p-12 text-center text-sm text-muted-foreground">
            {error
              ? `Failed to connect to demo server at ${DEMO_SERVER_URL}. Make sure the server is running.`
              : 'Click Refresh to fetch server-side evaluation results.'}
          </Card>
        )}
      </div>
    </section>
  );
}
