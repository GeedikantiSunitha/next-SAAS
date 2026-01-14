/**
 * Checkout Component Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as paymentHooks from '../../hooks/usePayments';

// Mock Stripe - must use factory function
vi.mock('@stripe/react-stripe-js', () => {
  const mockConfirmCardPayment = vi.fn().mockResolvedValue({
    paymentIntent: { status: 'succeeded' },
    error: null,
  });

  const mockGetElement = vi.fn().mockReturnValue({});

  return {
    Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardElement: () => <div data-testid="card-element">Card Element</div>,
    useStripe: () => ({
      confirmCardPayment: mockConfirmCardPayment,
    }), // Return truthy object so stripe check passes
    useElements: () => ({
      getElement: mockGetElement,
    }),
  };
});

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({
    confirmCardPayment: vi.fn(),
  }),
}));

// Mock hooks - Fix: Create mock mutation object (similar to Issue #4)
const mockCreatePaymentMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  reset: vi.fn(),
};

vi.mock('../../hooks/usePayments', () => ({
  useCreatePayment: vi.fn(() => mockCreatePaymentMutation),
}));

// Import component after mocks
const { Checkout } = await import('../../components/Checkout');

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

describe('Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock mutation object properties
    vi.mocked(paymentHooks.useCreatePayment).mockReturnValue(mockCreatePaymentMutation);
    mockCreatePaymentMutation.mutate.mockClear();
    mockCreatePaymentMutation.mutateAsync.mockClear();
    mockCreatePaymentMutation.isPending = false;
    mockCreatePaymentMutation.isError = false;
    mockCreatePaymentMutation.isSuccess = false;
    mockCreatePaymentMutation.error = null;
    mockCreatePaymentMutation.data = null;
  });

  it('should render checkout form', () => {
    // Default mocks are already set in beforeEach
    render(<Checkout />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument();
  });

  it('should show validation error for invalid amount', async () => {
    const user = userEvent.setup();

    render(<Checkout />, { wrapper: createWrapper() });

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
    const form = amountInput.closest('form') as HTMLFormElement;

    // Type invalid amount (0)
    await user.type(amountInput, '0');
    
    // Submit form using fireEvent to ensure react-hook-form validation runs
    fireEvent.submit(form);

    // Wait for validation error to appear
    // Input component renders error with test ID "amount-error" (based on input id="amount")
    await waitFor(() => {
      const errorElement = screen.getByTestId('amount-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(/amount must be greater than 0/i);
    }, { timeout: 3000 });
    
    // Also verify input has error styling
    expect(amountInput).toHaveClass('border-destructive');
  });

  it('should submit payment form', async () => {
    const user = userEvent.setup();
    
    // Mock mutateAsync to return payment data
    mockCreatePaymentMutation.mutateAsync.mockResolvedValue({
      id: 'pay-1',
      clientSecret: 'pi_secret_123',
      amount: 10000,
      currency: 'USD',
    });

    render(<Checkout />, { wrapper: createWrapper() });

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: /pay/i });
      expect(button).not.toBeDisabled();
      return button;
    });

    await user.type(amountInput, '100');
    await user.click(submitButton);

    // Wait for mutateAsync to be called
    await waitFor(() => {
      expect(mockCreatePaymentMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000, // Should be converted to cents
          currency: 'USD',
          provider: 'STRIPE',
        })
      );
    }, { timeout: 3000 });
  });

  it('should show loading state during payment', () => {
    // Set isPending before rendering
    mockCreatePaymentMutation.isPending = true;

    render(<Checkout />, { wrapper: createWrapper() });

    // Button should show "Processing..." text when pending
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.textContent).toContain('Processing');
  });
});
