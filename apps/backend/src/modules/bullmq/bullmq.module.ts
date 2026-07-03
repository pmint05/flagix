import { Global, Module, type OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

export const IOREDIS = Symbol('IOREDIS');
export const IOREDIS_SUB = Symbol('IOREDIS_SUB');
export const IOREDIS_PUB = Symbol('IOREDIS_PUB');
export const IOREDIS_CACHE = Symbol('IOREDIS_CACHE');
export const EVALUATION_QUEUE = Symbol('EVALUATION_QUEUE');
export const EVALUATION_QUEUE_NAME = 'evaluation-events';

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

function createEvaluationQueue(redis: Redis): Queue {
  return new Queue(EVALUATION_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 1000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    },
  });
}

@Global()
@Module({
  providers: [
    {
      provide: IOREDIS,
      useFactory: createRedisClient,
    },
    {
      provide: IOREDIS_SUB,
      useFactory: createRedisClient,
    },
    {
      provide: IOREDIS_PUB,
      useFactory: createRedisClient,
    },
    {
      provide: IOREDIS_CACHE,
      useFactory: createRedisClient,
    },
    {
      provide: EVALUATION_QUEUE,
      useFactory: createEvaluationQueue,
      inject: [IOREDIS],
    },
  ],
  exports: [IOREDIS, IOREDIS_SUB, IOREDIS_PUB, IOREDIS_CACHE, EVALUATION_QUEUE],
})
export class BullMQModule implements OnModuleDestroy {
  constructor(
    @Inject(IOREDIS) private readonly redis: Redis,
    @Inject(IOREDIS_SUB) private readonly redisSub: Redis,
    @Inject(IOREDIS_PUB) private readonly redisPub: Redis,
    @Inject(IOREDIS_CACHE) private readonly redisCache: Redis,
  ) {}

  async onModuleDestroy() {
    await Promise.all([
      this.redis.quit(),
      this.redisSub.quit(),
      this.redisPub.quit(),
      this.redisCache.quit(),
    ]);
  }
}
