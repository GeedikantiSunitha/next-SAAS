/**
 * Admin Dashboard Route Tests (TDD)
 * 
 * Comprehensive integration tests for admin dashboard endpoint:
 * - Authentication and authorization
 * - Dashboard statistics accuracy
 * - Error handling
 * - Edge cases
 */

import request from 'supertest';
import express from 'express';
import { prisma } from '../../config/database';
import { createTestAdmin, createTestUser } from '../../tests/setup';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import cookieParser from 'cookie-parser';
import * as authService from '../../services/authService';
import adminRoutes from '../../routes/admin';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

describe('Admin Dashboard Route - Integration Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user
    adminUser = await createTestAdmin({
      email: 'admin@test.com',
    });

    // Create regular user
    regularUser = await createTestUser({
      email: 'user@test.com',
    });

    // Get tokens
    const adminTokens = authService.generateTokens(adminUser.id);
    const userTokens = authService.generateTokens(regularUser.id);
    adminToken = adminTokens.accessToken;
    userToken = userTokens.accessToken;
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/admin/dashboard', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should require ADMIN or SUPER_ADMIN role', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/admin|permissions|forbidden/i);
    });

    it('should return dashboard stats for authenticated admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return correct total users count', async () => {
      // Arrange: Create additional users
      await createTestUser({ email: 'user2@test.com' });
      await createTestUser({ email: 'user3@test.com' });

      // Act
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.stats.totalUsers).toBe(4); // admin + regularUser + 2 new users
    });

    it('should return correct active sessions count', async () => {
      // Arrange: Create active and expired sessions
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await prisma.session.createMany({
        data: [
          {
            userId: adminUser.id,
            token: 'active-1',
            expiresAt: futureDate,
          },
          {
            userId: adminUser.id,
            token: 'active-2',
            expiresAt: futureDate,
          },
          {
            userId: adminUser.id,
            token: 'expired',
            expiresAt: pastDate,
          },
        ],
      });

      // Act
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.stats.activeSessions).toBe(2);
    });

    it('should return recent activity from audit logs', async () => {
      // Arrange: Create audit logs
      await prisma.auditLog.createMany({
        data: [
          {
            userId: adminUser.id,
            action: 'USER_LOGIN',
            resource: 'users',
            resourceId: adminUser.id,
          },
          {
            userId: regularUser.id,
            action: 'USER_REGISTERED',
            resource: 'users',
            resourceId: regularUser.id,
          },
        ],
      });

      // Act
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.stats.recentActivity).toBeDefined();
      expect(Array.isArray(response.body.data.stats.recentActivity)).toBe(true);
      expect(response.body.data.stats.recentActivity.length).toBeGreaterThan(0);
    });

    it('should return recent activity limited to 10 entries', async () => {
      // Arrange: Create 15 audit logs
      const auditLogs = Array.from({ length: 15 }, (_, i) => ({
        userId: adminUser.id,
        action: `ACTION_${i}`,
        resource: 'users',
        resourceId: adminUser.id,
        createdAt: new Date(Date.now() - i * 1000),
      }));

      await prisma.auditLog.createMany({ data: auditLogs });

      // Act
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.stats.recentActivity.length).toBe(10);
    });

    it('should return system health information', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.stats.systemHealth).toBeDefined();
      expect(response.body.data.stats.systemHealth.status).toBeDefined();
      expect(response.body.data.stats.systemHealth.timestamp).toBeDefined();
      expect(response.body.data.stats.systemHealth.database).toBeDefined();
    });

    it('should return all required dashboard stats fields', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      const stats = response.body.data.stats;
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('recentActivity');
      expect(stats).toHaveProperty('systemHealth');
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.activeSessions).toBe('number');
      expect(Array.isArray(stats.recentActivity)).toBe(true);
      expect(typeof stats.systemHealth).toBe('object');
    });

    it('should return empty recent activity when no audit logs exist', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.stats.recentActivity).toEqual([]);
    });

    it('should allow SUPER_ADMIN to access dashboard', async () => {
      // Arrange: Create super admin
      const superAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@test.com',
          password: 'hashed',
          role: 'SUPER_ADMIN',
        },
      });

      const tokens = authService.generateTokens(superAdmin.id);
      const superAdminToken = tokens.accessToken;

      // Act
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${superAdminToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();

      // Cleanup
      await prisma.user.delete({ where: { id: superAdmin.id } });
    });
  });
});
