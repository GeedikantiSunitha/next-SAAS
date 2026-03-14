import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * API Client Configuration
 * 
 * CRITICAL: This client is configured to work with the backend template:
 * - CORS: Uses withCredentials for cookie support
 * - Auth: Cookie-based authentication (HTTP-only cookies sent automatically)
 * - Refresh: Automatically refreshes token on 401 using cookies
 * - Error Handling: Centralized error handling
 * 
 * SECURITY: Access tokens are stored in HTTP-only cookies (NOT localStorage)
 * - Cookies are sent automatically by browser (withCredentials: true)
 * - No manual Authorization header needed (backend reads from cookie)
 * - Backward compatible: Authorization header still works if provided
 */

const apiClient = axios.create({
  // Use relative URL to go through Vite proxy (same-origin, cookies work)
  // In production, set VITE_API_BASE_URL to actual API URL
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  withCredentials: true, // CRITICAL: Enables cookies for refresh tokens
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Cached CSRF token for state-changing requests (double-submit cookie). */
let csrfTokenCache: string | null = null;

/** In-flight request promise - prevents race when multiple requests need token at once. */
let csrfTokenFetch: Promise<string | null> | null = null;

/**
 * Fetch CSRF token from backend (sets cookie and returns token).
 * Uses axios with withCredentials for consistent cookie handling (fixes proxy/cross-origin).
 * Serializes concurrent calls so only one request runs.
 */
export async function getCsrfToken(): Promise<string | null> {
  if (csrfTokenCache) return csrfTokenCache;
  if (csrfTokenFetch) return csrfTokenFetch;
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const fetchPromise = (async () => {
    try {
      const res = await axios.get<{ token?: string }>(`${base}/api/csrf-token`, {
        withCredentials: true,
      });
      if (res.data?.token) {
        if (csrfTokenFetch === fetchPromise) csrfTokenCache = res.data.token;
        return res.data.token;
      }
    } catch {
      // Ignore (e.g. backend not running or CORS)
    }
    return null;
  })();
  csrfTokenFetch = fetchPromise;
  const result = await fetchPromise;
  csrfTokenFetch = null;
  return result;
}

/**
 * Clear cached CSRF token. Call on logout so next session gets a fresh token.
 */
export function clearCsrfToken(): void {
  csrfTokenCache = null;
  csrfTokenFetch = null;
}

/**
 * Request Interceptor
 * - Adds X-CSRF-Token header for state-changing requests (CSRF protection).
 * - Cookies are sent automatically by browser (withCredentials: true).
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = (config.method || 'get').toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isCsrfEndpoint = config.url?.includes('/csrf-token');
    if (isStateChanging && !isCsrfEndpoint) {
      const token = await getCsrfToken();
      if (token) {
        config.headers.set('X-CSRF-Token', token);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Handles token refresh on 401 errors and network errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _csrfRetry?: boolean };

    // Handle network errors (offline, timeout, etc.)
    if (!error.response) {
      // Network error (offline, timeout, connection refused, etc.)
      const networkError = {
        message: error.message || 'Network error',
        code: error.code,
        isNetworkError: true,
        isTimeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
        isOffline: !navigator.onLine,
      };

      // Dispatch custom event for network error handling
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('network-error', { detail: networkError }));
      }

      return Promise.reject(networkError);
    }

    // Handle 401 (unauthorized) - try to refresh token
    // BUT: Don't try to refresh for auth endpoints - they don't need refresh
    const isAuthEndpoint = originalRequest?.url?.includes('/api/auth/login') || 
                           originalRequest?.url?.includes('/api/auth/register') ||
                           originalRequest?.url?.includes('/api/auth/me') ||
                           originalRequest?.url?.includes('/api/auth/refresh');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token using cookie
        // Backend sets new access token as HTTP-only cookie automatically
        // Use relative URL to go through proxy (same-origin, cookies work)
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/refresh`,
          {},
          { withCredentials: true } // Cookie contains refresh token
        );

        // Backend sets new accessToken as cookie, not in response body
        // No need to store in localStorage - cookie is sent automatically
        // Just retry the original request (cookies sent automatically)
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - DON'T redirect here, let AuthContext/ProtectedRoute handle it
        // This prevents redirect loops on public pages like /register
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 CSRF - clear cache and retry once
    const isCsrfError = error.response?.status === 403 &&
      (error.response?.data as { error?: string })?.error === 'Invalid or missing CSRF token';
    if (isCsrfError && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      clearCsrfToken();
      try {
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

