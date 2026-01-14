/**
 * Admin Settings Service
 * 
 * Provides system settings management for admin dashboard
 */

import { createAuditLog } from './auditService';
import config from '../config';

/**
 * Get system settings
 */
export const getSettings = async (adminUserId: string) => {
  // Return current system settings
  // In a real implementation, these would be stored in database
  const settings = {
    app: {
      name: config.appName,
      url: config.frontendUrl,
      environment: config.nodeEnv,
    },
    features: {
      registration: config.features.registration,
      oauth: {
        google: config.oauth?.google?.enabled || false,
        github: config.oauth?.github?.enabled || false,
        microsoft: config.oauth?.microsoft?.enabled || false,
      },
    },
    security: {
      jwtExpiry: config.jwt.expiresIn,
      refreshTokenExpiry: config.jwt.refreshExpiresIn,
    },
    email: {
      enabled: !!config.email?.apiKey,
      provider: 'resend', // Email provider is always Resend in this implementation
    },
  };

  await createAuditLog({
    userId: adminUserId,
    action: 'SETTINGS_VIEWED',
    resource: 'settings',
  });

  return { settings };
};

/**
 * Update system settings
 */
export const updateSettings = async (
  settings: Record<string, any>,
  adminUserId: string
) => {
  // In a real implementation, this would update database or config
  // For now, we'll just log the action
  await createAuditLog({
    userId: adminUserId,
    action: 'SETTINGS_UPDATED',
    resource: 'settings',
    details: { changes: Object.keys(settings) },
  });

  return {
    settings,
    message: 'Settings updated (requires server restart to take effect)',
  };
};

