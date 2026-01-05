/**
 * Admin Feature Flags E2E Integration Tests
 * 
 * Comprehensive E2E tests for complete admin feature flags workflow:
 * 1. Admin login
 * 2. Navigate to feature flags
 * 3. View all feature flags
 * 4. Toggle feature flag
 * 5. Verify database persistence
 * 6. Verify audit log created
 * 7. Verify flag state persists across requests
 * 
 * Uses E2E test template and utilities for consistency.
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../../config/database';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import adminRoutes from '../../routes/admin';
import authRoutes from '../../routes/auth';
import { extractCookies, findCookie } from '../utils/cookies';
import { createTestAdminWithPassword, createTestUserWithPassword } from '../utils/testUsers';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

interface FeatureFlagsResponse {
  success: boolean;
  data: {
    flags: Array<{
      key: string;
      description: string | null;
      enabled: boolean;
      updatedAt: Date;
    }>;
  };
}

describe('Admin Feature Flags E2E Tests', () => {
  let adminUser: any;
  let adminEmail: string;
  let adminPassword: string;
  let authToken: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany();
    await prisma.featureFlag.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    adminEmail = `admin-e2e-${Date.now()}@example.com`;
    adminPassword = 'Admin123!';
    adminUser = await createTestAdminWithPassword(adminEmail, adminPassword, {
      role: 'ADMIN',
    });

    // Step 1: Admin login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: adminPassword,
      })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    authToken = extractCookies(loginResponse.headers);
    expect(findCookie(loginResponse.headers, 'accessToken')).toBeDefined();
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.featureFlag.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('E2E: Complete Feature Flags Management Flow', () => {
    it('should complete full feature flags management workflow', async () => {
      // Step 2: Get all feature flags
      const getFlagsResponse = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', authToken)
        .expect(200);

      const flagsData = getFlagsResponse.body as FeatureFlagsResponse;
      expect(flagsData.success).toBe(true);
      expect(flagsData.data.flags).toBeDefined();
      expect(Array.isArray(flagsData.data.flags)).toBe(true);

      // Step 3: Verify initial state (flags may or may not exist)
      const testFlagKey = 'E2E_TEST_FLAG';

      // Step 4: Toggle feature flag (enable)
      const enableResponse = await request(app)
        .put(`/api/admin/feature-flags/${testFlagKey}`)
        .set('Cookie', authToken)
        .send({ enabled: true })
        .expect(200);

      expect(enableResponse.body.success).toBe(true);
      expect(enableResponse.body.data.key).toBe(testFlagKey);
      expect(enableResponse.body.data.enabled).toBe(true);

      // Step 5: Verify flag persisted in database
      const flagInDb = await prisma.featureFlag.findUnique({
        where: { key: testFlagKey },
      });

      expect(flagInDb).toBeDefined();
      expect(flagInDb?.key).toBe(testFlagKey);
      expect(flagInDb?.enabled).toBe(true);
      expect(flagInDb?.updatedBy).toBe(adminUser.id);

      // Step 6: Verify audit log created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: adminUser.id,
          action: 'FEATURE_FLAG_UPDATED',
          resource: 'feature_flags',
          resourceId: testFlagKey,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.userId).toBe(adminUser.id);
      expect(auditLog?.action).toBe('FEATURE_FLAG_UPDATED');

      // Step 7: Get flags again - verify flag appears in list
      const getFlagsResponse2 = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', authToken)
        .expect(200);

      const flagsData2 = getFlagsResponse2.body as FeatureFlagsResponse;
      const updatedFlag = flagsData2.data.flags.find((f) => f.key === testFlagKey);
      expect(updatedFlag).toBeDefined();
      expect(updatedFlag?.enabled).toBe(true);

      // Step 8: Toggle feature flag (disable)
      const disableResponse = await request(app)
        .put(`/api/admin/feature-flags/${testFlagKey}`)
        .set('Cookie', authToken)
        .send({ enabled: false })
        .expect(200);

      expect(disableResponse.body.success).toBe(true);
      expect(disableResponse.body.data.enabled).toBe(false);

      // Step 9: Verify flag updated in database
      const flagInDb2 = await prisma.featureFlag.findUnique({
        where: { key: testFlagKey },
      });

      expect(flagInDb2?.enabled).toBe(false);

      // Step 10: Verify state persists - get flags again
      const getFlagsResponse3 = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', authToken)
        .expect(200);

      const flagsData3 = getFlagsResponse3.body as FeatureFlagsResponse;
      const disabledFlag = flagsData3.data.flags.find((f) => f.key === testFlagKey);
      expect(disabledFlag?.enabled).toBe(false);
    });

    it('should handle multiple flag toggles and verify persistence', async () => {
      const flag1 = 'E2E_FLAG_1';
      const flag2 = 'E2E_FLAG_2';

      // Enable flag 1
      await request(app)
        .put(`/api/admin/feature-flags/${flag1}`)
        .set('Cookie', authToken)
        .send({ enabled: true })
        .expect(200);

      // Enable flag 2
      await request(app)
        .put(`/api/admin/feature-flags/${flag2}`)
        .set('Cookie', authToken)
        .send({ enabled: true })
        .expect(200);

      // Verify both flags in database
      const flag1InDb = await prisma.featureFlag.findUnique({
        where: { key: flag1 },
      });
      const flag2InDb = await prisma.featureFlag.findUnique({
        where: { key: flag2 },
      });

      expect(flag1InDb?.enabled).toBe(true);
      expect(flag2InDb?.enabled).toBe(true);

      // Get all flags - verify both appear
      const getFlagsResponse = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', authToken)
        .expect(200);

      const flagsData = getFlagsResponse.body as FeatureFlagsResponse;
      const foundFlag1 = flagsData.data.flags.find((f) => f.key === flag1);
      const foundFlag2 = flagsData.data.flags.find((f) => f.key === flag2);

      expect(foundFlag1?.enabled).toBe(true);
      expect(foundFlag2?.enabled).toBe(true);

      // Disable flag 1, keep flag 2 enabled
      await request(app)
        .put(`/api/admin/feature-flags/${flag1}`)
        .set('Cookie', authToken)
        .send({ enabled: false })
        .expect(200);

      // Verify flag 1 disabled, flag 2 still enabled
      const flag1InDb2 = await prisma.featureFlag.findUnique({
        where: { key: flag1 },
      });
      const flag2InDb2 = await prisma.featureFlag.findUnique({
        where: { key: flag2 },
      });

      expect(flag1InDb2?.enabled).toBe(false);
      expect(flag2InDb2?.enabled).toBe(true);
    });

    it('should require admin authentication', async () => {
      // Try to access without authentication
      const response = await request(app)
        .get('/api/admin/feature-flags')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should reject regular users', async () => {
      // Create regular user
      const regularEmail = `user-e2e-${Date.now()}@example.com`;
      const regularPassword = 'Password123!';
      const regularUser = await createTestUserWithPassword(regularEmail, regularPassword, {
        role: 'USER',
      });

      // Login as regular user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularEmail,
          password: regularPassword,
        })
        .expect(200);

      const userToken = extractCookies(loginResponse.headers);

      // Try to access admin feature flags
      const response = await request(app)
        .get('/api/admin/feature-flags')
        .set('Cookie', userToken)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/role|permission|access/i);

      // Cleanup
      await prisma.user.delete({ where: { id: regularUser.id } });
    });

    it('should create audit log for each flag update', async () => {
      const flagKey = 'E2E_AUDIT_TEST';

      // Enable flag
      await request(app)
        .put(`/api/admin/feature-flags/${flagKey}`)
        .set('Cookie', authToken)
        .send({ enabled: true })
        .expect(200);

      // Verify audit log
      const auditLog1 = await prisma.auditLog.findFirst({
        where: {
          userId: adminUser.id,
          action: 'FEATURE_FLAG_UPDATED',
          resourceId: flagKey,
        },
      });

      expect(auditLog1).toBeDefined();

      // Disable flag
      await request(app)
        .put(`/api/admin/feature-flags/${flagKey}`)
        .set('Cookie', authToken)
        .send({ enabled: false })
        .expect(200);

      // Verify second audit log
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: adminUser.id,
          action: 'FEATURE_FLAG_UPDATED',
          resourceId: flagKey,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(auditLogs.length).toBe(2);
      expect(auditLogs[0].action).toBe('FEATURE_FLAG_UPDATED');
      expect(auditLogs[1].action).toBe('FEATURE_FLAG_UPDATED');
    });
  });
});
