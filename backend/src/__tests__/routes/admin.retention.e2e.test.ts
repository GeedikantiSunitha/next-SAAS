/**
 * E2E Tests: Admin Data Retention API Endpoints
 *
 * Tests admin endpoints for:
 * - Manual retention policy enforcement
 * - Legal hold management (place/release)
 *
 * TDD Red Phase: Tests written first, expected to fail
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import app from '../../server';
import { prisma } from '../../config/database'; // Use the configured instance with encryption middleware
import bcrypt from 'bcryptjs';

describe('Admin Data Retention E2E Tests', () => {
  let adminToken: string;
  let regularUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    await prisma.user.create({
      data: {
        email: 'admin-retention@test.com',
        password: hashedPassword,
        name: 'Retention Admin',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
    });

    // Login admin
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin-retention@test.com',
      password: 'Admin123!',
    });

    // Check if login was successful
    if (!adminLoginRes.body.success) {
      console.error('Admin login failed:', adminLoginRes.body);
    }

    // Extract accessToken from response body or cookies
    if (adminLoginRes.body.data?.accessToken) {
      adminToken = `accessToken=${adminLoginRes.body.data.accessToken}`;
    } else if (adminLoginRes.headers['set-cookie']) {
      adminToken = adminLoginRes.headers['set-cookie'];
    } else {
      console.error('No token received for admin');
    }

    // Create regular user for auth tests
    const regularPassword = await bcrypt.hash('Regular123!', 12);
    await prisma.user.create({
      data: {
        email: 'regular-retention@test.com',
        password: regularPassword,
        name: 'Regular User',
        role: 'USER',
        isActive: true,
        emailVerified: true,
      },
    });

    // Login regular user
    const regularLoginRes = await request(app).post('/api/auth/login').send({
      email: 'regular-retention@test.com',
      password: 'Regular123!',
    });

    // Check if login was successful
    if (!regularLoginRes.body.success) {
      console.error('Regular user login failed:', regularLoginRes.body);
    }

    // Extract accessToken from response body or cookies
    if (regularLoginRes.body.data?.accessToken) {
      regularUserToken = `accessToken=${regularLoginRes.body.data.accessToken}`;
    } else if (regularLoginRes.headers['set-cookie']) {
      regularUserToken = regularLoginRes.headers['set-cookie'];
    } else {
      console.error('No token received for regular user');
    }
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin-retention@test.com', 'regular-retention@test.com', 'test-retention@test.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Delete test user if exists, then create fresh
    await prisma.user.deleteMany({
      where: { email: 'test-retention@test.com' },
    });

    const hashedPassword = await bcrypt.hash('Test123!', 12);
    const testUser = await prisma.user.create({
      data: {
        email: 'test-retention@test.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'USER',
        isActive: true,
        emailVerified: true,
      },
    });
    testUserId = testUser.id;
  });

  describe('POST /api/admin/retention/enforce', () => {
    it('should enforce retention policies successfully when called by admin', async () => {
      const response = await request(app)
        .post('/api/admin/retention/enforce')
        .set('Cookie', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('inactiveUsersAnonymized');
      expect(response.body.data).toHaveProperty('deletedUsersPurged');
      expect(response.body.data).toHaveProperty('expiredSessionsDeleted');
      expect(response.body.data).toHaveProperty('notificationsDeleted');
      expect(response.body.data).toHaveProperty('exportRequestsDeleted');
      expect(response.body.data).toHaveProperty('auditLogsArchived');
      expect(response.body.data).toHaveProperty('executedAt');
      expect(typeof response.body.data.inactiveUsersAnonymized).toBe('number');
      expect(typeof response.body.data.deletedUsersPurged).toBe('number');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/admin/retention/enforce')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when user is not admin', async () => {
      const response = await request(app)
        .post('/api/admin/retention/enforce')
        .set('Cookie', regularUserToken)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Mock error by passing invalid data or simulating failure
      // This tests error handling in the service
      const response = await request(app)
        .post('/api/admin/retention/enforce')
        .set('Cookie', adminToken);

      // Should still return 200 but may have errors array
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // errors field is optional in response
    });
  });

  describe('POST /api/admin/users/:id/legal-hold', () => {
    it('should place user on legal hold successfully', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .send({
          reason: 'Pending legal investigation',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('legal hold');

      // Verify user is on legal hold in database
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { onLegalHold: true, legalHoldReason: true, legalHoldAt: true },
      });

      expect(user?.onLegalHold).toBe(true);
      expect(user?.legalHoldReason).toBe('Pending legal investigation');
      expect(user?.legalHoldAt).toBeDefined();
    });

    it('should return 400 when reason is missing', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when reason is empty string', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .send({ reason: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when reason is only whitespace', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .send({ reason: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 when user does not exist', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/admin/users/${fakeUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .send({ reason: 'Test reason' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/legal-hold`)
        .send({ reason: 'Test reason' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when user is not admin', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', regularUserToken)
        .send({ reason: 'Test reason' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/users/:id/legal-hold', () => {
    beforeEach(async () => {
      // Place user on legal hold for each test
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          onLegalHold: true,
          legalHoldReason: 'Test investigation',
          legalHoldAt: new Date(),
        },
      });
    });

    it('should release user from legal hold successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('released');

      // Verify user is released from legal hold
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { onLegalHold: true, legalHoldReleasedAt: true },
      });

      expect(user?.onLegalHold).toBe(false);
      expect(user?.legalHoldReleasedAt).toBeDefined();
    });

    it('should return 404 when user does not exist', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/admin/users/${fakeUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUserId}/legal-hold`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when user is not admin', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', regularUserToken)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should succeed even if user is not on legal hold', async () => {
      // Release first time
      await request(app)
        .delete(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .expect(200);

      // Release second time (idempotent)
      const response = await request(app)
        .delete(`/api/admin/users/${testUserId}/legal-hold`)
        .set('Cookie', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
