/**
 * Tests for Privacy Preferences and Data Access Log Models
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import { prisma } from '../../config/database';

describe('Privacy Models', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `privacy-test-${Date.now()}@test.com`,
        password: 'hashed_password',
        role: 'USER',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('PrivacyPreferences Model', () => {
    afterEach(async () => {
      // Clean up after each test
      await prisma.privacyPreferences.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should create privacy preferences with default values', async () => {
      const preferences = await prisma.privacyPreferences.create({
        data: {
          userId: testUserId,
        },
      });

      expect(preferences).toBeDefined();
      expect(preferences.id).toBeDefined();
      expect(preferences.userId).toBe(testUserId);

      // Check default marketing preferences
      expect(preferences.emailMarketing).toBe(false);
      expect(preferences.smsMarketing).toBe(false);
      expect(preferences.pushNotifications).toBe(false);
      expect(preferences.productUpdates).toBe(true);
      expect(preferences.newsletterSubscription).toBe(false);

      // Check default sharing preferences
      expect(preferences.shareWithPartners).toBe(false);
      expect(preferences.shareForAnalytics).toBe(false);
      expect(preferences.shareForAdvertising).toBe(false);

      // Check default visibility preferences
      expect(preferences.profileVisibility).toBe('PRIVATE');
      expect(preferences.showActivityStatus).toBe(true);
    });

    it('should create privacy preferences with custom values', async () => {
      const preferences = await prisma.privacyPreferences.create({
        data: {
          userId: testUserId,
          emailMarketing: true,
          smsMarketing: true,
          pushNotifications: true,
          productUpdates: false,
          newsletterSubscription: true,
          shareWithPartners: true,
          shareForAnalytics: true,
          shareForAdvertising: false,
          profileVisibility: 'PUBLIC',
          showActivityStatus: false,
        },
      });

      expect(preferences.emailMarketing).toBe(true);
      expect(preferences.smsMarketing).toBe(true);
      expect(preferences.pushNotifications).toBe(true);
      expect(preferences.productUpdates).toBe(false);
      expect(preferences.newsletterSubscription).toBe(true);
      expect(preferences.shareWithPartners).toBe(true);
      expect(preferences.shareForAnalytics).toBe(true);
      expect(preferences.shareForAdvertising).toBe(false);
      expect(preferences.profileVisibility).toBe('PUBLIC');
      expect(preferences.showActivityStatus).toBe(false);
    });

    it('should update privacy preferences', async () => {
      const preferences = await prisma.privacyPreferences.create({
        data: {
          userId: testUserId,
        },
      });

      const updated = await prisma.privacyPreferences.update({
        where: { id: preferences.id },
        data: {
          emailMarketing: true,
          profileVisibility: 'FRIENDS',
        },
      });

      expect(updated.emailMarketing).toBe(true);
      expect(updated.profileVisibility).toBe('FRIENDS');
    });

    it('should enforce unique userId constraint', async () => {
      await prisma.privacyPreferences.create({
        data: {
          userId: testUserId,
        },
      });

      await expect(
        prisma.privacyPreferences.create({
          data: {
            userId: testUserId,
          },
        })
      ).rejects.toThrow(/unique constraint/i);
    });

    it('should cascade delete when user is deleted', async () => {
      const tempUser = await prisma.user.create({
        data: {
          email: `temp-privacy-${Date.now()}@test.com`,
          password: 'hashed',
          role: 'USER',
        },
      });

      const preferences = await prisma.privacyPreferences.create({
        data: {
          userId: tempUser.id,
        },
      });

      await prisma.user.delete({
        where: { id: tempUser.id },
      });

      const deletedPreferences = await prisma.privacyPreferences.findUnique({
        where: { id: preferences.id },
      });

      expect(deletedPreferences).toBeNull();
    });
  });

  describe('DataAccessLog Model', () => {
    afterEach(async () => {
      // Clean up after each test
      await prisma.dataAccessLog.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should create a data access log entry', async () => {
      const log = await prisma.dataAccessLog.create({
        data: {
          userId: testUserId,
          accessedBy: 'admin-user-id',
          accessType: 'VIEW',
          dataCategory: 'PROFILE',
          purpose: 'Customer support request',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.userId).toBe(testUserId);
      expect(log.accessedBy).toBe('admin-user-id');
      expect(log.accessType).toBe('VIEW');
      expect(log.dataCategory).toBe('PROFILE');
      expect(log.purpose).toBe('Customer support request');
      expect(log.ipAddress).toBe('192.168.1.1');
      expect(log.userAgent).toBe('Mozilla/5.0');
      expect(log.timestamp).toBeInstanceOf(Date);
    });

    it('should create multiple access log entries', async () => {
      await prisma.dataAccessLog.createMany({
        data: [
          {
            userId: testUserId,
            accessedBy: 'system',
            accessType: 'EXPORT',
            dataCategory: 'ORDERS',
            purpose: 'User requested data export',
          },
          {
            userId: testUserId,
            accessedBy: 'admin-user-id',
            accessType: 'VIEW',
            dataCategory: 'ACTIVITY',
            purpose: 'Security review',
          },
          {
            userId: testUserId,
            accessedBy: 'analytics-service',
            accessType: 'PROCESS',
            dataCategory: 'USAGE',
            purpose: 'Generate usage reports',
          },
        ],
      });

      const logs = await prisma.dataAccessLog.findMany({
        where: { userId: testUserId },
        orderBy: { timestamp: 'asc' },
      });

      expect(logs).toHaveLength(3);
      // Verify all three types exist (order may vary due to timing)
      const accessTypes = logs.map(log => log.accessType);
      expect(accessTypes).toContain('EXPORT');
      expect(accessTypes).toContain('VIEW');
      expect(accessTypes).toContain('PROCESS');
    });

    it('should retrieve access logs for a specific user', async () => {
      // Create logs for different users
      const otherUser = await prisma.user.create({
        data: {
          email: `other-privacy-${Date.now()}@test.com`,
          password: 'hashed',
          role: 'USER',
        },
      });

      await prisma.dataAccessLog.createMany({
        data: [
          {
            userId: testUserId,
            accessedBy: 'admin',
            accessType: 'VIEW',
            dataCategory: 'PROFILE',
            purpose: 'Support',
          },
          {
            userId: otherUser.id,
            accessedBy: 'admin',
            accessType: 'VIEW',
            dataCategory: 'PROFILE',
            purpose: 'Support',
          },
        ],
      });

      const userLogs = await prisma.dataAccessLog.findMany({
        where: { userId: testUserId },
      });

      expect(userLogs).toHaveLength(1);
      expect(userLogs[0].userId).toBe(testUserId);

      // Cleanup
      await prisma.user.delete({
        where: { id: otherUser.id },
      });
    });

    it('should cascade delete when user is deleted', async () => {
      const tempUser = await prisma.user.create({
        data: {
          email: `temp-log-${Date.now()}@test.com`,
          password: 'hashed',
          role: 'USER',
        },
      });

      const log = await prisma.dataAccessLog.create({
        data: {
          userId: tempUser.id,
          accessedBy: 'admin',
          accessType: 'VIEW',
          dataCategory: 'PROFILE',
          purpose: 'Test',
        },
      });

      await prisma.user.delete({
        where: { id: tempUser.id },
      });

      const deletedLog = await prisma.dataAccessLog.findUnique({
        where: { id: log.id },
      });

      expect(deletedLog).toBeNull();
    });

    it('should filter logs by timestamp range', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await prisma.dataAccessLog.create({
        data: {
          userId: testUserId,
          accessedBy: 'admin',
          accessType: 'VIEW',
          dataCategory: 'PROFILE',
          purpose: 'Test',
        },
      });

      const logs = await prisma.dataAccessLog.findMany({
        where: {
          userId: testUserId,
          timestamp: {
            gte: yesterday,
            lte: tomorrow,
          },
        },
      });

      expect(logs).toHaveLength(1);
    });
  });
});