/**
 * Feature Flag Hooks
 *
 * React Query hooks for fetching feature flags.
 * - useFeatureFlag: requires auth (for Profile, etc.)
 * - usePublicFeatureFlag: no auth (for Login, ForgotPassword, Header)
 */

import { useQuery } from '@tanstack/react-query';
import { getFeatureFlag, getPublicFeatureFlag } from '../api/featureFlags';

export const useFeatureFlag = (flagName: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featureFlag', flagName],
    queryFn: () => getFeatureFlag(flagName),
    staleTime: 60 * 1000, // 1 minute - admin toggles should propagate quickly
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    enabled: data?.data?.enabled ?? false,
    value: data?.data?.value,
    isLoading,
    error,
  };
};

/** For unauthenticated pages (Login, ForgotPassword, Header) - uses public API */
export const usePublicFeatureFlag = (flagName: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featureFlag', 'public', flagName],
    queryFn: () => getPublicFeatureFlag(flagName),
    staleTime: 60 * 1000, // 1 minute - admin toggles should propagate quickly
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    enabled: data?.data?.enabled ?? false,
    value: data?.data?.value,
    isLoading,
    error,
  };
};

