/**
 * Login Toast Notification E2E Tests
 * 
 * Tests to verify login success toast notification appears
 * Note: This is a frontend feature, but we test the backend login flow
 * that triggers the toast notification
 * 
 * ⚠️ PREREQUISITES CHECKLIST (from template):
 * [x] 1. Check Prisma schema for actual field names (User model verified)
 * [x] 2. Verify all required routes are imported (auth routes for login)
 * [x] 3. Check actual error message formats (tested manually)
 * [x] 4. Verify API endpoint paths are correct (checked routes/auth.ts)
 * [x] 5. Check response structure (verified from backend routes)
 * [x] 6. Remove unused imports (only using what's needed)
 * [x] 7. Verify database model fields exist (User: id, email, password, etc.)
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../../config/database';
import { createTestUserWithPassword } from '../utils/testUsers';
import { findCookie } from '../utils/cookies';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import authRoutes from '../../routes/auth';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Login Toast Notification E2E Tests', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;

  beforeEach(async () => {
    // ⚠️ IMPORTANT: Clean up in correct order (child tables before parent tables)
    await prisma.auditLog.deleteMany({});
    await prisma.dataDeletionRequest.deleteMany({});
    await prisma.dataExportRequest.deleteMany({});
    await prisma.consentRecord.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    userEmail = `login-toast-e2e-${Date.now()}@example.com`;
    userPassword = 'Password123!';
    testUser = await createTestUserWithPassword(userEmail, userPassword);

    // ⚠️ IMPORTANT: Clean up any existing sessions before login
    await prisma.session.deleteMany({ where: { userId: testUser.id } });
  });

  afterEach(async () => {
    // Same order as beforeEach
    await prisma.auditLog.deleteMany({});
    await prisma.dataDeletionRequest.deleteMany({});
    await prisma.dataExportRequest.deleteMany({});
    await prisma.consentRecord.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('E2E: Successful Login Response', () => {
    it('should return success response with user data for toast notification', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(userEmail);

      // Verify access token cookie is set (for frontend to detect successful login)
      const accessToken = findCookie(response.headers, 'accessToken');
      expect(accessToken).toBeDefined();

      // Frontend will use this success response to show toast notification
      // Toast message: "Login Successful - Welcome back! You have been logged in successfully."
    });

    it('should return success response even if user already has active session', async () => {
      // Create an active session
      await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'existing-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Should still return success for toast notification
      const accessToken = findCookie(response.headers, 'accessToken');
      expect(accessToken).toBeDefined();
    });
  });

  describe('E2E: Login Error Handling', () => {
    it('should not return success on invalid credentials (no toast)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/invalid|credentials|password|email/i);

      // No access token cookie on error
      const accessToken = findCookie(response.headers, 'accessToken');
      expect(accessToken).toBeUndefined();

      // Frontend should NOT show success toast on error
    });

    it('should not return success on non-existent user (no toast)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/invalid|credentials|password|email|not found/i);

      // No access token cookie on error
      const accessToken = findCookie(response.headers, 'accessToken');
      expect(accessToken).toBeUndefined();
    });
  });
});
