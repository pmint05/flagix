import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DATABASE } from '../../src/modules/database/database.module';
import { type Database } from '../../src/db';
import {
  organizations,
  projects,
  environments,
  sdkKeys,
} from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { hashSdkKey } from '../../src/common/utils/crypto';

describe('SSE Endpoint (e2e)', () => {
  let app: INestApplication;
  let db: Database;
  let sdkKey: string;
  let envId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    await app.init();

    db = moduleFixture.get<Database>(DATABASE);

    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function seedTestData() {
    const [org] = await db
      .insert(organizations)
      .values({ name: 'SSE Test Org', slug: 'sse-test-org' })
      .returning();

    const [project] = await db
      .insert(projects)
      .values({
        organizationId: org.id,
        name: 'SSE Test Project',
        slug: 'sse-test-project',
      })
      .returning();

    const [env] = await db
      .insert(environments)
      .values({
        projectId: project.id,
        name: 'Production',
        slug: 'production',
      })
      .returning();

    envId = env.id;
    sdkKey = `sse_test_key_${Date.now()}`;
    const keyHash = hashSdkKey(sdkKey);

    await db.insert(sdkKeys).values({
      organizationId: org.id,
      environmentId: envId,
      name: 'SSE Test Key',
      keyHash,
      keyHint: sdkKey.slice(0, 8),
      isActive: true,
    });
  }

  async function cleanupTestData() {
    if (!db) return;
    await db.delete(sdkKeys).where(eq(sdkKeys.environmentId, envId));
    await db.delete(environments).where(eq(environments.id, envId));
  }

  describe('GET /api/v1/flags/stream', () => {
    it('should return 401 without SDK key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/flags/stream')
        .expect(401);

      expect(response.body.message).toContain('Missing X-SDK-Key header');
    });

    it('should return 401 with invalid SDK key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/flags/stream')
        .set('X-SDK-Key', 'invalid-key')
        .expect(401);

      expect(response.body.message).toContain('Invalid SDK key');
    });

    it('should accept valid SDK key and return SSE headers', (done) => {
      const req = request(app.getHttpServer())
        .get('/api/v1/flags/stream')
        .set('X-SDK-Key', sdkKey)
        .buffer(false)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      req.expect(200).end((err, res) => {
        if (err) return done(err);
        expect(res.headers['content-type']).toContain('text/event-stream');
        done();
      });
    });

    it('should accept flagKey query parameter', (done) => {
      const req = request(app.getHttpServer())
        .get('/api/v1/flags/stream?flagKey=test-flag')
        .set('X-SDK-Key', sdkKey)
        .buffer(false)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      req.expect(200).end((err, res) => {
        if (err) return done(err);
        expect(res.headers['content-type']).toContain('text/event-stream');
        done();
      });
    });
  });
});
