/**
 * Service for managing consent versions
 * Handles version tracking, comparisons, and re-consent workflows
 */

import { ConsentType } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * Create a new consent version
 * Automatically deactivates previous active version if needed
 */
export async function createConsentVersion(
  consentType: ConsentType,
  version: string,
  title: string,
  content: string,
  options: {
    summary?: string;
    effectiveDate?: Date;
    expiryPeriod?: number;
    requiresReConsent?: boolean;
    changes?: string;
    isActive?: boolean;
    createdBy?: string;
  } = {}
) {
  // Validate version format (semver)
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(version)) {
    throw new Error('Version must follow semver format (e.g., 1.0.0)');
  }

  // Check if version already exists
  const existing = await prisma.consentVersion.findUnique({
    where: {
      consentType_version: {
        consentType,
        version,
      },
    },
  });

  if (existing) {
    throw new Error(`Version ${version} already exists for ${consentType}`);
  }

  // Default isActive to true and requiresReConsent to false
  const isActive = options.isActive !== undefined ? options.isActive : true;
  const requiresReConsent = options.requiresReConsent !== undefined ? options.requiresReConsent : false;

  // If setting as active, deactivate all other versions of same type
  if (isActive) {
    await prisma.consentVersion.updateMany({
      where: {
        consentType,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  return prisma.consentVersion.create({
    data: {
      consentType,
      version,
      title,
      content,
      summary: options.summary,
      effectiveDate: options.effectiveDate || new Date(),
      expiryPeriod: options.expiryPeriod,
      requiresReConsent,
      changes: options.changes,
      isActive,
    },
  });
}

/**
 * Get all versions for a consent type
 */
export async function getConsentVersions(
  consentType: ConsentType,
  includeInactive = true
) {
  return prisma.consentVersion.findMany({
    where: {
      consentType,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get the active version for a consent type
 */
export async function getActiveConsentVersion(consentType: ConsentType) {
  return prisma.consentVersion.findFirst({
    where: {
      consentType,
      isActive: true,
    },
    orderBy: {
      effectiveDate: 'desc',
    },
  });
}

/**
 * Check if a user needs to re-consent
 */
export async function needsReConsent(
  userId: string,
  consentType: ConsentType
): Promise<{
  needsReConsent: boolean;
  reason?: 'NO_CONSENT' | 'VERSION_OUTDATED' | 'EXPIRED';
  currentVersion?: string;
  newVersion?: string;
  changes?: string;
}> {
  // Get active version
  const activeVersion = await getActiveConsentVersion(consentType);
  if (!activeVersion) {
    return { needsReConsent: false };
  }

  // Check user's current consent
  const userConsent = await prisma.consentRecord.findUnique({
    where: {
      userId_consentType: {
        userId,
        consentType,
      },
    },
  });

  // No consent exists
  if (!userConsent || !userConsent.granted) {
    return {
      needsReConsent: true,
      reason: 'NO_CONSENT',
      newVersion: activeVersion.version,
    };
  }

  // Check if consent expired
  if (userConsent.expiresAt && userConsent.expiresAt < new Date()) {
    return {
      needsReConsent: true,
      reason: 'EXPIRED',
      currentVersion: userConsent.version || undefined,
      newVersion: activeVersion.version,
    };
  }

  // Check if version is outdated and requires re-consent
  if (
    activeVersion.requiresReConsent &&
    userConsent.version !== activeVersion.version
  ) {
    return {
      needsReConsent: true,
      reason: 'VERSION_OUTDATED',
      currentVersion: userConsent.version || undefined,
      newVersion: activeVersion.version,
      changes: activeVersion.changes || undefined,
    };
  }

  return { needsReConsent: false };
}

/**
 * Update user consent to new version
 */
export async function updateConsentVersion(
  userId: string,
  consentType: ConsentType,
  granted: boolean,
  ipAddress?: string,
  userAgent?: string
) {
  const activeVersion = await getActiveConsentVersion(consentType);
  if (!activeVersion) {
    throw new Error(`No active version found for ${consentType}`);
  }

  // Calculate expiry date if applicable
  let expiresAt: Date | null = null;
  if (granted && activeVersion.expiryPeriod) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + activeVersion.expiryPeriod);
  }

  // Update or create consent record
  return prisma.consentRecord.upsert({
    where: {
      userId_consentType: {
        userId,
        consentType,
      },
    },
    update: {
      granted,
      grantedAt: granted ? new Date() : null,
      revokedAt: !granted ? new Date() : null,
      version: activeVersion.version,
      versionId: activeVersion.id,
      expiresAt,
      ipAddress,
      userAgent,
    },
    create: {
      userId,
      consentType,
      granted,
      grantedAt: granted ? new Date() : null,
      revokedAt: !granted ? new Date() : null,
      version: activeVersion.version,
      versionId: activeVersion.id,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Get user's consent history
 */
export async function getConsentHistory(
  userId: string,
  consentType?: ConsentType
) {
  const currentConsents = await prisma.consentRecord.findMany({
    where: {
      userId,
      ...(consentType ? { consentType } : {}),
    },
    include: {
      consentVersion: true,
    },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      userId,
      action: {
        in: ['CONSENT_GRANTED', 'CONSENT_REVOKED', 'CONSENT_UPDATED'],
      },
      ...(consentType
        ? {
            details: {
              path: ['consentType'],
              equals: consentType,
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    current: currentConsents,
    history: auditLogs.map((log) => ({
      action: log.action,
      timestamp: log.createdAt,
      consentType: (log.details as any)?.consentType,
      version: (log.details as any)?.version,
      granted: (log.details as any)?.granted,
    })),
  };
}

/**
 * Handle expired consents (batch job)
 */
export async function handleExpiredConsents(): Promise<number> {
  const expired = await prisma.consentRecord.updateMany({
    where: {
      granted: true,
      expiresAt: {
        lte: new Date(),
      },
    },
    data: {
      granted: false,
      revokedAt: new Date(),
    },
  });

  return expired.count;
}

/**
 * Compare two consent versions
 */
export async function compareVersions(
  consentType: ConsentType,
  version1: string,
  version2: string
) {
  const [v1, v2] = await Promise.all([
    prisma.consentVersion.findUnique({
      where: {
        consentType_version: {
          consentType,
          version: version1,
        },
      },
    }),
    prisma.consentVersion.findUnique({
      where: {
        consentType_version: {
          consentType,
          version: version2,
        },
      },
    }),
  ]);

  if (!v1 || !v2) {
    throw new Error('One or both versions not found');
  }

  return {
    version1: {
      version: v1.version,
      title: v1.title,
      effectiveDate: v1.effectiveDate,
      expiryPeriod: v1.expiryPeriod,
    },
    version2: {
      version: v2.version,
      title: v2.title,
      effectiveDate: v2.effectiveDate,
      expiryPeriod: v2.expiryPeriod,
    },
    differences: {
      titleChanged: v1.title !== v2.title,
      contentChanged: v1.content !== v2.content,
      expiryPeriodChanged: v1.expiryPeriod !== v2.expiryPeriod,
      requiresReConsentChanged: v1.requiresReConsent !== v2.requiresReConsent,
    },
  };
}

/**
 * Get users who need to re-consent for a specific type
 */
export async function getUsersNeedingReConsent(consentType: ConsentType) {
  const activeVersion = await getActiveConsentVersion(consentType);
  if (!activeVersion) {
    return [];
  }

  // Find users with outdated or expired consents
  const users = await prisma.user.findMany({
    where: {
      consentRecords: {
        some: {
          consentType,
          OR: [
            // Version outdated
            {
              version: {
                not: activeVersion.version,
              },
            },
            // Consent expired
            {
              expiresAt: {
                lte: new Date(),
              },
            },
          ],
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  // Also include users with no consent
  const usersWithoutConsent = await prisma.user.findMany({
    where: {
      consentRecords: {
        none: {
          consentType,
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  return [...users, ...usersWithoutConsent];
}