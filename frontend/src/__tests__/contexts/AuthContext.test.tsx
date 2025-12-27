import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth';
import { STORAGE_KEYS } from '../../lib/constants';

// Mock the auth API
vi.mock('../../api/auth', () => ({
  authApi: {
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Test component that uses auth
const TestComponent = () => {
  const { user, loading, isAuthenticated, login, register, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('test@example.com', 'password', 'Test')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initialization - Cookie-based Auth', () => {
    it('should initialize with null user when no cookie', async () => {
      (authApi.getMe as any).mockRejectedValue(new Error('No token'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 3000 });
    });

    it('should load user from cookie on mount (NOT localStorage)', async () => {
      // Verify localStorage is NOT checked
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      
      (authApi.getMe as any).mockResolvedValue({
        success: true,
        data: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'USER',
        },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      }, { timeout: 3000 });

      // Verify localStorage.getItem was NOT called for accessToken
      expect(getItemSpy).not.toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    });

    it('should NOT use localStorage token if getMe fails', async () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      (authApi.getMe as any).mockRejectedValue(new Error('Invalid token'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 3000 });

      // Should NOT try to remove from localStorage (cookies handled by backend)
      expect(removeItemSpy).not.toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    });
  });

  describe('Login - Cookie-based Auth', () => {
    it('should login user and NOT store token in localStorage', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      (authApi.login as any).mockResolvedValue({
        success: true,
        data: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'USER',
          },
        // Note: accessToken NOT in response (set as cookie by backend)
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const loginButton = screen.getByText('Login');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(authApi.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
      }, { timeout: 3000 });

      // Verify localStorage.setItem was NOT called for accessToken
      expect(setItemSpy).not.toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, expect.any(String));
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    });
  });

  describe('Register - Cookie-based Auth', () => {
    it('should register user and NOT store token in localStorage', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      // Register returns user only (token set as cookie by backend)
      (authApi.register as any).mockResolvedValue({
        success: true,
        data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test',
            role: 'USER',
          },
      });

      // After register, auto-login is called (also sets cookie, not localStorage)
      (authApi.login as any).mockResolvedValue({
        success: true,
        data: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'USER',
        },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const registerButton = screen.getByText('Register');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(authApi.register).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password', name: 'Test' });
      }, { timeout: 3000 });

      // Verify localStorage.setItem was NOT called for accessToken
      expect(setItemSpy).not.toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, expect.any(String));
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    });
  });

  describe('Logout - Cookie-based Auth', () => {
    it('should logout user and NOT clear localStorage (cookies cleared by backend)', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

      (authApi.getMe as any).mockResolvedValue({
        success: true,
        data: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'USER',
        },
      });
      (authApi.logout as any).mockResolvedValue({});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(authApi.logout).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Verify localStorage.removeItem was NOT called (cookies handled by backend)
      expect(removeItemSpy).not.toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    });
  });
});

