import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi } from '../../api/auth';
import apiClient from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
              role: 'USER',
            },
            accessToken: 'token-123',
          },
        },
      };

      (apiClient.post as any).mockResolvedValueOnce(mockResponse);

      const result = await authApi.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(result.data.accessToken).toBe('token-123');
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              role: 'USER',
            },
            accessToken: 'token-123',
          },
        },
      };

      (apiClient.post as any).mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'Password123!',
      });
    });
  });

  describe('getMe', () => {
    it('should get current user', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              role: 'USER',
            },
          },
        },
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await authApi.getMe();

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      (apiClient.post as any).mockResolvedValueOnce({});

      await authApi.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'new-token',
          },
        },
      };

      (apiClient.post as any).mockResolvedValueOnce(mockResponse);

      const result = await authApi.refreshToken();

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('new-token');
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/auth/refresh',
        {},
        { withCredentials: true }
      );
    });
  });
});

