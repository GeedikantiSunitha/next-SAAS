/**
 * Checkout Component Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

// Mock hooks
vi.mock('../../hooks/usePayments', () => ({
  useCreatePayment: vi.fn(),
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
  const mockUseCreatePayment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentHooks.useCreatePayment).mockReturnValue(mockUseCreatePayment as any);
  });

  it('should render checkout form', () => {
    mockUseCreatePayment.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
    });

    render(<Checkout />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument();
  });

  it('should show validation error for invalid amount', async () => {
    const user = userEvent.setup();

    mockUseCreatePayment.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
    });

    render(<Checkout />, { wrapper: createWrapper() });

    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /pay/i });

    await user.type(amountInput, '0');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
    });
  });

  it('should submit payment form', async () => {
    const user = userEvent.setup();
    const mockMutateAsync = vi.fn().mockResolvedValue({
      id: 'pay-1',
      clientSecret: 'pi_secret_123',
    });

    mockUseCreatePayment.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
    });

    render(<Checkout />, { wrapper: createWrapper() });

    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /pay/i });

    await user.type(amountInput, '100');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  it('should show loading state during payment', () => {
    mockUseCreatePayment.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
      isError: false,
    });

    render(<Checkout />, { wrapper: createWrapper() });

    // Button should show "Processing..." text when pending
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Processing');
  });
});
