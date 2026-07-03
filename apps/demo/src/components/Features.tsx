import { LightningIcon, TargetIcon, BroadcastIcon, UsersThreeIcon, CodeBlockIcon, ChartBarIcon } from '@phosphor-icons/react';
import { FLAG_KEYS } from '@/lib/constants';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; weight?: 'fill' | 'regular' | 'bold' }>> = {
  LightningIcon,
  TargetIcon,
  BroadcastIcon,
  UsersThreeIcon,
  CodeBlockIcon,
  ChartBarIcon,
};

const FEATURES = [
  {
    title: 'Instant Rollout',
    description: 'Deploy features to production in minutes with zero downtime. Toggle features without redeploying.',
    icon: 'LightningIcon',
  },
  {
    title: 'Precision Targeting',
    description: 'Target specific users, regions, or devices with granular rules. Percentage rollouts and attribute-based targeting.',
    icon: 'TargetIcon',
  },
  {
    title: 'Real-time Propagation',
    description: 'Changes propagate instantly via WebSocket. No polling, no delays. Your flags are always in sync.',
    icon: 'BroadcastIcon',
  },
  {
    title: 'Team Governance',
    description: 'Role-based access control, audit logs, and change history keep your team aligned and accountable.',
    icon: 'UsersThreeIcon',
  },
  {
    title: 'Lightweight SDKs',
    description: 'Drop-in SDKs for React, Node.js, and more. Type-safe, with built-in caching and offline resilience.',
    icon: 'CodeBlockIcon',
  },
  {
    title: 'Built-in Analytics',
    description: 'Track evaluation metrics, user exposure, and experiment results with an integrated analytics dashboard.',
    icon: 'ChartBarIcon',
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to manage
            <br />
            <span className="text-accent">feature flags</span> at scale
          </h2>
          <p className="mt-4 text-muted-foreground">
            From simple toggles to complex multi-variate experiments, Flagix has you covered.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = ICON_MAP[feature.icon];
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  {Icon && <Icon className="h-5 w-5" weight="bold" />}
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
