/**
 * Password Reset E2E Integration Tests
 * 
 * Comprehensive E2E tests for complete password reset workflow:
 * 1. User requests password reset
 * 2. Email sent (or verified email service configured)
 * 3. Extract reset token from database
 * 4. User resets password using token
 * 5. Verify token marked as used
 * 6. User logs in with new password
 * 7. Verify old password doesn't work
 * 
 * Uses E2E test template and utilities for consistency.
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../../config/database';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import authRoutes from '../../routes/auth';
import { findCookie } from '../utils/cookies';
import { createTestUserWithPassword } from '../utils/testUsers';
import { LoginResponse } from '../../types/api-responses';
import { Resend } from 'resend';

// Mock Resend for email testing
jest.mock('resend');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Password Reset E2E Tests', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };

    // Clean up test data
    await prisma.passwordReset.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    userEmail = `password-reset-e2e-${Date.now()}@example.com`;
    userPassword = 'OriginalPassword123!';
    testUser = await createTestUserWithPassword(userEmail, userPassword);
  });

  afterEach(async () => {
    await prisma.passwordReset.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    process.env = originalEnv;
  });

  describe('E2E: Complete Password Reset Flow', () => {
    it('should complete full password reset workflow', async () => {
      // Configure email service
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.FROM_EMAIL = 'test@example.com';

      const mockSend = jest.fn().mockResolvedValue({
        data: { id: 'email-123' },
      });

      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      // Step 1: User requests password reset
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail })
        .expect(200);

      expect(forgotResponse.body.success).toBe(true);
      expect(forgotResponse.body.message).toBeDefined();

      // Step 2: Verify email was sent (or would be sent if configured)
      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key-here') {
        expect(mockSend).toHaveBeenCalledTimes(1);
        const emailCall = mockSend.mock.calls[0][0];
        expect(emailCall.to).toBe(userEmail);
        expect(emailCall.subject).toContain('Reset');
      }

      // Step 3: Get reset token from database
      const passwordReset = await prisma.passwordReset.findFirst({
        where: { userId: testUser.id },
      });

      expect(passwordReset).toBeDefined();
      expect(passwordReset?.token).toBeTruthy();
      expect(passwordReset?.used).toBe(false);
      expect(passwordReset?.expiresAt).toBeDefined();
      expect(new Date(passwordReset!.expiresAt) > new Date()).toBe(true);

      // Step 4: User resets password using token
      const newPassword = 'NewPassword123!';
      const resetResponse = await request(app)
        .post(`/api/auth/reset-password/${passwordReset?.token}`)
        .send({ password: newPassword })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);
      expect(resetResponse.body.message).toBeDefined();

      // Step 5: Verify token is marked as used
      const usedToken = await prisma.passwordReset.findUnique({
        where: { token: passwordReset?.token! },
      });

      expect(usedToken?.used).toBe(true);

      // Step 6: User logs in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: newPassword,
        })
        .expect(200);

      const loginData = loginResponse.body as LoginResponse;
      expect(loginData.success).toBe(true);

      // Verify login response structure (no MFA)
      if ('requiresMfa' in loginData.data) {
        // MFA required - not expected in this test
        expect(loginData.data.requiresMfa).toBeUndefined();
      } else {
        // Direct login - expected
        expect(loginData.data.email).toBe(userEmail);
      }

      // Verify access token cookie set
      expect(findCookie(loginResponse.headers, 'accessToken')).toBeDefined();

      // Step 7: Verify old password doesn't work
      const oldPasswordLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword, // Old password
        })
        .expect(401);

      expect(oldPasswordLogin.body.success).toBe(false);
      expect(oldPasswordLogin.body.error).toContain('Invalid');
    });

    it('should reject expired reset token', async () => {
      // Create expired token manually
      const expiredToken = 'expired-token-123';
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1); // 1 hour ago

      await prisma.passwordReset.create({
        data: {
          userId: testUser.id,
          token: expiredToken,
          expiresAt: expiredDate,
          used: false,
        },
      });

      // Try to reset password with expired token
      const resetResponse = await request(app)
        .post(`/api/auth/reset-password/${expiredToken}`)
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(resetResponse.body.success).toBe(false);
      expect(resetResponse.body.error).toContain('expired');
    });

    it('should reject already used reset token', async () => {
      // Create used token
      const usedToken = 'used-token-123';
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1); // 1 hour from now

      await prisma.passwordReset.create({
        data: {
          userId: testUser.id,
          token: usedToken,
          expiresAt: futureDate,
          used: true,
        },
      });

      // Try to reset password with used token
      const resetResponse = await request(app)
        .post(`/api/auth/reset-password/${usedToken}`)
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(resetResponse.body.success).toBe(false);
      expect(resetResponse.body.error).toContain('used');
    });

    it('should reject invalid reset token', async () => {
      // Try to reset password with non-existent token
      const resetResponse = await request(app)
        .post('/api/auth/reset-password/invalid-token-123')
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(resetResponse.body.success).toBe(false);
      expect(resetResponse.body.error).toBeDefined();
    });

    it('should handle password reset request for non-existent email gracefully', async () => {
      // Request password reset for non-existent email
      // Should return success (security: don't reveal if email exists)
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(forgotResponse.body.success).toBe(true);
      expect(forgotResponse.body.message).toBeDefined();

      // Verify no password reset record created
      const passwordReset = await prisma.passwordReset.findFirst({
        where: { userId: testUser.id },
      });
      expect(passwordReset).toBeNull();
    });

    it('should validate new password strength', async () => {
      // Get reset token
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.FROM_EMAIL = 'test@example.com';

      const mockSend = jest.fn().mockResolvedValue({
        data: { id: 'email-123' },
      });

      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail })
        .expect(200);

      const passwordReset = await prisma.passwordReset.findFirst({
        where: { userId: testUser.id },
      });

      // Try to reset with weak password
      const resetResponse = await request(app)
        .post(`/api/auth/reset-password/${passwordReset?.token}`)
        .send({ password: 'weak' }) // Too weak
        .expect(400);

      expect(resetResponse.body.success).toBe(false);
      expect(resetResponse.body.error).toBeDefined();
    });

    it('should allow multiple password reset requests (latest token works)', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.FROM_EMAIL = 'test@example.com';

      const mockSend = jest.fn().mockResolvedValue({
        data: { id: 'email-123' },
      });

      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      // Request password reset twice
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail })
        .expect(200);

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail })
        .expect(200);

      // Get latest token
      const passwordResets = await prisma.passwordReset.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(passwordResets.length).toBeGreaterThan(0);
      const latestToken = passwordResets[0];

      // Use latest token - should work
      const resetResponse = await request(app)
        .post(`/api/auth/reset-password/${latestToken.token}`)
        .send({ password: 'NewPassword123!' })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);
    });
  });
});
