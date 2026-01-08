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
import { Checkout } from '../../../components/Checkout';
import { useCreatePayment } from '../../../hooks/usePayments';
import { useToast } from '../../../hooks/use-toast';

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

// Mock hooks
vi.mock('../../../hooks/usePayments', () => ({
  useCreatePayment: vi.fn(),
}));

vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Checkout - Stripe Payment Initiation', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockCreatePayment = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useCreatePayment as any).mockReturnValue(mockCreatePayment);
  });

  it('should render payment form with amount, currency, and card fields', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Checkout />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/card details/i)).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });

  it('should convert amount to cents when submitting payment', async () => {
    mockCreatePayment.mutateAsync.mockResolvedValue({
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

    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.type(amountInput, '100.50');

    const submitButton = screen.getByRole('button', { name: /pay/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePayment.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10050, // Should be converted to cents
          currency: 'USD',
          provider: 'STRIPE',
        })
      );
    });
  });

  it('should show processing state during payment', async () => {
    mockCreatePayment.mutateAsync.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 'payment-123', clientSecret: 'pi_test' }), 100))
    );
    mockCreatePayment.isPending = true;

    render(
      <QueryClientProvider client={queryClient}>
        <Checkout />
      </QueryClientProvider>
    );

    const submitButton = screen.getByRole('button', { name: /pay/i });
    expect(submitButton).toBeDisabled();
  });
});
