/**
 * Privacy API Client Tests (TDD)
 * Verifies correct API paths for cookie preferences
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPost = vi.hoisted(() => vi.fn());
const mockGet = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    create: () => ({
      post: mockPost,
      get: mockGet,
    }),
  },
}));

import { privacyApi } from '../../api/privacy';

describe('Privacy API - updateCookiePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call /gdpr/consents/cookies for updateCookiePreferences', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });

    await privacyApi.updateCookiePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      functional: true,
    });

    expect(mockPost).toHaveBeenCalledWith('/gdpr/consents/cookies', {
      essential: true,
      analytics: false,
      marketing: false,
      functional: true,
    });
  });
});
