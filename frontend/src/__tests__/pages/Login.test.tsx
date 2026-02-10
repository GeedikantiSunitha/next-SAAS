import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from '../../pages/Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth';

// Mock auth API (not the context - let the real context work)
vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Create test wrapper with QueryClientProvider for React Query hooks
// Fix: Login page uses Layout which uses Header which uses NotificationBell (needs QueryClientProvider)
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authApi methods - cookie-based auth returns user only (no accessToken in body)
    (authApi.login as any).mockResolvedValue({
      success: true,
      data: { id: '1', email: 'test@example.com', role: 'USER' }, // User object directly, no accessToken
    });
    (authApi.getMe as any).mockRejectedValue(new Error('Not authenticated'));
  });

  it('should render login form', () => {
    render(<Login />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn();
    (authApi.login as any).mockImplementation(mockLogin);

    render(<Login />, { wrapper: createWrapper() });

    // Wait for AuthProvider to finish initializing
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const form = emailInput.closest('form') as HTMLFormElement;

    // Type invalid email
    await user.type(emailInput, 'invalid-email');
    
    // Submit form - react-hook-form validates on submit
    // When validation fails, onSubmit is NOT called, but errors are set
    fireEvent.submit(form);

    // Verify that login was NOT called (validation prevented submission)
    expect(mockLogin).not.toHaveBeenCalled();

    // Wait for validation error to appear
    // Input component now generates unique test IDs based on input name (e.g., "email-error")
    await waitFor(() => {
      const errorMessage = screen.getByTestId('email-error');
      expect(errorMessage).toHaveTextContent('Invalid email address');
    }, { timeout: 3000 });
    
    // Also verify input has error styling
    expect(emailInput).toHaveClass('border-destructive');
  });

  it('should validate password is required', async () => {
    const user = userEvent.setup();
    render(<Login />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should call login on form submit', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com', role: 'USER' },
        accessToken: 'token',
      },
    });
    (authApi.login as any).mockImplementation(mockLogin);

    render(<Login />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'Password123!' });
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });
    (authApi.login as any).mockImplementation(mockLogin);

    render(<Login />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(/invalid credentials/i);
    }, { timeout: 3000 });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    (authApi.login as any).mockReturnValue(loginPromise);

    render(<Login />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    // Button should be disabled while submitting
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise
    resolveLogin!({
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com', role: 'USER' },
        accessToken: 'token',
      },
    });
  });

  it('should navigate to dashboard on successful login', async () => {
    const user = userEvent.setup();
    render(<Login />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    // Wait for async login to complete and navigate to be called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    }, { timeout: 5000 });
    
    // Verify navigate was called (Login component calls it explicitly in onSubmit)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
