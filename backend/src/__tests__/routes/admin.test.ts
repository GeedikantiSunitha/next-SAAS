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

describe('Admin Routes', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    await prisma.user.deleteMany();
    
    // Create admin user
    adminUser = await createTestAdmin({
      email: 'admin@example.com',
    });
    
    // Create regular user
    regularUser = await createTestUser({
      email: 'user@example.com',
    });

    // Get tokens for both users
    const adminTokens = authService.generateTokens(adminUser.id);
    const userTokens = authService.generateTokens(regularUser.id);
    adminToken = adminTokens.accessToken;
    userToken = userTokens.accessToken;
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should allow ADMIN role to access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow SUPER_ADMIN role to access admin routes', async () => {
      // Create super admin
      const superAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@example.com',
          password: 'hashed',
          role: 'SUPER_ADMIN',
        },
      });

      const tokens = authService.generateTokens(superAdmin.id);
      const superAdminToken = tokens.accessToken;

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject USER role from accessing admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permissions');
    });
  });

  describe('Admin Dashboard', () => {
    it('should return admin dashboard data for authenticated admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});

