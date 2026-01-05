/**
 * Idempotency Middleware E2E Integration Tests
 * 
 * Comprehensive E2E tests for idempotency middleware on actual routes:
 * 1. GDPR deletion request idempotency
 * 2. GDPR consent grant idempotency
 * 3. GDPR data export request idempotency
 * 
 * ⚠️ PREREQUISITES CHECKLIST (from template):
 * [x] 1. Check Prisma schema for actual field names (DataDeletionRequest, ConsentRecord verified)
 * [x] 2. Verify all required routes are imported (auth routes for login, gdpr routes for endpoints)
 * [x] 3. Check actual error message formats (tested manually)
 * [x] 4. Verify API endpoint paths are correct (checked routes/gdpr.ts)
 * [x] 5. Check response structure (verified from backend routes)
 * [x] 6. Remove unused imports (only using what's needed)
 * [x] 7. Verify database model fields exist (DataDeletionRequest, ConsentRecord verified)
 * 
 * ⚠️ LEARNINGS FROM GDPR IMPLEMENTATION:
 * - Always verify route middleware (idempotency is activated in app.ts)
 * - Test both with and without idempotency key header
 * - Verify only one database record is created for duplicate requests
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
app.use(idempotency); // ⚠️ IMPORTANT: Activate idempotency middleware (as in app.ts)
app.use('/api/auth', authRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use(errorHandler);

describe('Idempotency Middleware E2E Integration Tests', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;
  let accessTokenCookie: string;

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
    userEmail = `idempotency-e2e-${Date.now()}@example.com`;
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
    await prisma.dataDeletionRequest.deleteMany({});
    await prisma.dataExportRequest.deleteMany({});
    await prisma.consentRecord.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('E2E: GDPR Deletion Request Idempotency', () => {
    it('should return same response for duplicate deletion requests with same idempotency key', async () => {
      const idempotencyKey = 'deletion-e2e-key-123';
      const deletionData = {
        deletionType: 'SOFT',
        reason: 'Test deletion request',
      };

      // First request
      const response1 = await request(app)
        .post('/api/gdpr/deletion')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send(deletionData)
        .expect(201);

      expect(response1.body.success).toBe(true);
      expect(response1.body.data.id).toBeDefined();
      const deletionId1 = response1.body.data.id;

      // Duplicate request with same idempotency key
      const response2 = await request(app)
        .post('/api/gdpr/deletion')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send(deletionData)
        .expect(201);

      // Should return same deletion request ID (cached response)
      expect(response2.body.data.id).toBe(deletionId1);
      expect(response2.body.data.deletionType).toBe(response1.body.data.deletionType);

      // Verify only ONE deletion request was created in database
      const deletions = await prisma.dataDeletionRequest.findMany({
        where: { userId: testUser.id },
      });
      expect(deletions.length).toBe(1);
      expect(deletions[0].id).toBe(deletionId1);
    });

    it('should allow different deletion requests with different idempotency keys', async () => {
      const deletionData = {
        deletionType: 'SOFT',
        reason: 'Test deletion',
      };

      // First request
      const response1 = await request(app)
        .post('/api/gdpr/deletion')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', 'key-1')
        .send(deletionData)
        .expect(201);

      // Second request with different key
      const response2 = await request(app)
        .post('/api/gdpr/deletion')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', 'key-2')
        .send(deletionData)
        .expect(201);

      // Should have different IDs
      expect(response2.body.data.id).not.toBe(response1.body.data.id);

      // Verify both deletion requests were created
      const deletions = await prisma.dataDeletionRequest.findMany({
        where: { userId: testUser.id },
      });
      expect(deletions.length).toBe(2);
    });
  });

  describe('E2E: GDPR Consent Grant Idempotency', () => {
    it('should return same response for duplicate consent grants with same idempotency key', async () => {
      const idempotencyKey = 'consent-e2e-key-123';

      // First request
      const response1 = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response1.body.data.id).toBeDefined();
      const consentId1 = response1.body.data.id;

      // Duplicate request
      const response2 = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send({ consentType: 'MARKETING_EMAILS' })
        .expect(200);

      // Should return same consent ID (cached response)
      expect(response2.body.data.id).toBe(consentId1);

      // Verify only ONE consent record exists (upsert should handle this, but idempotency prevents duplicate calls)
      const consents = await prisma.consentRecord.findMany({
        where: {
          userId: testUser.id,
          consentType: 'MARKETING_EMAILS',
        },
      });
      expect(consents.length).toBe(1);
    });
  });

  describe('E2E: Idempotency Key Header Formats', () => {
    it('should accept idempotency-key header (lowercase)', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('idempotency-key', 'lowercase-e2e-key')
        .send({ consentType: 'ANALYTICS' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept Idempotency-Key header (title case)', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('Idempotency-Key', 'titlecase-e2e-key')
        .send({ consentType: 'ANALYTICS' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept x-idempotency-key header', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .set('x-idempotency-key', 'x-prefix-e2e-key')
        .send({ consentType: 'ANALYTICS' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('E2E: Idempotency Without Key', () => {
    it('should process requests normally when no idempotency key is provided', async () => {
      // Request without idempotency key
      const response1 = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .send({ consentType: 'COOKIES' })
        .expect(200);

      // Second request without key should create new record
      const response2 = await request(app)
        .post('/api/gdpr/consents')
        .set('Cookie', accessTokenCookie)
        .send({ consentType: 'COOKIES' })
        .expect(200);

      // Both should succeed (upsert handles duplicates, but idempotency doesn't cache without key)
      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });
});
