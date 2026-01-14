/**
 * NewsletterSubscription Component Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewsletterSubscription } from '../../components/NewsletterSubscription';
import * as newsletterHooks from '../../hooks/useNewsletter';

// Mock hooks - Fix: Create mock mutation objects that match React Query mutation structure
const mockSubscribeMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  reset: vi.fn(),
};

const mockSubscriptionQuery = {
  data: null,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

vi.mock('../../hooks/useNewsletter', () => ({
  useSubscribe: vi.fn(() => mockSubscribeMutation),
  useSubscription: vi.fn(() => mockSubscriptionQuery),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('NewsletterSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock mutation object properties
    vi.mocked(newsletterHooks.useSubscribe).mockReturnValue(mockSubscribeMutation);
    vi.mocked(newsletterHooks.useSubscription).mockReturnValue(mockSubscriptionQuery);
    // Reset mutation methods
    mockSubscribeMutation.mutate.mockClear();
    mockSubscribeMutation.mutateAsync.mockClear();
    mockSubscribeMutation.isPending = false;
    mockSubscribeMutation.isError = false;
    mockSubscribeMutation.isSuccess = false;
    mockSubscribeMutation.error = null;
    mockSubscribeMutation.data = null;
    // Reset query properties
    mockSubscriptionQuery.data = null;
    mockSubscriptionQuery.isLoading = false;
    mockSubscriptionQuery.isError = false;
    mockSubscriptionQuery.error = null;
  });

  it('should render subscription form', () => {
    // Default mocks are already set in beforeEach
    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const form = emailInput.closest('form') as HTMLFormElement;

    // Type invalid email
    await user.type(emailInput, 'invalid-email');
    
    // Submit form using fireEvent to ensure react-hook-form validation runs
    // When validation fails, onSubmit is NOT called, but errors are set
    fireEvent.submit(form);

    // Wait for validation error to appear
    // Input component renders error with test ID "email-error" (based on input id="email")
    await waitFor(() => {
      const errorElement = screen.getByTestId('email-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(/Please enter a valid email address/i);
    }, { timeout: 3000 });
    
    // Also verify input has error styling
    expect(emailInput).toHaveClass('border-destructive');
  });

  it('should show validation error for empty email', async () => {
    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const form = emailInput.closest('form') as HTMLFormElement;

    // Submit form without entering email - validation should fail
    fireEvent.submit(form);

    // Wait for validation error to appear
    // Input component renders error with test ID "email-error"
    await waitFor(() => {
      const errorElement = screen.getByTestId('email-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(/Please enter a valid email address/i);
    }, { timeout: 3000 });
  });

  it('should show current subscription status when subscribed', () => {
    // Set subscription data before rendering
    mockSubscriptionQuery.data = {
      id: 'sub-1',
      email: 'test@example.com',
      isActive: true,
    };
    mockSubscriptionQuery.isLoading = false;
    mockSubscriptionQuery.isError = false;

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    expect(screen.getByText(/subscribed to our newsletter/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should submit subscription form', async () => {
    const user = userEvent.setup();

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubscribeMutation.mutate).toHaveBeenCalledWith(
        'newuser@example.com',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });

  it('should show loading state during subscription', () => {
    // Set isPending before rendering
    mockSubscribeMutation.isPending = true;

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.textContent).toContain('Subscribing');
  });

  it('should handle subscription error', async () => {
    const user = userEvent.setup();

    render(<NewsletterSubscription />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubscribeMutation.mutate).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    }, { timeout: 3000 });
  });
});
