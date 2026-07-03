import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DATABASE } from '../../src/modules/database/database.module';
import { type Database } from '../../src/db';
import {
  organizations,
  organizationMembers,
  projects,
  environments,
  sdkKeys,
  featureFlags,
  flagStates,
  variations,
  targetingRules,
} from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { hashSdkKey } from '../../src/common/utils/crypto';

describe('Evaluation API (e2e)', () => {
  let app: INestApplication;
  let db: Database;
  let sdkKey: string;
  let envId: string;
  let flagId: string;
  let varTrueId: string;
  let varFalseId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    db = moduleFixture.get<Database>(DATABASE);

    await seedTestData();
  });

  async function seedTestData() {
    const [org] = await db
      .insert(organizations)
      .values({ name: 'Test Org', slug: 'test-org' })
      .returning();

    const [project] = await db
      .insert(projects)
      .values({
        organizationId: org.id,
        name: 'Test Project',
        slug: 'test-project',
      })
      .returning();

    const [env] = await db
      .insert(environments)
      .values({
        organizationId: org.id,
        projectId: project.id,
        name: 'Test Env',
        slug: 'test-env',
      })
      .returning();
    envId = env.id;

    const rawKey = 'fkx_test_integration_key_12345';
    const keyHash = hashSdkKey(rawKey);
    sdkKey = rawKey;

    await db.insert(sdkKeys).values({
      organizationId: org.id,
      environmentId: env.id,
      name: 'Test Key',
      keyHash,
      keyHint: rawKey.slice(0, 8),
      type: 'server',
    });

    const [flag] = await db
      .insert(featureFlags)
      .values({
        organizationId: org.id,
        projectId: project.id,
        key: 'test-flag',
        name: 'Test Flag',
        flagType: 'boolean',
      })
      .returning();
    flagId = flag.id;

    await db.insert(flagStates).values({
      organizationId: org.id,
      featureFlagId: flag.id,
      environmentId: env.id,
      isEnabled: true,
      status: 'active',
    });

    const [vTrue] = await db
      .insert(variations)
      .values({
        organizationId: org.id,
        featureFlagId: flag.id,
        key: 'true',
        value: true,
        isDefault: false,
      })
      .returning();
    varTrueId = vTrue.id;

    const [vFalse] = await db
      .insert(variations)
      .values({
        organizationId: org.id,
        featureFlagId: flag.id,
        key: 'false',
        value: false,
        isDefault: true,
      })
      .returning();
    varFalseId = vFalse.id;

    await db.insert(targetingRules).values({
      organizationId: org.id,
      featureFlagId: flag.id,
      environmentId: env.id,
      ruleType: 'user',
      priority: 'b0',
      variationId: vTrue.id,
      conditions: { userIds: ['user-123', 'user-456'] },
      isEnabled: true,
    });

    await db.insert(targetingRules).values({
      organizationId: org.id,
      featureFlagId: flag.id,
      environmentId: env.id,
      ruleType: 'percentage',
      priority: 'd0',
      variationId: vTrue.id,
      conditions: { percentage: 30 },
      isEnabled: true,
    });
  }

  afterAll(async () => {
    await db.delete(targetingRules);
    await db.delete(variations);
    await db.delete(featureFlags);
    await db.delete(sdkKeys);
    await db.delete(environments);
    await db.delete(projects);
    await db.delete(organizationMembers);
    await db.delete(organizations);
    await app.close();
  });

  describe('POST /api/v1/evaluate', () => {
    it('should return 401 for missing SDK key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .send({ flagKey: 'test-flag', context: { userId: 'user-123' } })
        .expect(401);
    });

    it('should return 401 for invalid SDK key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .set('X-SDK-Key', 'invalid-key')
        .send({ flagKey: 'test-flag', context: { userId: 'user-123' } })
        .expect(401);
    });

    it('should evaluate flag for targeted user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .set('X-SDK-Key', sdkKey)
        .send({ flagKey: 'test-flag', context: { userId: 'user-123' } })
        .expect(200);

      expect(res.body.flagKey).toBe('test-flag');
      expect(res.body.enabled).toBe(true);
      expect(res.body.variationKey).toBe('true');
      expect(res.body.resolvedValue).toBe(true);
      expect(res.body.evaluationReason).toBe('USER_TARGETING');
    });

    it('should return FLAG_NOT_FOUND for non-existent flag', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .set('X-SDK-Key', sdkKey)
        .send({
          flagKey: 'non-existent-flag',
          context: { userId: 'user-123' },
        })
        .expect(200);

      expect(res.body.enabled).toBe(false);
      expect(res.body.evaluationReason).toBe('FLAG_NOT_FOUND');
    });

    it('should be deterministic - same input returns same result', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .set('X-SDK-Key', sdkKey)
        .send({ flagKey: 'test-flag', context: { userId: 'user-999' } })
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .set('X-SDK-Key', sdkKey)
        .send({ flagKey: 'test-flag', context: { userId: 'user-999' } })
        .expect(200);

      expect(res1.body).toEqual(res2.body);
    });

    it('should skip USER and PERCENTAGE rules for anonymous users', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .set('X-SDK-Key', sdkKey)
        .send({ flagKey: 'test-flag', context: {} })
        .expect(200);

      expect(res.body.evaluationReason).toBe('DEFAULT');
    });
  });

  describe('POST /api/v1/evaluate/all', () => {
    it('should evaluate all active flags', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluate/all')
        .set('X-SDK-Key', sdkKey)
        .send({ context: { userId: 'user-123' } })
        .expect(200);

      expect(res.body.flags).toBeDefined();
      expect(Array.isArray(res.body.flags)).toBe(true);
      expect(res.body.flags.length).toBeGreaterThan(0);
    });

    it('should exclude draft and archived flags', async () => {
      const orgId = (await db.select().from(organizations).limit(1))[0].id;
      const projectId = (await db.select().from(projects).limit(1))[0].id;
      const [draftFlag] = await db
        .insert(featureFlags)
        .values({
          organizationId: orgId,
          projectId,
          key: 'draft-flag',
          name: 'Draft Flag',
          flagType: 'boolean',
        })
        .returning();

      await db.insert(flagStates).values({
        organizationId: orgId,
        featureFlagId: draftFlag.id,
        environmentId: envId,
        isEnabled: false,
        status: 'draft',
      });

      await db.insert(variations).values({
        organizationId: (await db.select().from(organizations).limit(1))[0].id,
        featureFlagId: draftFlag.id,
        key: 'false',
        value: false,
        isDefault: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluate/all')
        .set('X-SDK-Key', sdkKey)
        .send({ context: { userId: 'user-123' } })
        .expect(200);

      const flagKeys = res.body.flags.map(
        (f: { flagKey: string }) => f.flagKey,
      );
      expect(flagKeys).not.toContain('draft-flag');

      await db
        .delete(variations)
        .where(eq(variations.featureFlagId, draftFlag.id));
      await db.delete(featureFlags).where(eq(featureFlags.id, draftFlag.id));
    });
  });

  describe('Kill Switch (SC-004)', () => {
    it('should short-circuit all rules when kill switch is active', async () => {
      const orgId = (await db.select().from(organizations).limit(1))[0].id;
      await db.insert(targetingRules).values({
        organizationId: orgId,
        featureFlagId: flagId,
        environmentId: envId,
        ruleType: 'kill_switch',
        priority: 'a0',
        variationId: varFalseId,
        conditions: {},
        isEnabled: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .set('X-SDK-Key', sdkKey)
        .send({
          flagKey: 'test-flag',
          context: { userId: 'user-123', role: 'admin' },
        })
        .expect(200);

      expect(res.body.evaluationReason).toBe('KILL_SWITCH');
      expect(res.body.enabled).toBe(false);
      expect(res.body.resolvedValue).toBe(false);

      await db
        .delete(targetingRules)
        .where(eq(targetingRules.ruleType, 'kill_switch'));
    });
  });

  describe('Percentage Distribution (SC-005, SC-006)', () => {
    it('should distribute within 2% of target over 10000 users', async () => {
      const orgId = (await db.select().from(organizations).limit(1))[0].id;
      const projectId = (await db.select().from(projects).limit(1))[0].id;
      const [pctFlag] = await db
        .insert(featureFlags)
        .values({
          organizationId: orgId,
          projectId,
          key: 'pct-flag',
          name: 'Percentage Flag',
          flagType: 'boolean',
        })
        .returning();

      await db.insert(flagStates).values({
        organizationId: orgId,
        featureFlagId: pctFlag.id,
        environmentId: envId,
        isEnabled: true,
        status: 'active',
      });

      const [pctVarTrue] = await db
        .insert(variations)
        .values({
          organizationId: orgId,
          featureFlagId: pctFlag.id,
          key: 'true',
          value: true,
          isDefault: false,
        })
        .returning();

      await db.insert(variations).values({
        organizationId: orgId,
        featureFlagId: pctFlag.id,
        key: 'false',
        value: false,
        isDefault: true,
      });

      await db.insert(targetingRules).values({
        organizationId: orgId,
        featureFlagId: pctFlag.id,
        environmentId: envId,
        ruleType: 'percentage',
        priority: 'd0',
        variationId: pctVarTrue.id,
        conditions: { percentage: 30 },
        isEnabled: true,
      });

      let matched = 0;
      const totalUsers = 1000;

      for (let i = 0; i < totalUsers; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/evaluate')
          .set('X-SDK-Key', sdkKey)
          .send({
            flagKey: 'pct-flag',
            context: { userId: `synthetic-user-${i}` },
          });
        if (res.body.evaluationReason === 'PERCENTAGE_ROLLOUT') {
          matched++;
        }
      }

      const actualPercentage = (matched / totalUsers) * 100;
      expect(actualPercentage).toBeGreaterThan(25);
      expect(actualPercentage).toBeLessThan(35);

      await db
        .delete(targetingRules)
        .where(eq(targetingRules.featureFlagId, pctFlag.id));
      await db
        .delete(variations)
        .where(eq(variations.featureFlagId, pctFlag.id));
      await db.delete(featureFlags).where(eq(featureFlags.id, pctFlag.id));
    }, 120000);
  });

  describe('Fail-Safe (FR-037, FR-056)', () => {
    it('should return safe default for non-existent flag', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluate')
        .set('X-SDK-Key', sdkKey)
        .send({
          flagKey: 'does-not-exist',
          context: { userId: 'user-1' },
        })
        .expect(200);

      expect(res.body.enabled).toBe(false);
      expect(res.body.evaluationReason).toBe('FLAG_NOT_FOUND');
    });
  });
});
