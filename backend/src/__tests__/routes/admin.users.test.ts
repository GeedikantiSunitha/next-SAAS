import request from 'supertest';
import express from 'express';
import { prisma } from '../../config/database';
import { createTestUser, createTestAdmin } from '../../tests/setup';
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

describe('Admin User Management Routes', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.session.deleteMany();
    await prisma.auditLog.deleteMany();

    adminUser = await createTestAdmin({
      email: 'admin@example.com',
    });

    regularUser = await createTestUser({
      email: 'user@example.com',
    });

    const tokens = authService.generateTokens(adminUser.id);
    adminToken = tokens.accessToken;
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await prisma.session.deleteMany();
    await prisma.auditLog.deleteMany();
  });

  describe('GET /api/admin/users', () => {
    it('should list all users with pagination', async () => {
      // Create additional users
      await createTestUser({ email: 'user1@example.com' });
      await createTestUser({ email: 'user2@example.com' });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support search by email', async () => {
      await createTestUser({ email: 'search@example.com' });

      const response = await request(app)
        .get('/api/admin/users?search=search@example.com')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should support filtering by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=USER')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support filtering by isActive status', async () => {
      const response = await request(app)
        .get('/api/admin/users?isActive=true')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user details by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(regularUser.id);
      expect(response.body.data.user.email).toBe(regularUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/users/non-existent-id')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create a new user', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        role: 'USER',
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', `accessToken=${adminToken}`)
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(newUserData.email);
      expect(response.body.data.user.name).toBe(newUserData.name);
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ email: 'test@example.com' }) // Missing password
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          email: 'test@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate emails', async () => {
      const userData = {
        email: regularUser.email, // Existing email
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', `accessToken=${adminToken}`)
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user details', async () => {
      const updateData = {
        name: 'Updated Name',
        role: 'ADMIN',
      };

      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.role).toBe(updateData.role);
    });

    it('should update user password', async () => {
      const updateData = {
        password: 'NewPassword123!',
      };

      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should activate/deactivate user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isActive).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/admin/users/non-existent-id')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${regularUser.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: regularUser.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/admin/users/non-existent-id')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should prevent deleting own account', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/users/:id/sessions', () => {
    it('should get user sessions', async () => {
      // Create a session for the user
      await prisma.session.create({
        data: {
          userId: regularUser.id,
          token: 'test-refresh-token',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });

      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}/sessions`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
    });

    it('should return empty array if no sessions', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}/sessions`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toEqual([]);
    });
  });

  describe('DELETE /api/admin/users/:id/sessions/:sessionId', () => {
    it('should revoke a user session', async () => {
      const session = await prisma.session.create({
        data: {
          userId: regularUser.id,
          token: 'test-refresh-token',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });

      const response = await request(app)
        .delete(`/api/admin/users/${regularUser.id}/sessions/${session.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify session is deleted
      const deletedSession = await prisma.session.findUnique({
        where: { id: session.id },
      });
      expect(deletedSession).toBeNull();
    });
  });

  describe('GET /api/admin/users/:id/activity', () => {
    it('should get user activity log', async () => {
      // Create audit log for user
      await prisma.auditLog.create({
        data: {
          userId: regularUser.id,
          action: 'USER_LOGIN',
          resource: 'users',
          resourceId: regularUser.id,
        },
      });

      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}/activity`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activity).toBeDefined();
      expect(Array.isArray(response.body.data.activity)).toBe(true);
    });

    it('should support pagination for activity', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}/activity?page=1&limit=10`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });
});

