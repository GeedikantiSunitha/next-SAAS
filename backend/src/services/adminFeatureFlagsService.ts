/**
 * Admin Feature Flags Service
 * 
 * Provides feature flags management for admin dashboard
 * Feature flags are stored in database and can be updated dynamically
 */

import { prisma } from '../config/database';
import { createAuditLog } from './auditService';

/**
 * Get all feature flags from database
 */
export const getAllFeatureFlags = async (adminUserId: string) => {
  // Get all feature flags from database
  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: 'asc' },
    select: {
      key: true,
      enabled: true,
      description: true,
      updatedAt: true,
      updatedBy: true,
    },
  });

  // Create audit log
  await createAuditLog({
    userId: adminUserId,
    action: 'FEATURE_FLAGS_VIEWED',
    resource: 'feature_flags',
  });

  return { flags };
};

/**
 * Update feature flag (creates if doesn't exist)
 */
export const updateFeatureFlag = async (
  key: string,
  enabled: boolean,
  adminUserId: string
) => {
  // Upsert feature flag (create if doesn't exist, update if exists)
  const flag = await prisma.featureFlag.upsert({
    where: { key },
    update: {
      enabled,
      updatedBy: adminUserId,
      updatedAt: new Date(),
    },
    create: {
      key,
      enabled,
      updatedBy: adminUserId,
      description: `Feature flag: ${key}`,
    },
  });

  // Create audit log
  await createAuditLog({
    userId: adminUserId,
    action: 'FEATURE_FLAG_UPDATED',
    resource: 'feature_flags',
    resourceId: key,
    details: { key, enabled, previousEnabled: !enabled },
  });

  return {
    key: flag.key,
    enabled: flag.enabled,
    message: 'Feature flag updated successfully',
  };
};

