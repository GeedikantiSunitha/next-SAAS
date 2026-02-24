/**
 * Feature Flag Runtime Service
 *
 * Reads feature flags from database first (admin-toggled), with fallback to config.
 * Ensures admin Feature Flags UI changes are enforced at runtime.
 */

import { prisma } from '../config/database';
import config from '../config';

/** Map DB flag keys to config.features / config.oauth */
const CONFIG_FALLBACK: Record<string, () => boolean> = {
  password_reset: () => config.features.passwordReset,
  registration: () => config.features.registration,
  email_verification: () => config.features.emailVerification,
  google_oauth: () => config.oauth.google.enabled,
  github_oauth: () => config.oauth.github.enabled,
  microsoft_oauth: () => !!config.oauth.microsoft?.enabled,
};

/**
 * Check if a feature is enabled at runtime.
 * Reads from database first; falls back to config if flag not in DB.
 */
export const isFeatureEnabled = async (key: string): Promise<boolean> => {
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    select: { enabled: true },
  });

  if (flag !== null) {
    return flag.enabled;
  }

  const fallback = CONFIG_FALLBACK[key];
  return fallback ? fallback() : false;
};
