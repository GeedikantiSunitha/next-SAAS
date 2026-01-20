/**
 * Security Incident Service Tests (TDD)
 *
 * Tests GDPR breach notification system (Article 33 & 34)
 */

import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  securityIncident: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  breachNotification: {
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

// Mock PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  IncidentType: {
    DATA_BREACH: 'DATA_BREACH',
    DATA_LOSS: 'DATA_LOSS',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    MALWARE: 'MALWARE',
    PHISHING: 'PHISHING',
    DDOS: 'DDOS',
    SYSTEM_COMPROMISE: 'SYSTEM_COMPROMISE',
    INSIDER_THREAT: 'INSIDER_THREAT',
    OTHER: 'OTHER',
  },
  IncidentSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  IncidentStatus: {
    REPORTED: 'REPORTED',
    INVESTIGATING: 'INVESTIGATING',
    CONTAINED: 'CONTAINED',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
  },
}));

// Mock email service
jest.mock('../../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Import after mocks
import {
  reportIncident,
  updateIncidentStatus,
  notifyAffectedUsers,
  reportToICO,
  get72HourDeadline,
  assessRisk,
  setPrismaInstance,
} from '../../services/securityIncidentService';

describe('Security Incident Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Inject mocked Prisma instance
    setPrismaInstance(mockPrisma as any);
  });

  describe('reportIncident', () => {
    it('should create a new security incident', async () => {
      const incidentData = {
        type: IncidentType.DATA_BREACH,
        severity: IncidentSeverity.HIGH,
        title: 'Unauthorized Database Access',
        description: 'Detected unauthorized access to user database',
        affectedDataTypes: ['email', 'name'],
        affectedUserCount: 100,
        detectedAt: new Date(),
        reportedBy: 'admin-123',
      };

      // Mock admin users for alertAdmins function
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'admin-1', email: 'admin@example.com', name: 'Admin' },
      ]);

      mockPrisma.securityIncident.create.mockResolvedValue({
        id: 'incident-1',
        ...incidentData,
        status: IncidentStatus.REPORTED,
        icoNotificationRequired: true,
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.securityIncident.update.mockResolvedValue({
        id: 'incident-1',
        adminNotifiedAt: new Date(),
      });

      const result = await reportIncident(incidentData);

      expect(result).toBeDefined();
      expect(result.id).toBe('incident-1');
      expect(result.type).toBe(IncidentType.DATA_BREACH);
      expect(mockPrisma.securityIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: IncidentType.DATA_BREACH,
          severity: IncidentSeverity.HIGH,
          title: 'Unauthorized Database Access',
        }),
      });
    });

    it('should automatically assess risk level', async () => {
      const incidentData = {
        type: IncidentType.DATA_BREACH,
        severity: IncidentSeverity.CRITICAL,
        title: 'Payment Data Breach',
        description: 'Credit card data exposed',
        affectedDataTypes: ['payment_info', 'credit_card'],
        affectedUserCount: 5000,
        detectedAt: new Date(),
        reportedBy: 'admin-123',
      };

      // Mock admin users
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'admin-1', email: 'admin@example.com', name: 'Admin' },
      ]);

      mockPrisma.securityIncident.create.mockResolvedValue({
        id: 'incident-2',
        ...incidentData,
        status: IncidentStatus.REPORTED,
        riskLevel: 'critical',
        icoNotificationRequired: true,
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.securityIncident.update.mockResolvedValue({
        id: 'incident-2',
        adminNotifiedAt: new Date(),
      });

      const result = await reportIncident(incidentData);

      expect(result.riskLevel).toBe('critical');
      expect(result.icoNotificationRequired).toBe(true);
    });

    it('should mark ICO notification as required for high-risk incidents', async () => {
      const incidentData = {
        type: IncidentType.DATA_BREACH,
        severity: IncidentSeverity.HIGH,
        title: 'Large Scale Data Breach',
        description: 'Multiple user accounts compromised',
        affectedDataTypes: ['email', 'password', 'personal_info'],
        affectedUserCount: 1000,
        detectedAt: new Date(),
        reportedBy: 'admin-123',
      };

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'admin-1', email: 'admin@example.com', name: 'Admin' },
      ]);

      mockPrisma.securityIncident.create.mockResolvedValue({
        id: 'incident-3',
        ...incidentData,
        status: IncidentStatus.REPORTED,
        icoNotificationRequired: true,
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.securityIncident.update.mockResolvedValue({
        id: 'incident-3',
        adminNotifiedAt: new Date(),
      });

      const result = await reportIncident(incidentData);

      expect(result.icoNotificationRequired).toBe(true);
    });

    it('should not require ICO notification for low-risk incidents', async () => {
      const incidentData = {
        type: IncidentType.DDOS,
        severity: IncidentSeverity.LOW,
        title: 'Minor DDoS Attempt',
        description: 'Brief DDoS attack, quickly mitigated',
        affectedDataTypes: [],
        affectedUserCount: 0,
        detectedAt: new Date(),
        reportedBy: 'admin-123',
      };

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'admin-1', email: 'admin@example.com', name: 'Admin' },
      ]);

      mockPrisma.securityIncident.create.mockResolvedValue({
        id: 'incident-4',
        ...incidentData,
        status: IncidentStatus.REPORTED,
        icoNotificationRequired: false,
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.securityIncident.update.mockResolvedValue({
        id: 'incident-4',
        adminNotifiedAt: new Date(),
      });

      const result = await reportIncident(incidentData);

      expect(result.icoNotificationRequired).toBe(false);
    });
  });

  describe('updateIncidentStatus', () => {
    it('should update incident status', async () => {
      const incidentId = 'incident-1';
      const updates = {
        status: IncidentStatus.CONTAINED,
        containedAt: new Date(),
        remediationSteps: 'Access revoked, passwords reset',
      };

      mockPrisma.securityIncident.update.mockResolvedValue({
        id: incidentId,
        ...updates,
        updatedAt: new Date(),
      });

      const result = await updateIncidentStatus(incidentId, updates);

      expect(result.status).toBe(IncidentStatus.CONTAINED);
      expect(result.containedAt).toBeDefined();
      expect(mockPrisma.securityIncident.update).toHaveBeenCalledWith({
        where: { id: incidentId },
        data: updates,
      });
    });

    it('should update incident to resolved status', async () => {
      const incidentId = 'incident-1';
      const updates = {
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date(),
        lessonsLearned: 'Improved access controls implemented',
      };

      mockPrisma.securityIncident.update.mockResolvedValue({
        id: incidentId,
        ...updates,
        updatedAt: new Date(),
      });

      const result = await updateIncidentStatus(incidentId, updates);

      expect(result.status).toBe(IncidentStatus.RESOLVED);
      expect(result.resolvedAt).toBeDefined();
    });
  });

  describe('notifyAffectedUsers', () => {
    it('should send notifications to all affected users', async () => {
      const incidentId = 'incident-1';
      const affectedUsers = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(affectedUsers);
      mockPrisma.securityIncident.findUnique.mockResolvedValue({
        id: incidentId,
        type: IncidentType.DATA_BREACH,
        title: 'Data Breach Notification',
        description: 'Your data may have been compromised',
        affectedDataTypes: ['email'],
        severity: IncidentSeverity.HIGH,
        detectedAt: new Date(),
      } as any);

      mockPrisma.breachNotification.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.securityIncident.update.mockResolvedValue({
        id: incidentId,
        usersNotifiedAt: new Date(),
      });

      const result = await notifyAffectedUsers(incidentId, ['user-1', 'user-2']);

      expect(result.notificationsSent).toBe(2);
      expect(mockPrisma.breachNotification.createMany).toHaveBeenCalled();
      expect(mockPrisma.securityIncident.update).toHaveBeenCalledWith({
        where: { id: incidentId },
        data: { usersNotifiedAt: expect.any(Date) },
      });
    });

    it('should handle email sending failures gracefully', async () => {
      const incidentId = 'incident-1';
      const affectedUsers = [
        { id: 'user-1', email: 'invalid@example.com', name: 'User 1' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(affectedUsers);
      mockPrisma.securityIncident.findUnique.mockResolvedValue({
        id: incidentId,
        type: IncidentType.DATA_BREACH,
        title: 'Data Breach Notification',
        description: 'Your data may have been compromised',
        affectedDataTypes: ['email'],
        detectedAt: new Date(),
      } as any);

      const { sendEmail } = require('../../services/emailService');
      (sendEmail as jest.Mock).mockRejectedValueOnce(new Error('Email failed'));

      mockPrisma.breachNotification.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.securityIncident.update.mockResolvedValue({
        id: incidentId,
        usersNotifiedAt: new Date(),
      });

      const result = await notifyAffectedUsers(incidentId, ['user-1']);

      expect(result.notificationsSent).toBe(0);
      expect(result.failures).toBeDefined();
      expect(result.failures).toHaveLength(1);
    });
  });

  describe('reportToICO', () => {
    it('should mark incident as reported to ICO', async () => {
      const incidentId = 'incident-1';
      const icoReferenceNumber = 'ICO-2026-123456';

      mockPrisma.securityIncident.update.mockResolvedValue({
        id: incidentId,
        icoNotifiedAt: new Date(),
        icoReferenceNumber,
        updatedAt: new Date(),
      });

      const result = await reportToICO(incidentId, icoReferenceNumber);

      expect(result.icoNotifiedAt).toBeDefined();
      expect(result.icoReferenceNumber).toBe(icoReferenceNumber);
      expect(mockPrisma.securityIncident.update).toHaveBeenCalledWith({
        where: { id: incidentId },
        data: {
          icoNotifiedAt: expect.any(Date),
          icoReferenceNumber,
        },
      });
    });
  });

  describe('get72HourDeadline', () => {
    it('should calculate 72-hour deadline from detection time', () => {
      const detectedAt = new Date('2026-01-20T10:00:00Z');
      const deadline = get72HourDeadline(detectedAt);

      expect(deadline.getTime() - detectedAt.getTime()).toBe(72 * 60 * 60 * 1000);
    });

    it('should return valid future date', () => {
      const detectedAt = new Date();
      const deadline = get72HourDeadline(detectedAt);

      expect(deadline.getTime()).toBeGreaterThan(detectedAt.getTime());
    });
  });

  describe('assessRisk', () => {
    it('should assess risk as critical for payment data breaches', () => {
      const incident = {
        type: IncidentType.DATA_BREACH,
        severity: IncidentSeverity.CRITICAL,
        affectedDataTypes: ['payment_info', 'credit_card'],
        affectedUserCount: 1000,
      };

      const risk = assessRisk(incident);

      expect(risk.level).toBe('critical');
      expect(risk.requiresICONotification).toBe(true);
    });

    it('should assess risk as high for sensitive data breaches', () => {
      const incident = {
        type: IncidentType.DATA_BREACH,
        severity: IncidentSeverity.HIGH,
        affectedDataTypes: ['password', 'ssn', 'personal_info'],
        affectedUserCount: 500,
      };

      const risk = assessRisk(incident);

      expect(risk.level).toBe('high');
      expect(risk.requiresICONotification).toBe(true);
    });

    it('should assess risk as low for non-sensitive incidents', () => {
      const incident = {
        type: IncidentType.DDOS,
        severity: IncidentSeverity.LOW,
        affectedDataTypes: [],
        affectedUserCount: 0,
      };

      const risk = assessRisk(incident);

      expect(risk.level).toBe('low');
      expect(risk.requiresICONotification).toBe(false);
    });

    it('should assess risk as medium for moderate incidents', () => {
      const incident = {
        type: IncidentType.UNAUTHORIZED_ACCESS,
        severity: IncidentSeverity.MEDIUM,
        affectedDataTypes: ['email'],
        affectedUserCount: 50,
      };

      const risk = assessRisk(incident);

      expect(risk.level).toBe('medium');
    });
  });
});
