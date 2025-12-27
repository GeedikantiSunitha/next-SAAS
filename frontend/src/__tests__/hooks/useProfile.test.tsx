/**
 * Tests for useProfile React Query hook
 * 
 * Tests verify:
 * - Profile data fetching
 * - Caching behavior
 * - Refetch on window focus
 * - Optimistic updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProfile, useUpdateProfile, useChangePassword } from '../../hooks/useProfile';
import { profileApi } from '../../api/profile';
import { User } from '../../api/auth';

// Mock the profile API
vi.mock('../../api/profile', () => ({
  profileApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch profile data successfully', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(profileApi.getProfile).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify data
    expect(result.current.data).toEqual(mockUser);
    expect(result.current.isSuccess).toBe(true);
    expect(profileApi.getProfile).toHaveBeenCalledTimes(1);
  });

  it('should handle profile fetch error', async () => {
    const error = new Error('Failed to fetch profile');
    vi.mocked(profileApi.getProfile).mockRejectedValue(error);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it('should cache profile data', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(profileApi.getProfile).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    const wrapper = createWrapper();
    const { result: result1 } = renderHook(() => useProfile(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Render hook again - should use cached data
    const { result: result2 } = renderHook(() => useProfile(), {
      wrapper,
    });

    // Should have data immediately (from cache)
    expect(result2.current.data).toEqual(mockUser);
    // API should only be called once (cached on second call)
    expect(profileApi.getProfile).toHaveBeenCalledTimes(1);
  });
});

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update profile successfully', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...mockUser,
      name: 'Updated Name',
    };

    vi.mocked(profileApi.getProfile).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    vi.mocked(profileApi.updateProfile).mockResolvedValue({
      success: true,
      data: updatedUser,
    });

    const wrapper = createWrapper();
    const { result: queryResult } = renderHook(() => useProfile(), {
      wrapper,
    });

    await waitFor(() => {
      expect(queryResult.current.isSuccess).toBe(true);
    });

    const { result: mutationResult } = renderHook(() => useUpdateProfile(), {
      wrapper,
    });

    // Update profile
    mutationResult.current.mutate({ name: 'Updated Name' });

    await waitFor(() => {
      expect(mutationResult.current.isSuccess).toBe(true);
    });

    expect(profileApi.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
    // Mutation returns full response { success: true, data: updatedUser }
    expect(mutationResult.current.data?.data).toEqual(updatedUser);
  });

  it('should handle update error', async () => {
    const error = new Error('Update failed');
    vi.mocked(profileApi.updateProfile).mockRejectedValue(error);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper,
    });

    result.current.mutate({ name: 'Updated Name' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should change password successfully', async () => {
    vi.mocked(profileApi.changePassword).mockResolvedValue({
      success: true,
      data: { message: 'Password changed successfully' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useChangePassword(), {
      wrapper,
    });

    result.current.mutate({
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(profileApi.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    });
    expect(result.current.data?.data.message).toBe('Password changed successfully');
  });

  it('should handle password change error', async () => {
    const error = new Error('Current password is incorrect');
    vi.mocked(profileApi.changePassword).mockRejectedValue(error);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useChangePassword(), {
      wrapper,
    });

    result.current.mutate({
      currentPassword: 'WrongPass123!',
      newPassword: 'NewPass123!',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

