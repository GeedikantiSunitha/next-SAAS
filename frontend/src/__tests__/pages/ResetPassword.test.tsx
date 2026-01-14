import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResetPassword } from '../../pages/ResetPassword';
import { authApi } from '../../api/auth';
import { useToast } from '../../hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: vi.fn(),
  };
});

// Mock authApi
vi.mock('../../api/auth', () => ({
  authApi: {
    resetPassword: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../../hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock PasswordStrengthIndicator
vi.mock('../../components/PasswordStrengthIndicator', () => ({
  PasswordStrengthIndicator: () => <div data-testid="password-strength-indicator">Password Strength</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderResetPassword = (token: string | null = 'test-token-123') => {
  vi.mocked(useSearchParams).mockReturnValue([
    {
      get: (key: string) => (key === 'token' ? token : null),
    } as URLSearchParams,
    vi.fn(),
  ]);

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ResetPassword />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render reset password form when token is present', () => {
    renderResetPassword('test-token-123');

    // Use heading selector to get the h1, not the button
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('should redirect to forgot-password if token is missing', async () => {
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    });

    renderResetPassword(null);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Invalid Link',
        description: 'Password reset link is invalid or missing token.',
        variant: 'error', // Fix: Updated to match implementation (component uses 'error', not 'destructive')
      });
      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });
  });

  it('should show validation error for password mismatch', async () => {
    const user = userEvent.setup();
    renderResetPassword('test-token-123');

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should show password strength indicator when password is entered', async () => {
    const user = userEvent.setup();
    renderResetPassword('test-token-123');

    const passwordInput = screen.getByLabelText(/new password/i);
    await user.type(passwordInput, 'Password123!');

    expect(screen.getByTestId('password-strength-indicator')).toBeInTheDocument();
  });

  it('should call resetPassword API on form submit', async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.mocked(authApi.resetPassword).mockResolvedValue({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });

    renderResetPassword('test-token-123');

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test-token-123', 'NewPassword123!');
    });
  });

  it('should display success toast and redirect to login after successful reset', async () => {
    const user = userEvent.setup();
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    });

    vi.mocked(authApi.resetPassword).mockResolvedValue({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });

    renderResetPassword('test-token-123');

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Password reset successfully. You can now login with your new password.',
      });
    }, { timeout: 3000 });

    // Wait for redirect (setTimeout in component)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });
  });

  it('should display error toast on API failure', async () => {
    const user = userEvent.setup();
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    });

    vi.mocked(authApi.resetPassword).mockRejectedValue({
      response: {
        data: {
          error: 'Invalid or expired reset token',
        },
      },
    });

    renderResetPassword('test-token-123');

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Invalid or expired reset token',
        variant: 'error', // Fix: Updated to match implementation (component uses 'error', not 'destructive')
      });
    });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.resetPassword).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Success' }), 100))
    );

    renderResetPassword('test-token-123');

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/resetting/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should have link to login page', () => {
    renderResetPassword('test-token-123');

    const loginLink = screen.getByRole('link', { name: /back to login/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

