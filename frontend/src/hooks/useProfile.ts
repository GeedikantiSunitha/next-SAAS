/**
 * React Query hooks for Profile API
 * 
 * Provides:
 * - useProfile: Fetch user profile (with caching)
 * - useUpdateProfile: Update profile (with optimistic updates)
 * - useChangePassword: Change password
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, UpdateProfileRequest, ChangePasswordRequest } from '../api/profile';
import { User } from '../api/auth';

// Query keys for React Query
export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch user profile
 * 
 * Features:
 * - Automatic caching
 * - Refetch on window focus (if enabled)
 * - Error handling
 */
export const useProfile = () => {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: async () => {
      const response = await profileApi.getProfile();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
  });
};

/**
 * Hook to update user profile
 * 
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Error handling
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await profileApi.updateProfile(data);
      return response;
    },
    onSuccess: (response) => {
      // Update cache with new data
      queryClient.setQueryData<User>(profileKeys.detail(), response.data);
      // Optionally refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
};

/**
 * Hook to change password
 * 
 * Features:
 * - Error handling
 * - Success/error callbacks
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await profileApi.changePassword(data);
      return response;
    },
  });
};

