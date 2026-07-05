import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from './evaluation.service';
import { FlagLoader } from './flag-loader';
import { evaluate } from './evaluation.engine';
import { simulate } from './evaluation.simulator';
import { buildSafeDefault, LoadedFlag } from './safe-default.util';

jest.mock('./evaluation.engine', () => ({
  evaluate: jest.fn(),
}));

jest.mock('./evaluation.simulator', () => ({
  simulate: jest.fn(),
}));

describe('EvaluationService', () => {
  let service: EvaluationService;
  let flagLoader: any;

  beforeEach(async () => {
    const mockFlagLoader = {
      loadFlag: jest.fn(),
      loadAllActiveFlags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationService,
        { provide: FlagLoader, useValue: mockFlagLoader },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
    flagLoader = module.get(FlagLoader);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateFlag', () => {
    const mockFlag: LoadedFlag = {
      id: 'flag-1',
      key: 'test-flag',
      name: 'Test Flag',
      flagType: 'boolean',
      status: 'active',
      isEnabled: true,
      version: 1,
      visibility: 'all',
      variations: [],
      rules: [],
    };

    it('should load flag and evaluate it', async () => {
      flagLoader.loadFlag.mockResolvedValueOnce(mockFlag);
      (evaluate as jest.Mock).mockReturnValueOnce({
        flagKey: 'test-flag',
        enabled: true,
        variationKey: 'true',
        resolvedValue: true,
        evaluationReason: 'DEFAULT',
      });

      const result = await service.evaluateFlag('env-1', 'test-flag', { userId: 'user-1' });

      expect(flagLoader.loadFlag).toHaveBeenCalledWith('env-1', 'test-flag', undefined);
      expect(evaluate).toHaveBeenCalledWith(mockFlag, { userId: 'user-1' });
      expect(result.enabled).toBe(true);
    });

    it('should return FLAG_NOT_FOUND if flag is not loaded', async () => {
      flagLoader.loadFlag.mockResolvedValueOnce(null);

      const result = await service.evaluateFlag('env-1', 'test-flag', { userId: 'user-1' });

      expect(result.evaluationReason).toBe('FLAG_NOT_FOUND');
      expect(result.enabled).toBe(false);
    });

    it('should return FLAG_NOT_FOUND if keyType is client but flag is server_only', async () => {
      const serverFlag = { ...mockFlag, visibility: 'server_only' };
      flagLoader.loadFlag.mockResolvedValueOnce(serverFlag);

      const result = await service.evaluateFlag('env-1', 'test-flag', { userId: 'user-1' }, 'client');

      expect(result.evaluationReason).toBe('FLAG_NOT_FOUND');
      expect(evaluate).not.toHaveBeenCalled();
    });

    it('should return FLAG_NOT_FOUND if keyType is server but flag is client_only', async () => {
      const clientFlag = { ...mockFlag, visibility: 'client_only' };
      flagLoader.loadFlag.mockResolvedValueOnce(clientFlag);

      const result = await service.evaluateFlag('env-1', 'test-flag', { userId: 'user-1' }, 'server');

      expect(result.evaluationReason).toBe('FLAG_NOT_FOUND');
      expect(evaluate).not.toHaveBeenCalled();
    });

    it('should catch error and return EVALUATION_ERROR', async () => {
      flagLoader.loadFlag.mockRejectedValueOnce(new Error('DB connection failed'));

      const result = await service.evaluateFlag('env-1', 'test-flag', { userId: 'user-1' });

      expect(result.evaluationReason).toBe('EVALUATION_ERROR');
    });
  });

  describe('evaluateAllFlags', () => {
    const mockFlags: LoadedFlag[] = [
      {
        id: 'flag-1',
        key: 'flag-1',
        name: 'Flag 1',
        flagType: 'boolean',
        status: 'active',
        isEnabled: true,
        version: 1,
        visibility: 'all',
        variations: [],
        rules: [],
      },
      {
        id: 'flag-2',
        key: 'flag-2',
        name: 'Flag 2',
        flagType: 'boolean',
        status: 'active',
        isEnabled: true,
        version: 1,
        visibility: 'server_only',
        variations: [],
        rules: [],
      },
      {
        id: 'flag-3',
        key: 'flag-3',
        name: 'Flag 3',
        flagType: 'boolean',
        status: 'active',
        isEnabled: true,
        version: 1,
        visibility: 'client_only',
        variations: [],
        rules: [],
      },
    ];

    it('should load all active flags and evaluate them', async () => {
      flagLoader.loadAllActiveFlags.mockResolvedValueOnce(mockFlags);
      (evaluate as jest.Mock).mockImplementation((flag) => ({
        flagKey: flag.key,
        enabled: true,
        variationKey: 'true',
        resolvedValue: true,
        evaluationReason: 'DEFAULT',
      }));

      const results = await service.evaluateAllFlags('env-1', { userId: 'user-1' });

      expect(results.length).toBe(3);
      expect(results.map((r) => r.flagKey)).toEqual(['flag-1', 'flag-2', 'flag-3']);
    });

    it('should filter out server_only flags if keyType is client', async () => {
      flagLoader.loadAllActiveFlags.mockResolvedValueOnce(mockFlags);
      (evaluate as jest.Mock).mockImplementation((flag) => ({
        flagKey: flag.key,
        enabled: true,
      }));

      const results = await service.evaluateAllFlags('env-1', { userId: 'user-1' }, 'client');

      expect(results.length).toBe(2);
      expect(results.map((r) => r.flagKey)).toEqual(['flag-1', 'flag-3']);
    });

    it('should filter out client_only flags if keyType is server', async () => {
      flagLoader.loadAllActiveFlags.mockResolvedValueOnce(mockFlags);
      (evaluate as jest.Mock).mockImplementation((flag) => ({
        flagKey: flag.key,
        enabled: true,
      }));

      const results = await service.evaluateAllFlags('env-1', { userId: 'user-1' }, 'server');

      expect(results.length).toBe(2);
      expect(results.map((r) => r.flagKey)).toEqual(['flag-1', 'flag-2']);
    });

    it('should handle evaluation failure for a single flag and return its safe default without failing others', async () => {
      flagLoader.loadAllActiveFlags.mockResolvedValueOnce(mockFlags);
      (evaluate as jest.Mock)
        .mockReturnValueOnce({ flagKey: 'flag-1', enabled: true })
        .mockImplementationOnce(() => {
          throw new Error('Eval crash');
        })
        .mockReturnValueOnce({ flagKey: 'flag-3', enabled: true });

      const results = await service.evaluateAllFlags('env-1', { userId: 'user-1' });

      expect(results.length).toBe(3);
      expect(results[1].evaluationReason).toBe('EVALUATION_ERROR');
    });
  });

  describe('simulateFlag', () => {
    const mockFlag: LoadedFlag = {
      id: 'flag-1',
      key: 'test-flag',
      name: 'Test Flag',
      flagType: 'boolean',
      status: 'active',
      isEnabled: true,
      version: 1,
      visibility: 'all',
      variations: [
        { id: 'var-1', key: 'true', value: true, isDefault: true },
      ],
      rules: [],
    };

    it('should simulate flag evaluation with draft overrides', async () => {
      flagLoader.loadFlag.mockResolvedValueOnce({ ...mockFlag });
      (simulate as jest.Mock).mockResolvedValueOnce({
        evaluatedResult: { flagKey: 'test-flag', enabled: false },
        rules: [],
      });

      const draftConfig = {
        isEnabled: false,
        status: 'draft',
        defaultVariationId: 'var-1',
        offVariationId: 'var-1',
        variations: [{ id: 'var-1', key: 'true', value: true, isDefault: true }],
        rules: [
          {
            ruleType: 'user' as const,
            variationId: 'var-1',
            conditions: { userIds: ['user-1'] },
            isEnabled: true,
          },
        ],
      };

      const result = await service.simulateFlag('env-1', 'test-flag', { userId: 'user-1' }, draftConfig);

      expect(simulate).toHaveBeenCalledWith(
        expect.objectContaining({
          isEnabled: false,
          status: 'draft',
          defaultVariationId: 'var-1',
          offVariationId: 'var-1',
          rules: [
            expect.objectContaining({
              ruleType: 'user',
              variationId: 'var-1',
              isEnabled: true,
            }),
          ],
        }),
        { userId: 'user-1' },
        { bypassDraft: undefined },
      );
      expect(result.evaluatedResult.enabled).toBe(false);
    });
  });
});
