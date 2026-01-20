/**
 * Data Retention Service
 *
 * Implements GDPR-compliant automated data retention policies
 * - Anonymizes inactive users (3+ years)
 * - Purges deleted users (30+ days)
 * - Respects legal holds
 * - Archives old records
 */

import { PrismaClient } from '@prisma/client';
import { dataRetentionPolicies } from '../config/dataRetention';
import { NotFoundError } from '../utils/errors';

// Allow prisma to be injected for testing
let prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

// For testing: allow setting a mock prisma instance
export function setPrismaInstance(instance: PrismaClient): void {
  prismaInstance = instance;
}

const prisma = getPrisma();

export interface RetentionEnforcementResult {
  inactiveUsersAnonymized: number;
  deletedUsersPurged: number;
  expiredSessionsDeleted: number;
  notificationsDeleted: number;
  exportRequestsDeleted: number;
  auditLogsArchived: number;
  executedAt: Date;
  errors?: string[];
}

export interface PurgeResult {
  anonymized?: number;
  deleted?: number;
  skippedDueToLegalHold?: number;
  errors?: string[];
}

/**
 * Main function to enforce all retention policies
 * Should be called by cron job daily
 */
export async function enforceRetentionPolicies(): Promise<RetentionEnforcementResult> {
  const startTime = new Date();
  const errors: string[] = [];

  let inactiveUsersResult: PurgeResult = { anonymized: 0, skippedDueToLegalHold: 0 };
  let deletedUsersResult: PurgeResult = { deleted: 0, skippedDueToLegalHold: 0 };
  let expiredSessionsResult: PurgeResult = { deleted: 0 };
  let notificationsResult: any = { readDeleted: 0, unreadDeleted: 0 };
  let exportRequestsResult: PurgeResult = { deleted: 0 };
  let auditLogsResult: any = { archived: 0 };

  try {
    // Execute all retention policies
    inactiveUsersResult = await purgeInactiveUsers();
    deletedUsersResult = await purgeDeletedUsers();
    expiredSessionsResult = await purgeExpiredSessions();
    notificationsResult = await purgeOldNotifications();
    exportRequestsResult = await purgeOldExportRequests();
    auditLogsResult = await archiveOldAuditLogs();

    // Collect any errors
    if (inactiveUsersResult.errors) errors.push(...inactiveUsersResult.errors);
    if (deletedUsersResult.errors) errors.push(...deletedUsersResult.errors);
    if (expiredSessionsResult.errors) errors.push(...expiredSessionsResult.errors);
    if (exportRequestsResult.errors) errors.push(...exportRequestsResult.errors);
  } catch (error: any) {
    errors.push(`Enforcement failed: ${error.message}`);
    throw error; // Re-throw to indicate failure
  }

  return {
    inactiveUsersAnonymized: inactiveUsersResult.anonymized || 0,
    deletedUsersPurged: deletedUsersResult.deleted || 0,
    expiredSessionsDeleted: expiredSessionsResult.deleted || 0,
    notificationsDeleted: (notificationsResult.readDeleted || 0) + (notificationsResult.unreadDeleted || 0),
    exportRequestsDeleted: exportRequestsResult.deleted || 0,
    auditLogsArchived: auditLogsResult.archived || 0,
    executedAt: startTime,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Anonymize users who have been inactive for 3+ years
 * Respects legal holds
 */
export async function purgeInactiveUsers(): Promise<PurgeResult> {
  const policy = dataRetentionPolicies.inactiveUsers;

  // Guard against null retention period
  if (policy.retentionPeriodDays === null) {
    throw new Error('Inactive users retention period cannot be indefinite');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

  const errors: string[] = [];
  let anonymized = 0;
  let skippedDueToLegalHold = 0;

  try {
    // Find users who haven't logged in for 3+ years
    const inactiveUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          lte: cutoffDate,
        },
        anonymizedAt: null, // Not already anonymized
        deletedAt: null, // Not marked for deletion
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
        onLegalHold: true,
      },
    });

    // Anonymize each user
    for (const user of inactiveUsers) {
      // Skip if on legal hold
      if (user.onLegalHold) {
        skippedDueToLegalHold++;
        continue;
      }

      try {
        // Generate anonymized data
        const anonymizedEmail = `anonymized_${user.id.substring(0, 8)}@example.com`;
        const anonymizedName = `Anonymized User ${user.id.substring(0, 8)}`;

        // Update user with anonymized data
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: anonymizedEmail,
            name: anonymizedName,
            password: null,
            oauthProvider: null,
            oauthProviderId: null,
            oauthEmail: null,
            anonymizedAt: new Date(),
          },
        });

        anonymized++;
      } catch (error: any) {
        errors.push(`Failed to anonymize user ${user.id}: ${error.message}`);
      }
    }

    return {
      anonymized,
      skippedDueToLegalHold,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    throw new Error(`Failed to purge inactive users: ${error.message}`);
  }
}

/**
 * Hard delete users who have been marked for deletion for 30+ days
 * Respects legal holds
 */
export async function purgeDeletedUsers(): Promise<PurgeResult> {
  const policy = dataRetentionPolicies.deletedUsers;

  // Guard against null retention period
  if (policy.retentionPeriodDays === null) {
    throw new Error('Deleted users retention period cannot be indefinite');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

  const errors: string[] = [];
  let deleted = 0;
  let skippedDueToLegalHold = 0;

  try {
    // Find users marked for deletion 30+ days ago
    const deletedUsers = await prisma.user.findMany({
      where: {
        deletedAt: {
          lte: cutoffDate,
        },
      },
      select: {
        id: true,
        email: true,
        deletedAt: true,
        onLegalHold: true,
      },
    });

    // Delete each user
    for (const user of deletedUsers) {
      // Skip if on legal hold
      if (user.onLegalHold) {
        skippedDueToLegalHold++;
        continue;
      }

      try {
        // Hard delete user (cascades will handle related records)
        await prisma.user.delete({
          where: { id: user.id },
        });

        deleted++;
      } catch (error: any) {
        errors.push(`Failed to delete user ${user.id}: ${error.message}`);
      }
    }

    return {
      deleted,
      skippedDueToLegalHold,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    throw new Error(`Failed to purge deleted users: ${error.message}`);
  }
}

/**
 * Delete expired sessions that are 90+ days old
 */
export async function purgeExpiredSessions(): Promise<PurgeResult> {
  const policy = dataRetentionPolicies.expiredSessions;

  // Guard against null retention period
  if (policy.retentionPeriodDays === null) {
    throw new Error('Expired sessions retention period cannot be indefinite');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lte: cutoffDate,
        },
      },
    });

    return {
      deleted: result.count,
    };
  } catch (error: any) {
    throw new Error(`Failed to purge expired sessions: ${error.message}`);
  }
}

/**
 * Delete old notifications based on read/unread status
 * - Read notifications: 1 year
 * - Unread notifications: 2 years
 */
export async function purgeOldNotifications(): Promise<{ readDeleted: number; unreadDeleted: number }> {
  const readPolicy = dataRetentionPolicies.readNotifications;
  const unreadPolicy = dataRetentionPolicies.unreadNotifications;

  // Guard against null retention periods
  if (readPolicy.retentionPeriodDays === null) {
    throw new Error('Read notifications retention period cannot be indefinite');
  }
  if (unreadPolicy.retentionPeriodDays === null) {
    throw new Error('Unread notifications retention period cannot be indefinite');
  }

  const readCutoffDate = new Date();
  readCutoffDate.setDate(readCutoffDate.getDate() - readPolicy.retentionPeriodDays);

  const unreadCutoffDate = new Date();
  unreadCutoffDate.setDate(unreadCutoffDate.getDate() - unreadPolicy.retentionPeriodDays);

  try {
    // Delete read notifications older than 1 year (readAt is not null means read)
    const readResult = await prisma.notification.deleteMany({
      where: {
        readAt: {
          not: null,
        },
        createdAt: {
          lte: readCutoffDate,
        },
      },
    });

    // Delete unread notifications older than 2 years (readAt is null means unread)
    const unreadResult = await prisma.notification.deleteMany({
      where: {
        readAt: null,
        createdAt: {
          lte: unreadCutoffDate,
        },
      },
    });

    return {
      readDeleted: readResult.count,
      unreadDeleted: unreadResult.count,
    };
  } catch (error: any) {
    throw new Error(`Failed to purge old notifications: ${error.message}`);
  }
}

/**
 * Delete data export requests older than 30 days
 */
export async function purgeOldExportRequests(): Promise<PurgeResult> {
  const policy = dataRetentionPolicies.exportRequests;

  // Guard against null retention period
  if (policy.retentionPeriodDays === null) {
    throw new Error('Export requests retention period cannot be indefinite');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

  try {
    const result = await prisma.dataExportRequest.deleteMany({
      where: {
        requestedAt: {
          lte: cutoffDate,
        },
      },
    });

    return {
      deleted: result.count,
    };
  } catch (error: any) {
    throw new Error(`Failed to purge old export requests: ${error.message}`);
  }
}

/**
 * Archive audit logs older than 7 years
 * Marks them as archived rather than deleting (legal requirement)
 */
export async function archiveOldAuditLogs(): Promise<{ archived: number }> {
  const policy = dataRetentionPolicies.auditLogs;

  // Guard against null retention period
  if (policy.retentionPeriodDays === null) {
    throw new Error('Audit logs retention period cannot be indefinite');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

  try {
    const result = await prisma.auditLog.updateMany({
      where: {
        createdAt: {
          lte: cutoffDate,
        },
        archived: false,
      },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
    });

    return {
      archived: result.count,
    };
  } catch (error: any) {
    throw new Error(`Failed to archive old audit logs: ${error.message}`);
  }
}

/**
 * Place a user on legal hold to prevent automatic deletion
 */
export async function placeOnLegalHold(userId: string, reason: string): Promise<{ success: boolean }> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Legal hold reason is required');
  }

  try {
    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        onLegalHold: true,
        legalHoldReason: reason,
        legalHoldAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    // Re-throw NotFoundError as-is
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new Error(`Failed to place user on legal hold: ${error.message}`);
  }
}

/**
 * Release a user from legal hold
 */
export async function releaseLegalHold(userId: string): Promise<{ success: boolean }> {
  try {
    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        onLegalHold: false,
        legalHoldReleasedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    // Re-throw NotFoundError as-is
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new Error(`Failed to release legal hold: ${error.message}`);
  }
}
