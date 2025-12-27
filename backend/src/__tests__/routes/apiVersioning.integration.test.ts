/**
 * API Versioning Integration Tests
 * 
 * Tests verify versioning works with actual routes
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../../config';

// Helper to get auth token
const getAuthToken = async (email: string, _password: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }
  return jwt.sign(
    { userId: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );
};

describe('API Versioning Integration', () => {
  let userToken: string;
  let userEmail: string;

  beforeEach(async () => {
    const timestamp = Date.now();
    userEmail = `api-version-${timestamp}@example.com`;
    const userPassword = await bcrypt.hash('Password123!', 10);
    
    await prisma.user.create({
      data: {
        email: userEmail,
        password: userPassword,
        name: 'API Version Test User',
        role: 'USER',
      },
    });

    userToken = await getAuthToken(userEmail, 'Password123!');
  });

  afterEach(async () => {
    if (userEmail) {
      await prisma.user.deleteMany({ where: { email: userEmail } });
    }
  });

  describe('Version Detection from URL Path', () => {
    it('should work with /api/v1/ prefix', async () => {
      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['api-version']).toBe('v1');
    });

    it('should work with /api/v2/ prefix', async () => {
      const response = await request(app)
        .get('/api/v2/profile/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['api-version']).toBe('v2');
    });

    it('should default to v1 for /api/ (backward compatibility)', async () => {
      const response = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['api-version']).toBe('v1');
    });
  });

  describe('Version Detection from Headers', () => {
    it('should detect version from X-API-Version header', async () => {
      const response = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-API-Version', 'v2');

      expect(response.status).toBe(200);
      expect(response.headers['api-version']).toBe('v2');
    });

    it('should prioritize header over URL path', async () => {
      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-API-Version', 'v2');

      expect(response.status).toBe(200);
      expect(response.headers['api-version']).toBe('v2');
    });
  });

  describe('Invalid Version Handling', () => {
    it('should return 400 for invalid version in header', async () => {
      const response = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-API-Version', 'v99');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid API version');
    });

    it('should return 400 for invalid version in URL', async () => {
      const response = await request(app)
        .get('/api/v99/profile/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid API version');
    });
  });
});

