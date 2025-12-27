/**
 * Feature Flags API
 * 
 * Client-side API for fetching feature flags from backend
 */

import apiClient from './client';

export interface FeatureFlagResponse {
  enabled: boolean;
  value?: string | number | boolean;
}

/**
 * Get feature flag status from backend
 */
export const getFeatureFlag = async (flagName: string): Promise<{ data: FeatureFlagResponse }> => {
  const response = await apiClient.get(`/api/feature-flags/${flagName}`);
  return response.data;
};

/**
 * Get all feature flags from backend
 */
export const getAllFeatureFlags = async (): Promise<{ data: Record<string, FeatureFlagResponse> }> => {
  const response = await apiClient.get('/api/feature-flags');
  return response.data;
};

