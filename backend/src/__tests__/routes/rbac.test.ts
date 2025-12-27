/**
 * RBAC Routes Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 * 
 * Tests verify:
 * - Role checking endpoints
 * - Permission checking endpoints
 * - Resource access checking
 * - Role management (admin only)
 * - Authorization enforcement
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../../config';

// Helper to get auth token from login (for Authorization header)
const getAuthToken = async (email: string, _password: string): Promise<string> => {
  // Generate token directly using the same method as login endpoint
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  // Generate token same way as authService.generateTokens
  const token = jwt.sign(
    { userId: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  return token;
};

describe('RBAC Routes', () => {
  let userToken: string;
  let adminToken: string;
  let superAdminToken: string;
  let userId: string;
  let adminId: string;
  let otherUserId: string;
  let userEmail: string;
  let adminEmail: string;
  let superAdminEmail: string;
  let otherUserEmail: string;

  beforeEach(async () => {
    // Create test users with different roles
    const timestamp = Date.now();
    userEmail = `rbac-user-${timestamp}@example.com`;
    adminEmail = `rbac-admin-${timestamp}@example.com`;
    superAdminEmail = `rbac-superadmin-${timestamp}@example.com`;
    otherUserEmail = `rbac-other-${timestamp}@example.com`;
    
    const userPassword = await bcrypt.hash('Password123!', 10);
    
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password: userPassword,
        name: 'RBAC Test User',
        role: 'USER',
      },
    });
    userId = user.id;

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: userPassword,
        name: 'RBAC Admin User',
        role: 'ADMIN',
      },
    });
    adminId = admin.id;

    await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: userPassword,
        name: 'RBAC Super Admin',
        role: 'SUPER_ADMIN',
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: otherUserEmail,
        password: userPassword,
        name: 'Other User',
        role: 'USER',
      },
    });
    otherUserId = otherUser.id;

    // Verify users exist before generating tokens
    const userCheck = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!userCheck) {
      throw new Error(`User not found after creation: ${userEmail}`);
    }

    // Get auth tokens
    userToken = await getAuthToken(userEmail, 'Password123!');
    adminToken = await getAuthToken(adminEmail, 'Password123!');
    superAdminToken = await getAuthToken(superAdminEmail, 'Password123!');
  });

  afterEach(async () => {
    // Cleanup - delete users by email to avoid ID issues
    if (userEmail) await prisma.user.deleteMany({ where: { email: userEmail } });
    if (adminEmail) await prisma.user.deleteMany({ where: { email: adminEmail } });
    if (superAdminEmail) await prisma.user.deleteMany({ where: { email: superAdminEmail } });
    if (otherUserEmail) await prisma.user.deleteMany({ where: { email: otherUserEmail } });
  });

  describe('GET /api/rbac/me/role', () => {
    it('should return current user role', async () => {
      const response = await request(app)
        .get('/api/rbac/me/role')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: { role: 'USER' },
      });
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/rbac/me/role');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/rbac/me/permissions', () => {
    it('should return user permissions info for USER', async () => {
      const response = await request(app)
        .get('/api/rbac/me/permissions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          role: 'USER',
          isAdmin: false,
          isSuperAdmin: false,
          hierarchy: 1,
        },
      });
    });

    it('should return admin permissions info for ADMIN', async () => {
      const response = await request(app)
        .get('/api/rbac/me/permissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          role: 'ADMIN',
          isAdmin: true,
          isSuperAdmin: false,
          hierarchy: 2,
        },
      });
    });

    it('should return super admin permissions info for SUPER_ADMIN', async () => {
      const response = await request(app)
        .get('/api/rbac/me/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          role: 'SUPER_ADMIN',
          isAdmin: true,
          isSuperAdmin: true,
          hierarchy: 3,
        },
      });
    });
  });

  describe('GET /api/rbac/check/role/:role', () => {
    it('should return true if user has the role', async () => {
      const response = await request(app)
        .get('/api/rbac/check/role/USER')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hasRole).toBe(true);
    });

    it('should return false if user does not have the role', async () => {
      const response = await request(app)
        .get('/api/rbac/check/role/ADMIN')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hasRole).toBe(false);
    });
  });

  describe('POST /api/rbac/check/access', () => {
    it('should return true if user can access own resource', async () => {
      const response = await request(app)
        .post('/api/rbac/check/access')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          resourceType: 'profile',
          resourceOwnerId: userId,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.canAccess).toBe(true);
    });

    it('should return false if user cannot access other user resource', async () => {
      const response = await request(app)
        .post('/api/rbac/check/access')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          resourceType: 'profile',
          resourceOwnerId: otherUserId,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.canAccess).toBe(false);
    });

    it('should return true if admin can access any resource', async () => {
      const response = await request(app)
        .post('/api/rbac/check/access')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resourceType: 'profile',
          resourceOwnerId: userId,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.canAccess).toBe(true);
    });

    it('should return 400 if resourceType is missing', async () => {
      const response = await request(app)
        .post('/api/rbac/check/access')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          resourceOwnerId: userId,
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 if resourceOwnerId is missing', async () => {
      const response = await request(app)
        .post('/api/rbac/check/access')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          resourceType: 'profile',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/rbac/users/role/:role', () => {
    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .get('/api/rbac/users/role/USER')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should return users with specific role for admin', async () => {
      const response = await request(app)
        .get('/api/rbac/users/role/USER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return users with specific role for super admin', async () => {
      const response = await request(app)
        .get('/api/rbac/users/role/ADMIN')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/rbac/users/:userId/role', () => {
    it('should return 403 if user is not super admin', async () => {
      const response = await request(app)
        .put(`/api/rbac/users/${otherUserId}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
    });

    it('should return 403 if admin tries to update role', async () => {
      const response = await request(app)
        .put(`/api/rbac/users/${otherUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
    });

    it('should update user role for super admin', async () => {
      const response = await request(app)
        .put(`/api/rbac/users/${otherUserId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('ADMIN');

      // Verify role was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: otherUserId },
      });
      expect(updatedUser?.role).toBe('ADMIN');

      // Reset role for cleanup
      await prisma.user.update({
        where: { id: otherUserId },
        data: { role: 'USER' },
      });
    });

    it('should return 400 if role is invalid', async () => {
      const response = await request(app)
        .put(`/api/rbac/users/${otherUserId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: 'INVALID_ROLE' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid role');
    });
  });

  describe('GET /api/rbac/compare/:userId', () => {
    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .get(`/api/rbac/compare/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should compare roles for admin', async () => {
      const response = await request(app)
        .get(`/api/rbac/compare/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentUser.role).toBe('ADMIN');
      expect(response.body.data.targetUser.role).toBe('USER');
      expect(response.body.data.hasHigherRole).toBe(true);
    });

    it('should compare roles for super admin', async () => {
      const response = await request(app)
        .get(`/api/rbac/compare/${adminId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentUser.role).toBe('SUPER_ADMIN');
      expect(response.body.data.targetUser.role).toBe('ADMIN');
      expect(response.body.data.hasHigherRole).toBe(true);
    });
  });
});

