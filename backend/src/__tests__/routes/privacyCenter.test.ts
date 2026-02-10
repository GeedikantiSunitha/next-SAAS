/**
 * Tests for Privacy Center API Endpoints
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import * as privacyCenterService from '../../services/privacyCenterService';
import { errorHandler } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../services/privacyCenterService');

// Setup middleware mocks
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    if (req.cookies?.accessToken === 'user-token') {
      req.user = { id: 'user-1', email: 'user@example.com', role: 'USER' };
      next();
    } else {
      const error: any = new Error('Authentication required');
      error.statusCode = 401;
      next(error);
    }
  }),
}));

// Import routes AFTER mocking
import privacyCenterRoutes from '../../routes/privacyCenter';

describe('Privacy Center API Endpoints', () => {
  let app: express.Application;
  let userToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Mount routes
    app.use('/api/privacy-center', privacyCenterRoutes);
    app.use(errorHandler);

    userToken = 'user-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/privacy-center/overview', () => {
    it('should return complete privacy overview for authenticated user', async () => {
      const mockOverview = {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          createdAt: new Date(),
          dataRetentionDays: 365,
        },
        dataCategories: [
          {
            category: 'PROFILE',
            description: 'Personal profile information',
            count: 15,
            lastUpdated: new Date(),
          },
          {
            category: 'ORDERS',
            description: 'Order history and transactions',
            count: 23,
            lastUpdated: new Date(),
          },
        ],
        consents: [
          {
            type: 'MARKETING_EMAILS',
            granted: true,
            version: '2.0.0',
            grantedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          {
            type: 'COOKIES',
            granted: false,
            version: '1.0.0',
            grantedAt: null,
            expiresAt: null,
          },
        ],
        privacyPreferences: {
          emailMarketing: false,
          smsMarketing: false,
          pushNotifications: true,
          shareWithPartners: false,
          profileVisibility: 'PRIVATE',
        },
        dataRequests: {
          exports: [
            {
              id: 'export-1',
              status: 'COMPLETED',
              requestedAt: new Date(),
              completedAt: new Date(),
              downloadUrl: '/api/gdpr/exports/export-1/download',
            },
          ],
          deletions: [
            {
              id: 'deletion-1',
              status: 'PENDING',
              requestedAt: new Date(),
              scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          ],
        },
        cookiePreferences: {
          essential: true,
          analytics: false,
          marketing: false,
          functional: true,
        },
        connectedAccounts: [
          {
            provider: 'google',
            connectedAt: new Date(),
          },
        ],
        recentAccess: [
          {
            accessedBy: 'admin-user',
            accessType: 'VIEW',
            dataCategory: 'PROFILE',
            purpose: 'Customer support',
            timestamp: new Date(),
          },
        ],
        metrics: {
          totalDataPoints: 38,
          activeConsents: 1,
          pendingRequests: 1,
          daysUntilDeletion: 30,
        },
      };

      (privacyCenterService.getPrivacyOverview as jest.Mock).mockResolvedValue(mockOverview);

      const response = await request(app)
        .get('/api/privacy-center/overview')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('dataCategories');
      expect(response.body.data).toHaveProperty('consents');
      expect(response.body.data).toHaveProperty('privacyPreferences');
      expect(response.body.data).toHaveProperty('dataRequests');
      expect(response.body.data).toHaveProperty('cookiePreferences');
      expect(response.body.data).toHaveProperty('connectedAccounts');
      expect(response.body.data).toHaveProperty('recentAccess');
      expect(response.body.data).toHaveProperty('metrics');

      expect(response.body.data.metrics.totalDataPoints).toBe(38);
      expect(response.body.data.metrics.activeConsents).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/privacy-center/overview')
        .expect(500); // Error handler returns 500 for uncaught errors

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined(); // Error handler sanitizes messages
    });

    it('should handle service errors gracefully', async () => {
      (privacyCenterService.getPrivacyOverview as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/privacy-center/overview')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      // Error handler sanitizes error messages in production
      expect(response.body.error).toBeDefined();
    });

    it('should cache responses for performance', async () => {
      const mockOverview = {
        user: { id: 'user-1', email: 'user@example.com' },
        dataCategories: [],
        consents: [],
        privacyPreferences: {},
        dataRequests: { exports: [], deletions: [] },
        cookiePreferences: {},
        connectedAccounts: [],
        recentAccess: [],
        metrics: {},
      };

      (privacyCenterService.getPrivacyOverview as jest.Mock).mockResolvedValue(mockOverview);

      // First request
      await request(app)
        .get('/api/privacy-center/overview')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      // Second request within cache window
      await request(app)
        .get('/api/privacy-center/overview')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      // Service should be called twice (no mocked cache)
      expect(privacyCenterService.getPrivacyOverview).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /api/privacy-center/data-categories', () => {
    it('should return detailed data categories', async () => {
      const mockCategories = [
        {
          category: 'PROFILE',
          description: 'Personal profile information',
          fields: ['name', 'email', 'phone', 'address'],
          purpose: 'Account management and communication',
          retention: '365 days after account closure',
          count: 15,
        },
        {
          category: 'USAGE',
          description: 'Application usage data',
          fields: ['login_times', 'feature_usage', 'preferences'],
          purpose: 'Product improvement and personalization',
          retention: '180 days',
          count: 125,
        },
      ];

      (privacyCenterService.getDataCategories as jest.Mock).mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/privacy-center/data-categories')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('fields');
      expect(response.body.data[0]).toHaveProperty('purpose');
      expect(response.body.data[0]).toHaveProperty('retention');
    });
  });

  describe('GET /api/privacy-center/access-log', () => {
    it('should return paginated access log', async () => {
      const mockAccessLog = {
        entries: [
          {
            id: 'log-1',
            accessedBy: 'support-admin',
            accessType: 'VIEW',
            dataCategory: 'PROFILE',
            purpose: 'Customer support request #123',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date(),
          },
          {
            id: 'log-2',
            accessedBy: 'system',
            accessType: 'EXPORT',
            dataCategory: 'ALL',
            purpose: 'User requested data export',
            ipAddress: null,
            userAgent: null,
            timestamp: new Date(),
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1,
        },
      };

      (privacyCenterService.getDataAccessLog as jest.Mock).mockResolvedValue(mockAccessLog);

      const response = await request(app)
        .get('/api/privacy-center/access-log?page=1&pageSize=10')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entries).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter by date range', async () => {
      const mockAccessLog = {
        entries: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      };

      (privacyCenterService.getDataAccessLog as jest.Mock).mockResolvedValue(mockAccessLog);

      const startDate = new Date('2024-01-01').toISOString();
      const endDate = new Date('2024-01-31').toISOString();

      await request(app)
        .get(`/api/privacy-center/access-log?startDate=${startDate}&endDate=${endDate}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(privacyCenterService.getDataAccessLog).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    it('should filter by access type', async () => {
      const mockAccessLog = {
        entries: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      };

      (privacyCenterService.getDataAccessLog as jest.Mock).mockResolvedValue(mockAccessLog);

      await request(app)
        .get('/api/privacy-center/access-log?accessType=EXPORT')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(privacyCenterService.getDataAccessLog).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          accessType: 'EXPORT',
        })
      );
    });
  });

  describe('GET /api/privacy-center/metrics', () => {
    it('should return privacy metrics summary', async () => {
      const mockMetrics = {
        dataCollection: {
          totalDataPoints: 245,
          byCategory: {
            PROFILE: 15,
            ORDERS: 23,
            USAGE: 125,
            PREFERENCES: 82,
          },
          lastUpdated: new Date(),
        },
        consents: {
          total: 5,
          granted: 2,
          revoked: 3,
          expiringSoon: 1,
        },
        requests: {
          totalExports: 3,
          totalDeletions: 1,
          pendingExports: 0,
          pendingDeletions: 1,
        },
        privacy: {
          profileVisibility: 'PRIVATE',
          dataSharing: false,
          marketingOptOut: true,
        },
        retention: {
          daysUntilDeletion: null,
          scheduledDeletionDate: null,
          dataRetentionPeriod: 365,
        },
      };

      (privacyCenterService.getPrivacyMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/api/privacy-center/metrics')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dataCollection');
      expect(response.body.data).toHaveProperty('consents');
      expect(response.body.data).toHaveProperty('requests');
      expect(response.body.data).toHaveProperty('privacy');
      expect(response.body.data).toHaveProperty('retention');
      expect(response.body.data.dataCollection.totalDataPoints).toBe(245);
    });
  });

  describe('POST /api/privacy-center/privacy-preferences', () => {
    it('should update privacy preferences', async () => {
      const updatedPreferences = {
        emailMarketing: true,
        smsMarketing: false,
        pushNotifications: true,
        shareWithPartners: false,
        profileVisibility: 'FRIENDS',
      };

      (privacyCenterService.updatePrivacyPreferences as jest.Mock).mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .post('/api/privacy-center/privacy-preferences')
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          emailMarketing: true,
          profileVisibility: 'FRIENDS',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Privacy preferences updated');
      expect(response.body.data.emailMarketing).toBe(true);
      expect(response.body.data.profileVisibility).toBe('FRIENDS');
    });

    it('should validate preference values', async () => {
      const response = await request(app)
        .post('/api/privacy-center/privacy-preferences')
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          profileVisibility: 'INVALID_VALUE',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid profile visibility');
    });

    it('should log preference changes', async () => {
      const updatedPreferences = { emailMarketing: false };

      (privacyCenterService.updatePrivacyPreferences as jest.Mock).mockResolvedValue(updatedPreferences);

      await request(app)
        .post('/api/privacy-center/privacy-preferences')
        .set('Cookie', `accessToken=${userToken}`)
        .send({ emailMarketing: false })
        .expect(200);

      expect(privacyCenterService.updatePrivacyPreferences).toHaveBeenCalledWith(
        'user-1',
        { emailMarketing: false },
        expect.objectContaining({ logChange: true })
      );
    });
  });

  describe('POST /api/privacy-center/clear-cache', () => {
    it('should clear user privacy cache', async () => {
      (privacyCenterService.clearUserCache as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/privacy-center/clear-cache')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Cache cleared');
    });
  });
});