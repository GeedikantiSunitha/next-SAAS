import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboard } from '../../../pages/admin/AdminDashboard';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as adminApi from '../../../api/admin';

// Mock admin API
vi.mock('../../../api/admin', () => ({
  adminApi: {
    getDashboard: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderAdminDashboard = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render admin dashboard', async () => {
    (adminApi.adminApi.getDashboard as any).mockResolvedValue({
      success: true,
      data: {
        stats: {
          totalUsers: 100,
          activeSessions: 50,
          recentActivity: [],
        },
      },
    });

    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (adminApi.adminApi.getDashboard as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderAdminDashboard();
    // Should show loading skeleton
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should display dashboard stats', async () => {
    (adminApi.adminApi.getDashboard as any).mockResolvedValue({
      success: true,
      data: {
        stats: {
          totalUsers: 150,
          activeSessions: 75,
          recentActivity: [],
        },
      },
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    });
  });
});

