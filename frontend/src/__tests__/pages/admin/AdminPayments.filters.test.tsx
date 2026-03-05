/**
 * AdminPayments Filter Tests (TDD - Issue 4)
 *
 * Tests that status filter UI exists and getPayments is called with filter params.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AdminPayments } from '../../../pages/admin/AdminPayments';
import { adminApi } from '../../../api/admin';

vi.mock('../../../api/admin');
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('../../../components/admin/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockAdminApi = vi.mocked(adminApi);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/payments']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AdminPayments - Filters (Issue 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminApi.getPayments.mockResolvedValue({
      success: true,
      data: {
        payments: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    });
    mockAdminApi.getSubscriptions.mockResolvedValue({
      success: true,
      data: { subscriptions: [] },
    });
  });

  it('should have status filter UI', async () => {
    render(<AdminPayments />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockAdminApi.getPayments).toHaveBeenCalled();
    });

    const statusFilter = screen.getByTestId('payment-status-filter');
    expect(statusFilter).toBeInTheDocument();
  });

  it('should show Refund button for succeeded payments (Issue 5/17)', async () => {
    mockAdminApi.getPayments.mockResolvedValue({
      success: true,
      data: {
        payments: [
          {
            id: 'pay-1',
            amount: 10000,
            status: 'succeeded',
            user: { email: 'user@example.com' },
            createdAt: '2024-01-01',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    render(<AdminPayments />, { wrapper: createWrapper() });

    await screen.findByText('user@example.com');

    expect(screen.getByRole('button', { name: /refund/i })).toBeInTheDocument();
  });

  it('should call getPayments with status when filter is selected', async () => {
    const user = userEvent.setup();
    render(<AdminPayments />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockAdminApi.getPayments).toHaveBeenCalled();
    });

    mockAdminApi.getPayments.mockClear();

    const statusFilter = screen.getByTestId('payment-status-filter');
    await user.selectOptions(statusFilter, 'SUCCEEDED');

    await waitFor(() => {
      expect(mockAdminApi.getPayments).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SUCCEEDED' })
      );
    });
  });
});
