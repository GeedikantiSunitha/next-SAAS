/**
 * GDPR Export Download Route Tests (TDD - Fix 7.1.2)
 *
 * GET /api/gdpr/exports/:id/download
 * - 401 when not authenticated
 * - 404 when export request not found
 * - 403 when export belongs to another user
 * - 410 when export link expired
 * - 400 when export status is not COMPLETED
 * - 200 with JSON attachment when COMPLETED and not expired
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
import { DataExportStatus } from '@prisma/client';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use(errorHandler);

describe('GET /api/gdpr/exports/:id/download', () => {
  let testUser: any;
  let otherUser: any;
  let userEmail: string;
  let userPassword: string;
  let accessTokenCookie: string;

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.dataDeletionRequest.deleteMany({});
    await prisma.dataExportRequest.deleteMany({});
    await prisma.consentRecord.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    userEmail = `gdpr-export-dl-${Date.now()}@example.com`;
    userPassword = 'Password123!';
    testUser = await createTestUserWithPassword(userEmail, userPassword);

    otherUser = await prisma.user.create({
      data: {
        email: `other-export-${Date.now()}@example.com`,
        password: 'hashed',
        name: 'Other User',
      },
    });

    await prisma.session.deleteMany({ where: { userId: testUser.id } });
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPassword })
      .expect(200);
    const accessToken = findCookie(loginResponse.headers, 'accessToken');
    accessTokenCookie = `accessToken=${accessToken}`;
  });

  afterEach(async () => {
    await prisma.dataExportRequest.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should return 401 when not authenticated', async () => {
    const exportReq = await prisma.dataExportRequest.create({
      data: {
        userId: testUser.id,
        status: DataExportStatus.COMPLETED,
        downloadUrl: '/api/gdpr/exports/req1/download',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await request(app)
      .get(`/api/gdpr/exports/${exportReq.id}/download`)
      .expect(401);
  });

  it('should return 404 when export request does not exist', async () => {
    await request(app)
      .get('/api/gdpr/exports/non-existent-id/download')
      .set('Cookie', accessTokenCookie)
      .expect(404);
  });

  it('should return 403 when export belongs to another user', async () => {
    const exportReq = await prisma.dataExportRequest.create({
      data: {
        userId: otherUser.id,
        status: DataExportStatus.COMPLETED,
        downloadUrl: '/api/gdpr/exports/req1/download',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await request(app)
      .get(`/api/gdpr/exports/${exportReq.id}/download`)
      .set('Cookie', accessTokenCookie)
      .expect(403);
  });

  it('should return 410 when export link has expired', async () => {
    const exportReq = await prisma.dataExportRequest.create({
      data: {
        userId: testUser.id,
        status: DataExportStatus.COMPLETED,
        downloadUrl: '/api/gdpr/exports/req1/download',
        expiresAt: new Date(Date.now() - 86400 * 1000), // 1 day ago
      },
    });

    await request(app)
      .get(`/api/gdpr/exports/${exportReq.id}/download`)
      .set('Cookie', accessTokenCookie)
      .expect(410);
  });

  it('should return 400 when export status is not COMPLETED', async () => {
    const exportReq = await prisma.dataExportRequest.create({
      data: {
        userId: testUser.id,
        status: DataExportStatus.PENDING,
        downloadUrl: null,
      },
    });

    await request(app)
      .get(`/api/gdpr/exports/${exportReq.id}/download`)
      .set('Cookie', accessTokenCookie)
      .expect(400);
  });

  it('should return 200 with JSON and Content-Disposition when COMPLETED and not expired', async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const exportReq = await prisma.dataExportRequest.create({
      data: {
        userId: testUser.id,
        status: DataExportStatus.COMPLETED,
        downloadUrl: `/api/gdpr/exports/req1/download`,
        expiresAt,
      },
    });

    const response = await request(app)
      .get(`/api/gdpr/exports/${exportReq.id}/download`)
      .set('Cookie', accessTokenCookie)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.headers['content-disposition']).toMatch(/attachment/);
    expect(response.headers['content-disposition']).toMatch(/filename=/);

    const body = response.body;
    expect(body).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.id).toBe(testUser.id);
    expect(body.exportMetadata).toBeDefined();
  });
});
