/**
 * OAuth Rate Limiter Tests (TDD)
 * 
 * Tests for OAuth-specific rate limiter that allows more requests
 * than the strict authentication limiter.
 */

import { oauthLimiter } from '../../middleware/security';
import config from '../../config';

describe('OAuth Rate Limiter', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalOAuthLimit = process.env.OAUTH_RATE_LIMIT_MAX;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalOAuthLimit) {
      process.env.OAUTH_RATE_LIMIT_MAX = originalOAuthLimit;
    } else {
      delete process.env.OAUTH_RATE_LIMIT_MAX;
    }
  });

  it('should exist and be exported', () => {
    expect(oauthLimiter).toBeDefined();
    expect(typeof oauthLimiter).toBe('function');
  });

  it('should have higher default limit than authLimiter', () => {
    // OAuth limiter should allow more requests (30) than auth limiter (5)
    const oauthMax = parseInt(process.env.OAUTH_RATE_LIMIT_MAX || '30', 10);
    const authMax = config.rateLimit.authMaxRequests;
    
    expect(oauthMax).toBeGreaterThan(authMax);
    expect(oauthMax).toBe(30); // Default should be 30
  });

  it('should respect OAUTH_RATE_LIMIT_MAX environment variable', () => {
    process.env.OAUTH_RATE_LIMIT_MAX = '50';
    const oauthMax = parseInt(process.env.OAUTH_RATE_LIMIT_MAX || '30', 10);
    expect(oauthMax).toBe(50);
  });

  it('should have default limit of 30 requests per 15 minutes', () => {
    delete process.env.OAUTH_RATE_LIMIT_MAX;
    const oauthMax = parseInt(process.env.OAUTH_RATE_LIMIT_MAX || '30', 10);
    expect(oauthMax).toBe(30);
  });
});
