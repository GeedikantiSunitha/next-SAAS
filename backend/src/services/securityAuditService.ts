/**
 * Security Audit Service
 *
 * Task 3.3: Security Monitoring & Alerting
 * Provides comprehensive security event logging, monitoring, and alerting
 */

import {
  PrismaClient,
  SecurityEventType,
  SecurityEventSeverity,
  SecurityEventOutcome,
  SecurityAuditLog,
  Prisma,
} from '@prisma/client';
import { sendEmail } from './emailService';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SecurityEventData {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resource?: string | null;
  action?: string | null;
  details?: any;
  metadata?: any;
}

export interface ThreatIndicators {
  failedLogins: number;
  bruteForceAttempts: number;
  rateLimitViolations: number;
  unauthorizedAccess: number;
  suspiciousActivity: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface BruteForceResult {
  bruteForceDetected: boolean;
  accountLocked: boolean;
  alertSent: boolean;
}

export class SecurityAuditService {
  private prisma: PrismaClient;
  private readonly BRUTE_FORCE_THRESHOLD = 5;
  private readonly BRUTE_FORCE_WINDOW_MINUTES = 5;
  private readonly RATE_LIMIT_WINDOW_MINUTES = 1;
  private readonly SUSPICIOUS_EXPORT_THRESHOLD = 3;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(eventData: SecurityEventData): Promise<SecurityAuditLog> {
    // Determine outcome based on event type
    const outcome = this.determineOutcome(eventData.eventType);

    // Check if alert should be sent
    const shouldAlert = this.shouldSendAlert(eventData.severity);

    // Create the log entry
    const log = await this.prisma.securityAuditLog.create({
      data: {
        eventType: eventData.eventType,
        severity: eventData.severity,
        userId: eventData.userId,
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        resource: eventData.resource,
        action: eventData.action,
        details: eventData.details as Prisma.InputJsonValue,
        metadata: eventData.metadata as Prisma.InputJsonValue,
        outcome,
        alertSent: shouldAlert,
        alertSentAt: shouldAlert ? new Date() : null,
      },
    });

    // Send alert if needed
    if (shouldAlert) {
      await this.sendSecurityAlert(log);
    }

    return log;
  }

  /**
   * Handle failed login attempt
   */
  async handleFailedLogin(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<BruteForceResult> {
    // Log the failed login
    await this.logSecurityEvent({
      eventType: SecurityEventType.FAILED_LOGIN,
      severity: SecurityEventSeverity.LOW,
      userId,
      ipAddress,
      userAgent,
      details: { timestamp: new Date() },
    });

    // Check for brute force
    const bruteForceDetected = await this.detectBruteForce(
      userId,
      this.BRUTE_FORCE_THRESHOLD,
      this.BRUTE_FORCE_WINDOW_MINUTES
    );

    let accountLocked = false;
    let alertSent = false;

    if (bruteForceDetected) {
      // Log brute force detection
      await this.logSecurityEvent({
        eventType: SecurityEventType.BRUTE_FORCE_DETECTED,
        severity: SecurityEventSeverity.HIGH,
        userId,
        ipAddress,
        userAgent,
        details: {
          threshold: this.BRUTE_FORCE_THRESHOLD,
          window: `${this.BRUTE_FORCE_WINDOW_MINUTES} minutes`,
        },
      });

      // Lock the account
      accountLocked = await this.lockAccount(userId);
      alertSent = true;
    }

    return {
      bruteForceDetected,
      accountLocked,
      alertSent,
    };
  }

  /**
   * Detect brute force attack
   */
  async detectBruteForce(
    userId: string,
    threshold: number,
    windowMinutes: number
  ): Promise<boolean> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const failedAttempts = await this.prisma.securityAuditLog.count({
      where: {
        userId,
        eventType: SecurityEventType.FAILED_LOGIN,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    return failedAttempts >= threshold;
  }

  /**
   * Lock user account
   */
  private async lockAccount(userId: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await this.logSecurityEvent({
        eventType: SecurityEventType.ACCOUNT_LOCKED,
        severity: SecurityEventSeverity.HIGH,
        userId,
        details: { reason: 'Brute force attack detected' },
      });

      return true;
    } catch (error) {
      console.error('Failed to lock account:', error);
      return false;
    }
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(hoursBack: number = 24): Promise<SecurityAuditLog[]> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    return this.prisma.securityAuditLog.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get events by severity
   */
  async getEventsBySeverity(severity: SecurityEventSeverity): Promise<SecurityAuditLog[]> {
    return this.prisma.securityAuditLog.findMany({
      where: { severity },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get threat indicators summary
   */
  async getThreatIndicators(hoursBack: number = 24): Promise<ThreatIndicators> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const events = await this.prisma.securityAuditLog.groupBy({
      by: ['eventType'],
      where: {
        createdAt: {
          gte: since,
        },
      },
      _count: {
        eventType: true,
      },
    });

    const counts = events.reduce((acc, event) => {
      acc[event.eventType] = event._count.eventType;
      return acc;
    }, {} as Record<string, number>);

    const indicators: ThreatIndicators = {
      failedLogins: counts[SecurityEventType.FAILED_LOGIN] || 0,
      bruteForceAttempts: counts[SecurityEventType.BRUTE_FORCE_DETECTED] || 0,
      rateLimitViolations: counts[SecurityEventType.RATE_LIMIT_EXCEEDED] || 0,
      unauthorizedAccess: counts[SecurityEventType.UNAUTHORIZED_ACCESS] || 0,
      suspiciousActivity: counts[SecurityEventType.SUSPICIOUS_ACTIVITY] || 0,
      threatLevel: this.calculateThreatLevel(counts),
    };

    return indicators;
  }

  /**
   * Log rate limit violation
   */
  async logRateLimitViolation(
    ipAddress: string,
    resource: string,
    requests: number,
    limit: number
  ): Promise<SecurityAuditLog> {
    return this.logSecurityEvent({
      eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecurityEventSeverity.MEDIUM,
      ipAddress,
      resource,
      details: {
        requests,
        limit,
        window: `${this.RATE_LIMIT_WINDOW_MINUTES} minute(s)`,
      },
    });
  }

  /**
   * Check if IP is rate limited
   */
  async isRateLimited(ipAddress: string, maxViolations: number = 3): Promise<boolean> {
    const windowStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

    const violations = await this.prisma.securityAuditLog.count({
      where: {
        ipAddress,
        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    return violations >= maxViolations;
  }

  /**
   * Log large data export
   */
  async logLargeDataExport(
    userId: string,
    resource: string,
    recordCount: number
  ): Promise<SecurityAuditLog> {
    const severity = recordCount > 5000
      ? SecurityEventSeverity.HIGH
      : SecurityEventSeverity.MEDIUM;

    return this.logSecurityEvent({
      eventType: SecurityEventType.DATA_EXPORT_LARGE,
      severity,
      userId,
      resource,
      details: { recordCount },
    });
  }

  /**
   * Detect suspicious data access patterns
   */
  async detectSuspiciousDataAccess(userId: string, hoursBack: number = 24): Promise<boolean> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const largeExports = await this.prisma.securityAuditLog.count({
      where: {
        userId,
        eventType: SecurityEventType.DATA_EXPORT_LARGE,
        createdAt: {
          gte: since,
        },
      },
    });

    return largeExports >= this.SUSPICIOUS_EXPORT_THRESHOLD;
  }

  /**
   * Log admin action
   */
  async logAdminAction(data: {
    userId: string;
    action: string;
    resource: string;
    ipAddress?: string;
    details?: any;
  }): Promise<SecurityAuditLog> {
    return this.logSecurityEvent({
      eventType: SecurityEventType.ADMIN_ACTION,
      severity: SecurityEventSeverity.INFO,
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      ipAddress: data.ipAddress,
      details: data.details,
    });
  }

  /**
   * Log role change
   */
  async logRoleChange(data: {
    adminId: string;
    targetUserId: string;
    oldRole: string;
    newRole: string;
    ipAddress?: string;
  }): Promise<SecurityAuditLog> {
    return this.logSecurityEvent({
      eventType: SecurityEventType.USER_ROLE_CHANGED,
      severity: SecurityEventSeverity.MEDIUM,
      userId: data.adminId,
      resource: data.targetUserId,
      details: {
        oldRole: data.oldRole,
        newRole: data.newRole,
        targetUser: data.targetUserId,
      },
      ipAddress: data.ipAddress,
    });
  }

  /**
   * Archive old logs
   */
  async archiveOldLogs(daysToKeep: number = 90): Promise<{ archived: number }> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    // Export logs before deletion
    await this.exportLogsForArchive(daysToKeep);

    // Delete old logs
    const result = await this.prisma.securityAuditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return { archived: result.count };
  }

  /**
   * Export logs for archive
   */
  async exportLogsForArchive(daysToKeep: number): Promise<SecurityAuditLog[]> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const logs = await this.prisma.securityAuditLog.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Save to archive file
    if (logs.length > 0) {
      const archiveDir = path.join(process.cwd(), 'archives', 'security-logs');
      await fs.mkdir(archiveDir, { recursive: true });

      const filename = `security-logs-${cutoffDate.toISOString().split('T')[0]}.json`;
      const filepath = path.join(archiveDir, filename);

      await fs.writeFile(filepath, JSON.stringify(logs, null, 2));
    }

    return logs;
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(log: SecurityAuditLog): Promise<void> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, name: true },
      });

      const subject = `${log.severity} Security Alert: ${log.eventType.replace(/_/g, ' ')}`;

      for (const admin of admins) {
        const html = `
          <h2>Security Alert</h2>
          <p>Dear ${admin.name || 'Admin'},</p>
          <p>A security event has been detected that requires your attention:</p>
          <ul>
            <li><strong>Event Type:</strong> ${log.eventType.replace(/_/g, ' ')}</li>
            <li><strong>Severity:</strong> ${log.severity}</li>
            <li><strong>Time:</strong> ${log.createdAt.toISOString()}</li>
            <li><strong>IP Address:</strong> ${log.ipAddress || 'N/A'}</li>
            <li><strong>User ID:</strong> ${log.userId || 'N/A'}</li>
            <li><strong>Details:</strong> ${JSON.stringify(log.details, null, 2)}</li>
          </ul>
          <p>Please investigate this event immediately.</p>
        `;

        await sendEmail({
          to: admin.email,
          subject,
          html,
        });
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  /**
   * Determine if alert should be sent based on severity
   */
  private shouldSendAlert(severity: SecurityEventSeverity): boolean {
    return severity === SecurityEventSeverity.HIGH ||
           severity === SecurityEventSeverity.CRITICAL;
  }

  /**
   * Determine outcome based on event type
   */
  private determineOutcome(eventType: SecurityEventType): SecurityEventOutcome {
    const blockedEvents: SecurityEventType[] = [
      SecurityEventType.BRUTE_FORCE_DETECTED,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecurityEventType.ACCOUNT_LOCKED,
    ];

    const failureEvents: SecurityEventType[] = [
      SecurityEventType.FAILED_LOGIN,
      SecurityEventType.DATA_ACCESS_DENIED,
      SecurityEventType.INVALID_API_KEY,
    ];

    if (blockedEvents.includes(eventType)) {
      return SecurityEventOutcome.BLOCKED;
    }

    if (failureEvents.includes(eventType)) {
      return SecurityEventOutcome.FAILURE;
    }

    return SecurityEventOutcome.SUCCESS;
  }

  /**
   * Calculate threat level based on event counts
   */
  private calculateThreatLevel(counts: Record<string, number>): ThreatIndicators['threatLevel'] {
    const criticalEvents = [
      SecurityEventType.BRUTE_FORCE_DETECTED,
      SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT,
      SecurityEventType.API_KEY_COMPROMISED,
    ];

    const highEvents = [
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityEventType.DATA_DELETION_ATTEMPT,
    ];

    const criticalCount = criticalEvents.reduce((sum, type) => sum + (counts[type] || 0), 0);
    const highCount = highEvents.reduce((sum, type) => sum + (counts[type] || 0), 0);

    if (criticalCount > 0) return 'CRITICAL';
    if (highCount > 2) return 'HIGH';
    if (highCount > 0 || (counts[SecurityEventType.FAILED_LOGIN] || 0) > 10) return 'MEDIUM';

    return 'LOW';
  }
}

// Export singleton instance
export const securityAuditService = new SecurityAuditService();