/**
 * OAuth Utility Functions Tests (TDD)
 * 
 * Tests for OAuth token retrieval functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initiateGoogleOAuth,
  getGoogleTokenFromCallback,
  initiateGitHubOAuth,
  getGitHubCodeFromCallback,
  initiateMicrosoftOAuth,
  getMicrosoftTokenFromCallback,
  initiateOAuth,
} from '../../utils/oauth';

describe('OAuth Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock sessionStorage
    const mockSessionStorage = {
      storage: {} as Record<string, string>,
      setItem: vi.fn((key: string, value: string) => {
        mockSessionStorage.storage[key] = value;
      }),
      getItem: vi.fn((key: string) => mockSessionStorage.storage[key] || null),
      removeItem: vi.fn((key: string) => {
        delete mockSessionStorage.storage[key];
      }),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initiateGoogleOAuth', () => {
    it('should throw error if Google Client ID is not configured', () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');

      expect(() => initiateGoogleOAuth()).toThrow('Google Client ID not configured');
    });

    it('should redirect to Google OAuth URL with correct parameters', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');

      initiateGoogleOAuth();

      expect(mockLocation.href).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(mockLocation.href).toContain('client_id=test-google-client-id');
      expect(mockLocation.href).toContain('response_type=token');
      expect(mockLocation.href).toContain('scope=openid+email+profile');
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'google_oauth_state',
        expect.any(String)
      );
    });
  });

  describe('getGoogleTokenFromCallback', () => {
    it('should extract token from URL fragment', () => {
      const mockLocation = {
        hash: '#access_token=test-token&state=test-state&token_type=Bearer',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      // Set state in sessionStorage
      (window.sessionStorage as any).storage['google_oauth_state'] = 'test-state';

      const result = getGoogleTokenFromCallback();

      expect(result).toEqual({
        token: 'test-token',
        provider: 'google',
      });
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('google_oauth_state');
    });

    it('should throw error if state does not match', () => {
      const mockLocation = {
        hash: '#access_token=test-token&state=wrong-state',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      (window.sessionStorage as any).storage['google_oauth_state'] = 'correct-state';

      expect(() => getGoogleTokenFromCallback()).toThrow('Invalid OAuth state');
    });

    it('should throw error if OAuth error is present', () => {
      const mockLocation = {
        hash: '#error=access_denied&error_description=User+cancelled',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      expect(() => getGoogleTokenFromCallback()).toThrow('Google OAuth error: access_denied');
    });

    it('should return null if no token is present', () => {
      const mockLocation = {
        hash: '#state=test-state',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      (window.sessionStorage as any).storage['google_oauth_state'] = 'test-state';

      const result = getGoogleTokenFromCallback();

      expect(result).toBeNull();
    });
  });

  describe('initiateGitHubOAuth', () => {
    it('should throw error if GitHub Client ID is not configured', () => {
      vi.stubEnv('VITE_GITHUB_CLIENT_ID', '');

      expect(() => initiateGitHubOAuth()).toThrow('GitHub Client ID not configured');
    });

    it('should redirect to GitHub OAuth URL with correct parameters', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      vi.stubEnv('VITE_GITHUB_CLIENT_ID', 'test-github-client-id');

      initiateGitHubOAuth();

      expect(mockLocation.href).toContain('github.com/login/oauth/authorize');
      expect(mockLocation.href).toContain('client_id=test-github-client-id');
      expect(mockLocation.href).toContain('scope=user'); // URL encoded as user%3Aemail
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'github_oauth_state',
        expect.any(String)
      );
    });
  });

  describe('getGitHubCodeFromCallback', () => {
    it('should extract code from URL query parameters', () => {
      const mockLocation = {
        search: '?code=test-code&state=test-state',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      (window.sessionStorage as any).storage['github_oauth_state'] = 'test-state';

      const result = getGitHubCodeFromCallback();

      expect(result).toEqual({
        code: 'test-code',
        state: 'test-state',
      });
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('github_oauth_state');
    });

    it('should throw error if state does not match', () => {
      const mockLocation = {
        search: '?code=test-code&state=wrong-state',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      (window.sessionStorage as any).storage['github_oauth_state'] = 'correct-state';

      expect(() => getGitHubCodeFromCallback()).toThrow('Invalid OAuth state');
    });

    it('should throw error if OAuth error is present', () => {
      const mockLocation = {
        search: '?error=access_denied&error_description=User+cancelled',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      expect(() => getGitHubCodeFromCallback()).toThrow('GitHub OAuth error: access_denied');
    });
  });

  describe('initiateMicrosoftOAuth', () => {
    it('should throw error if Microsoft Client ID is not configured', () => {
      vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', '');

      expect(() => initiateMicrosoftOAuth()).toThrow('Microsoft Client ID not configured');
    });

    it('should redirect to Microsoft OAuth URL with correct parameters', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'test-microsoft-client-id');
      vi.stubEnv('VITE_MICROSOFT_TENANT_ID', 'test-tenant-id');

      initiateMicrosoftOAuth();

      expect(mockLocation.href).toContain('login.microsoftonline.com');
      expect(mockLocation.href).toContain('test-tenant-id');
      expect(mockLocation.href).toContain('client_id=test-microsoft-client-id');
      expect(mockLocation.href).toContain('response_type=token');
      expect(mockLocation.href).toContain('scope=openid+profile+email');
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'microsoft_oauth_state',
        expect.any(String)
      );
    });

    it('should use common tenant if tenant ID is not configured', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'test-microsoft-client-id');
      vi.stubEnv('VITE_MICROSOFT_TENANT_ID', '');

      initiateMicrosoftOAuth();

      expect(mockLocation.href).toContain('/common/oauth2/v2.0/authorize');
    });
  });

  describe('getMicrosoftTokenFromCallback', () => {
    it('should extract token from URL fragment', () => {
      const mockLocation = {
        hash: '#access_token=test-token&state=test-state&token_type=Bearer',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      (window.sessionStorage as any).storage['microsoft_oauth_state'] = 'test-state';

      const result = getMicrosoftTokenFromCallback();

      expect(result).toEqual({
        token: 'test-token',
        provider: 'microsoft',
      });
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('microsoft_oauth_state');
    });
  });

  describe('initiateOAuth', () => {
    it('should call initiateGoogleOAuth for google provider', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');

      initiateOAuth('google');

      expect(mockLocation.href).toContain('accounts.google.com');
    });

    it('should call initiateGitHubOAuth for github provider', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      vi.stubEnv('VITE_GITHUB_CLIENT_ID', 'test-client-id');

      initiateOAuth('github');

      expect(mockLocation.href).toContain('github.com');
    });

    it('should call initiateMicrosoftOAuth for microsoft provider', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'test-client-id');

      initiateOAuth('microsoft');

      expect(mockLocation.href).toContain('login.microsoftonline.com');
    });

    it('should throw error for unsupported provider', () => {
      expect(() => initiateOAuth('unsupported' as any)).toThrow('Unsupported OAuth provider');
    });
  });
});
