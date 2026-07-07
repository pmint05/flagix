import { useState, useEffect } from 'react';
import { CheckIcon, BuildingsIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { DEMO_SERVER_URL } from '@/lib/constants';
import type { EvaluationContext } from '@flagix/sdk-core';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

interface PricingData {
  layout: string;
  plans: PricingPlan[];
  scenario: string;
}

interface PricingProps {
  activeContext: EvaluationContext;
}

export function Pricing({ activeContext }: PricingProps) {
  const [data, setData] = useState<PricingData | null>(null);

  useEffect(() => {
    const ctx = JSON.stringify(activeContext);
    fetch(`${DEMO_SERVER_URL}/api/content/pricing?context=${encodeURIComponent(ctx)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ layout: 'default', plans: [], scenario: '' }));
  }, [activeContext]);

  if (!data) {
    return (
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto h-8 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const isHeroLayout = data.layout === 'enterprise';

  return (
    <section id="pricing" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          {isHeroLayout ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
                <BuildingsIcon className="h-3.5 w-3.5" weight="bold" />
                Enterprise Ready
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built for teams that <span className="text-accent">scale</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Enterprise-grade feature management with the simplicity of a modern SaaS.
                Trusted by teams shipping billions of evaluations daily.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-muted-foreground">
                Start free. Upgrade when you need more power. No hidden fees.
              </p>
            </>
          )}
        </div>

        {isHeroLayout ? (
          <PricingHeroLayout plans={data.plans} />
        ) : (
          <PricingDefaultLayout plans={data.plans} />
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground font-mono">
          Evaluated by Express Server · {data.scenario}
        </p>
      </div>
    </section>
  );
}

function PricingDefaultLayout({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="mt-16 grid gap-8 lg:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard key={plan.name} {...plan} />
      ))}
    </div>
  );
}

function PricingHeroLayout({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="mt-16">
      <div className="mx-auto max-w-2xl">
        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            {...plan}
            footer={
              <div className="mt-8 border-t border-border pt-6 text-center">
                <p className="text-xs text-muted-foreground">Ideal for teams 50+</p>
                <p className="mt-2 text-sm font-medium">
                  Need something smaller?{' '}
                  <a href="#" className="text-accent hover:underline">
                    See Pro plan <ArrowUpRightIcon className="inline h-3 w-3" weight="bold" />
                  </a>
                </p>
              </div>
            }
          />
        ))}
      </div>

      <div className="mt-12 grid gap-4 text-center text-sm text-muted-foreground sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="font-semibold text-foreground">99.99%</div>
          <div>Uptime SLA</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="font-semibold text-foreground">SOC 2</div>
          <div>Type II Certified</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="font-semibold text-foreground">GDPR</div>
          <div>Compliant</div>
        </div>
      </div>
    </div>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta?: React.ReactNode;
  footer?: React.ReactNode;
}

function PricingCard({ name, price, period, description, features, highlighted, cta, footer }: PricingCardProps) {
  return (
    <div
      className={`relative rounded-xl border p-8 ${
        highlighted
          ? 'border-accent bg-card shadow-sm'
          : 'border-border bg-card'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          Most Popular
        </div>
      )}

      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-6">
        <span className="text-4xl font-bold">{price}</span>
        {period && (
          <span className="text-sm text-muted-foreground">{period}</span>
        )}
      </div>

      <ul className="mt-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm">
            <CheckIcon className="h-4 w-4 text-accent" weight="bold" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        className="mt-8 w-full"
        variant={highlighted ? 'default' : 'outline'}
      >
        {cta || 'Get Started'}
      </Button>

      {footer}
    </div>
  );
}
