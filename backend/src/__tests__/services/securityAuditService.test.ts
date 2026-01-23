/**
 * TDD Tests for Security Audit Service
 *
 * Task 3.3: Security Monitoring & Alerting
 * Following TDD approach - these tests are written BEFORE implementation
 */

import { SecurityAuditService } from '../../services/securityAuditService';
import { PrismaClient, SecurityEventType, SecurityEventSeverity, SecurityEventOutcome } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  PrismaClient: jest.fn(),
}));

// Mock email service
jest.mock('../../services/emailService', () => ({
  sendEmail: jest.fn(),
}));

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let mockPrisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = mockDeep<PrismaClient>();
    service = new SecurityAuditService(mockPrisma);
  });

  describe('Logging Security Events', () => {
    it('should log a failed login attempt', async () => {
      const eventData = {
        eventType: SecurityEventType.FAILED_LOGIN,
        severity: SecurityEventSeverity.LOW,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { email: 'user@example.com' },
      };

      const mockLog = {
        id: 'log-123',
        ...eventData,
        outcome: SecurityEventOutcome.FAILURE,
        alertSent: false,
        createdAt: new Date(),
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue(mockLog as any);

      const result = await service.logSecurityEvent(eventData);

      expect(result).toBeDefined();
      expect(result.id).toBe('log-123');
      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: SecurityEventSeverity.LOW,
          userId: 'user-123',
          outcome: SecurityEventOutcome.FAILURE,
        }),
      });
    });

    it('should log suspicious activity', async () => {
      const eventData = {
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.MEDIUM,
        userId: 'user-456',
        ipAddress: '10.0.0.1',
        details: { activity: 'Multiple password reset attempts' },
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'log-456',
        ...eventData,
        outcome: SecurityEventOutcome.BLOCKED,
        alertSent: false,
        createdAt: new Date(),
      } as any);

      const result = await service.logSecurityEvent(eventData);

      expect(result).toBeDefined();
      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalled();
    });

    it('should log rate limit violations', async () => {
      const eventData = {
        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: SecurityEventSeverity.MEDIUM,
        ipAddress: '192.168.1.100',
        resource: '/api/auth/login',
        details: { requests: 100, limit: 10, window: '1 minute' },
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'log-789',
        ...eventData,
        outcome: SecurityEventOutcome.BLOCKED,
        alertSent: false,
        createdAt: new Date(),
      } as any);

      const result = await service.logSecurityEvent(eventData);

      expect(result).toBeDefined();
      expect(result.outcome).toBe(SecurityEventOutcome.BLOCKED);
    });

    it('should log unauthorized access attempts', async () => {
      const eventData = {
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        severity: SecurityEventSeverity.HIGH,
        userId: 'user-999',
        resource: '/admin/users',
        action: 'DELETE',
        ipAddress: '192.168.1.50',
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'log-999',
        ...eventData,
        outcome: SecurityEventOutcome.BLOCKED,
        alertSent: true,
        alertSentAt: new Date(),
        createdAt: new Date(),
      } as any);

      const result = await service.logSecurityEvent(eventData);

      expect(result.alertSent).toBe(true);
      expect(result.severity).toBe(SecurityEventSeverity.HIGH);
    });
  });

  describe('Brute Force Detection', () => {
    it('should detect brute force attacks (5 failed logins in 5 minutes)', async () => {
      const userId = 'user-brute';

      // Mock 5 failed login attempts in the last 5 minutes
      mockPrisma.securityAuditLog.count.mockResolvedValue(5);

      const isBruteForce = await service.detectBruteForce(userId, 5, 5);

      expect(isBruteForce).toBe(true);
      expect(mockPrisma.securityAuditLog.count).toHaveBeenCalledWith({
        where: {
          userId,
          eventType: SecurityEventType.FAILED_LOGIN,
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });

    it('should not flag as brute force if under threshold', async () => {
      const userId = 'user-normal';

      // Mock 3 failed login attempts (under threshold of 5)
      mockPrisma.securityAuditLog.count.mockResolvedValue(3);

      const isBruteForce = await service.detectBruteForce(userId, 5, 5);

      expect(isBruteForce).toBe(false);
    });

    it('should automatically log brute force detection', async () => {
      const userId = 'user-auto-detect';

      mockPrisma.securityAuditLog.count.mockResolvedValue(5);
      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'brute-log',
        eventType: SecurityEventType.BRUTE_FORCE_DETECTED,
        severity: SecurityEventSeverity.HIGH,
        userId,
        outcome: SecurityEventOutcome.BLOCKED,
        alertSent: true,
        createdAt: new Date(),
      } as any);

      // Mock user update for account locking
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        isActive: false,
      } as any);

      const result = await service.handleFailedLogin(userId, '192.168.1.1', 'Mozilla');

      expect(result.bruteForceDetected).toBe(true);
      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalledTimes(3); // Failed login + brute force + account locked
    });

    it('should lock account after brute force detection', async () => {
      const userId = 'user-lock';

      mockPrisma.securityAuditLog.count.mockResolvedValue(5);
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        isActive: false,
      } as any);

      const result = await service.handleFailedLogin(userId, '192.168.1.1', 'Mozilla');

      expect(result.accountLocked).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: false },
      });
    });
  });

  describe('Security Event Retrieval', () => {
    it('should retrieve security events for dashboard', async () => {
      const mockEvents = [
        {
          id: '1',
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: SecurityEventSeverity.LOW,
          createdAt: new Date(),
        },
        {
          id: '2',
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: SecurityEventSeverity.MEDIUM,
          createdAt: new Date(),
        },
      ];

      mockPrisma.securityAuditLog.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.getRecentSecurityEvents(24); // Last 24 hours

      expect(result).toHaveLength(2);
      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expect.any(Date),
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
    });

    it('should get security events by severity', async () => {
      mockPrisma.securityAuditLog.findMany.mockResolvedValue([
        {
          id: '1',
          eventType: SecurityEventType.BRUTE_FORCE_DETECTED,
          severity: SecurityEventSeverity.HIGH,
          createdAt: new Date(),
        },
      ] as any);

      const result = await service.getEventsBySeverity(SecurityEventSeverity.HIGH);

      expect(result).toHaveLength(1);
      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: { severity: SecurityEventSeverity.HIGH },
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
    });

    it('should get threat indicators summary', async () => {
      mockPrisma.securityAuditLog.groupBy.mockResolvedValue([
        {
          eventType: SecurityEventType.FAILED_LOGIN,
          _count: { eventType: 10 },
        },
        {
          eventType: SecurityEventType.BRUTE_FORCE_DETECTED,
          _count: { eventType: 2 },
        },
      ] as any);

      const result = await service.getThreatIndicators(24);

      expect(result).toBeDefined();
      expect(result.failedLogins).toBe(10);
      expect(result.bruteForceAttempts).toBe(2);
      expect(result.threatLevel).toBeDefined();
    });
  });

  describe('Alert Notifications', () => {
    it('should send email alert for critical events', async () => {
      const { sendEmail } = require('../../services/emailService');

      // Mock admin users
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'admin-1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
      ] as any);

      const eventData = {
        eventType: SecurityEventType.BRUTE_FORCE_DETECTED,
        severity: SecurityEventSeverity.CRITICAL,
        userId: 'user-critical',
        ipAddress: '192.168.1.1',
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'critical-log',
        ...eventData,
        outcome: SecurityEventOutcome.BLOCKED,
        alertSent: true,
        alertSentAt: new Date(),
        createdAt: new Date(),
      } as any);

      await service.logSecurityEvent(eventData);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: expect.stringContaining('CRITICAL Security Alert'),
          html: expect.stringContaining('Security Alert'),
        })
      );
    });

    it('should send email alert for high severity events', async () => {
      const { sendEmail } = require('../../services/emailService');

      // Mock admin users
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'admin-1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
      ] as any);

      const eventData = {
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        severity: SecurityEventSeverity.HIGH,
        userId: 'user-high',
        resource: '/admin/sensitive-data',
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'high-log',
        ...eventData,
        outcome: SecurityEventOutcome.BLOCKED,
        alertSent: true,
        createdAt: new Date(),
      } as any);

      await service.logSecurityEvent(eventData);

      expect(sendEmail).toHaveBeenCalled();
    });

    it('should not send alerts for low severity events', async () => {
      const { sendEmail } = require('../../services/emailService');

      const eventData = {
        eventType: SecurityEventType.FAILED_LOGIN,
        severity: SecurityEventSeverity.LOW,
        userId: 'user-low',
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'low-log',
        ...eventData,
        outcome: SecurityEventOutcome.FAILURE,
        alertSent: false,
        createdAt: new Date(),
      } as any);

      await service.logSecurityEvent(eventData);

      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit violations', async () => {
      const ipAddress = '192.168.1.100';

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'rate-limit-log',
        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: SecurityEventSeverity.MEDIUM,
        ipAddress,
        outcome: SecurityEventOutcome.BLOCKED,
        createdAt: new Date(),
      } as any);

      const result = await service.logRateLimitViolation(ipAddress, '/api/resource', 100, 10);

      expect(result).toBeDefined();
      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          ipAddress,
          resource: '/api/resource',
          details: expect.objectContaining({
            requests: 100,
            limit: 10,
          }),
        }),
      });
    });

    it('should check if IP is rate limited', async () => {
      const ipAddress = '192.168.1.200';

      mockPrisma.securityAuditLog.count.mockResolvedValue(3);

      const isLimited = await service.isRateLimited(ipAddress, 5);

      expect(isLimited).toBe(false);
      expect(mockPrisma.securityAuditLog.count).toHaveBeenCalledWith({
        where: {
          ipAddress,
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });
  });

  describe('Data Access Monitoring', () => {
    it('should log large data exports', async () => {
      const eventData = {
        userId: 'user-export',
        resource: 'user-data-export',
        recordCount: 10000,
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'export-log',
        eventType: SecurityEventType.DATA_EXPORT_LARGE,
        severity: SecurityEventSeverity.MEDIUM,
        userId: eventData.userId,
        resource: eventData.resource,
        details: { recordCount: eventData.recordCount },
        outcome: SecurityEventOutcome.SUCCESS,
        createdAt: new Date(),
      } as any);

      const result = await service.logLargeDataExport(
        eventData.userId,
        eventData.resource,
        eventData.recordCount
      );

      expect(result).toBeDefined();
      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: SecurityEventType.DATA_EXPORT_LARGE,
          userId: eventData.userId,
          resource: eventData.resource,
        }),
      });
    });

    it('should flag suspicious data export patterns', async () => {
      const userId = 'user-suspicious';

      // Mock multiple large exports in short time
      mockPrisma.securityAuditLog.count.mockResolvedValue(5);

      const isSuspicious = await service.detectSuspiciousDataAccess(userId, 24);

      expect(isSuspicious).toBe(true);
      expect(mockPrisma.securityAuditLog.count).toHaveBeenCalledWith({
        where: {
          userId,
          eventType: SecurityEventType.DATA_EXPORT_LARGE,
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });
  });

  describe('Admin Action Logging', () => {
    it('should log admin actions', async () => {
      const adminAction = {
        userId: 'admin-123',
        action: 'DELETE_USER',
        resource: 'user-456',
        ipAddress: '192.168.1.1',
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'admin-log',
        eventType: SecurityEventType.ADMIN_ACTION,
        severity: SecurityEventSeverity.INFO,
        ...adminAction,
        outcome: SecurityEventOutcome.SUCCESS,
        createdAt: new Date(),
      } as any);

      const result = await service.logAdminAction(adminAction);

      expect(result).toBeDefined();
      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: SecurityEventType.ADMIN_ACTION,
          action: 'DELETE_USER',
        }),
      });
    });

    it('should log role changes', async () => {
      const roleChange = {
        adminId: 'admin-123',
        targetUserId: 'user-456',
        oldRole: 'USER',
        newRole: 'ADMIN',
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue({
        id: 'role-log',
        eventType: SecurityEventType.USER_ROLE_CHANGED,
        severity: SecurityEventSeverity.MEDIUM,
        userId: roleChange.adminId,
        resource: roleChange.targetUserId,
        details: { oldRole: roleChange.oldRole, newRole: roleChange.newRole },
        outcome: SecurityEventOutcome.SUCCESS,
        createdAt: new Date(),
      } as any);

      const result = await service.logRoleChange(roleChange);

      expect(result).toBeDefined();
      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: SecurityEventType.USER_ROLE_CHANGED,
          details: expect.objectContaining({
            oldRole: 'USER',
            newRole: 'ADMIN',
          }),
        }),
      });
    });
  });

  describe('Log Retention and Cleanup', () => {
    it('should archive old logs (older than 90 days)', async () => {
      mockPrisma.securityAuditLog.findMany.mockResolvedValue([
        { id: '1', createdAt: new Date('2023-01-01') },
        { id: '2', createdAt: new Date('2023-01-02') },
      ] as any);

      mockPrisma.securityAuditLog.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.archiveOldLogs(90);

      expect(result.archived).toBe(2);
      expect(mockPrisma.securityAuditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should export logs before archiving', async () => {
      mockPrisma.securityAuditLog.findMany.mockResolvedValue([
        {
          id: '1',
          eventType: SecurityEventType.FAILED_LOGIN,
          createdAt: new Date('2023-01-01'),
        },
      ] as any);

      const exported = await service.exportLogsForArchive(90);

      expect(exported).toHaveLength(1);
      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });
});