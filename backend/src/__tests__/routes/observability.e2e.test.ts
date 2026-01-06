/**
 * Observability Routes E2E Tests
 * 
 * End-to-end tests for observability endpoints
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import requestId from '../../middleware/requestId';
import errorHandler from '../../middleware/errorHandler';
import authRoutes from '../../routes/auth';
import observabilityRoutes from '../../routes/observability';
import { prisma } from '../../config/database';
import { createTestUserWithPassword } from '../utils/testUsers';
import { findCookie } from '../utils/cookies';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use('/api/observability', observabilityRoutes);
app.use(errorHandler);

describe('Observability Routes E2E', () => {
  let adminUser: any;
  let adminToken: string;
  let regularUser: any;
  let regularToken: string;

  let adminEmail: string;
  let adminPassword: string;
  let userEmail: string;
  let userPassword: string;

  beforeAll(async () => {
    // Cleanup first
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user
    adminEmail = `admin-${Date.now()}@test.com`;
    adminPassword = 'TestPassword123!';
    adminUser = await createTestUserWithPassword(adminEmail, adminPassword, { role: 'ADMIN' });

    // Create regular user
    userEmail = `user-${Date.now()}@test.com`;
    userPassword = 'TestPassword123!';
    regularUser = await createTestUserWithPassword(userEmail, userPassword, { role: 'USER' });
  });

  beforeEach(async () => {
    // Note: Global setup.ts beforeEach deletes all users, so we need to recreate them
    // Check if users exist by email (more reliable than ID after deletion)
    let adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    let userExists = await prisma.user.findUnique({ where: { email: userEmail } });
    
    // Recreate users if they don't exist (they were deleted by global beforeEach)
    if (!adminExists) {
      adminUser = await createTestUserWithPassword(adminEmail, adminPassword, { role: 'ADMIN' });
    } else {
      adminUser = adminExists;
    }
    
    if (!userExists) {
      regularUser = await createTestUserWithPassword(userEmail, userPassword, { role: 'USER' });
    } else {
      regularUser = userExists;
    }

    // Clean sessions for test users (after recreating them)
    await prisma.session.deleteMany({
      where: {
        userId: { in: [adminUser.id, regularUser.id] },
      },
    });

    // Login admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    expect(adminLogin.status).toBe(200);
    const adminTokenValue = findCookie(adminLogin.headers, 'accessToken');
    expect(adminTokenValue).toBeDefined();
    adminToken = adminTokenValue ? `accessToken=${adminTokenValue}` : '';

    // Login regular user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPassword });

    expect(userLogin.status).toBe(200);
    const userTokenValue = findCookie(userLogin.headers, 'accessToken');
    expect(userTokenValue).toBeDefined();
    regularToken = userTokenValue ? `accessToken=${userTokenValue}` : '';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUser.id, regularUser.id] },
      },
    });
  });

  describe('GET /api/observability/alerts/check', () => {
    it('should return alerts for admin user', async () => {
      const response = await request(app)
        .get('/api/observability/alerts/check')
        .set('Cookie', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('checkedAt');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('totalAlerts');
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
    });

    it('should reject regular user', async () => {
      const response = await request(app)
        .get('/api/observability/alerts/check')
        .set('Cookie', regularToken);

      expect(response.status).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/observability/alerts/check');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/observability/alerts/rules', () => {
    it('should return alert rules for admin user', async () => {
      const response = await request(app)
        .get('/api/observability/alerts/rules')
        .set('Cookie', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rules');
      expect(Array.isArray(response.body.data.rules)).toBe(true);
      expect(response.body.data.rules.length).toBeGreaterThan(0);
    });

    it('should reject regular user', async () => {
      const response = await request(app)
        .get('/api/observability/alerts/rules')
        .set('Cookie', regularToken);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/observability/alerts/check', () => {
    it('should trigger alert check with custom rules', async () => {
      const customRules = [
        {
          name: 'Test Alert',
          metric: 'errorRate',
          threshold: 0.5,
          severity: 'warning',
        },
      ];

      const response = await request(app)
        .post('/api/observability/alerts/check')
        .set('Cookie', adminToken)
        .send({ rules: customRules });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('checkedAt');
      expect(response.body.data).toHaveProperty('alerts');
    });

    it('should use default rules if none provided', async () => {
      const response = await request(app)
        .post('/api/observability/alerts/check')
        .set('Cookie', adminToken)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/observability/metrics/verify', () => {
    it('should verify metrics for admin user', async () => {
      const response = await request(app)
        .get('/api/observability/metrics/verify')
        .set('Cookie', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('endpoint');
      expect(response.body.data).toHaveProperty('format');
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('overall');
    });

    it('should reject regular user', async () => {
      const response = await request(app)
        .get('/api/observability/metrics/verify')
        .set('Cookie', regularToken);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/observability/metrics/verify/endpoint', () => {
    it('should verify metrics endpoint accessibility', async () => {
      const response = await request(app)
        .get('/api/observability/metrics/verify/endpoint')
        .set('Cookie', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('endpoint');
      expect(response.body.data).toHaveProperty('accessible');
    });
  });

  describe('GET /api/observability/metrics/verify/format', () => {
    it('should verify metrics format', async () => {
      const response = await request(app)
        .get('/api/observability/metrics/verify/format')
        .set('Cookie', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('isValidFormat');
      expect(response.body.data).toHaveProperty('hasHelpComments');
      expect(response.body.data).toHaveProperty('hasTypeComments');
    });
  });

  describe('GET /api/observability/metrics/verify/content', () => {
    it('should verify metrics content', async () => {
      const response = await request(app)
        .get('/api/observability/metrics/verify/content')
        .set('Cookie', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('hasRequestMetrics');
      expect(response.body.data).toHaveProperty('hasErrorMetrics');
      expect(response.body.data).toHaveProperty('hasLatencyMetrics');
    });
  });
});
