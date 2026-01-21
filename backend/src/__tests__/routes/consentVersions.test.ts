/**
 * Tests for Consent Version API Endpoints
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { ConsentType } from '@prisma/client';
import * as consentVersionService from '../../services/consentVersionService';
import { errorHandler } from '../../middleware/errorHandler';

// Mock dependencies BEFORE importing routes that use them
jest.mock('../../config/database');
jest.mock('../../services/consentVersionService');
jest.mock('../../services/adminUserService');

// Setup proper middleware mocks that are configured BEFORE importing routes
jest.mock('../../middleware/auth', () => {
  const authenticateFn = (req: any, _res: any, next: any) => {
    if (req.cookies?.accessToken === 'admin-token') {
      req.user = { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' };
    } else if (req.cookies?.accessToken === 'user-token') {
      req.user = { id: 'user-1', email: 'user@example.com', role: 'USER' };
    }
    next();
  };

  const requireRoleFn = (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  };

  return {
    authenticate: jest.fn().mockImplementation(authenticateFn),
    requireRole: jest.fn().mockImplementation(requireRoleFn)
  };
});

// Import routes AFTER mocking
import adminRoutes from '../../routes/admin';
import gdprRoutes from '../../routes/gdpr';

describe('Consent Version API Endpoints', () => {
  let app: express.Application;
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Mount routes - use the main admin router which includes middleware
    app.use('/api/admin', adminRoutes);
    app.use('/api/gdpr', gdprRoutes);
    app.use(errorHandler);

    adminToken = 'admin-token';
    userToken = 'user-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Routes', () => {
    describe('POST /api/admin/consent-versions', () => {
      it('should create a new consent version (admin only)', async () => {
        const newVersion = {
          id: 'version-1',
          consentType: ConsentType.MARKETING_EMAILS,
          version: '1.0.0',
          title: 'Marketing Consent',
          content: 'Marketing consent content',
          effectiveDate: new Date(),
          isActive: true,
        };

        (consentVersionService.createConsentVersion as jest.Mock).mockResolvedValue(newVersion);

        const response = await request(app)
          .post('/api/admin/consent-versions')
          .set('Cookie', `accessToken=${adminToken}`)
          .send({
            consentType: ConsentType.MARKETING_EMAILS,
            version: '1.0.0',
            title: 'Marketing Consent',
            content: 'Marketing consent content',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(expect.objectContaining({
          version: '1.0.0',
          title: 'Marketing Consent',
        }));
      });

      it('should reject non-admin users', async () => {
        await request(app)
          .post('/api/admin/consent-versions')
          .set('Cookie', `accessToken=${userToken}`)
          .send({
            consentType: ConsentType.MARKETING_EMAILS,
            version: '1.0.0',
            title: 'Marketing Consent',
            content: 'Content',
          })
          .expect(403);
      });

      it('should validate version format', async () => {
        const response = await request(app)
          .post('/api/admin/consent-versions')
          .set('Cookie', `accessToken=${adminToken}`)
          .send({
            consentType: ConsentType.MARKETING_EMAILS,
            version: 'invalid-version',
            title: 'Marketing Consent',
            content: 'Content',
          })
          .expect(400);

        expect(response.body.error).toContain('semver format');
      });
    });

    describe('GET /api/admin/consent-versions/:consentType', () => {
      it('should return all versions for a consent type', async () => {
        const versions = [
          { id: 'v1', version: '1.0.0', effectiveDate: new Date() },
          { id: 'v2', version: '2.0.0', effectiveDate: new Date() },
        ];

        (consentVersionService.getConsentVersions as jest.Mock).mockResolvedValue(versions);

        const response = await request(app)
          .get(`/api/admin/consent-versions/${ConsentType.MARKETING_EMAILS}`)
          .set('Cookie', `accessToken=${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
      });

      it('should return 400 for invalid consent type', async () => {
        await request(app)
          .get('/api/admin/consent-versions/INVALID_TYPE')
          .set('Cookie', `accessToken=${adminToken}`)
          .expect(400);
      });
    });

    describe('GET /api/admin/consent-versions/:consentType/active', () => {
      it('should return the active version', async () => {
        const activeVersion = {
          id: 'v1',
          version: '2.0.0',
          isActive: true,
        };

        (consentVersionService.getActiveConsentVersion as jest.Mock).mockResolvedValue(activeVersion);

        const response = await request(app)
          .get(`/api/admin/consent-versions/${ConsentType.COOKIES}/active`)
          .set('Cookie', `accessToken=${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isActive).toBe(true);
      });

      it('should return 404 if no active version', async () => {
        (consentVersionService.getActiveConsentVersion as jest.Mock).mockResolvedValue(null);

        await request(app)
          .get(`/api/admin/consent-versions/${ConsentType.ANALYTICS}/active`)
          .set('Cookie', `accessToken=${adminToken}`)
          .expect(404);
      });
    });

    describe('GET /api/admin/consent-versions/:consentType/users-needing-reconsent', () => {
      it('should return users needing re-consent', async () => {
        const users = [
          { id: 'user-1', email: 'user1@example.com' },
          { id: 'user-2', email: 'user2@example.com' },
        ];

        (consentVersionService.getUsersNeedingReConsent as jest.Mock).mockResolvedValue(users);

        const response = await request(app)
          .get(`/api/admin/consent-versions/${ConsentType.MARKETING_EMAILS}/users-needing-reconsent`)
          .set('Cookie', `accessToken=${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(2);
        expect(response.body.data).toEqual(users);
      });
    });

    describe('POST /api/admin/consent-versions/compare', () => {
      it('should compare two versions', async () => {
        const comparison = {
          version1: { version: '1.0.0', title: 'v1' },
          version2: { version: '2.0.0', title: 'v2' },
          differences: {
            titleChanged: true,
            contentChanged: true,
            expiryPeriodChanged: false,
          },
        };

        (consentVersionService.compareVersions as jest.Mock).mockResolvedValue(comparison);

        const response = await request(app)
          .post('/api/admin/consent-versions/compare')
          .set('Cookie', `accessToken=${adminToken}`)
          .send({
            consentType: ConsentType.MARKETING_EMAILS,
            version1: '1.0.0',
            version2: '2.0.0',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.differences.titleChanged).toBe(true);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/admin/consent-versions/compare')
          .set('Cookie', `accessToken=${adminToken}`)
          .send({
            consentType: ConsentType.MARKETING_EMAILS,
            // Missing version1 and version2
          })
          .expect(400);

        expect(response.body.error).toContain('required');
      });
    });

    describe('POST /api/admin/consent-versions/expired/handle', () => {
      it('should handle expired consents', async () => {
        (consentVersionService.handleExpiredConsents as jest.Mock).mockResolvedValue(5);

        const response = await request(app)
          .post('/api/admin/consent-versions/expired/handle')
          .set('Cookie', `accessToken=${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('5 expired consent(s)');
      });
    });
  });

  describe('User Routes', () => {
    describe('GET /api/gdpr/consents/:consentType/needs-reconsent', () => {
      it('should check if user needs to re-consent', async () => {
        const status = {
          needsReConsent: true,
          reason: 'VERSION_OUTDATED',
          currentVersion: '1.0.0',
          newVersion: '2.0.0',
          changes: 'Updated privacy policy',
        };

        (consentVersionService.needsReConsent as jest.Mock).mockResolvedValue(status);

        const response = await request(app)
          .get(`/api/gdpr/consents/${ConsentType.PRIVACY_POLICY}/needs-reconsent`)
          .set('Cookie', `accessToken=${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.needsReConsent).toBe(true);
        expect(response.body.data.reason).toBe('VERSION_OUTDATED');
      });

      it('should return 400 for invalid consent type', async () => {
        await request(app)
          .get('/api/gdpr/consents/INVALID/needs-reconsent')
          .set('Cookie', `accessToken=${userToken}`)
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/gdpr/consents/${ConsentType.PRIVACY_POLICY}/needs-reconsent`)
          .expect(401);
      });
    });

    describe('GET /api/gdpr/consents/history', () => {
      it('should return user consent history', async () => {
        const history = {
          current: [
            {
              id: 'consent-1',
              consentType: ConsentType.MARKETING_EMAILS,
              granted: true,
              version: '1.0.0',
            },
          ],
          history: [
            {
              action: 'CONSENT_GRANTED',
              consentType: ConsentType.MARKETING_EMAILS,
              version: '1.0.0',
              timestamp: new Date(),
            },
          ],
        };

        (consentVersionService.getConsentHistory as jest.Mock).mockResolvedValue(history);

        const response = await request(app)
          .get('/api/gdpr/consents/history')
          .set('Cookie', `accessToken=${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.current).toHaveLength(1);
        expect(response.body.data.history).toHaveLength(1);
      });

      it('should filter by consent type', async () => {
        const history = { current: [], history: [] };
        (consentVersionService.getConsentHistory as jest.Mock).mockResolvedValue(history);

        await request(app)
          .get(`/api/gdpr/consents/history?consentType=${ConsentType.COOKIES}`)
          .set('Cookie', `accessToken=${userToken}`)
          .expect(200);

        expect(consentVersionService.getConsentHistory).toHaveBeenCalledWith(
          'user-1',
          ConsentType.COOKIES
        );
      });
    });

    describe('POST /api/gdpr/consents/update-version', () => {
      it('should update consent with new version', async () => {
        const updatedConsent = {
          id: 'consent-1',
          userId: 'user-1',
          consentType: ConsentType.MARKETING_EMAILS,
          granted: true,
          version: '2.0.0',
          versionId: 'version-2',
        };

        (consentVersionService.updateConsentVersion as jest.Mock).mockResolvedValue(updatedConsent);

        const response = await request(app)
          .post('/api/gdpr/consents/update-version')
          .set('Cookie', `accessToken=${userToken}`)
          .send({
            consentType: ConsentType.MARKETING_EMAILS,
            granted: true,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('granted successfully');
      });

      it('should handle consent revocation', async () => {
        const revokedConsent = {
          id: 'consent-1',
          userId: 'user-1',
          consentType: ConsentType.MARKETING_EMAILS,
          granted: false,
          version: '2.0.0',
        };

        (consentVersionService.updateConsentVersion as jest.Mock).mockResolvedValue(revokedConsent);

        const response = await request(app)
          .post('/api/gdpr/consents/update-version')
          .set('Cookie', `accessToken=${userToken}`)
          .send({
            consentType: ConsentType.MARKETING_EMAILS,
            granted: false,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('revoked successfully');
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/gdpr/consents/update-version')
          .set('Cookie', `accessToken=${userToken}`)
          .send({
            consentType: ConsentType.MARKETING_EMAILS,
            // Missing 'granted' field
          })
          .expect(400);

        expect(response.body.error).toContain('required');
      });
    });
  });
});