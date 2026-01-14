/**
 * Login Toast Notification Tests (TDD)
 * 
 * Tests for showing toast notification on successful login
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { Login } from '../../pages/Login';
import * as authApiModule from '../../api/auth';
import * as useAuthHook from '../../contexts/AuthContext';
import * as useToastHook from '../../hooks/use-toast';

// Mock dependencies
vi.mock('../../api/auth', async () => {
  const actual = await vi.importActual('../../api/auth');
  return {
    ...actual,
    authApi: {
      login: vi.fn(),
      loginWithMfa: vi.fn(),
    },
  };
});
vi.mock('../../contexts/AuthContext');
vi.mock('../../hooks/use-toast');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(
      BrowserRouter,
      null,
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
  };

  return Wrapper;
};

describe('Login Toast Notification', () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAuth
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      refreshUser: vi.fn(),
      user: null,
      loading: false,
    } as any);

    // Mock useToast
    vi.mocked(useToastHook.useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    } as any);

    // Mock navigate
    vi.doMock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
  });

  it('should show success toast on successful login without MFA', async () => {
    const user = userEvent.setup();
    const mockRefreshUser = vi.fn().mockResolvedValue(undefined);

    // Mock successful login response (no MFA)
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    };

    // The Login component calls authApi.login() directly, not useAuth().login()
    vi.mocked(authApiModule.authApi.login).mockResolvedValue({
      success: true,
      data: mockUser,
    } as any);

    // Mock refreshUser to resolve (component calls this after login)
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      refreshUser: mockRefreshUser,
      user: null,
      loading: false,
    } as any);

    render(<Login />, { wrapper: createWrapper() });

    // Fill form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');

    // Submit
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // Wait for authApi.login to be called (component calls this directly)
    await waitFor(() => {
      expect(authApiModule.authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      });
    });

    // Wait for refreshUser to be called (component calls this after successful login)
    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalled();
    });

    // Verify toast was called with success message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/success|welcome|logged in/i),
          variant: 'success',
        })
      );
    });
  });

  it('should show success toast on successful MFA login', async () => {
    const user = userEvent.setup();
    const mockRefreshUser = vi.fn();

    // Mock MFA required response
    vi.mocked(authApiModule.authApi.login).mockResolvedValue({
      success: true,
      data: {
        requiresMfa: true,
        mfaMethod: 'TOTP',
        user: { id: '1', email: 'test@example.com' },
      },
    } as any);

    // Mock MFA verification success
    vi.mocked(authApiModule.authApi.loginWithMfa).mockResolvedValue({
      success: true,
      data: { id: '1', email: 'test@example.com', name: 'Test User' },
    } as any);

    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      refreshUser: mockRefreshUser,
      user: null,
      loading: false,
    } as any);

    render(<Login />, { wrapper: createWrapper() });

    // Fill form and submit
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // Wait for MFA form to appear
    await waitFor(() => {
      expect(screen.getByText(/verification code/i)).toBeInTheDocument();
    });

    // Enter MFA code
    const mfaInput = screen.getByLabelText(/verification code/i);
    await user.type(mfaInput, '123456');

    // Submit MFA
    const verifyButton = screen.getByRole('button', { name: /verify|submit/i });
    await user.click(verifyButton);

    // Wait for MFA verification
    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalled();
    });

    // Verify toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/success|welcome|logged in/i),
          variant: 'success',
        })
      );
    });
  });

  it('should not show toast on login error', async () => {
    const user = userEvent.setup();

    // Mock login error
    vi.mocked(authApiModule.authApi.login).mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });

    render(<Login />, { wrapper: createWrapper() });

    // Fill form and submit
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    // Verify toast was NOT called for errors
    expect(mockToast).not.toHaveBeenCalled();
  });
});
