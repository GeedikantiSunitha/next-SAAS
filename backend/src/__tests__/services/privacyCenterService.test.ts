/**
 * Tests for Privacy Center Service
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import { prisma } from '../../config/database';
import * as privacyCenterService from '../../services/privacyCenterService';
import { ConsentType } from '@prisma/client';

jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    consentRecord: { findMany: jest.fn() },
    privacyPreferences: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    dataAccessLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    dataExportRequest: { findMany: jest.fn() },
    dataDeletionRequest: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

// We'll spy on the actual cache from the service instead of mocking it

describe('Privacy Center Service', () => {
  const testUserId = 'user-123';

  beforeEach(async () => {
    jest.clearAllMocks();
    // Clear the actual cache
    const privacyCenterModule = await import('../../services/privacyCenterService');
    const { cache } = privacyCenterModule;
    cache.clear();
  });

  describe('getPrivacyOverview', () => {
    it('should aggregate all privacy data for a user', async () => {
      // Mock data
      const mockUser = {
        id: testUserId,
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
      };

      const mockConsents = [
        {
          id: 'consent-1',
          consentType: ConsentType.MARKETING_EMAILS,
          granted: true,
          version: '2.0.0',
          grantedAt: new Date(),
          consentVersion: { version: '2.0.0' },
        },
      ];

      const mockPreferences = {
        id: 'pref-1',
        userId: testUserId,
        emailMarketing: false,
        smsMarketing: false,
        pushNotifications: true,
        shareWithPartners: false,
        profileVisibility: 'PRIVATE',
      };

      const mockExports = [
        {
          id: 'export-1',
          status: 'COMPLETED',
          requestedAt: new Date(),
          completedAt: new Date(),
        },
      ];

      const mockDeletions: any[] = [];


      const mockAccessLogs = [
        {
          id: 'log-1',
          accessedBy: 'admin',
          accessType: 'VIEW',
          dataCategory: 'PROFILE',
          purpose: 'Support',
          timestamp: new Date(),
        },
      ];

      // Setup mocks
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue(mockConsents);
      (prisma.privacyPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreferences);
      (prisma.dataExportRequest.findMany as jest.Mock).mockResolvedValue(mockExports);
      (prisma.dataDeletionRequest.findMany as jest.Mock).mockResolvedValue(mockDeletions);
      (prisma.dataAccessLog.findMany as jest.Mock).mockResolvedValue(mockAccessLogs);

      const result = await privacyCenterService.getPrivacyOverview(testUserId);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('dataCategories');
      expect(result).toHaveProperty('consents');
      expect(result).toHaveProperty('privacyPreferences');
      expect(result).toHaveProperty('dataRequests');
      expect(result).toHaveProperty('cookiePreferences');
      expect(result).toHaveProperty('recentAccess');
      expect(result).toHaveProperty('metrics');

      expect(result.user.email).toBe('test@example.com');
      expect(result.consents).toHaveLength(1);
      expect(result.privacyPreferences.emailMarketing).toBe(false);
    });

    it('should handle missing user gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(privacyCenterService.getPrivacyOverview(testUserId))
        .rejects.toThrow('User not found');
    });

    it('should use cached data when available', async () => {
      const privacyCenterModule = await import('../../services/privacyCenterService');
      const { cache } = privacyCenterModule;
      const cachedData = { cached: true };
      cache.set(`privacy:overview:${testUserId}`, cachedData);

      const result = await privacyCenterService.getPrivacyOverview(testUserId);

      expect(result).toEqual(cachedData);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should create default privacy preferences if not exist', async () => {
      const mockUser = { id: testUserId, email: 'test@example.com', createdAt: new Date() };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.privacyPreferences.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.privacyPreferences.create as jest.Mock).mockResolvedValue({
        userId: testUserId,
        emailMarketing: false,
        smsMarketing: false,
        pushNotifications: false,
        shareWithPartners: false,
        profileVisibility: 'PRIVATE',
      });

      // Mock other required services
      (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dataExportRequest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dataDeletionRequest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dataAccessLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.privacyPreferences.count as jest.Mock).mockResolvedValue(1);

      await privacyCenterService.getPrivacyOverview(testUserId);

      expect(prisma.privacyPreferences.create).toHaveBeenCalledWith({
        data: { userId: testUserId },
      });
    });
  });

  describe('getDataCategories', () => {
    it('should return categorized data with counts', async () => {
      // Mock individual counts
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.privacyPreferences.count as jest.Mock).mockResolvedValue(1);

      const result = await privacyCenterService.getDataCategories(testUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      const profileCategory = result.find(c => c.category === 'PROFILE');
      expect(profileCategory).toBeDefined();
      expect(profileCategory?.count).toBe(15);
      expect(profileCategory?.fields).toContain('email');
      expect(profileCategory?.purpose).toBeDefined();
      expect(profileCategory?.retention).toBeDefined();
    });

    it('should include all standard data categories', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.privacyPreferences.count as jest.Mock).mockResolvedValue(0);

      const result = await privacyCenterService.getDataCategories(testUserId);

      const categories = result.map(c => c.category);
      expect(categories).toContain('PROFILE');
      expect(categories).toContain('ORDERS');
      expect(categories).toContain('USAGE');
      expect(categories).toContain('PREFERENCES');
    });
  });

  describe('getDataAccessLog', () => {
    it('should return paginated access logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          accessedBy: 'admin',
          accessType: 'VIEW',
          dataCategory: 'PROFILE',
          purpose: 'Support',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
        },
      ];

      (prisma.dataAccessLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.dataAccessLog.count as jest.Mock).mockResolvedValue(1);

      const result = await privacyCenterService.getDataAccessLog(testUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(result.entries).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.dataAccessLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dataAccessLog.count as jest.Mock).mockResolvedValue(0);

      await privacyCenterService.getDataAccessLog(testUserId, {
        startDate,
        endDate,
      });

      expect(prisma.dataAccessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should filter by access type', async () => {
      (prisma.dataAccessLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dataAccessLog.count as jest.Mock).mockResolvedValue(0);

      await privacyCenterService.getDataAccessLog(testUserId, {
        accessType: 'EXPORT',
      });

      expect(prisma.dataAccessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            accessType: 'EXPORT',
          }),
        })
      );
    });
  });

  describe('getPrivacyMetrics', () => {
    it('should calculate comprehensive privacy metrics', async () => {
      // Mock various data sources
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.privacyPreferences.count as jest.Mock).mockResolvedValue(1);

      (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue([
        { granted: true, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        { granted: true, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        { granted: false, expiresAt: null },
      ]);

      (prisma.dataExportRequest.findMany as jest.Mock).mockResolvedValue([
        { status: 'COMPLETED' },
        { status: 'PENDING' },
      ]);

      (prisma.dataDeletionRequest.findMany as jest.Mock).mockResolvedValue([
        { status: 'PENDING', scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      ]);

      (prisma.privacyPreferences.findUnique as jest.Mock).mockResolvedValue({
        profileVisibility: 'PRIVATE',
        shareWithPartners: false,
        emailMarketing: false,
      });

      const result = await privacyCenterService.getPrivacyMetrics(testUserId);

      expect(result.dataCollection.totalDataPoints).toBe(245); // Sum of all counts
      expect(result.consents.total).toBe(3);
      expect(result.consents.granted).toBe(2);
      expect(result.consents.expiringSoon).toBe(1); // One expires in 30 days
      expect(result.requests.totalExports).toBe(2);
      expect(result.requests.pendingDeletions).toBe(1);
      expect(result.retention.daysUntilDeletion).toBe(30);
    });

    it('should handle no data gracefully', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.privacyPreferences.count as jest.Mock).mockResolvedValue(0);
      (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dataExportRequest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dataDeletionRequest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.privacyPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await privacyCenterService.getPrivacyMetrics(testUserId);

      expect(result.dataCollection.totalDataPoints).toBe(0);
      expect(result.consents.total).toBe(0);
      expect(result.retention.daysUntilDeletion).toBeNull();
    });
  });

  describe('updatePrivacyPreferences', () => {
    it('should update existing preferences', async () => {
      const updates = {
        emailMarketing: true,
        profileVisibility: 'FRIENDS',
      };

      const updatedPrefs = {
        ...updates,
        userId: testUserId,
        smsMarketing: false,
      };

      (prisma.privacyPreferences.upsert as jest.Mock).mockResolvedValue(updatedPrefs);

      const result = await privacyCenterService.updatePrivacyPreferences(testUserId, updates);

      expect(result).toMatchObject(updates);
      expect(prisma.privacyPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: testUserId },
        update: updates,
        create: { userId: testUserId, ...updates },
      });
    });

    it('should validate profile visibility values', async () => {
      const invalidUpdate = {
        profileVisibility: 'INVALID_VALUE',
      };

      await expect(privacyCenterService.updatePrivacyPreferences(testUserId, invalidUpdate))
        .rejects.toThrow('Invalid profile visibility');
    });

    it('should log preference changes when requested', async () => {
      const updates = { emailMarketing: false };

      (prisma.privacyPreferences.findUnique as jest.Mock).mockResolvedValue({
        emailMarketing: true,
      });

      (prisma.privacyPreferences.upsert as jest.Mock).mockResolvedValue({
        ...updates,
        userId: testUserId,
      });

      await privacyCenterService.updatePrivacyPreferences(testUserId, updates, { logChange: true });

      expect(prisma.dataAccessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: testUserId,
          accessedBy: testUserId,
          accessType: 'UPDATE',
          dataCategory: 'PREFERENCES',
          purpose: expect.stringContaining('Privacy preference update'),
        }),
      });
    });

    it('should clear cache after update', async () => {
      const privacyCenterModule = await import('../../services/privacyCenterService');
      const { cache } = privacyCenterModule;
      const updates = { emailMarketing: true };

      (prisma.privacyPreferences.upsert as jest.Mock).mockResolvedValue({
        ...updates,
        userId: testUserId,
      });

      cache.set(`privacy:overview:${testUserId}`, { cached: true });

      await privacyCenterService.updatePrivacyPreferences(testUserId, updates);

      expect(cache.has(`privacy:overview:${testUserId}`)).toBe(false);
    });
  });

  describe('clearUserCache', () => {
    it('should clear all user-related cache entries', async () => {
      const privacyCenterModule = await import('../../services/privacyCenterService');
      const { cache } = privacyCenterModule;
      // Set multiple cache entries
      cache.set(`privacy:overview:${testUserId}`, { overview: true });
      cache.set(`privacy:metrics:${testUserId}`, { metrics: true });
      cache.set(`privacy:categories:${testUserId}`, { categories: true });

      const result = await privacyCenterService.clearUserCache(testUserId);

      expect(result).toBe(true);
      expect(cache.has(`privacy:overview:${testUserId}`)).toBe(false);
      expect(cache.has(`privacy:metrics:${testUserId}`)).toBe(false);
      expect(cache.has(`privacy:categories:${testUserId}`)).toBe(false);
    });
  });
});