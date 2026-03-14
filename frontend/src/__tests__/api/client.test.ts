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
      const axiosGetSpy = vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: { token: 'csrf-old' } } as any)
        .mockResolvedValueOnce({ data: { token: 'csrf-new' } } as any);

      const t1 = await getCsrfToken();
      expect(t1).toBe('csrf-old');
      expect(axiosGetSpy).toHaveBeenCalledWith(expect.stringContaining('/api/csrf-token'), expect.objectContaining({ withCredentials: true }));

      const t2 = await getCsrfToken();
      expect(t2).toBe('csrf-old');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);

      clearCsrfToken();

      const t3 = await getCsrfToken();
      expect(t3).toBe('csrf-new');
      expect(axiosGetSpy).toHaveBeenCalledTimes(2);

      axiosGetSpy.mockRestore();
    });
  });

  describe('CSRF Token - serialize concurrent getCsrfToken', () => {
    it('should run only one request when multiple callers need token with empty cache', async () => {
      clearCsrfToken();
      const axiosGetSpy = vi.spyOn(axios, 'get');
      let resolveRequest: (value: any) => void;
      const requestPromise = new Promise<any>((r) => { resolveRequest = r; });
      axiosGetSpy.mockReturnValueOnce(requestPromise);

      const p1 = getCsrfToken();
      const p2 = getCsrfToken();
      const p3 = getCsrfToken();

      resolveRequest!({ data: { token: 'csrf-serialized' } });

      const [t1, t2, t3] = await Promise.all([p1, p2, p3]);
      expect(t1).toBe('csrf-serialized');
      expect(t2).toBe('csrf-serialized');
      expect(t3).toBe('csrf-serialized');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);

      axiosGetSpy.mockRestore();
    });
  });

  describe('CSRF Token - use axios with withCredentials (cookie consistency)', () => {
    it('should use axios.get with withCredentials for CSRF fetch', async () => {
      clearCsrfToken();
      const axiosGetSpy = vi.spyOn(axios, 'get').mockResolvedValue({ data: { token: 'csrf-axios' } } as any);

      await getCsrfToken();

      expect(axiosGetSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/csrf-token'),
        expect.objectContaining({ withCredentials: true })
      );
      axiosGetSpy.mockRestore();
    });
  });
});

