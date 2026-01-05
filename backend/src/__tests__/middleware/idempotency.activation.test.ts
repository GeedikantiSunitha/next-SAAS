/**
 * Idempotency Middleware Activation Tests (TDD)
 * 
 * Tests to verify idempotency middleware is properly activated on routes
 * that should be idempotent (POST/PUT/PATCH operations)
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../../config/database';
import { createTestUserWithPassword } from '../utils/testUsers';
import { findCookie } from '../utils/cookies';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import { idempotency } from '../../middleware/idempotency';
import authRoutes from '../../routes/auth';
import gdprRoutes from '../../routes/gdpr';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use(idempotency); // Activate idempotency middleware
app.use('/api/auth', authRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use(errorHandler);

describe('Idempotency Middleware Activation', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;
  let accessTokenCookie: string;

  beforeEach(async () => {
    // Clean up
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
    userEmail = `idempotency-test-${Date.now()}@example.com`;
    userPassword = 'Password123!';
    testUser = await createTestUserWithPassword(userEmail, userPassword);

    // Login
    await prisma.session.deleteMany({ where: { userId: testUser.id } });
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPassword })
      .expect(200);

    const accessToken = findCookie(loginResponse.headers, 'accessToken');
    accessTokenCookie = `accessToken=${accessToken}`;
  });

  afterEach(async () => {
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

  describe('GDPR Deletion Request Idempotency', () => {
    it('should return same response for duplicate deletion request with same idempotency key', async () => {
      const idempotencyKey = 'deletion-key-123';
      const deletionData = {
        deletionType: 'SOFT',
        reason: 'Test deletion',
      };

      // First request
      const response1 = await request(app)
        .post('/api/gdpr/deletion')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send(deletionData)
        .expect(201);

      const deletionId1 = response1.body.data.id;

      // Duplicate request
      const response2 = await request(app)
        .post('/api/gdpr/deletion')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send(deletionData)
        .expect(201);

      // Should return same deletion request ID
      expect(response2.body.data.id).toBe(deletionId1);

      // Verify only one deletion request was created
      const deletions = await prisma.dataDeletionRequest.findMany({
        where: { userId: testUser.id },
      });
      expect(deletions.length).toBe(1);
    });
  });

  describe('GDPR Consent Grant Idempotency', () => {
    it('should return same response for duplicate consent grant with same idempotency key', async () => {
      const idempotencyKey = 'consent-key-123';

      // First request
      const response1 = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      const consentId1 = response1.body.data.id;

      // Duplicate request
      const response2 = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      // Should return same consent ID
      expect(response2.body.data.id).toBe(consentId1);
    });
  });

  describe('Idempotency Key Header Formats', () => {
    it('should accept idempotency-key header (lowercase)', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('idempotency-key', 'lowercase-key')
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept Idempotency-Key header (title case)', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', 'titlecase-key')
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept x-idempotency-key header', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('x-idempotency-key', 'x-prefix-key')
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
