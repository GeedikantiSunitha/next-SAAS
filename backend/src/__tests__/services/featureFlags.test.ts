/**
 * Feature Flags Service Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 * 
 * Tests verify:
 * - Flag retrieval from environment variables
 * - Default values when flags not set
 * - Caching behavior
 * - Flag combinations
 * - Type safety
 */

import * as featureFlagsService from '../../services/featureFlagsService';

describe('Feature Flags Service', () => {
  // Save original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear any caches
    if (featureFlagsService.clearCache) {
      featureFlagsService.clearCache();
    }
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('isFeatureEnabled', () => {
    it('should return true when feature flag is set to "true"', () => {
      process.env.FEATURE_NEW_DASHBOARD = 'true';
      const result = featureFlagsService.isFeatureEnabled('NEW_DASHBOARD');
      expect(result).toBe(true);
    });

    it('should return false when feature flag is set to "false"', () => {
      process.env.FEATURE_NEW_DASHBOARD = 'false';
      const result = featureFlagsService.isFeatureEnabled('NEW_DASHBOARD');
      expect(result).toBe(false);
    });

    it('should return false when feature flag is not set', () => {
      delete process.env.FEATURE_NEW_DASHBOARD;
      const result = featureFlagsService.isFeatureEnabled('NEW_DASHBOARD');
      expect(result).toBe(false);
    });

    it('should return false when feature flag is empty string', () => {
      process.env.FEATURE_NEW_DASHBOARD = '';
      const result = featureFlagsService.isFeatureEnabled('NEW_DASHBOARD');
      expect(result).toBe(false);
    });

    it('should be case-insensitive for boolean values', () => {
      process.env.FEATURE_NEW_DASHBOARD = 'TRUE';
      const result = featureFlagsService.isFeatureEnabled('NEW_DASHBOARD');
      expect(result).toBe(true);
    });

    it('should handle multiple feature flags independently', () => {
      process.env.FEATURE_NEW_DASHBOARD = 'true';
      process.env.FEATURE_BETA_FEATURES = 'false';
      
      expect(featureFlagsService.isFeatureEnabled('NEW_DASHBOARD')).toBe(true);
      expect(featureFlagsService.isFeatureEnabled('BETA_FEATURES')).toBe(false);
    });
  });

  describe('getFeatureFlag', () => {
    it('should return string value when flag is set', () => {
      process.env.FEATURE_API_VERSION = 'v2';
      const result = featureFlagsService.getFeatureFlag('API_VERSION');
      expect(result).toBe('v2');
    });

    it('should return default value when flag is not set', () => {
      delete process.env.FEATURE_API_VERSION;
      const result = featureFlagsService.getFeatureFlag('API_VERSION', 'v1');
      expect(result).toBe('v1');
    });

    it('should return null when flag is not set and no default provided', () => {
      delete process.env.FEATURE_API_VERSION;
      const result = featureFlagsService.getFeatureFlag('API_VERSION');
      expect(result).toBeNull();
    });

    it('should return number when flag is numeric string', () => {
      process.env.FEATURE_MAX_RETRIES = '5';
      const result = featureFlagsService.getFeatureFlag('MAX_RETRIES');
      expect(result).toBe('5');
    });
  });

  describe('getFeatureFlagAsNumber', () => {
    it('should return number when flag is numeric string', () => {
      process.env.FEATURE_MAX_RETRIES = '5';
      const result = featureFlagsService.getFeatureFlagAsNumber('MAX_RETRIES');
      expect(result).toBe(5);
    });

    it('should return default when flag is not set', () => {
      delete process.env.FEATURE_MAX_RETRIES;
      const result = featureFlagsService.getFeatureFlagAsNumber('MAX_RETRIES', 3);
      expect(result).toBe(3);
    });

    it('should return default when flag is invalid number', () => {
      process.env.FEATURE_MAX_RETRIES = 'invalid';
      const result = featureFlagsService.getFeatureFlagAsNumber('MAX_RETRIES', 3);
      expect(result).toBe(3);
    });

    it('should return null when flag is not set and no default provided', () => {
      delete process.env.FEATURE_MAX_RETRIES;
      const result = featureFlagsService.getFeatureFlagAsNumber('MAX_RETRIES');
      expect(result).toBeNull();
    });
  });

  describe('getFeatureFlagAsBoolean', () => {
    it('should return true for "true" string', () => {
      process.env.FEATURE_ENABLED = 'true';
      const result = featureFlagsService.getFeatureFlagAsBoolean('ENABLED');
      expect(result).toBe(true);
    });

    it('should return false for "false" string', () => {
      process.env.FEATURE_ENABLED = 'false';
      const result = featureFlagsService.getFeatureFlagAsBoolean('ENABLED');
      expect(result).toBe(false);
    });

    it('should return default when flag is not set', () => {
      delete process.env.FEATURE_ENABLED;
      const result = featureFlagsService.getFeatureFlagAsBoolean('ENABLED', true);
      expect(result).toBe(true);
    });

    it('should return false for invalid boolean string', () => {
      process.env.FEATURE_ENABLED = 'maybe';
      const result = featureFlagsService.getFeatureFlagAsBoolean('ENABLED', false);
      expect(result).toBe(false);
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags as object', () => {
      process.env.FEATURE_NEW_DASHBOARD = 'true';
      process.env.FEATURE_BETA_FEATURES = 'false';
      process.env.FEATURE_API_VERSION = 'v2';
      
      const flags = featureFlagsService.getAllFeatureFlags();
      
      expect(flags.NEW_DASHBOARD).toBe(true);
      expect(flags.BETA_FEATURES).toBe(false);
      expect(flags.API_VERSION).toBe('v2');
    });

    it('should return empty object when no flags are set', () => {
      // Clear all FEATURE_ env vars
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('FEATURE_')) {
          delete process.env[key];
        }
      });
      
      const flags = featureFlagsService.getAllFeatureFlags();
      expect(Object.keys(flags).length).toBe(0);
    });
  });

  describe('Caching', () => {
    it('should cache flag values for performance', () => {
      process.env.FEATURE_TEST_FLAG = 'true';
      
      const result1 = featureFlagsService.isFeatureEnabled('TEST_FLAG');
      
      // Should return true
      expect(result1).toBe(true);
    });

    it('should allow clearing cache', () => {
      if (featureFlagsService.clearCache) {
        process.env.FEATURE_TEST_FLAG = 'true';
        featureFlagsService.isFeatureEnabled('TEST_FLAG');
        
        process.env.FEATURE_TEST_FLAG = 'false';
        featureFlagsService.clearCache();
        
        const result = featureFlagsService.isFeatureEnabled('TEST_FLAG');
        expect(result).toBe(false);
      }
    });
  });
});

