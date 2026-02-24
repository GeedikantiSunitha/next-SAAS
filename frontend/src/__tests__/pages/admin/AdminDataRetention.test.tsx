import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDataRetention } from '../../../pages/admin/AdminDataRetention';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as adminApi from '../../../api/admin';
import * as useToastHook from '../../../hooks/use-toast';

// Mock admin API
vi.mock('../../../api/admin', () => ({
  adminApi: {
    enforceRetentionPolicies: vi.fn(),
    placeUserOnLegalHold: vi.fn(),
    releaseUserFromLegalHold: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../../../hooks/use-toast');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderAdminDataRetention = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AdminDataRetention />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminDataRetention', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    // Mock window.confirm to always return true
    vi.stubGlobal('confirm', vi.fn(() => true));

    // Mock useToast
    vi.mocked(useToastHook.useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render data retention page', () => {
    renderAdminDataRetention();

    // Use getByRole to target the page heading specifically (sidebar also has "Data Retention" link)
    expect(screen.getByRole('heading', { name: 'Data Retention', level: 1 })).toBeInTheDocument();
  });

  it('should display page description', () => {
    renderAdminDataRetention();

    expect(screen.getByText(/Manage GDPR-compliant data retention policies/i)).toBeInTheDocument();
  });

  it('should have enforce retention button', () => {
    renderAdminDataRetention();

    const button = screen.getByRole('button', { name: /enforce retention policies/i });
    expect(button).toBeInTheDocument();
  });

  it('should call enforceRetentionPolicies when button clicked', async () => {
    (adminApi.adminApi.enforceRetentionPolicies as any).mockResolvedValue({
      success: true,
      data: {
        inactiveUsersAnonymized: 5,
        deletedUsersPurged: 3,
        expiredSessionsDeleted: 10,
        notificationsDeleted: 20,
        exportRequestsDeleted: 2,
        auditLogsArchived: 100,
        executedAt: new Date().toISOString(),
      },
    });

    renderAdminDataRetention();

    const button = screen.getByRole('button', { name: /enforce retention policies/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(adminApi.adminApi.enforceRetentionPolicies).toHaveBeenCalled();
    });
  });

  it('should display success message after enforcement', async () => {
    (adminApi.adminApi.enforceRetentionPolicies as any).mockResolvedValue({
      success: true,
      data: {
        inactiveUsersAnonymized: 5,
        deletedUsersPurged: 3,
        expiredSessionsDeleted: 10,
        notificationsDeleted: 20,
        exportRequestsDeleted: 2,
        auditLogsArchived: 100,
        executedAt: new Date().toISOString(),
      },
    });

    renderAdminDataRetention();

    const button = screen.getByRole('button', { name: /enforce retention policies/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          description: 'Retention policies enforced successfully',
        })
      );
    });
  });

  it('should display enforcement results', async () => {
    (adminApi.adminApi.enforceRetentionPolicies as any).mockResolvedValue({
      success: true,
      data: {
        inactiveUsersAnonymized: 5,
        deletedUsersPurged: 3,
        expiredSessionsDeleted: 10,
        notificationsDeleted: 20,
        exportRequestsDeleted: 2,
        auditLogsArchived: 100,
        executedAt: new Date().toISOString(),
      },
    });

    renderAdminDataRetention();

    const button = screen.getByRole('button', { name: /enforce retention policies/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/5.*inactive users anonymized/i)).toBeInTheDocument();
      expect(screen.getByText(/3.*deleted users purged/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during enforcement', async () => {
    (adminApi.adminApi.enforceRetentionPolicies as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderAdminDataRetention();

    const button = screen.getByRole('button', { name: /enforce retention policies/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('should display error message on enforcement failure', async () => {
    (adminApi.adminApi.enforceRetentionPolicies as any).mockRejectedValue(
      new Error('Failed to enforce policies')
    );

    renderAdminDataRetention();

    const button = screen.getByRole('button', { name: /enforce retention policies/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Failed to enforce retention policies',
          variant: 'destructive',
        })
      );
    });
  });

  it('should display retention policy information', () => {
    renderAdminDataRetention();

    expect(screen.getByText('Inactive Users')).toBeInTheDocument();
    expect(screen.getByText(/anonymized after 3 years/i)).toBeInTheDocument();
    expect(screen.getByText('Deleted Users')).toBeInTheDocument();
    expect(screen.getByText(/permanently removed after 30 days/i)).toBeInTheDocument();
  });

  it('should have legal hold section', () => {
    renderAdminDataRetention();

    expect(screen.getByRole('heading', { name: /legal hold/i })).toBeInTheDocument();
    expect(screen.getByText(/users on legal hold are exempt/i)).toBeInTheDocument();
  });
});
