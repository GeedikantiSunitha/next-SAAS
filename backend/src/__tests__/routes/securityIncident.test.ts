/**
 * Security Incident API Routes Tests (TDD)
 *
 * Tests GDPR breach notification API endpoints
 * Admin-only routes for managing security incidents
 */

import request from 'supertest';
import express from 'express';
import { prisma } from '../../config/database';
import { createTestUser } from '../../tests/setup';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import cookieParser from 'cookie-parser';
import * as authService from '../../services/authService';
import securityIncidentRoutes from '../../routes/securityIncident';
import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/security-incidents', securityIncidentRoutes);
app.use(errorHandler);

describe('Security Incident API Routes', () => {
  let adminUser: any;
  let regularUser: any;
  let adminTokens: any;
  let userTokens: any;

  beforeEach(async () => {
    // Clean up
    await prisma.breachNotification.deleteMany();
    await prisma.securityIncident.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    adminUser = await createTestUser({
      email: `admin-${Date.now()}@example.com`,
      password: hashedPassword,
      role: 'ADMIN',
    });

    // Create regular user
    regularUser = await createTestUser({
      email: `user-${Date.now()}@example.com`,
      password: hashedPassword,
      role: 'USER',
    });

    adminTokens = authService.generateTokens(adminUser.id);
    userTokens = authService.generateTokens(regularUser.id);
  });

  afterEach(async () => {
    await prisma.breachNotification.deleteMany();
    await prisma.securityIncident.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/security-incidents', () => {
    it('should allow admin to report a new security incident', async () => {
      const incidentData = {
        type: IncidentType.DATA_BREACH,
        severity: IncidentSeverity.HIGH,
        title: 'Test Data Breach',
        description: 'Test breach description',
        affectedDataTypes: ['email', 'name'],
        affectedUserCount: 100,
        detectedAt: new Date().toISOString(),
        reportedBy: adminUser.id,
      };

      const response = await request(app)
        .post('/api/security-incidents')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.type).toBe(IncidentType.DATA_BREACH);
      expect(response.body.data.severity).toBe(IncidentSeverity.HIGH);
      expect(response.body.data.status).toBe(IncidentStatus.REPORTED);
    });

    it('should reject non-admin users from reporting incidents', async () => {
      const incidentData = {
        type: IncidentType.DATA_BREACH,
        severity: IncidentSeverity.HIGH,
        title: 'Test Data Breach',
        description: 'Test breach description',
        affectedDataTypes: ['email'],
        affectedUserCount: 50,
        detectedAt: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/security-incidents')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send(incidentData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should reject unauthenticated requests', async () => {
      const incidentData = {
        type: IncidentType.DATA_BREACH,
        severity: IncidentSeverity.HIGH,
        title: 'Test Data Breach',
        description: 'Test breach description',
        affectedDataTypes: ['email'],
        affectedUserCount: 50,
        detectedAt: new Date().toISOString(),
      };

      await request(app)
        .post('/api/security-incidents')
        .send(incidentData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/security-incidents')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          type: IncidentType.DATA_BREACH,
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/security-incidents', () => {
    beforeEach(async () => {
      // Create test incidents
      await prisma.securityIncident.createMany({
        data: [
          {
            type: IncidentType.DATA_BREACH,
            severity: IncidentSeverity.HIGH,
            title: 'Incident 1',
            description: 'Description 1',
            affectedDataTypes: ['email'],
            affectedUserCount: 100,
            detectedAt: new Date(),
            status: IncidentStatus.REPORTED,
            reportedById: adminUser.id,
          },
          {
            type: IncidentType.UNAUTHORIZED_ACCESS,
            severity: IncidentSeverity.MEDIUM,
            title: 'Incident 2',
            description: 'Description 2',
            affectedDataTypes: ['name'],
            affectedUserCount: 50,
            detectedAt: new Date(),
            status: IncidentStatus.INVESTIGATING,
            reportedById: adminUser.id,
          },
        ],
      });
    });

    it('should allow admin to list all incidents', async () => {
      const response = await request(app)
        .get('/api/security-incidents')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should reject non-admin users from listing incidents', async () => {
      await request(app)
        .get('/api/security-incidents')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(403);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/security-incidents?status=REPORTED')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe(IncidentStatus.REPORTED);
    });

    it('should support filtering by severity', async () => {
      const response = await request(app)
        .get('/api/security-incidents?severity=HIGH')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].severity).toBe(IncidentSeverity.HIGH);
    });
  });

  describe('GET /api/security-incidents/:id', () => {
    let testIncidentId: string;

    beforeEach(async () => {
      const incident = await prisma.securityIncident.create({
        data: {
          type: IncidentType.DATA_BREACH,
          severity: IncidentSeverity.HIGH,
          title: 'Test Incident',
          description: 'Test description',
          affectedDataTypes: ['email', 'name'],
          affectedUserCount: 100,
          detectedAt: new Date(),
          status: IncidentStatus.REPORTED,
          reportedById: adminUser.id,
        },
      });
      testIncidentId = incident.id;
    });

    it('should allow admin to get incident by ID', async () => {
      const response = await request(app)
        .get(`/api/security-incidents/${testIncidentId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testIncidentId);
      expect(response.body.data.title).toBe('Test Incident');
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .get(`/api/security-incidents/${testIncidentId}`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent incident', async () => {
      await request(app)
        .get('/api/security-incidents/non-existent-id')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/security-incidents/:id', () => {
    let testIncidentId: string;

    beforeEach(async () => {
      const incident = await prisma.securityIncident.create({
        data: {
          type: IncidentType.DATA_BREACH,
          severity: IncidentSeverity.HIGH,
          title: 'Test Incident',
          description: 'Test description',
          affectedDataTypes: ['email'],
          affectedUserCount: 100,
          detectedAt: new Date(),
          status: IncidentStatus.REPORTED,
          reportedById: adminUser.id,
        },
      });
      testIncidentId = incident.id;
    });

    it('should allow admin to update incident status', async () => {
      const response = await request(app)
        .patch(`/api/security-incidents/${testIncidentId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          status: IncidentStatus.CONTAINED,
          containedAt: new Date().toISOString(),
          remediationSteps: 'Access revoked',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(IncidentStatus.CONTAINED);
      expect(response.body.data.containedAt).toBeDefined();
    });

    it('should allow admin to mark incident as resolved', async () => {
      const response = await request(app)
        .patch(`/api/security-incidents/${testIncidentId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          status: IncidentStatus.RESOLVED,
          resolvedAt: new Date().toISOString(),
          lessonsLearned: 'Improved security measures',
        })
        .expect(200);

      expect(response.body.data.status).toBe(IncidentStatus.RESOLVED);
      expect(response.body.data.resolvedAt).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .patch(`/api/security-incidents/${testIncidentId}`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({ status: IncidentStatus.CONTAINED })
        .expect(403);
    });
  });

  describe('POST /api/security-incidents/:id/notify-users', () => {
    let testIncidentId: string;
    let affectedUserId: string;

    beforeEach(async () => {
      const incident = await prisma.securityIncident.create({
        data: {
          type: IncidentType.DATA_BREACH,
          severity: IncidentSeverity.HIGH,
          title: 'Test Breach',
          description: 'User data compromised',
          affectedDataTypes: ['email', 'name'],
          affectedUserCount: 1,
          detectedAt: new Date(),
          status: IncidentStatus.REPORTED,
          reportedById: adminUser.id,
        },
      });
      testIncidentId = incident.id;
      affectedUserId = regularUser.id;
    });

    it('should allow admin to notify affected users', async () => {
      const response = await request(app)
        .post(`/api/security-incidents/${testIncidentId}/notify-users`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          userIds: [affectedUserId],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notificationsSent).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .post(`/api/security-incidents/${testIncidentId}/notify-users`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({ userIds: [affectedUserId] })
        .expect(403);
    });

    it('should validate userIds array', async () => {
      await request(app)
        .post(`/api/security-incidents/${testIncidentId}/notify-users`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          // Missing userIds
        })
        .expect(400);
    });
  });

  describe('POST /api/security-incidents/:id/report-ico', () => {
    let testIncidentId: string;

    beforeEach(async () => {
      const incident = await prisma.securityIncident.create({
        data: {
          type: IncidentType.DATA_BREACH,
          severity: IncidentSeverity.HIGH,
          title: 'Test Breach',
          description: 'Serious breach requiring ICO notification',
          affectedDataTypes: ['email', 'password'],
          affectedUserCount: 1000,
          detectedAt: new Date(),
          status: IncidentStatus.REPORTED,
          reportedById: adminUser.id,
          icoNotificationRequired: true,
        },
      });
      testIncidentId = incident.id;
    });

    it('should allow admin to report incident to ICO', async () => {
      const response = await request(app)
        .post(`/api/security-incidents/${testIncidentId}/report-ico`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          icoReferenceNumber: 'ICO-2026-123456',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.icoNotifiedAt).toBeDefined();
      expect(response.body.data.icoReferenceNumber).toBe('ICO-2026-123456');
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .post(`/api/security-incidents/${testIncidentId}/report-ico`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({ icoReferenceNumber: 'ICO-2026-123456' })
        .expect(403);
    });

    it('should validate ICO reference number', async () => {
      await request(app)
        .post(`/api/security-incidents/${testIncidentId}/report-ico`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          // Missing icoReferenceNumber
        })
        .expect(400);
    });
  });

  describe('GET /api/security-incidents/:id/deadline', () => {
    let testIncidentId: string;
    let detectedAt: Date;

    beforeEach(async () => {
      detectedAt = new Date();
      const incident = await prisma.securityIncident.create({
        data: {
          type: IncidentType.DATA_BREACH,
          severity: IncidentSeverity.HIGH,
          title: 'Test Breach',
          description: 'Test',
          affectedDataTypes: ['email'],
          affectedUserCount: 100,
          detectedAt,
          status: IncidentStatus.REPORTED,
          reportedById: adminUser.id,
          icoNotificationRequired: true,
        },
      });
      testIncidentId = incident.id;
    });

    it('should calculate and return 72-hour ICO notification deadline', async () => {
      const response = await request(app)
        .get(`/api/security-incidents/${testIncidentId}/deadline`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deadline).toBeDefined();
      expect(response.body.data.hoursRemaining).toBeDefined();

      // Verify deadline is approximately 72 hours from detection
      const deadline = new Date(response.body.data.deadline);
      const expectedDeadline = new Date(detectedAt);
      expectedDeadline.setHours(expectedDeadline.getHours() + 72);

      const timeDiff = Math.abs(deadline.getTime() - expectedDeadline.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .get(`/api/security-incidents/${testIncidentId}/deadline`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(403);
    });
  });
});
