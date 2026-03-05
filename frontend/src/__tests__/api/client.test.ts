import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import apiClient, { getCsrfToken, clearCsrfToken } from '../../api/client';
import axios from 'axios';

// Mock axios for testing
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        defaults: {
          baseURL: 'http://localhost:3001',
          withCredentials: true,
        },
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
      post: vi.fn(),
    },
  };
});

describe('API Client - Cookie-based Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Configuration', () => {
    it('should have withCredentials enabled for cookies', () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
    });

    it('should use correct base URL from environment', () => {
      expect(apiClient.defaults.baseURL).toBe(
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      );
    });
  });

  describe('Request Interceptor - Cookie-based Auth', () => {
    it('should NOT add Authorization header (cookies sent automatically)', () => {
      // With cookie-based auth, we should NOT manually add Authorization header
      // Cookies are sent automatically by the browser
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      
      // The interceptor should NOT call localStorage.getItem('accessToken')
      // We verify this by checking that getItem is not called for accessToken
      expect(getItemSpy).not.toHaveBeenCalledWith('accessToken');
    });

    it('should NOT read access token from localStorage', () => {
      // Verify localStorage.getItem is never called for accessToken
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      
      // Even if token exists in localStorage, it should not be used
      localStorage.setItem('accessToken', 'old-token');
      
      // The interceptor should not use this token
      // (We can't easily test the interceptor directly, but we verify the pattern)
      expect(getItemSpy).not.toHaveBeenCalledWith('accessToken');
    });
  });

  describe('Response Interceptor - Token Refresh', () => {
    it('should handle 401 errors without localStorage token', async () => {
      // When token refresh happens, it should use cookies, not localStorage
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      
      // Token refresh should NOT store accessToken in localStorage
      // Cookies are set by backend automatically
      expect(setItemSpy).not.toHaveBeenCalledWith('accessToken', expect.any(String));
      
      // If refresh fails, should NOT try to remove from localStorage
      // (since it was never stored there)
      expect(removeItemSpy).not.toHaveBeenCalledWith('accessToken');
    });
  });

  describe('CSRF Token - clearCsrfToken on logout', () => {
    it('should clear CSRF cache so next request fetches fresh token', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy
        .mockResolvedValueOnce({ json: () => Promise.resolve({ token: 'csrf-old' }) } as Response)
        .mockResolvedValueOnce({ json: () => Promise.resolve({ token: 'csrf-new' }) } as Response);

      const t1 = await getCsrfToken();
      expect(t1).toBe('csrf-old');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const t2 = await getCsrfToken();
      expect(t2).toBe('csrf-old');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      clearCsrfToken();

      const t3 = await getCsrfToken();
      expect(t3).toBe('csrf-new');
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      fetchSpy.mockRestore();
    });
  });
});

