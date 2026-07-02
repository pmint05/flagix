import { EvaluationCollectorWorker } from './evaluation-collector.worker';
import { EvaluationEventsRepository } from '@/modules/evaluation-events/evaluation-events.repository';

let capturedHandler: ((job: { data: any }) => Promise<void>) | null = null;

jest.mock('bullmq', () => {
  const actual = jest.requireActual('bullmq');
  return {
    ...actual,
    Worker: jest.fn().mockImplementation((_name: string, handler: any, _opts: any) => {
      capturedHandler = handler;
      return { on: jest.fn(), close: jest.fn() };
    }),
  };
});

const mockJobData = {
  organizationId: 'org-1',
  projectId: 'proj-1',
  environmentId: 'env-1',
  featureFlagId: 'flag-1',
  flagKey: 'test-flag',
  variationId: null,
  variationKey: 'on',
  resolvedValue: true,
  evaluationReason: 'DEFAULT',
  contextUserHash: 'hash12345',
  sdkKeyId: 'sdk-1',
  clientIpHash: 'hash67890',
  timestamp: '2026-07-02T12:00:00.000Z',
};

async function processJob(data: any) {
  if (!capturedHandler) throw new Error('Worker not initialized');
  return capturedHandler({ data });
}

describe('EvaluationCollectorWorker', () => {
  let worker: EvaluationCollectorWorker;
  let mockRepository: jest.Mocked<EvaluationEventsRepository>;
  let mockRedis: { publish: jest.Mock };

  beforeEach(() => {
    capturedHandler = null;
    jest.clearAllMocks();

    mockRepository = {
      batchInsert: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockRedis = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    worker = new EvaluationCollectorWorker(mockRedis as any, mockRepository);
    worker.onModuleInit();
  });

  describe('batch insert and flush', () => {
    it('should add jobs to buffer via handler', async () => {
      await processJob(mockJobData);
      await processJob({ ...mockJobData, flagKey: 'flag-2' });

      expect((worker as any).buffer.length).toBe(2);
      expect((worker as any).buffer[0].flagKey).toBe('test-flag');
      expect((worker as any).buffer[1].flagKey).toBe('flag-2');
    });

    it('should batch insert when buffer reaches FLUSH_SIZE', async () => {
      for (let i = 0; i < (worker as any).FLUSH_SIZE; i++) {
        await processJob({ ...mockJobData, flagKey: `flag-${i}` });
      }

      expect(mockRepository.batchInsert).toHaveBeenCalledTimes(1);
      const batch = (mockRepository.batchInsert as jest.Mock).mock.calls[0][0];
      expect(batch.length).toBe((worker as any).FLUSH_SIZE);
    });

    it('should not flush before buffer reaches threshold', async () => {
      await processJob(mockJobData);

      expect(mockRepository.batchInsert).not.toHaveBeenCalled();
    });

    it('should map job data to insert format correctly', async () => {
      await processJob(mockJobData);
      await (worker as any).flush();

      const batch = (mockRepository.batchInsert as jest.Mock).mock.calls[0][0];
      expect(batch[0]).toEqual({
        organizationId: 'org-1',
        projectId: 'proj-1',
        environmentId: 'env-1',
        featureFlagId: 'flag-1',
        flagKey: 'test-flag',
        variationId: null,
        variationKey: 'on',
        resolvedValue: true,
        evaluationReason: 'DEFAULT',
        contextUserHash: 'hash12345',
        sdkKeyId: 'sdk-1',
        clientIpHash: 'hash67890',
      });
    });

    it('should clear buffer after successful flush', async () => {
      await processJob(mockJobData);
      expect((worker as any).buffer.length).toBe(1);

      await (worker as any).flush();
      expect((worker as any).buffer.length).toBe(0);
    });

    it('should handle batch insert errors gracefully', async () => {
      mockRepository.batchInsert = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      for (let i = 0; i < (worker as any).FLUSH_SIZE; i++) {
        await processJob({ ...mockJobData, flagKey: `flag-${i}` });
      }

      await expect(
        (worker as any).flush(),
      ).resolves.toBeUndefined();
    });
  });

  describe('Redis pub/sub publishing', () => {
    it('should publish event to Redis on each job', async () => {
      await processJob(mockJobData);

      expect(mockRedis.publish).toHaveBeenCalledTimes(1);
      const [channel, message] = (mockRedis.publish as jest.Mock).mock.calls[0];
      expect(channel).toBe('analytics:evaluations');

      const parsed = JSON.parse(message);
      expect(parsed.flagKey).toBe('test-flag');
      expect(parsed.variationKey).toBe('on');
      expect(parsed.organizationId).toBe('org-1');
      expect(parsed.contextUserHash).toBe('hash12345');
    });

    it('should handle Redis publish errors gracefully', async () => {
      mockRedis.publish = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection lost'));

      await expect(
        processJob(mockJobData),
      ).resolves.toBeUndefined();
    });
  });

  describe('timer-based flush', () => {
    it('should register a flush interval on init', () => {
      jest.useFakeTimers();
      const clearSpy = jest.spyOn(global, 'setInterval');

      worker.onModuleInit();

      expect(clearSpy).toHaveBeenCalledWith(
        expect.any(Function),
        (worker as any).FLUSH_INTERVAL_MS,
      );

      clearSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});
