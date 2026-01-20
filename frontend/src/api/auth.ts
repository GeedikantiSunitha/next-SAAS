import apiClient from './client';

/**
 * Authentication API Service
 * 
 * All auth endpoints matching the backend template API
 */

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data: User | { requiresMfa: boolean; mfaMethod: 'TOTP' | 'EMAIL'; user: User }; // Backend login returns user or MFA requirement
}

export interface RegisterResponse {
  success: boolean;
  data: User; // Backend register returns user directly, not wrapped in { user, accessToken }
}

export interface MeResponse {
  success: boolean;
  data: User; // Backend /me returns { success: true, data: user } where data is the User object
}

export const authApi = {
  /**
   * Register a new user
   * Backend returns { success: true, data: user } and sets accessToken as HTTP-only cookie
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   * Backend returns { success: true, data: user } and sets accessToken as HTTP-only cookie
   * No accessToken in response body (security: HTTP-only cookies)
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  /**
   * Logout user
   * Clears refresh token cookie on backend
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },

  /**
   * Get current user
   */
  getMe: async (): Promise<MeResponse> => {
    const response = await apiClient.get<MeResponse>('/api/auth/me');
    return response.data;
  },

  /**
   * Refresh access token
   * Uses refresh token from HTTP-only cookie
   * Backend sets new accessToken as HTTP-only cookie (not in response body)
   */
  refreshToken: async (): Promise<{ success: boolean; data: {} }> => {
    const response = await apiClient.post<{ success: boolean; data: {} }>(
      '/api/auth/refresh',
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Request password reset
   * Sends password reset email
   */
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/api/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  /**
   * Reset password using token
   */
  resetPassword: async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/api/auth/reset-password/${token}`,
      { password }
    );
    return response.data;
  },

  /**
   * Authenticate with OAuth provider (token-based flow)
   */
  oauthLogin: async (provider: 'google' | 'github' | 'microsoft', token: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `/api/auth/oauth/${provider}`,
      { token }
    );
    return response.data;
  },

  /**
   * Link OAuth provider to existing account
   */
  linkOAuth: async (provider: 'google' | 'github' | 'microsoft', token: string): Promise<{ success: boolean; data: User }> => {
    const response = await apiClient.post<{ success: boolean; data: User }>(
      '/api/auth/oauth/link',
      { provider, token }
    );
    return response.data;
  },

  /**
   * Unlink OAuth provider from account
   */
  unlinkOAuth: async (provider: 'google' | 'github' | 'microsoft'): Promise<{ success: boolean; data: User }> => {
    const response = await apiClient.post<{ success: boolean; data: User }>(
      '/api/auth/oauth/unlink',
      { provider }
    );
    return response.data;
  },

  /**
   * Exchange GitHub authorization code for access token
   */
  exchangeGitHubCode: async (code: string): Promise<{ success: boolean; data: { token: string } }> => {
    const response = await apiClient.post<{ success: boolean; data: { token: string } }>(
      '/api/auth/oauth/github/exchange',
      { code }
    );
    return response.data;
  },

  /**
   * Get user's linked OAuth methods
   */
  getOAuthMethods: async (): Promise<{ success: boolean; data: ('google' | 'github' | 'microsoft')[] }> => {
    const response = await apiClient.get<{ success: boolean; data: ('google' | 'github' | 'microsoft')[] }>(
      '/api/auth/oauth/methods'
    );
    return response.data;
  },

  /**
   * Complete login with MFA verification
   */
  loginWithMfa: async (
    code: string,
    method: 'TOTP' | 'EMAIL',
    isBackupCode?: boolean
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login/mfa', {
      code,
      method,
      isBackupCode: isBackupCode || false,
    });
    return response.data;
  },
};

