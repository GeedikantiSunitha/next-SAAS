/**
 * Cookie Consent Tests (GDPR/PECR Compliance)
 *
 * Tests for cookie consent management endpoints
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { extractCookies } from '../utils/cookies';

describe('Cookie Consent API', () => {
  let authCookies: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test123!@#', 12);

    const user = await prisma.user.create({
      data: {
        email: 'cookie-test@example.com',
        password: hashedPassword,
        name: 'Cookie Test User'
      }
    });
    userId = user.id;

    // Login to get auth cookies
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cookie-test@example.com',
        password: 'Test123!@#'
      })
      .expect(200);

    authCookies = extractCookies(loginResponse.headers);

    if (!authCookies) {
      throw new Error('Failed to get auth cookies');
    }
  });

  afterAll(async () => {
    // Cleanup
    await prisma.consentRecord.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('POST /api/gdpr/consents/cookies', () => {
    it('should save cookie consent preferences', async () => {
      const cookiePreferences = {
        essential: true,
        analytics: true,
        marketing: false,
        functional: true,
        version: '1.0.0'
      };

      const response = await request(app)
        .post('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .send(cookiePreferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Cookie consent');

      // Verify saved in database
      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          consentType: 'COOKIES'
        }
      });

      expect(consent).toBeDefined();
      expect(consent?.granted).toBe(true);
      expect(consent?.metadata).toMatchObject({
        essential: true,
        analytics: true,
        marketing: false,
        functional: true
      });
    });

    it('should update existing cookie consent', async () => {
      // First consent
      await request(app)
        .post('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .send({
          essential: true,
          analytics: true,
          marketing: true,
          functional: true,
          version: '1.0.0'
        })
        .expect(200);

      // Update consent (reject marketing)
      const response = await request(app)
        .post('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .send({
          essential: true,
          analytics: true,
          marketing: false, // Changed
          functional: true,
          version: '1.0.0'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify updated
      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          consentType: 'COOKIES'
        }
      });

      expect(consent?.metadata).toMatchObject({
        marketing: false
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/gdpr/consents/cookies')
        .send({
          essential: true,
          analytics: false,
          marketing: false,
          functional: false,
          version: '1.0.0'
        })
        .expect(401);
    });

    it('should validate consent data', async () => {
      const response = await request(app)
        .post('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .send({
          // Missing essential
          analytics: true,
          version: '1.0.0'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('essential');
    });

    it('should track IP address and user agent', async () => {
      await request(app)
        .post('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .set('User-Agent', 'Mozilla/5.0 Test Browser')
        .send({
          essential: true,
          analytics: false,
          marketing: false,
          functional: false,
          version: '1.0.0'
        })
        .expect(200);

      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          consentType: 'COOKIES'
        }
      });

      expect(consent?.userAgent).toContain('Mozilla');
      expect(consent?.ipAddress).toBeDefined();
    });

    it('should track consent version', async () => {
      await request(app)
        .post('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .send({
          essential: true,
          analytics: true,
          marketing: false,
          functional: true,
          version: '1.0.0'
        })
        .expect(200);

      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          consentType: 'COOKIES'
        }
      });

      expect(consent?.version).toBe('1.0.0');
    });
  });

  describe('GET /api/gdpr/consents/cookies', () => {
    beforeEach(async () => {
      // Create a cookie consent
      await request(app)
        .post('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .send({
          essential: true,
          analytics: true,
          marketing: false,
          functional: true,
          version: '1.0.0'
        });
    });

    it('should retrieve cookie consent preferences', async () => {
      const response = await request(app)
        .get('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        essential: true,
        analytics: true,
        marketing: false,
        functional: true
      });
    });

    it('should return null if no consent exists', async () => {
      // Delete consent
      await prisma.consentRecord.deleteMany({
        where: {
          userId,
          consentType: 'COOKIES'
        }
      });

      const response = await request(app)
        .get('/api/gdpr/consents/cookies')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/gdpr/consents/cookies')
        .expect(401);
    });
  });
});
