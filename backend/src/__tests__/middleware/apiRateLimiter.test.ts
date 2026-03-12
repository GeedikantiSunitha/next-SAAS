/**
 * API Rate Limiter Tests (TDD)
 *
 * Verifies apiLimiter skips rate limiting in test and development
 * to avoid 429 errors during local development.
 */

import config from '../../config';
import { shouldSkipApiRateLimit } from '../../middleware/security';

describe('API Rate Limiter', () => {
  const originalNodeEnv = config.nodeEnv;

  afterEach(() => {
    config.nodeEnv = originalNodeEnv;
  });

  it('should skip rate limiting in test environment', () => {
    config.nodeEnv = 'test';
    expect(shouldSkipApiRateLimit()).toBe(true);
  });

  it('should skip rate limiting in development environment', () => {
    config.nodeEnv = 'development';
    expect(shouldSkipApiRateLimit()).toBe(true);
  });

  it('should NOT skip rate limiting in production environment', () => {
    config.nodeEnv = 'production';
    expect(shouldSkipApiRateLimit()).toBe(false);
  });
});
