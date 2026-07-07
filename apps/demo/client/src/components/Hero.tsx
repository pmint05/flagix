import { useState, useEffect } from 'react';
import { ArrowRightIcon, CodeIcon, RocketIcon, ShieldPlusIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { DEMO_SERVER_URL } from '@/lib/constants';
import type { EvaluationContext } from '@flagix/sdk-core';

const HEADLINE_VARIANTS = {
  'dev-focused': {
    headline: 'Ship features with',
    accent: 'confidence',
    sub: 'not chaos',
    tagline: 'Flagix lets you deploy, test, and roll back features instantly without touching your codebase.',
    icon: CodeIcon,
  },
  'ops-focused': {
    headline: 'Kill broken features',
    accent: 'in 5ms',
    sub: 'no redeploy',
    tagline: 'Instant circuit breaker for any feature. When things go wrong, flip a switch — not a PR.',
    icon: ShieldPlusIcon,
  },
  'growth-focused': {
    headline: '10x your release',
    accent: 'velocity',
    sub: 'with zero risk',
    tagline: 'Gradual rollouts, A/B tests, and instant rollbacks let your team move faster than ever.',
    icon: RocketIcon,
  },
} as const;

type HeadlineVariant = keyof typeof HEADLINE_VARIANTS;

const FEATURE_ITEMS = [
  { title: 'Gradual Rollouts', desc: 'Release to 1%, then scale to 100% with confidence.' },
  { title: 'A/B Testing', desc: 'Compare variants and measure impact on key metrics.' },
  { title: 'Kill Switch', desc: 'Instantly disable broken features without redeploying.' },
  { title: 'User Targeting', desc: 'Target by region, role, device, plan, or any attribute.' },
];

interface HeroData {
  variant: string;
  headline: string;
  accent: string;
  sub: string;
  tagline: string;
  isNewHomepage: boolean;
  promoActive: boolean;
  scenario: string[];
}

interface HeroProps {
  activeContext: EvaluationContext;
}

export function Hero({ activeContext }: HeroProps) {
  const [data, setData] = useState<HeroData | null>(null);

  useEffect(() => {
    const ctx = JSON.stringify(activeContext);
    fetch(`${DEMO_SERVER_URL}/api/content/hero?context=${encodeURIComponent(ctx)}`)
      .then((r) => r.json())
      .then((d) => { setData(d); })
      .catch(() => {
        setData({
          variant: 'dev-focused',
          headline: 'Ship features with',
          accent: 'confidence',
          sub: 'not chaos',
          tagline: 'Flagix lets you deploy, test, and roll back features instantly.',
          isNewHomepage: false,
          promoActive: false,
          scenario: [],
        });
      });
  }, [activeContext]);

  if (!data) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mx-auto mt-6 h-6 w-96 animate-pulse rounded bg-muted" />
        </div>
      </section>
    );
  }

  if (data.isNewHomepage) {
    return <HeroVariant scenario={data.scenario} />;
  }

  return <HeroDefault variant={data.variant as HeadlineVariant} scenario={data.scenario} />;
}

function HeroDefault({ variant: headlineVariant, scenario }: { variant: HeadlineVariant; scenario: string[] }) {
  const variant = HEADLINE_VARIANTS[headlineVariant] || HEADLINE_VARIANTS['dev-focused'];
  const Icon = variant.icon;

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Now in Public Beta
          <span className="text-border">|</span>
          <Icon className="h-3 w-3 text-accent" weight="bold" />
          <span className="text-xs text-accent font-medium">{headlineVariant} audience</span>
        </div>

        <h1 className="font-bold text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {variant.headline}
          <br />
          <span className="text-accent">{variant.accent}</span>
          {variant.sub ? `, ${variant.sub}` : ''}
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {variant.tagline}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg">
            Start Building Free
            <ArrowRightIcon className="h-4 w-4" weight="bold" />
          </Button>
          <Button variant="outline" size="lg">
            View Documentation
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-card p-4 text-left"
            >
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground font-mono">
          Evaluated by Express Server · {scenario.join(' · ')}
        </p>
      </div>
    </section>
  );
}

function HeroVariant({ scenario }: { scenario: string[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
            Beta Layout Active
          </div>

          <h1 className="font-bold text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Feature flags
            <br />
            done <span className="text-accent">right</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Decouple deployment from release. Roll out features gradually, run experiments,
            and kill broken features instantly. All configurable from a single dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg">
              Get Started
              <ArrowRightIcon className="h-4 w-4" weight="bold" />
            </Button>
            <Button variant="outline" size="lg">
              Schedule a Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { value: '99.99%', label: 'Uptime SLA' },
            { value: '<10ms', label: 'Flag Resolution' },
            { value: '50K+', label: 'Teams Using Flagix' },
            { value: '1B+', label: 'Flags Evaluated Daily' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="text-2xl font-bold text-accent">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground font-mono">
        Evaluated by Express Server · {scenario.join(' · ')}
      </p>
    </section>
  );
}
