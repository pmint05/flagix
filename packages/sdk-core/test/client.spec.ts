import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlagixClient } from '../src/client';
import { SseClient } from '../src/sse';

vi.mock('../src/sse', () => {
  return {
    SseClient: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      close: vi.fn(),
    })),
  };
});

describe('FlagixClient', () => {
  const config = {
    sdkKey: 'test-key',
    baseUrl: 'http://localhost:3000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Mock EventSource if needed, but we focus on core logic
  });

  it('should initialize and fetch all flags', async () => {
    const mockResponse = {
      flags: [
        { flagKey: 'feature-1', enabled: true, resolvedValue: true, variationKey: 'on', evaluationReason: 'DEFAULT' },
        { flagKey: 'feature-2', enabled: false, resolvedValue: 'off', variationKey: 'off', evaluationReason: 'DEFAULT' },
      ]
    };
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const client = new FlagixClient(config);
    await client.init({ userId: 'user-1' });

    expect(client.getFlagValue('feature-1', false)).toBe(true);
    expect(client.getFlagValue('feature-2', 'default')).toBe('off');
    expect(client.getFlagValue('non-existent', 'fallback')).toBe('fallback');
  });

  it('should handle setContext and clear cache', async () => {
    const client = new FlagixClient(config);
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ flags: [{ flagKey: 'f1', resolvedValue: 'v1' }] }),
    });

    await client.init({ userId: 'user-1' });
    expect(client.getFlagValue('f1', 'none')).toBe('v1');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ flags: [{ flagKey: 'f1', resolvedValue: 'v2' }] }),
    });

    await client.setContext({ userId: 'user-2' });
    expect(client.getFlagValue('f1', 'none')).toBe('v2');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should be resilient to network errors (Fail-Safe)', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Connection refused'));

    const client = new FlagixClient(config);
    
    // Should not throw
    await expect(client.init({ userId: 'user-1' })).resolves.not.toThrow();
    
    expect(client.getFlagValue('any-flag', 'fallback')).toBe('fallback');
  });

  it('should be resilient to malformed JSON responses', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('SyntaxError'); },
    });

    const client = new FlagixClient(config);
    await client.init({ userId: 'user-1' });

    expect(client.getFlagValue('any-flag', 'fallback')).toBe('fallback');
  });
});
