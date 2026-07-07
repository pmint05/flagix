import { Router } from 'express';
import { flagix } from '../flagix.js';

const router = Router();

const HEADLINE_VARIANTS = {
  'dev-focused': {
    headline: 'Ship features with',
    accent: 'confidence',
    sub: 'not chaos',
    tagline: 'Flagix lets you deploy, test, and roll back features instantly without touching your codebase.',
  },
  'ops-focused': {
    headline: 'Kill broken features',
    accent: 'in 5ms',
    sub: 'no redeploy',
    tagline: 'Instant circuit breaker for any feature. When things go wrong, flip a switch — not a PR.',
  },
  'growth-focused': {
    headline: '10x your release',
    accent: 'velocity',
    sub: 'with zero risk',
    tagline: 'Gradual rollouts, A/B tests, and instant rollbacks let your team move faster than ever.',
  },
} as const;

type HeadlineVariant = keyof typeof HEADLINE_VARIANTS;

const FEATURE_ITEMS = [
  { key: 'instant-rollout', title: 'Instant Rollout', desc: 'Deploy features in minutes with zero downtime.', serverEvaluated: false },
  { key: 'precision-targeting', title: 'Precision Targeting', desc: 'Target users by region, role, device, plan, or any attribute.', serverEvaluated: false },
  { key: 'real-time-sync', title: 'Real-time Sync', desc: 'Changes propagate instantly via WebSocket. No polling needed.', serverEvaluated: false },
  { key: 'team-governance', title: 'Team Governance', desc: 'RBAC, audit logs, and change history for your team.', serverEvaluated: false },
  { key: 'beta-analytics', title: 'Advanced Analytics (Beta)', desc: 'Track evaluation metrics, user exposure, experiment results.', serverEvaluated: true },
  { key: 'enterprise-sso', title: 'SSO & SAML', desc: 'Enterprise-grade single sign-on for your organization.', serverEvaluated: true },
  { key: 'custom-targeting', title: 'Custom Targeting', desc: 'Build complex targeting rules with custom attributes.', serverEvaluated: true },
];

router.get('/hero', async (req, res) => {
  try {
    const [heroHeadline, isNewHomepage, showPromo] = await Promise.all([
      flagix.evaluate<string>('hero-headline', req.flagixContext, 'dev-focused'),
      flagix.evaluate<boolean>('new-homepage', req.flagixContext, false),
      flagix.evaluate<boolean>('promo-banner', req.flagixContext, false),
    ]);

    const variant = HEADLINE_VARIANTS[heroHeadline as HeadlineVariant] || HEADLINE_VARIANTS['dev-focused'];

    res.json({
      ...variant,
      variant: heroHeadline,
      promoActive: showPromo,
      isNewHomepage,
      scenario: [
        `[Canary Release] new-homepage = ${isNewHomepage} — user "${req.flagixContext.userId}" ${isNewHomepage ? 'sees new layout' : 'sees default homepage'}`,
        `[Promo Banner] promo-banner = ${showPromo} — ${showPromo ? 'promotional banner shown' : 'banner hidden'}`,
        `[A/B Test] hero-headline = "${heroHeadline}" — ${heroHeadline === 'dev-focused' ? 'developer-focused messaging' : heroHeadline === 'ops-focused' ? 'ops-focused messaging' : 'growth-focused messaging'}`,
      ],
    });
  } catch (err) {
    res.status(502).json({ error: 'Failed to evaluate content', message: String(err) });
  }
});

router.get('/features', async (req, res) => {
  try {
    const [betaAnalytics, pricingHero] = await Promise.all([
      flagix.evaluate<boolean>('beta-analytics', req.flagixContext, false),
      flagix.evaluate<boolean>('pricing-hero', req.flagixContext, false),
    ]);

    const isEnterprise = req.flagixContext.attributes?.plan === 'enterprise';
    const isBeta = req.flagixContext.attributes?.betaAccess === true;

    const features = FEATURE_ITEMS
      .filter((f) => {
        if (f.key === 'beta-analytics' && !betaAnalytics) return false;
        if (f.key === 'enterprise-sso' && !isEnterprise) return false;
        if (f.key === 'custom-targeting' && !isEnterprise) return false;
        return true;
      })
      .map(({ serverEvaluated: _se, ...f }) => ({
        ...f,
        enabled: _se ? true : undefined,
      }));

    const scenarios: string[] = [];

    if (!betaAnalytics) {
      scenarios.push('[Kill Switch] beta-analytics is OFF — Advanced Analytics hidden');
    } else {
      scenarios.push(`[Beta Gating] beta-analytics is ON${isBeta ? ' — user has betaAccess' : ' — but user lacks betaAccess, still shown via flag'}`);
    }

    if (isEnterprise) {
      scenarios.push('[Tier Gating] enterprise plan detected — SSO & Custom Targeting revealed');
    } else {
      scenarios.push(`[Tier Gating] plan=${req.flagixContext.attributes?.plan ?? 'none'} — enterprise features hidden`);
    }

    if (pricingHero) {
      scenarios.push('[A/B Test] pricing-hero flag is ON — enterprise-focused pricing layout active');
    }

    res.json({
      features,
      pricingLayout: pricingHero ? 'enterprise' : 'default',
      scenarios,
      context: {
        userId: req.flagixContext.userId,
        plan: req.flagixContext.attributes?.plan ?? 'none',
        betaAccess: isBeta,
      },
    });
  } catch (err) {
    res.status(502).json({ error: 'Failed to evaluate features', message: String(err) });
  }
});

router.get('/pricing', async (req, res) => {
  try {
    const pricingHero = await flagix.evaluate<boolean>('pricing-hero', req.flagixContext, false);

    const plans = pricingHero
      ? [
          {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'Everything you need to manage flags at enterprise scale.',
            features: ['Unlimited members', 'Unlimited flags', 'Custom targeting', 'Unlimited audit log', 'SSO & SAML', 'On-premise', 'SLA guarantee'],
            highlighted: true,
            cta: 'Request a Demo',
          },
        ]
      : [
          { name: 'Starter', price: 'Free', period: 'forever', description: 'For individuals and small projects.', features: ['5 team members', '10 feature flags', 'Basic targeting', '7-day audit log', 'Community support'], highlighted: false, cta: 'Start Free' },
          { name: 'Pro', price: '$49', period: '/month', description: 'For growing teams that need more power.', features: ['25 team members', 'Unlimited flags', 'Advanced targeting', '30-day audit log', 'Webhooks', 'Priority support'], highlighted: true, cta: 'Start Pro Trial' },
          { name: 'Enterprise', price: 'Custom', period: '', description: 'For large organizations with custom needs.', features: ['Unlimited members', 'Unlimited flags', 'Custom targeting', 'Unlimited audit log', 'SSO & SAML', 'On-premise'], highlighted: false, cta: 'Contact Sales' },
        ];

    res.json({
      layout: pricingHero ? 'enterprise' : 'default',
      plans,
      scenario: pricingHero
        ? `[A/B Testing] pricing-hero ON — showing enterprise-focused single-plan layout`
        : `[A/B Testing] pricing-hero OFF — showing standard 3-tier layout`,
    });
  } catch (err) {
    res.status(502).json({ error: 'Failed to evaluate pricing', message: String(err) });
  }
});

export { router as contentRouter };
