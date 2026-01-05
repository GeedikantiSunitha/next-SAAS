/**
 * Payment History Component Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentHistory } from '../../components/PaymentHistory';
import * as paymentHooks from '../../hooks/usePayments';

// Mock hooks
vi.mock('../../hooks/usePayments', () => ({
  usePayments: vi.fn(),
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

describe('PaymentHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    vi.mocked(paymentHooks.usePayments).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<PaymentHistory />, { wrapper: createWrapper() });

    // Check for loading spinner (Loader2 component)
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('should show error state', () => {
    vi.mocked(paymentHooks.usePayments).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    render(<PaymentHistory />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load payment history/i)).toBeInTheDocument();
  });

  it('should show empty state', () => {
    vi.mocked(paymentHooks.usePayments).mockReturnValue({
      data: {
        payments: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
      isLoading: false,
      error: null,
    } as any);

    render(<PaymentHistory />, { wrapper: createWrapper() });

    expect(screen.getByText(/no payments found/i)).toBeInTheDocument();
  });

  it('should display payment list', () => {
    const mockPayments = {
      payments: [
        {
          id: 'pay-1',
          amount: 100.0,
          currency: 'USD' as const,
          status: 'SUCCEEDED' as const,
          description: 'Test payment',
          createdAt: '2024-01-01T00:00:00Z',
          providerPaymentId: 'pi_123',
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    vi.mocked(paymentHooks.usePayments).mockReturnValue({
      data: mockPayments,
      isLoading: false,
      error: null,
    } as any);

    render(<PaymentHistory />, { wrapper: createWrapper() });

    expect(screen.getByText(/test payment/i)).toBeInTheDocument();
    expect(screen.getByText(/usd 100.00/i)).toBeInTheDocument();
    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
  });
});
