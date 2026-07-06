import 'dotenv/config';
import { createDrizzleClient } from './index';
import {
  user,
  account,
  organizations,
  organizationMembers,
  projects,
  environments,
  featureFlags,
  variations,
  flagStates,
  targetingRules,
  sdkKeys,
  evaluationEvents,
  evaluationStatsHourly,
  evaluationStatsDaily,
} from './schema';
import { hashSdkKey } from '@/common/utils/crypto';
import * as crypto from 'crypto';

async function main() {
  const db = createDrizzleClient();
  console.log('Seeding database...');

  try {
    // 1. Clean old data in order
    console.log('Cleaning old tables...');
    await db.delete(evaluationEvents);
    await db.delete(evaluationStatsHourly);
    await db.delete(evaluationStatsDaily);
    await db.delete(targetingRules);
    await db.delete(flagStates);
    await db.delete(variations);
    await db.delete(featureFlags);
    await db.delete(sdkKeys);
    await db.delete(environments);
    await db.delete(projects);
    await db.delete(organizationMembers);
    await db.delete(organizations);
    await db.delete(account);
    await db.delete(user);

    // 2. Create User
    console.log('Creating test user...');
    const userId = 'dev-user-id';
    await db.insert(user).values({
      id: userId,
      name: 'Developer',
      email: 'dev@flagix.com',
      emailVerified: true,
    });

    // Mật khẩu 'password123' đã băm bcrypt
    await db.insert(account).values({
      id: 'dev-account-id',
      userId,
      accountId: userId,
      providerId: 'credential',
      password: '2bb324d95333366914ca6c60ed38ac80:50610328363adb96d92f4f036eb9140086a371bb645817d39a5dc9a6b8429bd9ea57dd22cd80ea01ea30083eb3c61d9df710c3b21aa4bd2a8595529e85ae4237',
    });

    // 3. Create Organization
    console.log('Creating organization...');
    const orgId = crypto.randomUUID();
    const [org] = await db
      .insert(organizations)
      .values({
        id: orgId,
        name: "Developer's Organization",
        slug: 'developer-org',
      })
      .returning();

    await db.insert(organizationMembers).values({
      id: crypto.randomUUID(),
      userId,
      organizationId: org.id,
      role: 'admin',
    });

    // 4. Create Project
    console.log('Creating project...');
    const projectId = crypto.randomUUID();
    const [project] = await db
      .insert(projects)
      .values({
        id: projectId,
        organizationId: org.id,
        name: 'Default Project',
        slug: 'default-project',
        createdBy: userId,
      })
      .returning();

    // 5. Create Environments
    console.log('Creating environments...');
    const devEnvId = crypto.randomUUID();
    const prodEnvId = crypto.randomUUID();

    await db.insert(environments).values([
      {
        id: devEnvId,
        organizationId: org.id,
        projectId: project.id,
        name: 'Development',
        slug: 'development',
        type: 'development',
        isActive: true,
        createdBy: userId,
      },
      {
        id: prodEnvId,
        organizationId: org.id,
        projectId: project.id,
        name: 'Production',
        slug: 'production',
        type: 'production',
        isActive: true,
        createdBy: userId,
      },
    ]);

    // 6. Create SDK Keys
    console.log('Creating SDK keys...');
    const rawDevClientKey = 'sdk_client_devkey123abcdefghijklmnopqrstuv';
    const rawDevServerKey = 'sdk_server_devkey123abcdefghijklmnopqrstuv';
    const rawProdClientKey = 'sdk_client_prodkey123abcdefghijklmnopqrstuv';
    const rawProdServerKey = 'sdk_server_prodkey123abcdefghijklmnopqrstuv';

    await db.insert(sdkKeys).values([
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        environmentId: devEnvId,
        name: 'Dev Client Key',
        keyHash: hashSdkKey(rawDevClientKey),
        keyHint: 'devkey12',
        type: 'client',
        isActive: true,
        createdBy: userId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        environmentId: devEnvId,
        name: 'Dev Server Key',
        keyHash: hashSdkKey(rawDevServerKey),
        keyHint: 'devkey12',
        type: 'server',
        isActive: true,
        createdBy: userId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        environmentId: prodEnvId,
        name: 'Prod Client Key',
        keyHash: hashSdkKey(rawProdClientKey),
        keyHint: 'prodkey1',
        type: 'client',
        isActive: true,
        createdBy: userId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        environmentId: prodEnvId,
        name: 'Prod Server Key',
        keyHash: hashSdkKey(rawProdServerKey),
        keyHint: 'prodkey1',
        type: 'server',
        isActive: true,
        createdBy: userId,
      },
    ]);

    // 7. Create Feature Flags & Variations
    console.log('Creating feature flags & variations...');

    // Flag 1: dark-mode (boolean, visibility: all)
    const flagDarkModeId = crypto.randomUUID();
    await db.insert(featureFlags).values({
      id: flagDarkModeId,
      organizationId: org.id,
      projectId: project.id,
      key: 'dark-mode',
      name: 'Dark Mode',
      description: 'Enables dark mode for the application interface.',
      flagType: 'boolean',
      visibility: 'all',
      createdBy: userId,
    });

    const varDarkModeTrueId = crypto.randomUUID();
    const varDarkModeFalseId = crypto.randomUUID();
    await db.insert(variations).values([
      {
        id: varDarkModeTrueId,
        organizationId: org.id,
        featureFlagId: flagDarkModeId,
        key: 'true',
        value: true,
        color: 'blue',
        isDefault: false,
      },
      {
        id: varDarkModeFalseId,
        organizationId: org.id,
        featureFlagId: flagDarkModeId,
        key: 'false',
        value: false,
        color: 'red',
        isDefault: true,
      },
    ]);

    // Flag 2: new-homepage (boolean, visibility: client_only)
    const flagNewHomeId = crypto.randomUUID();
    await db.insert(featureFlags).values({
      id: flagNewHomeId,
      organizationId: org.id,
      projectId: project.id,
      key: 'new-homepage',
      name: 'New Homepage Layout',
      description: 'Test the new grid-based homepage design.',
      flagType: 'boolean',
      visibility: 'client_only',
      createdBy: userId,
    });

    const varNewHomeTrueId = crypto.randomUUID();
    const varNewHomeFalseId = crypto.randomUUID();
    await db.insert(variations).values([
      {
        id: varNewHomeTrueId,
        organizationId: org.id,
        featureFlagId: flagNewHomeId,
        key: 'true',
        value: true,
        color: 'green',
        isDefault: false,
      },
      {
        id: varNewHomeFalseId,
        organizationId: org.id,
        featureFlagId: flagNewHomeId,
        key: 'false',
        value: false,
        color: 'amber',
        isDefault: true,
      },
    ]);

    // Flag 3: payment-gateway (multivariate, visibility: server_only)
    const flagPaymentId = crypto.randomUUID();
    await db.insert(featureFlags).values({
      id: flagPaymentId,
      organizationId: org.id,
      projectId: project.id,
      key: 'payment-gateway',
      name: 'Active Payment Gateway',
      description:
        'Controls which payment processing provider to route transactions to.',
      flagType: 'multivariate',
      visibility: 'server_only',
      createdBy: userId,
    });

    const varStripeId = crypto.randomUUID();
    const varPaypalId = crypto.randomUUID();
    const varRazorpayId = crypto.randomUUID();
    await db.insert(variations).values([
      {
        id: varStripeId,
        organizationId: org.id,
        featureFlagId: flagPaymentId,
        key: 'stripe',
        value: 'stripe',
        color: 'purple',
        isDefault: true,
      },
      {
        id: varPaypalId,
        organizationId: org.id,
        featureFlagId: flagPaymentId,
        key: 'paypal',
        value: 'paypal',
        color: 'blue',
        isDefault: false,
      },
      {
        id: varRazorpayId,
        organizationId: org.id,
        featureFlagId: flagPaymentId,
        key: 'razorpay',
        value: 'razorpay',
        color: 'indigo',
        isDefault: false,
      },
    ]);

    // Flag 4: theme-color (multivariate, visibility: all)
    const flagThemeId = crypto.randomUUID();
    await db.insert(featureFlags).values({
      id: flagThemeId,
      organizationId: org.id,
      projectId: project.id,
      key: 'theme-color',
      name: 'Application Theme Color',
      description: 'Dynamically customize the theme color preset.',
      flagType: 'multivariate',
      visibility: 'all',
      createdBy: userId,
    });

    const varThemeLightBlueId = crypto.randomUUID();
    const varThemeDarkSlateId = crypto.randomUUID();
    const varThemeRoseId = crypto.randomUUID();
    await db.insert(variations).values([
      {
        id: varThemeLightBlueId,
        organizationId: org.id,
        featureFlagId: flagThemeId,
        key: 'light-blue',
        value: 'light-blue',
        color: 'sky',
        isDefault: true,
      },
      {
        id: varThemeDarkSlateId,
        organizationId: org.id,
        featureFlagId: flagThemeId,
        key: 'dark-slate',
        value: 'dark-slate',
        color: 'lime',
        isDefault: false,
      },
      {
        id: varThemeRoseId,
        organizationId: org.id,
        featureFlagId: flagThemeId,
        key: 'rose',
        value: 'rose',
        color: 'pink',
        isDefault: false,
      },
    ]);

    // Flag 5: hero-headline (multivariate, visibility: all)
    const flagHeroHeadlineId = crypto.randomUUID();
    await db.insert(featureFlags).values({
      id: flagHeroHeadlineId,
      organizationId: org.id,
      projectId: project.id,
      key: 'hero-headline',
      name: 'Hero Headline Variant',
      description: 'A/B test hero headline: dev-focused, ops-focused, or growth-focused.',
      flagType: 'multivariate',
      visibility: 'all',
      createdBy: userId,
    });

    const varHeroDevId = crypto.randomUUID();
    const varHeroOpsId = crypto.randomUUID();
    const varHeroGrowthId = crypto.randomUUID();
    await db.insert(variations).values([
      {
        id: varHeroDevId,
        organizationId: org.id,
        featureFlagId: flagHeroHeadlineId,
        key: 'dev-focused',
        value: 'dev-focused',
        color: 'blue',
        isDefault: true,
      },
      {
        id: varHeroOpsId,
        organizationId: org.id,
        featureFlagId: flagHeroHeadlineId,
        key: 'ops-focused',
        value: 'ops-focused',
        color: 'green',
        isDefault: false,
      },
      {
        id: varHeroGrowthId,
        organizationId: org.id,
        featureFlagId: flagHeroHeadlineId,
        key: 'growth-focused',
        value: 'growth-focused',
        color: 'purple',
        isDefault: false,
      },
    ]);

    // Flag 6: pricing-hero (boolean, visibility: all)
    const flagPricingHeroId = crypto.randomUUID();
    await db.insert(featureFlags).values({
      id: flagPricingHeroId,
      organizationId: org.id,
      projectId: project.id,
      key: 'pricing-hero',
      name: 'Pricing Hero Layout',
      description: 'A/B test pricing page: enterprise single-plan vs standard 3-tier.',
      flagType: 'boolean',
      visibility: 'all',
      createdBy: userId,
    });

    const varPricingTrueId = crypto.randomUUID();
    const varPricingFalseId = crypto.randomUUID();
    await db.insert(variations).values([
      {
        id: varPricingTrueId,
        organizationId: org.id,
        featureFlagId: flagPricingHeroId,
        key: 'true',
        value: true,
        color: 'green',
        isDefault: false,
      },
      {
        id: varPricingFalseId,
        organizationId: org.id,
        featureFlagId: flagPricingHeroId,
        key: 'false',
        value: false,
        color: 'red',
        isDefault: true,
      },
    ]);

    // Flag 7: promo-banner (boolean, visibility: all)
    const flagPromoBannerId = crypto.randomUUID();
    await db.insert(featureFlags).values({
      id: flagPromoBannerId,
      organizationId: org.id,
      projectId: project.id,
      key: 'promo-banner',
      name: 'Promotional Banner',
      description: 'Toggle promotional banner for holiday campaigns and targeted offers.',
      flagType: 'boolean',
      visibility: 'all',
      createdBy: userId,
    });

    const varPromoTrueId = crypto.randomUUID();
    const varPromoFalseId = crypto.randomUUID();
    await db.insert(variations).values([
      {
        id: varPromoTrueId,
        organizationId: org.id,
        featureFlagId: flagPromoBannerId,
        key: 'true',
        value: true,
        color: 'amber',
        isDefault: false,
      },
      {
        id: varPromoFalseId,
        organizationId: org.id,
        featureFlagId: flagPromoBannerId,
        key: 'false',
        value: false,
        color: 'red',
        isDefault: true,
      },
    ]);

    // Flag 8: beta-analytics (boolean, visibility: all)
    const flagBetaAnalyticsId = crypto.randomUUID();
    await db.insert(featureFlags).values({
      id: flagBetaAnalyticsId,
      organizationId: org.id,
      projectId: project.id,
      key: 'beta-analytics',
      name: 'Beta Analytics Dashboard',
      description: 'Kill-switch gated beta feature for advanced analytics. Only visible to beta users.',
      flagType: 'boolean',
      visibility: 'all',
      createdBy: userId,
    });

    const varBetaTrueId = crypto.randomUUID();
    const varBetaFalseId = crypto.randomUUID();
    await db.insert(variations).values([
      {
        id: varBetaTrueId,
        organizationId: org.id,
        featureFlagId: flagBetaAnalyticsId,
        key: 'true',
        value: true,
        color: 'green',
        isDefault: false,
      },
      {
        id: varBetaFalseId,
        organizationId: org.id,
        featureFlagId: flagBetaAnalyticsId,
        key: 'false',
        value: false,
        color: 'red',
        isDefault: true,
      },
    ]);

    // 8. Create Flag States
    console.log('Creating flag states...');
    // Dev flag states
    await db.insert(flagStates).values([
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagDarkModeId,
        environmentId: devEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varDarkModeTrueId,
        offVariationId: varDarkModeFalseId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagNewHomeId,
        environmentId: devEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varNewHomeTrueId,
        offVariationId: varNewHomeFalseId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagPaymentId,
        environmentId: devEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varStripeId,
        offVariationId: varPaypalId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagThemeId,
        environmentId: devEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varThemeLightBlueId,
        offVariationId: varThemeRoseId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagHeroHeadlineId,
        environmentId: devEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varHeroDevId,
        offVariationId: varHeroOpsId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagPricingHeroId,
        environmentId: devEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varPricingFalseId,
        offVariationId: varPricingFalseId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagPromoBannerId,
        environmentId: devEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varPromoFalseId,
        offVariationId: varPromoFalseId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagBetaAnalyticsId,
        environmentId: devEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varBetaFalseId,
        offVariationId: varBetaFalseId,
      },
    ]);

    // Prod flag states
    await db.insert(flagStates).values([
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagDarkModeId,
        environmentId: prodEnvId,
        isEnabled: false,
        status: 'active',
        defaultVariationId: varDarkModeTrueId,
        offVariationId: varDarkModeFalseId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagNewHomeId,
        environmentId: prodEnvId,
        isEnabled: false,
        status: 'draft',
        defaultVariationId: varNewHomeTrueId,
        offVariationId: varNewHomeFalseId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagPaymentId,
        environmentId: prodEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varStripeId,
        offVariationId: varPaypalId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagThemeId,
        environmentId: prodEnvId,
        isEnabled: true,
        status: 'active',
        defaultVariationId: varThemeLightBlueId,
        offVariationId: varThemeRoseId,
      },
    ]);

    // 9. Create Targeting Rules
    console.log('Creating targeting rules...');

    // Rule for theme-color (Custom targeting with multiple parameters to benchmark performance)
    const lagTestingConditions = {
      conditions: [
        { contextKey: 'userId', type: 'string', operator: 'is_not_empty' },
        {
          contextKey: 'browser',
          type: 'string',
          operator: 'is_one_of',
          values: ['Chrome', 'Firefox', 'Safari'],
        },
        {
          contextKey: 'device',
          type: 'string',
          operator: 'is_one_of',
          values: ['mobile', 'desktop'],
        },
        {
          contextKey: 'version',
          type: 'number',
          operator: 'greater_than',
          value: 10,
        },
        {
          contextKey: 'location',
          type: 'string',
          operator: 'is_one_of',
          values: ['US', 'VN', 'SG', 'EU'],
        },
        {
          contextKey: 'betaUser',
          type: 'boolean',
          operator: 'equals',
          value: true,
        },
      ],
    };

    await db.insert(targetingRules).values([
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagThemeId,
        environmentId: devEnvId,
        ruleType: 'custom',
        priority: '0',
        variationId: varThemeRoseId,
        conditions: lagTestingConditions,
        isEnabled: true,
        createdBy: userId,
      },
      {
        id: crypto.randomUUID(),
        organizationId: org.id,
        featureFlagId: flagThemeId,
        environmentId: devEnvId,
        ruleType: 'user',
        priority: '1',
        variationId: varThemeDarkSlateId,
        conditions: { userIds: ['dev-user-1', 'dev-user-2'] },
        isEnabled: true,
        createdBy: userId,
      },
    ]);

    console.log('Database seeded successfully!');
    console.log('\n--- Login Credentials ---');
    console.log('Email: dev@flagix.com');
    console.log('Password: password123');
    console.log('\n--- SDK Keys (Dev Environment) ---');
    console.log(`Client Key: ${rawDevClientKey}`);
    console.log(`Server Key: ${rawDevServerKey}`);
    console.log('-------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();
