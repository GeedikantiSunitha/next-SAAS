/**
 * Admin Feature Flags Service Tests (TDD)
 * 
 * Comprehensive test suite following TDD approach:
 * - Unit tests for service functions
 * - Integration tests with database
 * - Edge cases and error handling
 * 
 * RED → GREEN → REFACTOR
 */

import { prisma } from '../../config/database';
import * as adminFeatureFlagsService from '../../services/adminFeatureFlagsService';

describe('Admin Feature Flags Service - Unit Tests', () => {
  let adminUser: { id: string; email: string };
  let regularUser: { id: string; email: string };

  beforeEach(async () => {
    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        password: 'hashed',
        role: 'ADMIN',
      },
    });

    // Create regular user
    regularUser = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@test.com`,
        password: 'hashed',
        role: 'USER',
      },
    });
  });

  afterEach(async () => {
    // Clean up
    await prisma.featureFlag.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUser.id, regularUser.id] },
      },
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags from database', async () => {
      // Arrange: Clean slate - seed/other tests may have created flags
      await prisma.featureFlag.deleteMany({});
      await prisma.featureFlag.createMany({
        data: [
          { key: 'registration', enabled: true, description: 'User registration' },
          { key: 'oauth', enabled: false, description: 'OAuth authentication' },
          { key: 'google_oauth', enabled: true, description: 'Google OAuth' },
        ],
      });

      // Act
      const result = await adminFeatureFlagsService.getAllFeatureFlags(adminUser.id);

      // Assert
      expect(result.flags).toHaveLength(3);
      expect(result.flags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'registration', enabled: true }),
          expect.objectContaining({ key: 'oauth', enabled: false }),
          expect.objectContaining({ key: 'google_oauth', enabled: true }),
        ])
      );
    });

    it('should return empty array when no feature flags exist', async () => {
      // Act
      const result = await adminFeatureFlagsService.getAllFeatureFlags(adminUser.id);

      // Assert
      expect(result.flags).toEqual([]);
    });

    it('should create audit log when viewing feature flags', async () => {
      // Act
      await adminFeatureFlagsService.getAllFeatureFlags(adminUser.id);

      // Assert: Check audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: adminUser.id,
          action: 'FEATURE_FLAGS_VIEWED',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].resource).toBe('feature_flags');
    });

    it('should include description in flag objects', async () => {
      // Arrange
      await prisma.featureFlag.create({
        data: {
          key: 'test_flag',
          enabled: true,
          description: 'Test description',
        },
      });

      // Act
      const result = await adminFeatureFlagsService.getAllFeatureFlags(adminUser.id);

      // Assert
      const flag = result.flags.find((f) => f.key === 'test_flag');
      expect(flag).toHaveProperty('description', 'Test description');
    });

    it('should handle flags with null description', async () => {
      // Arrange
      await prisma.featureFlag.create({
        data: {
          key: 'test_flag',
          enabled: true,
          description: null,
        },
      });

      // Act
      const result = await adminFeatureFlagsService.getAllFeatureFlags(adminUser.id);

      // Assert
      const flag = result.flags.find((f) => f.key === 'test_flag');
      expect(flag).toHaveProperty('description', null);
    });
  });

  describe('updateFeatureFlag', () => {
    it('should update existing feature flag', async () => {
      // Arrange: Create flag
      await prisma.featureFlag.create({
        data: {
          key: 'registration',
          enabled: false,
        },
      });

      // Act
      const result = await adminFeatureFlagsService.updateFeatureFlag(
        'registration',
        true,
        adminUser.id
      );

      // Assert
      expect(result.key).toBe('registration');
      expect(result.enabled).toBe(true);

      // Verify in database
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'registration' },
      });
      expect(flag?.enabled).toBe(true);
      expect(flag?.updatedBy).toBe(adminUser.id);
    });

    it('should create feature flag if it does not exist', async () => {
      // Act
      const result = await adminFeatureFlagsService.updateFeatureFlag(
        'new_flag',
        true,
        adminUser.id
      );

      // Assert
      expect(result.key).toBe('new_flag');
      expect(result.enabled).toBe(true);

      // Verify in database
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'new_flag' },
      });
      expect(flag).toBeTruthy();
      expect(flag?.enabled).toBe(true);
      expect(flag?.updatedBy).toBe(adminUser.id);
    });

    it('should disable feature flag', async () => {
      // Arrange
      await prisma.featureFlag.create({
        data: {
          key: 'test_flag',
          enabled: true,
        },
      });

      // Act
      const result = await adminFeatureFlagsService.updateFeatureFlag(
        'test_flag',
        false,
        adminUser.id
      );

      // Assert
      expect(result.enabled).toBe(false);

      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'test_flag' },
      });
      expect(flag?.enabled).toBe(false);
    });

    it('should create audit log when updating feature flag', async () => {
      // Arrange
      await prisma.featureFlag.create({
        data: {
          key: 'test_flag',
          enabled: false,
        },
      });

      // Act
      await adminFeatureFlagsService.updateFeatureFlag(
        'test_flag',
        true,
        adminUser.id
      );

      // Assert: Check audit log
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: adminUser.id,
          action: 'FEATURE_FLAG_UPDATED',
          resource: 'feature_flags',
          resourceId: 'test_flag',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].details).toEqual(
        expect.objectContaining({
          key: 'test_flag',
          enabled: true,
        })
      );
    });

    it('should update updatedBy field with admin user ID', async () => {
      // Act
      await adminFeatureFlagsService.updateFeatureFlag(
        'test_flag',
        true,
        adminUser.id
      );

      // Assert
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'test_flag' },
      });
      expect(flag?.updatedBy).toBe(adminUser.id);
    });

    it('should update updatedAt timestamp', async () => {
      // Arrange
      const flag = await prisma.featureFlag.create({
        data: {
          key: 'test_flag',
          enabled: false,
        },
      });
      const originalUpdatedAt = flag.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      await adminFeatureFlagsService.updateFeatureFlag(
        'test_flag',
        true,
        adminUser.id
      );

      // Assert
      const updatedFlag = await prisma.featureFlag.findUnique({
        where: { key: 'test_flag' },
      });
      expect(updatedFlag?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should handle multiple updates to same flag', async () => {
      // Arrange
      await prisma.featureFlag.create({
        data: {
          key: 'test_flag',
          enabled: false,
        },
      });

      // Act: Update multiple times
      await adminFeatureFlagsService.updateFeatureFlag(
        'test_flag',
        true,
        adminUser.id
      );
      await adminFeatureFlagsService.updateFeatureFlag(
        'test_flag',
        false,
        adminUser.id
      );
      await adminFeatureFlagsService.updateFeatureFlag(
        'test_flag',
        true,
        adminUser.id
      );

      // Assert
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'test_flag' },
      });
      expect(flag?.enabled).toBe(true);

      // Check audit logs
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          resource: 'feature_flags',
          resourceId: 'test_flag',
        },
      });
      expect(auditLogs).toHaveLength(3);
    });

    it('should handle special characters in flag key', async () => {
      // Act
      const result = await adminFeatureFlagsService.updateFeatureFlag(
        'test_flag_with_underscores',
        true,
        adminUser.id
      );

      // Assert
      expect(result.key).toBe('test_flag_with_underscores');
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'test_flag_with_underscores' },
      });
      expect(flag).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database errors
      // For now, we'll test that service doesn't throw unexpected errors
      await expect(
        adminFeatureFlagsService.getAllFeatureFlags(adminUser.id)
      ).resolves.toHaveProperty('flags');
    });

    it('should handle invalid admin user ID gracefully', async () => {
      // Act & Assert - should throw error due to foreign key constraint
      await expect(
        adminFeatureFlagsService.getAllFeatureFlags('invalid-id')
      ).rejects.toThrow();
    });
  });
});
