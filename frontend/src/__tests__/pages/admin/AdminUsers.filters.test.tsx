/**
 * AdminUsers Filter Persistence Tests (TDD - Issue 2)
 *
 * Tests that role filter syncs with URL search params and persists on refresh.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AdminUsers } from '../../../pages/admin/AdminUsers';
import { adminApi } from '../../../api/admin';
import { useAuth } from '../../../contexts/AuthContext';

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

// Wrapper to expose current URL search for assertions
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
};

const createWrapper = (initialEntries: string[] = ['/admin/users']) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AdminUsers - Filter Persistence (Issue 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1', role: 'SUPER_ADMIN' },
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
            oauthProvider: null,
            emailVerified: true,
            createdAt: '2024-01-01',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });
  });

  it('should initialize roleFilter from URL search params on mount', async () => {
    render(<AdminUsers />, {
      wrapper: createWrapper(['/admin/users?role=ADMIN']),
    });

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    const roleSelect = screen.getByTestId('role-filter');
    expect(roleSelect).toHaveValue('ADMIN');
  });

  it('should update URL when role filter changes', async () => {
    const user = userEvent.setup();
    render(<AdminUsers />, { wrapper: createWrapper(['/admin/users']) });

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    const roleSelect = screen.getByTestId('role-filter');
    await user.selectOptions(roleSelect, 'ADMIN');

    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('role=ADMIN');
    });
  });
});
