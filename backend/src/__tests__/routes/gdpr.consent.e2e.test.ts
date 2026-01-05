/**
 * GDPR Consent Management E2E Integration Tests (TDD)
 * 
 * Comprehensive E2E tests for GDPR consent management flows:
 * 1. Grant consent
 * 2. Revoke consent
 * 3. Get user consents
 * 4. Check specific consent
 * 
 * ⚠️ PREREQUISITES CHECKLIST (from template):
 * [x] 1. Check Prisma schema for actual field names (ConsentRecord model verified)
 * [x] 2. Verify all required routes are imported (auth routes for login, gdpr routes for endpoints)
 * [x] 3. Check actual error message formats (tested manually)
 * [x] 4. Verify API endpoint paths are correct (checked routes/gdpr.ts)
 * [x] 5. Check response structure (verified from backend routes)
 * [x] 6. Remove unused imports (only using what's needed)
 * [x] 7. Verify database model fields exist (ConsentRecord: id, userId, consentType, granted, etc.)
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
import gdprRoutes from '../../routes/gdpr';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use(errorHandler);

describe('GDPR Consent Management E2E Integration Tests', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;
  let accessTokenCookie: string;

  beforeEach(async () => {
    // ⚠️ IMPORTANT: Clean up in correct order (child tables before parent tables)
    await prisma.auditLog.deleteMany({});
    await prisma.consentRecord.deleteMany({});
    await prisma.dataDeletionRequest.deleteMany({});
    await prisma.dataExportRequest.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    userEmail = `gdpr-consent-e2e-${Date.now()}@example.com`;
    userPassword = 'Password123!';
    testUser = await createTestUserWithPassword(userEmail, userPassword);

    // ⚠️ IMPORTANT: Clean up any existing sessions before login
    await prisma.session.deleteMany({ where: { userId: testUser.id } });

    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: userPassword,
      })
      .expect(200);

    const accessToken = findCookie(loginResponse.headers, 'accessToken');
    accessTokenCookie = `accessToken=${accessToken}`;
  });

  afterEach(async () => {
    // Same order as beforeEach
    await prisma.auditLog.deleteMany({});
    await prisma.consentRecord.deleteMany({});
    await prisma.dataDeletionRequest.deleteMany({});
    await prisma.dataExportRequest.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('E2E: Grant Consent', () => {
    it('should grant consent successfully', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .send({
          consentType: 'MARKETING_EMAILS',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consentType).toBe('MARKETING_EMAILS');
      expect(response.body.data.granted).toBe(true);
      expect(response.body.data.grantedAt).toBeDefined();

      // Verify in database
      const consent = await prisma.consentRecord.findUnique({
        where: {
          userId_consentType: {
            userId: testUser.id,
            consentType: 'MARKETING_EMAILS',
          },
        },
      });
      expect(consent).toBeDefined();
      expect(consent?.granted).toBe(true);
    });

    it('should grant multiple consents', async () => {
      // Grant first consent
      await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      // Grant second consent
      await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .send({ consentType: 'ANALYTICS' })
        .expect(200);

      // Verify both in database
      const consents = await prisma.consentRecord.findMany({
        where: { userId: testUser.id },
      });
      expect(consents.length).toBe(2);
      expect(consents.some((c) => c.consentType === 'MARKETING_EMAILS' && c.granted)).toBe(true);
      expect(consents.some((c) => c.consentType === 'ANALYTICS' && c.granted)).toBe(true);
    });

    it('should reject invalid consent type', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .send({
          consentType: 'INVALID_TYPE',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/invalid|consent|type/i);
    });
  });

  describe('E2E: Revoke Consent', () => {
    it('should revoke consent successfully', async () => {
      // First grant consent
      await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      // Then revoke it
      const response = await request(app)
        .delete('/api/gdpr/consents/MARKETING_EMAILS')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.granted).toBe(false);
      expect(response.body.data.revokedAt).toBeDefined();

      // Verify in database
      const consent = await prisma.consentRecord.findUnique({
        where: {
          userId_consentType: {
            userId: testUser.id,
            consentType: 'MARKETING_EMAILS',
          },
        },
      });
      expect(consent?.granted).toBe(false);
    });

    it('should reject invalid consent type on revoke', async () => {
      const response = await request(app)
        .delete('/api/gdpr/consents/INVALID_TYPE')
        .set('Cookie', accessTokenCookie)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/invalid|consent|type/i);
    });
  });

  describe('E2E: Get User Consents', () => {
    it('should fetch all user consents', async () => {
      // Create multiple consents
      await prisma.consentRecord.createMany({
        data: [
          {
            userId: testUser.id,
            consentType: 'MARKETING_EMAILS',
            granted: true,
            grantedAt: new Date(),
          },
          {
            userId: testUser.id,
            consentType: 'ANALYTICS',
            granted: false,
          },
        ],
      });

      const response = await request(app)
        .get('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array when no consents exist', async () => {
      const response = await request(app)
        .get('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('E2E: Check Specific Consent', () => {
    it('should return true when consent is granted', async () => {
      // Grant consent
      await prisma.consentRecord.create({
        data: {
          userId: testUser.id,
          consentType: 'MARKETING_EMAILS',
          granted: true,
          grantedAt: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/gdpr/consents/MARKETING_EMAILS/check')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasConsent).toBe(true);
    });

    it('should return false when consent is not granted', async () => {
      const response = await request(app)
        .get('/api/gdpr/consents/MARKETING_EMAILS/check')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasConsent).toBe(false);
    });
  });

  describe('E2E: Authorization', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .send({
          consentType: 'MARKETING_EMAILS',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/token|auth|unauthorized|login/i);
    });
  });
});
