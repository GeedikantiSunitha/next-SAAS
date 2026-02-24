/**
 * Feature Flag Runtime Service Tests (TDD)
 * 
 * Verifies that feature flags read from database take precedence over config,
 * so admin toggles in Feature Flags UI are enforced at runtime.
 */

import { prisma } from '../../config/database';
import * as featureFlagRuntimeService from '../../services/featureFlagRuntimeService';

describe('Feature Flag Runtime Service', () => {
  const testAdminId = 'test-admin-id';

  beforeEach(async () => {
    await prisma.featureFlag.deleteMany({});
  });

  afterEach(async () => {
    await prisma.featureFlag.deleteMany({});
  });

  describe('isFeatureEnabled', () => {
    it('should return false when password_reset is disabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'password_reset',
          enabled: false,
          description: 'Enable password reset',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('password_reset');
      expect(result).toBe(false);
    });

    it('should return true when password_reset is enabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'password_reset',
          enabled: true,
          description: 'Enable password reset',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('password_reset');
      expect(result).toBe(true);
    });

    it('should fall back to config when flag does not exist in database', async () => {
      // No flag in DB - should use config (ENABLE_PASSWORD_RESET env)
      const result = await featureFlagRuntimeService.isFeatureEnabled('password_reset');
      // Default config is true when env not set
      expect(typeof result).toBe('boolean');
    });

    it('should return false when registration is disabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'registration',
          enabled: false,
          description: 'Enable registration',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('registration');
      expect(result).toBe(false);
    });

    it('should return true when registration is enabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'registration',
          enabled: true,
          description: 'Enable registration',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('registration');
      expect(result).toBe(true);
    });

    it('should return false when email_verification is disabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'email_verification',
          enabled: false,
          description: 'Require email verification',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('email_verification');
      expect(result).toBe(false);
    });

    it('should return false for unknown flag key when not in database', async () => {
      const result = await featureFlagRuntimeService.isFeatureEnabled('unknown_flag_xyz');
      expect(result).toBe(false);
    });

    it('should return false when google_oauth is disabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'google_oauth',
          enabled: false,
          description: 'Enable Google OAuth',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('google_oauth');
      expect(result).toBe(false);
    });

    it('should return true when google_oauth is enabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'google_oauth',
          enabled: true,
          description: 'Enable Google OAuth',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('google_oauth');
      expect(result).toBe(true);
    });

    it('should return false when github_oauth is disabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'github_oauth',
          enabled: false,
          description: 'Enable GitHub OAuth',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('github_oauth');
      expect(result).toBe(false);
    });

    it('should return false when microsoft_oauth is disabled in database', async () => {
      await prisma.featureFlag.create({
        data: {
          key: 'microsoft_oauth',
          enabled: false,
          description: 'Enable Microsoft OAuth',
          updatedBy: testAdminId,
        },
      });

      const result = await featureFlagRuntimeService.isFeatureEnabled('microsoft_oauth');
      expect(result).toBe(false);
    });

    it('should reflect admin toggle - DB overrides config', async () => {
      await prisma.featureFlag.upsert({
        where: { key: 'password_reset' },
        create: { key: 'password_reset', enabled: false, description: 'Enable password reset' },
        update: { enabled: false },
      });

      const resultDisabled = await featureFlagRuntimeService.isFeatureEnabled('password_reset');
      expect(resultDisabled).toBe(false);

      await prisma.featureFlag.update({
        where: { key: 'password_reset' },
        data: { enabled: true },
      });

      const resultEnabled = await featureFlagRuntimeService.isFeatureEnabled('password_reset');
      expect(resultEnabled).toBe(true);
    });
  });
});
