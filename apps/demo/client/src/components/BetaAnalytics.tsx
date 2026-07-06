import { useFlag } from '@flagix/sdk-react';
import { ChartBarIcon, LightningIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { FLAG_KEYS } from '@/lib/constants';

export function BetaAnalytics() {
  const { value: showAnalytics, isLoading } = useFlag(FLAG_KEYS.BETA_ANALYTICS, false);

  if (isLoading || !showAnalytics) return null;

  return (
    <section id="analytics" className="border-t border-b border-accent/20 bg-accent/5">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Beta Feature — Kill Switch Active
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Advanced <span className="text-accent">Analytics</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Track every flag evaluation in real time. See exposure rates, rollout progress,
              and user impact — all from one dashboard. This section is gated behind a
              feature flag with instant kill-switch via SSE.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                { icon: ChartBarIcon, title: 'Evaluation Metrics', desc: 'Request volume, latency, cache hit rate per flag' },
                { icon: LightningIcon, title: 'Real-time Stream', desc: 'Watch evaluations stream in live via SSE connection' },
                { icon: ShieldCheckIcon, title: 'Instant Rollback', desc: 'Toggle this entire section off from the dashboard without deploy' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-lg border border-border bg-background p-4">
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" weight="bold" />
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="mt-6">
              Try Beta Analytics
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Live Evaluation Stream</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { flag: 'dark-mode', result: 'true', reason: 'RULE_MATCH', time: '1.2ms' },
                { flag: 'new-homepage', result: 'false', reason: 'DEFAULT', time: '0.8ms' },
                { flag: 'theme-accent', result: 'light-blue', reason: 'ROLLOUT', time: '1.5ms' },
                { flag: 'beta-analytics', result: 'true', reason: 'BOOL_TRUE', time: '0.6ms' },
                { flag: 'hero-headline', result: 'growth', reason: 'ROLLOUT', time: '1.1ms' },
              ].map((log) => (
                <div key={log.flag} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-1.5 w-1.5 rounded-full ${
                        log.reason === 'ROLLOUT' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-foreground">{log.flag}</span>
                    <span className="text-muted-foreground">→ {log.result}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{log.reason}</span>
                    <span>{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
