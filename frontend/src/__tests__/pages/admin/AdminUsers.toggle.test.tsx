/**
 * AdminUsers Toggle Active Status Tests (TDD)
 * 
 * Tests to verify disable/enable user functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminUsers } from '../../../pages/admin/AdminUsers';
import { adminApi } from '../../../api/admin';
import { useAuth } from '../../../contexts/AuthContext';

// Mock dependencies
vi.mock('../../../api/admin');
vi.mock('../../../contexts/AuthContext');
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('../../../components/admin/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockAdminApi = vi.mocked(adminApi);
const mockUseAuth = vi.mocked(useAuth);

describe('AdminUsers - Toggle Active Status', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1', role: 'ADMIN' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    mockAdminApi.getUsers.mockResolvedValue({
      success: true,
      data: {
        users: [
          {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
            isActive: true,
            createdAt: '2024-01-01',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    // Setup default toggleUserActive mock
    mockAdminApi.toggleUserActive = vi.fn().mockResolvedValue({
      success: true,
      data: { user: { id: 'user-1', isActive: false } },
    });
  });

  it('should show toggle button for each user', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsers />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    // Should have disable button for active user
    expect(screen.getByText(/disable/i)).toBeInTheDocument();
  });

  it('should call toggleUserActive when disable button is clicked', async () => {
    const user = userEvent.setup();
    
    // Ensure mock is set up (already done in beforeEach, but make sure it's fresh)
    mockAdminApi.toggleUserActive.mockClear();
    mockAdminApi.toggleUserActive.mockResolvedValue({
      success: true,
      data: { user: { id: 'user-1', isActive: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsers />
      </QueryClientProvider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    // Wait for disable button to be available
    const disableButton = await waitFor(() => {
      const button = screen.getByText(/disable/i);
      expect(button).toBeInTheDocument();
      return button;
    });

    // Click disable button - this will show a confirmation dialog
    await user.click(disableButton);

    // Wait for confirmation dialog and confirm
    await waitFor(() => {
      // The component uses window.confirm, which we need to mock
      // But since we can't easily mock window.confirm in this test,
      // we need to check if the mutation was called after confirmation
      // Actually, let's check if the button click triggers the confirm
    });

    // Since window.confirm is used, we need to mock it to return true
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    try {
      // Click again after mocking confirm
      await user.click(disableButton);

      // Wait for mutation to be called
      await waitFor(() => {
        expect(mockAdminApi.toggleUserActive).toHaveBeenCalledWith('user-1', false);
      }, { timeout: 3000 });
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it('should show enable button for inactive users', async () => {
    mockAdminApi.getUsers.mockResolvedValue({
      success: true,
      data: {
        users: [
          {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
            isActive: false,
            createdAt: '2024-01-01',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsers />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/enable/i)).toBeInTheDocument();
    });
  });
});
