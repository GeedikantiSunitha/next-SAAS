import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../../config/database';
import authRoutes from '../../routes/auth';
import { createTestUser } from '../../tests/setup';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import * as oauthService from '../../services/oauthService';
import * as oauthTokenVerifier from '../../utils/oauthTokenVerifier';

// Mock OAuth service
jest.mock('../../services/oauthService', () => ({
  createOrUpdateUserFromOAuth: jest.fn(),
  linkOAuthToUser: jest.fn(),
  unlinkOAuthFromUser: jest.fn(),
  getUserOAuthMethods: jest.fn(),
}));

// Mock OAuth token verifier
jest.mock('../../utils/oauthTokenVerifier', () => ({
  verifyOAuthToken: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('OAuth Routes', () => {
  let testUser: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    await prisma.user.deleteMany();
    testUser = await createTestUser({
      email: 'test@example.com',
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/oauth/:provider', () => {
    it('should create or update user from Google OAuth token', async () => {
      const mockUser = {
        id: testUser.id,
        email: 'google@example.com',
        name: 'Google User',
        oauthProvider: 'google',
        oauthProviderId: 'google-123',
        emailVerified: true,
      };

      const mockProfile = {
        id: 'google-123',
        emails: [{ value: 'google@example.com', verified: true }],
        displayName: 'Google User',
        provider: 'google',
      };

      (oauthTokenVerifier.verifyOAuthToken as jest.Mock).mockResolvedValue(mockProfile);
      (oauthService.createOrUpdateUserFromOAuth as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/oauth/google')
        .send({ token: 'google-oauth-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('google@example.com');
      expect(oauthTokenVerifier.verifyOAuthToken).toHaveBeenCalledWith('google', 'google-oauth-token');
      expect(oauthService.createOrUpdateUserFromOAuth).toHaveBeenCalledWith('google', mockProfile);
    });

    it('should create or update user from GitHub OAuth token', async () => {
      const mockUser = {
        id: testUser.id,
        email: 'github@example.com',
        name: 'GitHub User',
        oauthProvider: 'github',
        oauthProviderId: 'github-456',
        emailVerified: true,
      };

      const mockProfile = {
        id: 'github-456',
        emails: [{ value: 'github@example.com', verified: true }],
        displayName: 'GitHub User',
        provider: 'github',
      };

      (oauthTokenVerifier.verifyOAuthToken as jest.Mock).mockResolvedValue(mockProfile);
      (oauthService.createOrUpdateUserFromOAuth as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/oauth/github')
        .send({ token: 'github-oauth-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('github@example.com');
    });

    it('should require token in request body', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/google')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      // Validation errors are in errors array or error message
      const errorText = JSON.stringify(response.body.errors || response.body.error);
      expect(errorText).toContain('token');
    });

    it('should create or update user from Microsoft OAuth token', async () => {
      const mockProfile = {
        id: 'microsoft-789',
        emails: [{ value: 'microsoft@example.com', verified: true }],
        displayName: 'Microsoft User',
        provider: 'microsoft',
      };

      const mockUser = {
        id: testUser.id,
        email: 'microsoft@example.com',
        name: 'Microsoft User',
        oauthProvider: 'microsoft',
        oauthProviderId: 'microsoft-789',
        emailVerified: true,
      };

      (oauthTokenVerifier.verifyOAuthToken as jest.Mock).mockResolvedValue(mockProfile);
      (oauthService.createOrUpdateUserFromOAuth as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/oauth/microsoft')
        .send({ token: 'microsoft-oauth-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('microsoft@example.com');
    });

    it('should reject invalid provider', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/invalid-provider')
        .send({ token: 'token' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/oauth/link', () => {
    it('should link OAuth provider to authenticated user', async () => {
      // Get auth token for test user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const accessTokenCookie = cookieArray.find((c: string) => c.startsWith('accessToken='));
      
      const mockProfile = {
        id: 'google-123',
        emails: [{ value: 'google@example.com', verified: true }],
        displayName: 'Google User',
        provider: 'google',
      };

      const mockLinkedUser = {
        ...testUser,
        oauthProvider: 'google',
        oauthProviderId: 'google-123',
      };

      (oauthTokenVerifier.verifyOAuthToken as jest.Mock).mockResolvedValue(mockProfile);
      (oauthService.linkOAuthToUser as jest.Mock).mockResolvedValue(mockLinkedUser);

      const response = await request(app)
        .post('/api/auth/oauth/link')
        .set('Cookie', accessTokenCookie || '')
        .send({
          provider: 'google',
          token: 'google-oauth-token',
        });

      // Debug: log response if not 200
      if (response.status !== 200) {
        console.log('Link OAuth response:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.oauthProvider).toBe('google');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/link')
        .send({
          provider: 'google',
          token: 'google-oauth-token',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });
  });

  describe('POST /api/auth/oauth/unlink', () => {
    it('should unlink OAuth provider from authenticated user', async () => {
      // Create user with OAuth
      const oauthUser = await prisma.user.create({
        data: {
          email: 'oauth@example.com',
          password: await require('bcryptjs').hash('Password123!', 12),
          oauthProvider: 'google',
          oauthProviderId: 'google-123',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'oauth@example.com',
          password: 'Password123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const accessTokenCookie = cookieArray.find((c: string) => c.startsWith('accessToken='));

      const mockUnlinkedUser = {
        ...oauthUser,
        oauthProvider: null,
        oauthProviderId: null,
      };

      (oauthService.unlinkOAuthFromUser as jest.Mock).mockResolvedValue(mockUnlinkedUser);

      const response = await request(app)
        .post('/api/auth/oauth/unlink')
        .set('Cookie', accessTokenCookie || '')
        .send({ provider: 'google' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(oauthService.unlinkOAuthFromUser).toHaveBeenCalledWith(oauthUser.id, 'google');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/unlink')
        .send({ provider: 'google' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });
  });

  describe('GET /api/auth/oauth/methods', () => {
    it('should return user\'s linked OAuth methods', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const accessTokenCookie = cookieArray.find((c: string) => c.startsWith('accessToken='));

      (oauthService.getUserOAuthMethods as jest.Mock).mockResolvedValue(['google']);

      const response = await request(app)
        .get('/api/auth/oauth/methods')
        .set('Cookie', accessTokenCookie || '');

      if (response.status !== 200) {
        console.log('Get methods response:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(['google']);
    });

    it('should return empty array if no OAuth methods linked', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const accessTokenCookie = cookieArray.find((c: string) => c.startsWith('accessToken='));

      (oauthService.getUserOAuthMethods as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/auth/oauth/methods')
        .set('Cookie', accessTokenCookie || '');

      if (response.status !== 200) {
        console.log('Get methods (empty) response:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/methods')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

