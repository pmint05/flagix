import { Test, TestingModule } from '@nestjs/testing';
import { FlagLoader } from './flag-loader';
import { DATABASE } from '@/modules/database/database.module';
import { FlagConfigCacheService } from './flag-config-cache.service';

describe('FlagLoader', () => {
  let loader: FlagLoader;
  let db: any;
  let cache: any;

  beforeEach(async () => {
    const mockDb = {
      query: {
        environments: {
          findFirst: jest.fn(),
        },
        featureFlags: {
          findFirst: jest.fn(),
        },
        segments: {
          findMany: jest.fn(),
        },
        flagStates: {
          findMany: jest.fn(),
        },
      },
    };

    const mockCache = {
      getFlagConfig: jest.fn(),
      setFlagConfig: jest.fn(),
      getAllFlagConfigs: jest.fn(),
      setAllFlagConfigs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlagLoader,
        { provide: DATABASE, useValue: mockDb },
        { provide: FlagConfigCacheService, useValue: mockCache },
      ],
    }).compile();

    loader = module.get<FlagLoader>(FlagLoader);
    db = module.get(DATABASE);
    cache = module.get(FlagConfigCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadFlag', () => {
    it('should return cached flag configuration if present', async () => {
      const mockFlag = { id: 'flag-1', key: 'test-flag' } as any;
      cache.getFlagConfig.mockResolvedValueOnce(mockFlag);

      const result = await loader.loadFlag('env-1', 'test-flag');

      expect(cache.getFlagConfig).toHaveBeenCalledWith('env-1', 'test-flag');
      expect(db.query.featureFlags.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual(mockFlag);
    });

    it('should query DB and return loaded flag on cache miss', async () => {
      cache.getFlagConfig.mockResolvedValueOnce(null);

      // Mock environment lookup
      db.query.environments.findFirst.mockResolvedValueOnce({
        id: 'env-1',
        projectId: 'project-1',
      });

      // Mock flag lookup
      const dbFlag = {
        id: 'flag-1',
        key: 'test-flag',
        name: 'Test Flag',
        flagType: 'boolean',
        visibility: 'all',
        flagStates: [
          {
            id: 'state-1',
            status: 'active',
            isEnabled: true,
            version: 1,
            offVariationId: 'var-false',
            defaultVariationId: 'var-true',
          },
        ],
        variations: [
          { id: 'var-true', key: 'true', value: true, isDefault: false },
          { id: 'var-false', key: 'false', value: false, isDefault: true },
        ],
        targetingRules: [],
      };
      db.query.featureFlags.findFirst.mockResolvedValueOnce(dbFlag);

      const result = await loader.loadFlag('env-1', 'test-flag');

      expect(db.query.environments.findFirst).toHaveBeenCalled();
      expect(db.query.featureFlags.findFirst).toHaveBeenCalled();
      expect(cache.setFlagConfig).toHaveBeenCalledWith(
        'env-1',
        'test-flag',
        expect.any(Object),
      );

      expect(result).toEqual({
        id: 'flag-1',
        key: 'test-flag',
        name: 'Test Flag',
        flagType: 'boolean',
        status: 'active',
        isEnabled: true,
        version: 1,
        offVariationId: 'var-false',
        defaultVariationId: 'var-true',
        variations: [
          { id: 'var-true', key: 'true', value: true, isDefault: false },
          { id: 'var-false', key: 'false', value: false, isDefault: true },
        ],
        rules: [],
        visibility: 'all',
        segments: {},
      });
    });

    it('should skip environment query if projectId is passed directly', async () => {
      cache.getFlagConfig.mockResolvedValueOnce(null);
      const dbFlag = {
        id: 'flag-1',
        key: 'test-flag',
        name: 'Test Flag',
        flagType: 'boolean',
        visibility: 'all',
        flagStates: [{ status: 'active', isEnabled: true, version: 1 }],
        variations: [],
        targetingRules: [],
      };
      db.query.featureFlags.findFirst.mockResolvedValueOnce(dbFlag);

      await loader.loadFlag('env-1', 'test-flag', 'project-1');

      expect(db.query.environments.findFirst).not.toHaveBeenCalled();
      expect(db.query.featureFlags.findFirst).toHaveBeenCalled();
    });

    it('should load related segments if targeting rules reference segments', async () => {
      cache.getFlagConfig.mockResolvedValueOnce(null);

      const dbFlag = {
        id: 'flag-1',
        key: 'test-flag',
        name: 'Test Flag',
        flagType: 'boolean',
        visibility: 'all',
        flagStates: [{ status: 'active', isEnabled: true, version: 1 }],
        variations: [],
        targetingRules: [
          {
            id: 'rule-1',
            ruleType: 'segment',
            priority: '0000',
            variationId: 'var-1',
            conditions: { segmentIds: ['seg-1'] },
            isEnabled: true,
          },
        ],
      };
      db.query.featureFlags.findFirst.mockResolvedValueOnce(dbFlag);

      db.query.segments.findMany.mockResolvedValueOnce([
        {
          id: 'seg-1',
          key: 'vip-segment',
          conditions: [{ conditionType: 'role', roles: ['vip'] }],
        },
      ]);

      const result = await loader.loadFlag('env-1', 'test-flag', 'project-1');

      expect(db.query.segments.findMany).toHaveBeenCalled();
      expect(result?.segments).toEqual({
        'seg-1': {
          id: 'seg-1',
          key: 'vip-segment',
          conditions: [{ conditionType: 'role', roles: ['vip'] }],
        },
      });
    });

    it('should return null if environment is not found', async () => {
      cache.getFlagConfig.mockResolvedValueOnce(null);
      db.query.environments.findFirst.mockResolvedValueOnce(null);

      const result = await loader.loadFlag('env-1', 'test-flag');

      expect(result).toBeNull();
    });

    it('should return null if flag state or flag is not found', async () => {
      cache.getFlagConfig.mockResolvedValueOnce(null);
      db.query.environments.findFirst.mockResolvedValueOnce({
        id: 'env-1',
        projectId: 'project-1',
      });
      db.query.featureFlags.findFirst.mockResolvedValueOnce(null);

      const result = await loader.loadFlag('env-1', 'test-flag');

      expect(result).toBeNull();
    });
  });

  describe('loadAllActiveFlags', () => {
    it('should return cached list of flags if present', async () => {
      const mockFlags = [{ id: 'flag-1', key: 'test-flag' }] as any;
      cache.getAllFlagConfigs.mockResolvedValueOnce(mockFlags);

      const result = await loader.loadAllActiveFlags('env-1');

      expect(cache.getAllFlagConfigs).toHaveBeenCalledWith('env-1');
      expect(db.query.flagStates.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(mockFlags);
    });

    it('should query DB and map active flags on cache miss', async () => {
      cache.getAllFlagConfigs.mockResolvedValueOnce(null);

      const dbFlagStates = [
        {
          id: 'state-1',
          status: 'active',
          isEnabled: true,
          version: 1,
          offVariationId: 'var-false',
          defaultVariationId: 'var-true',
          featureFlag: {
            id: 'flag-1',
            key: 'test-flag',
            name: 'Test Flag',
            flagType: 'boolean',
            visibility: 'all',
            deletedAt: null,
            variations: [
              { id: 'var-true', key: 'true', value: true, isDefault: false },
              { id: 'var-false', key: 'false', value: false, isDefault: true },
            ],
            targetingRules: [
              {
                id: 'rule-1',
                ruleType: 'segment',
                priority: '0000',
                variationId: 'var-true',
                conditions: { segmentIds: ['seg-1'] },
                isEnabled: true,
              },
            ],
          },
        },
      ];

      db.query.flagStates.findMany.mockResolvedValueOnce(dbFlagStates);
      db.query.segments.findMany.mockResolvedValueOnce([
        {
          id: 'seg-1',
          key: 'vip-segment',
          conditions: [],
        },
      ]);

      const result = await loader.loadAllActiveFlags('env-1');

      expect(db.query.flagStates.findMany).toHaveBeenCalled();
      expect(db.query.segments.findMany).toHaveBeenCalled();
      expect(cache.setAllFlagConfigs).toHaveBeenCalledWith(
        'env-1',
        expect.any(Array),
      );
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('test-flag');
      expect(result[0].segments).toEqual({
        'seg-1': { id: 'seg-1', key: 'vip-segment', conditions: [] },
      });
    });
  });
});
