/**
 * Feature Flag Hook
 * 
 * React Query hook for fetching feature flags
 */

import { useQuery } from '@tanstack/react-query';
import { getFeatureFlag } from '../api/featureFlags';

export const useFeatureFlag = (flagName: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featureFlag', flagName],
    queryFn: () => getFeatureFlag(flagName),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return {
    enabled: data?.data?.enabled ?? false,
    value: data?.data?.value,
    isLoading,
    error,
  };
};

