/**
 * Privacy API Client Tests (TDD)
 * Verifies correct API paths and use of apiClient (CSRF, auth, etc.)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPost = vi.hoisted(() => vi.fn());
const mockGet = vi.hoisted(() => vi.fn());

vi.mock('../../api/client', () => ({
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { privacyApi } from '../../api/privacy';

describe('Privacy API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateCookiePreferences', () => {
    it('should use apiClient (CSRF included) and call /api/gdpr/consents/cookies', async () => {
      mockPost.mockResolvedValue({ data: { success: true } });

      await privacyApi.updateCookiePreferences({
        essential: true,
        analytics: false,
        marketing: false,
        functional: true,
      });

      expect(mockPost).toHaveBeenCalledWith('/api/gdpr/consents/cookies', {
        essential: true,
        analytics: false,
        marketing: false,
        functional: true,
      });
    });
  });

  describe('updatePrivacyPreferences', () => {
    it('should use apiClient (CSRF included) and call /api/privacy-center/privacy-preferences', async () => {
      mockPost.mockResolvedValue({ data: { success: true } });

      await privacyApi.updatePrivacyPreferences({ emailMarketing: true });

      expect(mockPost).toHaveBeenCalledWith('/api/privacy-center/privacy-preferences', {
        emailMarketing: true,
      });
    });
  });
});
