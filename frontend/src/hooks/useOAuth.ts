/**
 * React Query hooks for OAuth API
 * 
 * Provides:
 * - useOAuthMethods: Fetch user's linked OAuth methods
 * - useLinkOAuth: Link OAuth provider to account
 * - useUnlinkOAuth: Unlink OAuth provider from account
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';

// Query keys for React Query
export const oauthKeys = {
  all: ['oauth'] as const,
  methods: () => [...oauthKeys.all, 'methods'] as const,
};

/**
 * Hook to fetch user's linked OAuth methods
 */
export const useOAuthMethods = () => {
  return useQuery({
    queryKey: oauthKeys.methods(),
    queryFn: async () => {
      const response = await authApi.getOAuthMethods();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

/**
 * Hook to link OAuth provider to account
 */
export const useLinkOAuth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ provider, token }: { provider: 'google' | 'github'; token: string }) => {
      const response = await authApi.linkOAuth(provider, token);
      return response;
    },
    onSuccess: () => {
      // Invalidate OAuth methods cache to refetch
      queryClient.invalidateQueries({ queryKey: oauthKeys.methods() });
      // Also invalidate profile to get updated user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

/**
 * Hook to unlink OAuth provider from account
 */
export const useUnlinkOAuth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: 'google' | 'github') => {
      const response = await authApi.unlinkOAuth(provider);
      return response;
    },
    onSuccess: () => {
      // Invalidate OAuth methods cache to refetch
      queryClient.invalidateQueries({ queryKey: oauthKeys.methods() });
      // Also invalidate profile to get updated user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
