import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as authApi from '../../../api/auth';

// Mock auth API
vi.mock('../../../api/auth', () => ({
  authApi: {
    logout: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderAdminLayout = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render admin panel header', () => {
    renderAdminLayout();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    renderAdminLayout();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render children content', () => {
    renderAdminLayout();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    renderAdminLayout();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should render user dashboard link', () => {
    renderAdminLayout();
    expect(screen.getByText('User Dashboard')).toBeInTheDocument();
  });
});

