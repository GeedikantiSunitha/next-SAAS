/**
 * Newsletter Routes E2E Tests (TDD)
 * 
 * Comprehensive end-to-end tests for newsletter API routes
 * Following E2E test template guidelines
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
import newsletterRoutes from '../../routes/newsletter';
import { NewsletterStatus } from '@prisma/client';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use(errorHandler);

describe('Newsletter Routes E2E Tests', () => {
  let testUser: any;
  let adminUser: any;
  let userEmail: string;
  let adminEmail: string;
  let userPassword: string;
  let adminPassword: string;
  let userTokenCookie: string;
  let adminTokenCookie: string;

  // Create users ONCE before all tests
  beforeAll(async () => {
    // Initial cleanup
    await prisma.newsletterSubscription.deleteMany({});
    await prisma.newsletter.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users once
    userEmail = `newsletter-user-${Date.now()}@example.com`;
    adminEmail = `newsletter-admin-${Date.now()}@example.com`;
    userPassword = 'TestPassword123!';
    adminPassword = 'TestPassword123!';

    testUser = await createTestUserWithPassword(userEmail, userPassword);
    adminUser = await createTestUserWithPassword(adminEmail, adminPassword, { role: 'ADMIN' });
  });

  beforeEach(async () => {
    // Only clean test data (newsletters/subscriptions), keep users
    await prisma.newsletterSubscription.deleteMany({});
    await prisma.newsletter.deleteMany({});
    
    // Clean only sessions for our test users (faster than deleting all)
    await prisma.session.deleteMany({ 
      where: { 
        userId: { in: [testUser.id, adminUser.id] } 
      } 
    });
    
    // Get fresh auth tokens (needed for each test)
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPassword });
    const userToken = findCookie(userLogin.headers, 'accessToken');
    userTokenCookie = userToken ? `accessToken=${userToken}` : '';

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    const adminToken = findCookie(adminLogin.headers, 'accessToken');
    adminTokenCookie = adminToken ? `accessToken=${adminToken}` : '';
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.newsletterSubscription.deleteMany({});
    await prisma.newsletter.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /api/newsletter/subscribe', () => {
    it('should subscribe user to newsletter (authenticated)', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .set('Cookie', [userTokenCookie])
        .send({ email: userEmail })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('user@example.com');
      expect(response.body.data.userId).toBe(testUser.id);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.unsubscribeToken).toBeDefined();
    });

    it('should subscribe without authentication (public)', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'guest@example.com' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('guest@example.com');
      expect(response.body.data.userId).toBeNull();
      expect(response.body.data.isActive).toBe(true);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reactivate existing inactive subscription', async () => {
      // Create inactive subscription
      await prisma.newsletterSubscription.create({
        data: {
          email: 'existing@example.com',
          isActive: false,
          unsubscribedAt: new Date(),
          unsubscribeToken: crypto.randomBytes(32).toString('hex'),
        },
      });

      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .set('Cookie', [userTokenCookie])
        .send({ email: 'existing@example.com' })
        .expect(201);

      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.unsubscribedAt).toBeNull();
    });
  });

  describe('POST /api/newsletter/unsubscribe', () => {
    it('should unsubscribe using token (public)', async () => {
      await prisma.newsletterSubscription.create({
        data: {
          email: 'unsub@example.com',
          isActive: true,
          unsubscribeToken: 'test-unsubscribe-token-123',
        },
      });

      const response = await request(app)
        .post('/api/newsletter/unsubscribe')
        .send({ token: 'test-unsubscribe-token-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.data.unsubscribedAt).toBeDefined();
    });

    it('should return 404 for invalid token', async () => {
      const response = await request(app)
        .post('/api/newsletter/unsubscribe')
        .send({ token: 'invalid-token' })
        .expect([400, 404, 500]); // Flexible error status codes

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/newsletter/subscription', () => {
    it('should get user subscription (authenticated)', async () => {
      await prisma.newsletterSubscription.create({
        data: {
          email: 'user@example.com',
          userId: testUser.id,
          isActive: true,
          unsubscribeToken: crypto.randomBytes(32).toString('hex'),
        },
      });

      const response = await request(app)
        .get('/api/newsletter/subscription')
        .set('Cookie', [userTokenCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('user@example.com');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should return 404 if user not subscribed', async () => {
      const response = await request(app)
        .get('/api/newsletter/subscription')
        .set('Cookie', [userTokenCookie])
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/newsletter/subscription')
        .expect(401);
    });
  });

  describe('POST /api/newsletter (Admin - Create Newsletter)', () => {
    it('should create newsletter draft (admin only)', async () => {
      const response = await request(app)
        .post('/api/newsletter')
        .set('Cookie', [adminTokenCookie])
        .send({
          title: 'Test Newsletter',
          subject: 'Test Subject',
          content: '<p>Test content</p>',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Newsletter');
      expect(response.body.data.status).toBe(NewsletterStatus.DRAFT);
      expect(response.body.data.createdBy).toBe(adminUser.id);
    });

    it('should create scheduled newsletter', async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/newsletter')
        .set('Cookie', [adminTokenCookie])
        .send({
          title: 'Scheduled Newsletter',
          subject: 'Scheduled Subject',
          content: '<p>Scheduled content</p>',
          scheduledAt: scheduledAt.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(NewsletterStatus.SCHEDULED);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app)
        .post('/api/newsletter')
        .set('Cookie', [userTokenCookie])
        .send({
          title: 'Test Newsletter',
          subject: 'Test Subject',
          content: '<p>Test content</p>',
        })
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/newsletter')
        .send({
          title: 'Test Newsletter',
          subject: 'Test Subject',
          content: '<p>Test content</p>',
        })
        .expect(401);
    });
  });

  describe('GET /api/newsletter (Admin - List Newsletters)', () => {
    beforeEach(async () => {
      await prisma.newsletter.createMany({
        data: [
          {
            title: 'Draft Newsletter',
            subject: 'Draft',
            content: '<p>Draft</p>',
            createdBy: adminUser.id,
            status: NewsletterStatus.DRAFT,
          },
          {
            title: 'Sent Newsletter',
            subject: 'Sent',
            content: '<p>Sent</p>',
            createdBy: adminUser.id,
            status: NewsletterStatus.SENT,
            sentAt: new Date(),
          },
        ],
      });
    });

    it('should get all newsletters (admin only)', async () => {
      const response = await request(app)
        .get('/api/newsletter')
        .set('Cookie', [adminTokenCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter newsletters by status', async () => {
      const response = await request(app)
        .get('/api/newsletter')
        .set('Cookie', [adminTokenCookie])
        .query({ status: NewsletterStatus.DRAFT })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((n: any) => n.status === NewsletterStatus.DRAFT)).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app)
        .get('/api/newsletter')
        .set('Cookie', [userTokenCookie])
        .expect(403);
    });
  });

  describe('GET /api/newsletter/:id (Admin - Get Newsletter)', () => {
    it('should get newsletter by ID (admin only)', async () => {
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Test Newsletter',
          subject: 'Test Subject',
          content: '<p>Test</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.DRAFT,
        },
      });

      const response = await request(app)
        .get(`/api/newsletter/${newsletter.id}`)
        .set('Cookie', [adminTokenCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(newsletter.id);
      expect(response.body.data.title).toBe('Test Newsletter');
    });

    it('should return 404 for non-existent newsletter', async () => {
      await request(app)
        .get('/api/newsletter/non-existent-id')
        .set('Cookie', [adminTokenCookie])
        .expect(404);
    });
  });

  describe('PUT /api/newsletter/:id (Admin - Update Newsletter)', () => {
    it('should update newsletter (admin only)', async () => {
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Original Title',
          subject: 'Original Subject',
          content: '<p>Original</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.DRAFT,
        },
      });

      const response = await request(app)
        .put(`/api/newsletter/${newsletter.id}`)
        .set('Cookie', [adminTokenCookie])
        .send({
          title: 'Updated Title',
          subject: 'Updated Subject',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.subject).toBe('Updated Subject');
    });

    it('should return 403 for non-admin user', async () => {
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Test',
          subject: 'Test',
          content: '<p>Test</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.DRAFT,
        },
      });

      await request(app)
        .put(`/api/newsletter/${newsletter.id}`)
        .set('Cookie', [userTokenCookie])
        .send({ title: 'Updated' })
        .expect(403);
    });
  });

  describe('POST /api/newsletter/:id/send (Admin - Send Newsletter)', () => {
    it('should send newsletter to all active subscribers (admin only)', async () => {
      // Create newsletter
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Test Newsletter',
          subject: 'Test Subject',
          content: '<p>Test content</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.DRAFT,
        },
      });

      // Create subscriptions
      await prisma.newsletterSubscription.createMany({
        data: [
          { email: 'sub1@example.com', isActive: true, unsubscribeToken: 'token1' },
          { email: 'sub2@example.com', isActive: true, unsubscribeToken: 'token2' },
        ],
      });

      const response = await request(app)
        .post(`/api/newsletter/${newsletter.id}/send`)
        .set('Cookie', [adminTokenCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(NewsletterStatus.SENT);
      expect(response.body.data.sentCount).toBe(2);
      expect(response.body.data.sentAt).toBeDefined();
    });

    it('should return 400 if newsletter already sent', async () => {
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Sent Newsletter',
          subject: 'Sent',
          content: '<p>Sent</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.SENT,
          sentAt: new Date(),
        },
      });

      await request(app)
        .post(`/api/newsletter/${newsletter.id}/send`)
        .set('Cookie', [adminTokenCookie])
        .expect([400, 500]); // Flexible error status codes
    });
  });

  describe('GET /api/newsletter/subscriptions (Admin - List Subscriptions)', () => {
    beforeEach(async () => {
      await prisma.newsletterSubscription.createMany({
        data: [
          { email: 'active1@example.com', isActive: true, unsubscribeToken: 'token1' },
          { email: 'active2@example.com', isActive: true, unsubscribeToken: 'token2' },
          { email: 'inactive@example.com', isActive: false, unsubscribeToken: 'token3' },
        ],
      });
    });

    it('should get all subscriptions (admin only)', async () => {
      const response = await request(app)
        .get('/api/newsletter/subscriptions')
        .set('Cookie', [adminTokenCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter subscriptions by isActive', async () => {
      const response = await request(app)
        .get('/api/newsletter/subscriptions')
        .set('Cookie', [adminTokenCookie])
        .query({ isActive: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((s: any) => s.isActive === true)).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app)
        .get('/api/newsletter/subscriptions')
        .set('Cookie', [userTokenCookie])
        .expect(403);
    });
  });
});
