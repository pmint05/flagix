import { useFlag } from '@flagix/sdk-react';
import { CheckIcon, BuildingsIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { FLAG_KEYS } from '@/lib/constants';

const STARTER_FEATURES = ['5 team members', '10 feature flags', 'Basic targeting rules', '7-day audit log', 'Community support'];
const PRO_FEATURES = ['25 team members', 'Unlimited flags', 'Advanced targeting', '30-day audit log', 'Webhooks', 'Priority support'];
const ENTERPRISE_FEATURES = ['Unlimited members', 'Unlimited flags', 'Custom targeting', 'Unlimited audit log', 'SSO & SAML', 'On-premise', 'SLA guarantee'];

export function Pricing() {
  const { value: isPricingHero } = useFlag(FLAG_KEYS.PRICING_HERO, false);

  return (
    <section id="pricing" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          {isPricingHero ? (
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

        {isPricingHero ? <PricingHeroLayout /> : <PricingDefaultLayout />}
      </div>
    </section>
  );
}

function PricingDefaultLayout() {
  return (
    <div className="mt-16 grid gap-8 lg:grid-cols-3">
      <PricingCard name="Starter" price="Free" period="forever" description="For individuals and small projects." features={STARTER_FEATURES} />
      <PricingCard name="Pro" price="$49" period="/month" description="For growing teams that need more power." features={PRO_FEATURES} highlighted />
      <PricingCard name="Enterprise" price="Custom" period="" description="For large organizations with custom needs." features={ENTERPRISE_FEATURES} cta="Contact Sales" />
    </div>
  );
}

function PricingHeroLayout() {
  return (
    <div className="mt-16">
      <div className="mx-auto max-w-2xl">
        <PricingCard
          name="Enterprise"
          price="Custom"
          period=""
          description="Everything you need to manage flags at enterprise scale."
          features={ENTERPRISE_FEATURES}
          highlighted
          cta="Request a Demo"
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
