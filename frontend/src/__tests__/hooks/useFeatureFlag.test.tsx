/**
 * Feature Flag Hook Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import * as featureFlagsApi from '../../api/featureFlags';

// Mock the API
vi.mock('../../api/featureFlags', () => ({
  getFeatureFlag: vi.fn(),
  getAllFeatureFlags: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when feature is enabled', async () => {
    vi.mocked(featureFlagsApi.getFeatureFlag).mockResolvedValue({ data: { enabled: true } });

    const { result } = renderHook(() => useFeatureFlag('NEW_DASHBOARD'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.enabled).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return false when feature is disabled', async () => {
    vi.mocked(featureFlagsApi.getFeatureFlag).mockResolvedValue({ data: { enabled: false } });

    const { result } = renderHook(() => useFeatureFlag('NEW_DASHBOARD'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.enabled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return false by default when API fails', async () => {
    vi.mocked(featureFlagsApi.getFeatureFlag).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useFeatureFlag('NEW_DASHBOARD'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.enabled).toBe(false);
  });

  it('should show loading state initially', () => {
    vi.mocked(featureFlagsApi.getFeatureFlag).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useFeatureFlag('NEW_DASHBOARD'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.enabled).toBe(false);
  });
});

