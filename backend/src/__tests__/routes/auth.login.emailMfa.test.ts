/**
 * Auth Login - Email MFA OTP (TDD)
 * When login returns requiresMfa + mfaMethod EMAIL, sendEmailOtp must be called
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import requestId from '../../middleware/requestId';
import errorHandler from '../../middleware/errorHandler';
import { prisma } from '../../config/database';
import { createTestUser } from '../../tests/setup';
import * as authService from '../../services/authService';
import * as mfaService from '../../services/mfaService';
import authRoutes from '../../routes/auth';

jest.mock('../../services/authService');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth Login - Email MFA OTP', () => {
  let testUser: { id: string; email: string; name: string | null; role: string };

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { startsWith: 'email-mfa-test@' } } });
    testUser = await createTestUser({ email: `email-mfa-test-${Date.now()}@example.com` });
    jest.clearAllMocks();
    (authService.login as jest.Mock).mockResolvedValue({
      requiresMfa: true,
      mfaMethod: 'EMAIL',
      user: testUser,
    });
  });

  afterEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { startsWith: 'email-mfa-test@' } } });
  });

  it('should call sendEmailOtp when login returns requiresMfa and mfaMethod is EMAIL', async () => {
    const sendEmailOtpSpy = jest.spyOn(mfaService, 'sendEmailOtp').mockResolvedValue({ success: true, otp: '123456' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'Password123!' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.requiresMfa).toBe(true);
    expect(response.body.data.mfaMethod).toBe('EMAIL');
    expect(sendEmailOtpSpy).toHaveBeenCalledWith(testUser.id);

    sendEmailOtpSpy.mockRestore();
  });
});
