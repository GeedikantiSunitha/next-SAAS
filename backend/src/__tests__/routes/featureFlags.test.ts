/**
 * Feature Flags Routes Tests (TDD)
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../../config';
import * as featureFlagsService from '../../services/featureFlagsService';

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

describe('Feature Flags Routes', () => {
  let userToken: string;
  let userEmail: string;

  beforeEach(async () => {
    // Clear feature flags cache
    featureFlagsService.clearCache();
    
    const timestamp = Date.now();
    userEmail = `feature-flags-${timestamp}@example.com`;
    const userPassword = await bcrypt.hash('Password123!', 10);
    
    await prisma.user.create({
      data: {
        email: userEmail,
        password: userPassword,
        name: 'Feature Flags Test User',
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

  describe('GET /api/feature-flags/:flagName', () => {
    it('should return feature flag status when flag is enabled', async () => {
      process.env.FEATURE_NEW_DASHBOARD = 'true';
      
      const response = await request(app)
        .get('/api/feature-flags/NEW_DASHBOARD')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(true);
      
      delete process.env.FEATURE_NEW_DASHBOARD;
    });

    it('should return feature flag status when flag is disabled', async () => {
      process.env.FEATURE_NEW_DASHBOARD = 'false';
      
      const response = await request(app)
        .get('/api/feature-flags/NEW_DASHBOARD')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(false);
      
      delete process.env.FEATURE_NEW_DASHBOARD;
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/feature-flags/NEW_DASHBOARD');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/feature-flags', () => {
    it('should return all feature flags', async () => {
      // Set flags
      const originalNewDashboard = process.env.FEATURE_NEW_DASHBOARD;
      const originalBetaFeatures = process.env.FEATURE_BETA_FEATURES;
      
      process.env.FEATURE_NEW_DASHBOARD = 'true';
      process.env.FEATURE_BETA_FEATURES = 'false';
      
      const response = await request(app)
        .get('/api/feature-flags')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('NEW_DASHBOARD');
      // getAllFeatureFlags returns boolean values
      expect(typeof response.body.data.NEW_DASHBOARD).toBe('boolean');
      
      // Restore original values
      if (originalNewDashboard !== undefined) {
        process.env.FEATURE_NEW_DASHBOARD = originalNewDashboard;
      } else {
        delete process.env.FEATURE_NEW_DASHBOARD;
      }
      if (originalBetaFeatures !== undefined) {
        process.env.FEATURE_BETA_FEATURES = originalBetaFeatures;
      } else {
        delete process.env.FEATURE_BETA_FEATURES;
      }
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/feature-flags');

      expect(response.status).toBe(401);
    });
  });
});

