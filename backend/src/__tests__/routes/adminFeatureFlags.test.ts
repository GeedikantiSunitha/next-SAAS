/**
 * Admin Feature Flags Routes Tests (TDD)
 * 
 * Comprehensive integration tests for admin feature flags endpoints:
 * - Authentication and authorization
 * - CRUD operations
 * - Error handling
 * - Edge cases
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../../config';

// Helper to get auth token
const getAuthToken = async (email: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }
  return jwt.sign(
    { userId: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );
};

describe('Admin Feature Flags Routes - Integration Tests', () => {
  let adminToken: string;
  let adminEmail: string;
  let adminUserId: string;
  let regularUserToken: string;
  let regularUserEmail: string;

  beforeEach(async () => {
    const timestamp = Date.now();

    // Create admin user
    adminEmail = `admin-${timestamp}@test.com`;
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    adminUserId = adminUser.id;
    adminToken = await getAuthToken(adminEmail);

    // Create regular user
    regularUserEmail = `user-${timestamp}@test.com`;
    const userPassword = await bcrypt.hash('User123!', 10);
    await prisma.user.create({
      data: {
        email: regularUserEmail,
        password: userPassword,
        name: 'Regular User',
        role: 'USER',
      },
    });
    regularUserToken = await getAuthToken(regularUserEmail);
  });

  afterEach(async () => {
    // Clean up
    await prisma.featureFlag.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminEmail, regularUserEmail] },
      },
    });
  });

  describe('GET /api/admin/feature-flags', () => {
    it('should return all feature flags for admin user', async () => {
      // Arrange: Create feature flags
      await prisma.featureFlag.createMany({
        data: [
          { key: 'registration', enabled: true, description: 'User registration' },
          { key: 'oauth', enabled: false, description: 'OAuth authentication' },
        ],
      });

      // Act
      const response = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', [`accessToken=${adminToken}`]);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.flags).toHaveLength(2);
      expect(response.body.data.flags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'registration', enabled: true }),
          expect.objectContaining({ key: 'oauth', enabled: false }),
        ])
      );
    });

    it('should return empty array when no feature flags exist', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', [`accessToken=${adminToken}`]);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.flags).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app).get('/api/admin/feature-flags');

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', [`accessToken=${regularUserToken}`]);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should create audit log when admin views feature flags', async () => {
      // Act
      await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', [`accessToken=${adminToken}`]);

      // Assert: Check audit log
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: adminUserId,
          action: 'FEATURE_FLAGS_VIEWED',
        },
      });

      expect(auditLogs).toHaveLength(1);
    });
  });

  describe('PUT /api/admin/feature-flags/:key', () => {
    it('should update existing feature flag', async () => {
      // Arrange: Create flag
      await prisma.featureFlag.create({
        data: {
          key: 'registration',
          enabled: false,
        },
      });

      // Act
      const response = await request(app)
        .put('/api/admin/feature-flags/registration')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: true });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('registration');
      expect(response.body.data.enabled).toBe(true);

      // Verify in database
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'registration' },
      });
      expect(flag?.enabled).toBe(true);
      expect(flag?.updatedBy).toBe(adminUserId);
    });

    it('should create feature flag if it does not exist', async () => {
      // Act
      const response = await request(app)
        .put('/api/admin/feature-flags/new_flag')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: true });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('new_flag');
      expect(response.body.data.enabled).toBe(true);

      // Verify in database
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'new_flag' },
      });
      expect(flag).toBeTruthy();
      expect(flag?.enabled).toBe(true);
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
      const response = await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: false });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.enabled).toBe(false);

      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'test_flag' },
      });
      expect(flag?.enabled).toBe(false);
    });

    it('should return 400 if enabled is not boolean', async () => {
      // Act
      const response = await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: 'not-a-boolean' });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 if enabled field is missing', async () => {
      // Act
      const response = await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({});

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .send({ enabled: true });

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      // Act
      const response = await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .set('Cookie', [`accessToken=${regularUserToken}`])
        .send({ enabled: true });

      // Assert
      expect(response.status).toBe(403);
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
      await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: true });

      // Assert: Check audit log
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: adminUserId,
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

    it('should handle multiple rapid updates', async () => {
      // Arrange
      await prisma.featureFlag.create({
        data: {
          key: 'test_flag',
          enabled: false,
        },
      });

      // Act: Multiple updates
      await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: true });

      await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: false });

      await request(app)
        .put('/api/admin/feature-flags/test_flag')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: true });

      // Assert
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'test_flag' },
      });
      expect(flag?.enabled).toBe(true);
    });

    it('should handle special characters in flag key', async () => {
      // Act
      const response = await request(app)
        .put('/api/admin/feature-flags/test_flag_with_underscores')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: true });

      // Assert
      expect(response.status).toBe(200);
      const flag = await prisma.featureFlag.findUnique({
        where: { key: 'test_flag_with_underscores' },
      });
      expect(flag).toBeTruthy();
    });
  });

  describe('System Tests - End-to-End', () => {
    it('should allow admin to view and update feature flags in sequence', async () => {
      // Step 1: View empty flags
      const view1 = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', [`accessToken=${adminToken}`]);

      expect(view1.status).toBe(200);
      expect(view1.body.data.flags).toEqual([]);

      // Step 2: Create a flag
      const create1 = await request(app)
        .put('/api/admin/feature-flags/registration')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: true });

      expect(create1.status).toBe(200);
      expect(create1.body.data.enabled).toBe(true);

      // Step 3: View flags again
      const view2 = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', [`accessToken=${adminToken}`]);

      expect(view2.status).toBe(200);
      expect(view2.body.data.flags).toHaveLength(1);
      expect(view2.body.data.flags[0].key).toBe('registration');
      expect(view2.body.data.flags[0].enabled).toBe(true);

      // Step 4: Update flag
      const update1 = await request(app)
        .put('/api/admin/feature-flags/registration')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ enabled: false });

      expect(update1.status).toBe(200);
      expect(update1.body.data.enabled).toBe(false);

      // Step 5: Verify update persisted
      const view3 = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', [`accessToken=${adminToken}`]);

      expect(view3.status).toBe(200);
      expect(view3.body.data.flags[0].enabled).toBe(false);
    });
  });
});
