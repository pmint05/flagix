import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FlagixProvider, useFlag } from '../src';
import { FlagixClient } from '@flagix/sdk-core';

// Simple mock for FlagixClient to avoid complex setup
vi.mock('@flagix/sdk-core', async () => {
  const actual = await vi.importActual('@flagix/sdk-core');
  return {
    ...actual,
    FlagixClient: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(() => {}),
      getAllFlags: vi.fn().mockReturnValue({}),
      getFlagValue: vi.fn().mockReturnValue('mocked'),
    })),
  };
});

describe('useFlag', () => {
  it('should return value from client', () => {
    const client = new FlagixClient({ sdkKey: 'test' });
    (client.getAllFlags as any).mockReturnValue({
      'test-flag': { flagKey: 'test-flag', resolvedValue: 'on' }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlagixProvider client={client}>{children}</FlagixProvider>
    );

    const { result } = renderHook(() => useFlag('test-flag', 'off'), { wrapper });
    expect(result.current.value).toBe('on');
  });

  it('should return default value if flag not found', () => {
    const client = new FlagixClient({ sdkKey: 'test' });
    (client.getAllFlags as any).mockReturnValue({});

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlagixProvider client={client}>{children}</FlagixProvider>
    );

    const { result } = renderHook(() => useFlag('unknown-flag', 'fallback'), { wrapper });
    expect(result.current.value).toBe('fallback');
  });
});
