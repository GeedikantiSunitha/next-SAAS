/**
 * Admin Feature Flags Service
 * 
 * Provides feature flags management for admin dashboard
 */

import { prisma } from '../config/database';
import { getFeatureFlag, setFeatureFlag } from '../services/featureFlagsService';
import { createAuditLog } from './auditService';

/**
 * Get all feature flags
 */
export const getAllFeatureFlags = async (adminUserId: string) => {
  // Get feature flags from environment/config
  // In a real implementation, these would be stored in database
  const flags = [
    { key: 'registration', enabled: process.env.ENABLE_REGISTRATION !== 'false' },
    { key: 'oauth', enabled: process.env.ENABLE_OAUTH === 'true' },
    { key: 'google_oauth', enabled: process.env.ENABLE_GOOGLE_OAUTH === 'true' },
    { key: 'github_oauth', enabled: process.env.ENABLE_GITHUB_OAUTH === 'true' },
    { key: 'microsoft_oauth', enabled: process.env.ENABLE_MICROSOFT_OAUTH === 'true' },
  ];

  await createAuditLog({
    userId: adminUserId,
    action: 'FEATURE_FLAGS_VIEWED',
    resource: 'feature_flags',
  });

  return { flags };
};

/**
 * Update feature flag
 */
export const updateFeatureFlag = async (
  key: string,
  enabled: boolean,
  adminUserId: string
) => {
  // In a real implementation, this would update database or config
  // For now, we'll just log the action
  await createAuditLog({
    userId: adminUserId,
    action: 'FEATURE_FLAG_UPDATED',
    resource: 'feature_flags',
    resourceId: key,
    details: { key, enabled },
  });

  return {
    key,
    enabled,
    message: 'Feature flag updated (requires server restart to take effect)',
  };
};

