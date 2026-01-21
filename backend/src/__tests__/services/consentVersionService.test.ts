/**
 * Tests for Consent Version Service
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import { prisma } from '../../config/database';
import { ConsentType } from '@prisma/client';
import * as consentVersionService from '../../services/consentVersionService';

// Mock the prisma client
jest.mock('../../config/database', () => ({
  prisma: {
    consentVersion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    consentRecord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ConsentVersionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConsentVersion', () => {
    it('should create a new consent version', async () => {
      const mockVersion = {
        id: 'version-1',
        consentType: ConsentType.MARKETING_EMAILS,
        version: '1.0.0',
        title: 'Marketing Consent',
        content: 'We would like to send you marketing emails',
        summary: 'Initial version',
        effectiveDate: new Date(),
        expiryPeriod: 365,
        isActive: true,
        requiresReConsent: false,
        changes: null,
        createdBy: 'admin-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.consentVersion.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.consentVersion.create as jest.Mock).mockResolvedValue(mockVersion);

      const result = await consentVersionService.createConsentVersion(
        ConsentType.MARKETING_EMAILS,
        '1.0.0',
        'Marketing Consent',
        'We would like to send you marketing emails',
        {
          summary: 'Initial version',
          expiryPeriod: 365,
          createdBy: 'admin-user',
        }
      );

      expect(result).toEqual(mockVersion);
      expect(prisma.consentVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          consentType: ConsentType.MARKETING_EMAILS,
          version: '1.0.0',
          title: 'Marketing Consent',
          content: 'We would like to send you marketing emails',
          summary: 'Initial version',
          expiryPeriod: 365,
          isActive: true,
          requiresReConsent: false,
        }),
      });
    });

    it('should throw error if version already exists', async () => {
      const existingVersion = {
        id: 'version-1',
        consentType: ConsentType.MARKETING_EMAILS,
        version: '1.0.0',
      };

      (prisma.consentVersion.findUnique as jest.Mock).mockResolvedValue(existingVersion);

      await expect(
        consentVersionService.createConsentVersion(
          ConsentType.MARKETING_EMAILS,
          '1.0.0',
          'Marketing Consent',
          'Content'
        )
      ).rejects.toThrow('Version 1.0.0 already exists for MARKETING_EMAILS');
    });

    it('should deactivate current version if requiresReConsent is true', async () => {
      const mockVersion = {
        id: 'version-2',
        consentType: ConsentType.MARKETING_EMAILS,
        version: '2.0.0',
        title: 'Updated Marketing Consent',
        content: 'Updated content',
        isActive: true,
        requiresReConsent: true,
      };

      (prisma.consentVersion.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.consentVersion.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.consentVersion.create as jest.Mock).mockResolvedValue(mockVersion);

      await consentVersionService.createConsentVersion(
        ConsentType.MARKETING_EMAILS,
        '2.0.0',
        'Updated Marketing Consent',
        'Updated content',
        { requiresReConsent: true }
      );

      expect(prisma.consentVersion.updateMany).toHaveBeenCalledWith({
        where: {
          consentType: ConsentType.MARKETING_EMAILS,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    });
  });

  describe('getActiveConsentVersion', () => {
    it('should return the active version for a consent type', async () => {
      const activeVersion = {
        id: 'version-1',
        consentType: ConsentType.COOKIES,
        version: '1.0.0',
        isActive: true,
      };

      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(activeVersion);

      const result = await consentVersionService.getActiveConsentVersion(ConsentType.COOKIES);

      expect(result).toEqual(activeVersion);
      expect(prisma.consentVersion.findFirst).toHaveBeenCalledWith({
        where: {
          consentType: ConsentType.COOKIES,
          isActive: true,
        },
        orderBy: {
          effectiveDate: 'desc',
        },
      });
    });

    it('should return null if no active version exists', async () => {
      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await consentVersionService.getActiveConsentVersion(ConsentType.ANALYTICS);

      expect(result).toBeNull();
    });
  });

  describe('needsReConsent', () => {
    it('should return true if user has no consent', async () => {
      const activeVersion = {
        id: 'version-1',
        version: '1.0.0',
        isActive: true,
      };

      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(activeVersion);
      (prisma.consentRecord.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await consentVersionService.needsReConsent(
        'user-1',
        ConsentType.MARKETING_EMAILS
      );

      expect(result.needsReConsent).toBe(true);
      expect(result.reason).toBe('NO_CONSENT');
    });

    it('should return true if consent has expired', async () => {
      const activeVersion = {
        id: 'version-1',
        version: '1.0.0',
        isActive: true,
      };

      const expiredConsent = {
        id: 'consent-1',
        userId: 'user-1',
        consentType: ConsentType.MARKETING_EMAILS,
        granted: true,
        expiresAt: new Date('2020-01-01'),
        version: '1.0.0',
        consentVersion: null,
      };

      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(activeVersion);
      (prisma.consentRecord.findUnique as jest.Mock).mockResolvedValue(expiredConsent);

      const result = await consentVersionService.needsReConsent(
        'user-1',
        ConsentType.MARKETING_EMAILS
      );

      expect(result.needsReConsent).toBe(true);
      expect(result.reason).toBe('EXPIRED');
    });

    it('should return true if version is outdated and requiresReConsent', async () => {
      const userConsent = {
        id: 'consent-1',
        userId: 'user-1',
        consentType: ConsentType.MARKETING_EMAILS,
        granted: true,
        versionId: 'old-version',
        version: '1.0.0',
        expiresAt: null,
        consentVersion: null,
      };

      const activeVersion = {
        id: 'new-version',
        version: '2.0.0',
        requiresReConsent: true,
        changes: 'Updated data retention policy',
      };

      (prisma.consentRecord.findUnique as jest.Mock).mockResolvedValue(userConsent);
      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(activeVersion);

      const result = await consentVersionService.needsReConsent(
        'user-1',
        ConsentType.MARKETING_EMAILS
      );

      expect(result.needsReConsent).toBe(true);
      expect(result.reason).toBe('VERSION_OUTDATED');
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.newVersion).toBe('2.0.0');
      expect(result.changes).toBe('Updated data retention policy');
    });

    it('should return false if consent is up-to-date', async () => {
      const activeVersion = {
        id: 'current-version',
        version: '1.0.0',
        requiresReConsent: false,
        isActive: true,
      };

      const userConsent = {
        id: 'consent-1',
        userId: 'user-1',
        consentType: ConsentType.MARKETING_EMAILS,
        granted: true,
        versionId: 'current-version',
        version: '1.0.0',
        expiresAt: null,
        consentVersion: activeVersion,
      };

      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(activeVersion);
      (prisma.consentRecord.findUnique as jest.Mock).mockResolvedValue(userConsent);

      const result = await consentVersionService.needsReConsent(
        'user-1',
        ConsentType.MARKETING_EMAILS
      );

      expect(result.needsReConsent).toBe(false);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('updateConsentVersion', () => {
    it('should update consent with new version when granted', async () => {
      const activeVersion = {
        id: 'version-1',
        version: '1.0.0',
        expiryPeriod: 365,
      };

      const updatedConsent = {
        id: 'consent-1',
        userId: 'user-1',
        consentType: ConsentType.MARKETING_EMAILS,
        granted: true,
        grantedAt: new Date(),
        version: '1.0.0',
        versionId: 'version-1',
      };

      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(activeVersion);
      (prisma.consentRecord.upsert as jest.Mock).mockResolvedValue(updatedConsent);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await consentVersionService.updateConsentVersion(
        'user-1',
        ConsentType.MARKETING_EMAILS,
        true,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toEqual(updatedConsent);
      expect(prisma.consentRecord.upsert).toHaveBeenCalledWith({
        where: {
          userId_consentType: {
            userId: 'user-1',
            consentType: ConsentType.MARKETING_EMAILS,
          },
        },
        update: expect.objectContaining({
          granted: true,
          version: '1.0.0',
          versionId: 'version-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
        create: expect.objectContaining({
          userId: 'user-1',
          consentType: ConsentType.MARKETING_EMAILS,
          granted: true,
          version: '1.0.0',
          versionId: 'version-1',
        }),
      });
    });

    it('should revoke consent when granted is false', async () => {
      const activeVersion = {
        id: 'version-1',
        version: '1.0.0',
      };

      const revokedConsent = {
        id: 'consent-1',
        userId: 'user-1',
        consentType: ConsentType.MARKETING_EMAILS,
        granted: false,
        revokedAt: new Date(),
        version: '1.0.0',
        versionId: 'version-1',
      };

      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(activeVersion);
      (prisma.consentRecord.upsert as jest.Mock).mockResolvedValue(revokedConsent);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await consentVersionService.updateConsentVersion(
        'user-1',
        ConsentType.MARKETING_EMAILS,
        false
      );

      expect(result.granted).toBe(false);
      expect(result.revokedAt).toBeDefined();
    });

    it('should throw error if no active version found', async () => {
      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        consentVersionService.updateConsentVersion(
          'user-1',
          ConsentType.MARKETING_EMAILS,
          true
        )
      ).rejects.toThrow('No active version found for MARKETING_EMAILS');
    });
  });

  describe('getConsentHistory', () => {
    it('should return user consent history', async () => {
      const consentRecords = [
        {
          id: 'consent-1',
          consentType: ConsentType.MARKETING_EMAILS,
          granted: true,
          version: '1.0.0',
          consentVersion: { title: 'Marketing v1' },
        },
      ];

      const auditLogs = [
        {
          id: 'log-1',
          action: 'CONSENT_GRANTED',
          createdAt: new Date(),
          details: { consentType: 'MARKETING_EMAILS', version: '1.0.0' },
        },
      ];

      (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue(consentRecords);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(auditLogs);

      const result = await consentVersionService.getConsentHistory('user-1');

      expect(result.current).toEqual(consentRecords);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].action).toBe('CONSENT_GRANTED');
    });
  });

  describe('handleExpiredConsents', () => {
    it('should revoke expired consents', async () => {
      (prisma.consentRecord.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const count = await consentVersionService.handleExpiredConsents();

      expect(count).toBe(2);
      expect(prisma.consentRecord.updateMany).toHaveBeenCalledWith({
        where: {
          granted: true,
          expiresAt: {
            lte: expect.any(Date),
          },
        },
        data: {
          granted: false,
          revokedAt: expect.any(Date),
        },
      });
    });

    it('should return 0 if no expired consents', async () => {
      (prisma.consentRecord.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const count = await consentVersionService.handleExpiredConsents();

      expect(count).toBe(0);
    });
  });

  describe('getUsersNeedingReConsent', () => {
    it('should return users with outdated consent versions', async () => {
      const activeVersion = {
        id: 'new-version',
        version: '2.0.0',
        requiresReConsent: true,
        isActive: true,
      };

      const usersWithOutdated = [
        { id: 'user-1', email: 'user1@example.com' },
      ];

      const usersWithoutConsent = [
        { id: 'user-2', email: 'user2@example.com' },
      ];

      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(activeVersion);
      (prisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce(usersWithOutdated)
        .mockResolvedValueOnce(usersWithoutConsent);

      const result = await consentVersionService.getUsersNeedingReConsent(
        ConsentType.MARKETING_EMAILS
      );

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([...usersWithOutdated, ...usersWithoutConsent]));
    });

    it('should return empty array if no active version requires re-consent', async () => {
      (prisma.consentVersion.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await consentVersionService.getUsersNeedingReConsent(
        ConsentType.MARKETING_EMAILS
      );

      expect(result).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions and return differences', async () => {
      const version1 = {
        id: 'v1',
        consentType: ConsentType.MARKETING_EMAILS,
        version: '1.0.0',
        title: 'Marketing Consent',
        content: 'Content v1',
        summary: 'Initial version',
        effectiveDate: new Date('2023-01-01'),
        expiryPeriod: 365,
      };

      const version2 = {
        id: 'v2',
        consentType: ConsentType.MARKETING_EMAILS,
        version: '2.0.0',
        title: 'Updated Marketing Consent',
        content: 'Content v2',
        summary: 'Updated version',
        effectiveDate: new Date('2024-01-01'),
        expiryPeriod: 180,
        changes: 'Reduced retention period',
      };

      (prisma.consentVersion.findUnique as jest.Mock)
        .mockResolvedValueOnce(version1)
        .mockResolvedValueOnce(version2);

      const result = await consentVersionService.compareVersions(
        ConsentType.MARKETING_EMAILS,
        '1.0.0',
        '2.0.0'
      );

      expect(result.differences.titleChanged).toBe(true);
      expect(result.differences.contentChanged).toBe(true);
      expect(result.differences.expiryPeriodChanged).toBe(true);
      expect(result.version2.version).toBe('2.0.0');
    });

    it('should throw error if version not found', async () => {
      (prisma.consentVersion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        consentVersionService.compareVersions(
          ConsentType.MARKETING_EMAILS,
          '1.0.0',
          '2.0.0'
        )
      ).rejects.toThrow('One or both versions not found');
    });
  });

  describe('getConsentVersions', () => {
    it('should return all versions for a consent type', async () => {
      const versions = [
        { id: 'v1', version: '1.0.0', effectiveDate: new Date('2023-01-01') },
        { id: 'v2', version: '2.0.0', effectiveDate: new Date('2024-01-01') },
      ];

      (prisma.consentVersion.findMany as jest.Mock).mockResolvedValue(versions);

      const result = await consentVersionService.getConsentVersions(
        ConsentType.MARKETING_EMAILS
      );

      expect(result).toEqual(versions);
      expect(prisma.consentVersion.findMany).toHaveBeenCalledWith({
        where: {
          consentType: ConsentType.MARKETING_EMAILS,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});