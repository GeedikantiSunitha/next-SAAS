import request from 'supertest';
import express from 'express';
import { prisma } from '../../config/database';
import { createTestUser } from '../../tests/setup';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import cookieParser from 'cookie-parser';
import * as authService from '../../services/authService';
import authRoutes from '../../routes/auth';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('MFA Routes', () => {
  let testUser: any;
  let userToken: string;

  beforeEach(async () => {
    await prisma.mfaBackupCode.deleteMany();
    await prisma.mfaMethod.deleteMany();
    await prisma.user.deleteMany();

    testUser = await createTestUser({
      email: 'test@example.com',
    });

    const tokens = authService.generateTokens(testUser.id);
    userToken = tokens.accessToken;
  });

  afterEach(async () => {
    await prisma.mfaBackupCode.deleteMany();
    await prisma.mfaMethod.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/mfa/setup/totp', () => {
    it('should setup TOTP MFA', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.secret).toBeDefined();
      expect(response.body.data.qrCodeUrl).toBeDefined();
      expect(response.body.data.backupCodes).toHaveLength(10);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/mfa/verify', () => {
    it('should verify TOTP code', async () => {
      // Setup TOTP first
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .set('Cookie', `accessToken=${userToken}`)
        .send({ method: 'TOTP', code: token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should reject invalid TOTP code', async () => {
      await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .set('Cookie', `accessToken=${userToken}`)
        .send({ method: 'TOTP', code: '000000' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
    });
  });

  describe('POST /api/auth/mfa/enable', () => {
    it('should enable TOTP MFA after verification', async () => {
      // Setup TOTP
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      const response = await request(app)
        .post('/api/auth/mfa/enable')
        .set('Cookie', `accessToken=${userToken}`)
        .send({ method: 'TOTP', code: token })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify MFA is enabled
      const mfaMethod = await prisma.mfaMethod.findUnique({
        where: {
          userId_method: {
            userId: testUser.id,
            method: 'TOTP',
          },
        },
      });

      expect(mfaMethod?.isEnabled).toBe(true);
    });
  });

  describe('POST /api/auth/mfa/disable', () => {
    it('should disable MFA method', async () => {
      // Setup and enable TOTP
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      await request(app)
        .post('/api/auth/mfa/enable')
        .set('Cookie', `accessToken=${userToken}`)
        .send({ method: 'TOTP', code: token })
        .expect(200);

      // Disable MFA
      const response = await request(app)
        .post('/api/auth/mfa/disable')
        .set('Cookie', `accessToken=${userToken}`)
        .send({ method: 'TOTP' })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify MFA is disabled
      const mfaMethod = await prisma.mfaMethod.findUnique({
        where: {
          userId_method: {
            userId: testUser.id,
            method: 'TOTP',
          },
        },
      });

      expect(mfaMethod?.isEnabled).toBe(false);
    });
  });

  describe('POST /api/auth/mfa/backup-codes', () => {
    it('should generate backup codes', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/backup-codes')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.codes).toHaveLength(10);
    });
  });

  describe('POST /api/auth/mfa/verify-backup', () => {
    it('should verify backup code', async () => {
      // Generate backup codes
      const codesResponse = await request(app)
        .post('/api/auth/mfa/backup-codes')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      const code = codesResponse.body.data.codes[0];

      const response = await request(app)
        .post('/api/auth/mfa/verify-backup')
        .set('Cookie', `accessToken=${userToken}`)
        .send({ code })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should reject invalid backup code', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/verify-backup')
        .set('Cookie', `accessToken=${userToken}`)
        .send({ code: 'INVALID' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
    });
  });

  describe('GET /api/auth/mfa/methods', () => {
    it('should return user MFA methods', async () => {
      // Setup TOTP
      await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      const response = await request(app)
        .get('/api/auth/mfa/methods')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.methods).toHaveLength(1);
      expect(response.body.data.methods[0].method).toBe('TOTP');
    });
  });

  describe('POST /api/auth/mfa/setup/email', () => {
    it('should setup email MFA', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup/email')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.method).toBe('EMAIL');
    });
  });

  describe('POST /api/auth/mfa/send-email-otp', () => {
    it('should send email OTP', async () => {
      // Setup email MFA first
      await request(app)
        .post('/api/auth/mfa/setup/email')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      const response = await request(app)
        .post('/api/auth/mfa/send-email-otp')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.otp).toBeDefined();
      expect(response.body.data.otp).toMatch(/^\d{6}$/);
    });
  });
});


