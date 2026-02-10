/**
 * Checkout Component - Stripe Payment Tests (TDD)
 * 
 * Tests to verify Stripe payment initiation works correctly
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
// Fix: Corrected import paths - from src/__tests__/components, use ../../ to reach src/
// Previously was ../../../ which went to frontend/ (one level too high)
import { Checkout } from '../../components/Checkout';
import { useCreatePayment } from '../../hooks/usePayments';
import { useToast } from '../../hooks/use-toast';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(),
    confirmCardPayment: vi.fn(),
  })),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
    }),
  }),
  useElements: () => ({
    getElement: vi.fn(() => ({})),
  }),
}));

// Mock hooks - Fix: Use correct path and proper mock setup
const mockCreatePaymentMutation = {
  mutateAsync: vi.fn(),
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  reset: vi.fn(),
};

const mockCapturePaymentMutation = {
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  reset: vi.fn(),
};

vi.mock('../../hooks/usePayments', () => ({
  useCreatePayment: vi.fn(() => mockCreatePaymentMutation),
  useCapturePayment: vi.fn(() => mockCapturePaymentMutation),
}));

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Checkout - Stripe Payment Initiation', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to return the mutation object
    vi.mocked(useCreatePayment).mockReturnValue(mockCreatePaymentMutation);
    // Reset mutation mock properties
    mockCreatePaymentMutation.mutateAsync.mockClear();
    mockCreatePaymentMutation.mutate.mockClear();
    mockCreatePaymentMutation.isPending = false;
    mockCreatePaymentMutation.isError = false;
    mockCreatePaymentMutation.isSuccess = false;
    mockCreatePaymentMutation.error = null;
    mockCreatePaymentMutation.data = null;
  });

  it('should render payment form with amount, currency, and card fields', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Checkout />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    // Currency is a select element, find by label
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    // Card Details label is not associated with input, so use getByText instead
    expect(screen.getByText(/card details/i)).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });

  it('should convert amount to cents when submitting payment', async () => {
    mockCreatePaymentMutation.mutateAsync.mockResolvedValue({
      id: 'payment-123',
      clientSecret: 'pi_test_secret',
      amount: 10000, // $100.00 in cents
      currency: 'USD',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Checkout />
      </QueryClientProvider>
    );

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    const user = userEvent.setup();
    await user.type(amountInput, '100.50');

    // Wait for button to be available and enabled
    const submitButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: /pay/i });
      expect(button).not.toBeDisabled();
      return button;
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePaymentMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10050, // Should be converted to cents
          currency: 'USD',
          provider: 'STRIPE',
        })
      );
    });
  });

  it('should show processing state during payment', async () => {
    // Set isPending BEFORE rendering so component sees it
    mockCreatePaymentMutation.isPending = true;
    mockCreatePaymentMutation.mutateAsync.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 'payment-123', clientSecret: 'pi_test' }), 100))
    );

    render(
      <QueryClientProvider client={queryClient}>
        <Checkout />
      </QueryClientProvider>
    );

    // Wait for button to render, even if disabled
    const submitButton = await waitFor(() => {
      // Button text might be "Pay " or "Processing..." when pending
      const button = screen.getByRole('button', { name: /pay|processing/i });
      return button;
    });
    
    expect(submitButton).toBeDisabled();
  });
});
