import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { EvaluationCollectorService } from './evaluation-collector.service';
import { EVALUATION_QUEUE } from '@/modules/bullmq/bullmq.module';
import { hashUserId, hashClientIp } from '@/common/utils/crypto';

jest.mock('@/common/utils/crypto', () => ({
  hashUserId: jest.fn((v: string) => `hash_user_${v}`),
  hashClientIp: jest.fn((v: string) => `hash_ip_${v}`),
  generateRawKey: jest.fn(),
  hashSdkKey: jest.fn(),
  hashSha256: jest.fn(),
}));

import type { EvaluationResult } from '@flagix/shared';

const mockEvaluationResult: EvaluationResult = {
  flagKey: 'test-flag',
  variationKey: 'on',
  resolvedValue: true,
  evaluationReason: 'DEFAULT',
  enabled: true,
};

const mockMeta = {
  organizationId: 'org-1',
  projectId: 'proj-1',
  environmentId: 'env-1',
  featureFlagId: 'flag-1',
  sdkKeyId: 'sdk-1',
  clientIp: '192.168.1.1',
  contextUserId: 'user-1',
};

describe('EvaluationCollectorService', () => {
  let service: EvaluationCollectorService;
  let mockQueue: jest.Mocked<Pick<Queue, 'add'>>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationCollectorService,
        { provide: EVALUATION_QUEUE, useValue: mockQueue },
      ],
    }).compile();

    service = module.get<EvaluationCollectorService>(EvaluationCollectorService);
    jest.clearAllMocks();
  });

  describe('record', () => {
    it('should hash userId and clientIp before enqueueing', async () => {
      await service.record(mockEvaluationResult, mockMeta);

      expect(hashUserId).toHaveBeenCalledWith('user-1');
      expect(hashClientIp).toHaveBeenCalledWith('192.168.1.1');

      const expectedPayload = expect.objectContaining({
        organizationId: 'org-1',
        projectId: 'proj-1',
        environmentId: 'env-1',
        featureFlagId: 'flag-1',
        flagKey: 'test-flag',
        variationId: null,
        variationKey: 'on',
        resolvedValue: true,
        evaluationReason: 'DEFAULT',
        contextUserHash: 'hash_user_user-1',
        sdkKeyId: 'sdk-1',
        clientIpHash: 'hash_ip_192.168.1.1',
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'evaluation-event',
        expectedPayload,
        expect.objectContaining({
          removeOnComplete: true,
          attempts: 3,
        }),
      );
    });

    it('should set hashes to null when contextUserId is missing', async () => {
      await service.record(mockEvaluationResult, {
        ...mockMeta,
        contextUserId: undefined,
        clientIp: undefined,
      });

      const callArg = (mockQueue.add as jest.Mock).mock.calls[0][1];
      expect(callArg.contextUserHash).toBeNull();
      expect(callArg.clientIpHash).toBeNull();
    });

    it('should set featureFlagId and sdkKeyId to null when undefined', async () => {
      await service.record(mockEvaluationResult, {
        organizationId: 'org-1',
        projectId: 'proj-1',
        environmentId: 'env-1',
      });

      const callArg = (mockQueue.add as jest.Mock).mock.calls[0][1];
      expect(callArg.featureFlagId).toBeNull();
      expect(callArg.sdkKeyId).toBeNull();
    });

    it('should include a timestamp in the payload', async () => {
      const beforeTime = new Date().toISOString();
      await service.record(mockEvaluationResult, mockMeta);
      const callArg = (mockQueue.add as jest.Mock).mock.calls[0][1];
      const afterTime = new Date().toISOString();

      expect(typeof callArg.timestamp).toBe('string');
      expect(callArg.timestamp).toBeTruthy();
    });

    it('should not throw when queue.add fails (fire-and-forget)', async () => {
      mockQueue.add = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection error'));

      await expect(
        service.record(mockEvaluationResult, mockMeta),
      ).resolves.toBeUndefined();
    });

    it('should pass correct BullMQ job options', async () => {
      await service.record(mockEvaluationResult, mockMeta);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'evaluation-event',
        expect.any(Object),
        {
          removeOnComplete: true,
          removeOnFail: 1000,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      );
    });
  });

  describe('recordBatch', () => {
    it('should enqueue each result individually', async () => {
      const results = [
        { ...mockEvaluationResult, flagKey: 'flag-1' },
        { ...mockEvaluationResult, flagKey: 'flag-2' },
        { ...mockEvaluationResult, flagKey: 'flag-3' },
      ];

      const featureFlagIdMap = new Map([
        ['flag-1', 'ff-id-1'],
        ['flag-2', 'ff-id-2'],
        ['flag-3', 'ff-id-3'],
      ]);

      await service.recordBatch(results, {
        ...mockMeta,
        featureFlagIdMap,
      });

      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should map featureFlagId per result', async () => {
      const results = [
        { ...mockEvaluationResult, flagKey: 'flag-a' },
      ];

      const featureFlagIdMap = new Map([['flag-a', 'ff-id-a']]);

      await service.recordBatch(results, {
        ...mockMeta,
        featureFlagIdMap,
      });

      const callArg = (mockQueue.add as jest.Mock).mock.calls[0][1];
      expect(callArg.featureFlagId).toBe('ff-id-a');
    });
  });
});
