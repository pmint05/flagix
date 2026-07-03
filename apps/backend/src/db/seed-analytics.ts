import 'dotenv/config';
import { createDrizzleClient } from './index';
import {
  evaluationEvents,
  organizations,
  projects,
  environments,
  featureFlags,
  variations,
  sdkKeys,
} from './schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { hashUserId, hashClientIp } from '@/common/utils/crypto';
import * as crypto from 'crypto';

async function main() {
  const db = createDrizzleClient();
  console.log('Seeding evaluation events...');

  const org = await db.query.organizations.findFirst({
    where: isNull(organizations.deletedAt),
  });
  if (!org) {
    console.error('No organization found. Run main seed first.');
    process.exit(1);
  }

  const project = await db.query.projects.findFirst({
    where: isNull(projects.deletedAt),
  });
  const envs = await db.query.environments.findMany({
    where: isNull(environments.deletedAt),
  });
  const flags = await db.query.featureFlags.findMany({
    where: isNull(featureFlags.deletedAt),
    with: {
      variations: true,
    },
  });
  const keys = await db.query.sdkKeys.findMany({
    where: isNull(sdkKeys.deletedAt),
  });

  if (!project || envs.length === 0 || flags.length === 0) {
    console.error('Missing project/envs/flags. Run main seed first.');
    process.exit(1);
  }

  // Clear existing events
  console.log('Clearing existing evaluation events...');
  await db.delete(evaluationEvents);

  const clientKeys = keys.filter((k) => k.type === 'client');
  const USER_ID_POOL = Array.from({ length: 200 }, (_, i) => `user-${String(i + 1).padStart(4, '0')}`);
  const IP_POOL = Array.from({ length: 20 }, () =>
    `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
  );

  // Configuration for each flag: [percentage for variation A, variation B, ...]
  // The remaining % goes to DEFAULT (no matching rule)
  const flagConfigs: Record<string, {
    variationWeights: Record<string, number>;
    envSplit: number; // 0-1, how much goes to env[0] vs env[1]
    errorRate: number; // probability of FLAG_NOT_FOUND etc
  }> = {};

  for (const flag of flags) {
    const variations = flag.variations.map((v) => v.key);
    const weights: Record<string, number> = {};
    if (variations.length === 2) {
      weights[variations[0]] = 0.4;
      weights[variations[1]] = 0.35;
    } else if (variations.length === 3) {
      weights[variations[0]] = 0.3;
      weights[variations[1]] = 0.25;
      weights[variations[2]] = 0.2;
    }
    flagConfigs[flag.key] = {
      variationWeights: weights,
      envSplit: flag.key === 'new-homepage' ? 0.9 : 0.6,
      errorRate: Math.random() * 0.02,
    };
  }

  const TOTAL_EVENTS = 8000;
  const HOURS_BACK = 24;
  const now = Date.now();
  const batch: any[] = [];

  console.log(`Generating ${TOTAL_EVENTS} evaluation events...`);

  for (let i = 0; i < TOTAL_EVENTS; i++) {
    const flag = flags[i % flags.length];
    const config = flagConfigs[flag.key];
    const variations = flag.variations;

    // Pick environment based on envSplit
    const envIndex = Math.random() < config.envSplit ? 0 : 1;
    const env = envs[envIndex];
    const sdkKey = clientKeys[envIndex % clientKeys.length];

    // Random timestamp in last HOURS_BACK hours
    const minutesAgo = Math.floor(Math.random() * HOURS_BACK * 60);
    const createdAt = new Date(now - minutesAgo * 60 * 1000 - Math.floor(Math.random() * 60000));

    // Pick variation based on weights (or error)
    let variationKey: string | null = null;
    let resolvedValue: unknown = null;
    let evaluationReason = 'DEFAULT';

    if (Math.random() < config.errorRate) {
      evaluationReason = 'FLAG_NOT_FOUND';
    } else {
      // Weighted random selection
      const roll = Math.random();
      let cumulative = 0;
      for (const v of variations) {
        const weight = config.variationWeights[v.key] || 1 / variations.length;
        cumulative += weight;
        if (roll < cumulative) {
          variationKey = v.key;
          resolvedValue = v.value;
          evaluationReason = weight > 0.3 ? 'PERCENTAGE_ROLLOUT' : 'DEFAULT';
          break;
        }
      }
      if (!variationKey) {
        const def = variations.find((v) => v.isDefault) || variations[0];
        variationKey = def.key;
        resolvedValue = def.value;
        evaluationReason = 'DEFAULT';
      }
    }

    // Random user
    const userId = USER_ID_POOL[Math.floor(Math.random() * USER_ID_POOL.length)];
    const ip = IP_POOL[Math.floor(Math.random() * IP_POOL.length)];

    batch.push({
      organizationId: org.id,
      projectId: project.id,
      environmentId: env.id,
      featureFlagId: flag.id,
      flagKey: flag.key,
      variationId: variationKey
        ? variations.find((v) => v.key === variationKey)?.id ?? null
        : null,
      variationKey,
      resolvedValue,
      evaluationReason,
      contextUserHash: hashUserId(userId),
      sdkKeyId: sdkKey?.id ?? null,
      clientIpHash: hashClientIp(ip),
      createdAt,
    });

    // Flush every 500
    if (batch.length >= 500) {
      await db.insert(evaluationEvents).values(batch.splice(0));
      process.stdout.write('.');
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await db.insert(evaluationEvents).values(batch);
    process.stdout.write('.');
  }

  console.log(`\nInserted ${TOTAL_EVENTS} evaluation events across ${flags.length} flags and ${envs.length} environments.`);

  // Summary
  const perFlag = await db
    .select({
      flagKey: evaluationEvents.flagKey,
      count: sql<number>`count(*)::int`,
    })
    .from(evaluationEvents)
    .groupBy(evaluationEvents.flagKey);

  console.log('\nPer-flag counts:');
  for (const row of perFlag) {
    console.log(`  ${row.flagKey}: ${row.count}`);
  }

  const perEnv = await db
    .select({
      envId: evaluationEvents.environmentId,
      count: sql<number>`count(*)::int`,
    })
    .from(evaluationEvents)
    .groupBy(evaluationEvents.environmentId);

  console.log('\nPer-environment counts:');
  for (const row of perEnv) {
    console.log(`  ${row.envId.substring(0, 8)}: ${row.count}`);
  }

  console.log('\nDone!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Analytics seed failed:', err);
  process.exit(1);
});
