/**
 * Header Component - Notification Bell Tests (TDD)
 * 
 * Tests to verify notification bell icon appears in header
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useUnreadCount } from '../../hooks/useNotifications';

// Mock notification hooks
vi.mock('../../hooks/useNotifications', () => ({
  useUnreadCount: vi.fn(),
  useNotifications: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

describe('Header - Notification Bell Icon', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUnreadCount as any).mockReturnValue({
      data: 0,
      isLoading: false,
    });
  });

  it('should show notification bell icon when user is authenticated', () => {
    renderWithProviders(
      <Header isAuthenticated={true} userEmail="test@example.com" />
    );

    // Should have bell icon
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('should not show notification bell when user is not authenticated', () => {
    renderWithProviders(
      <Header isAuthenticated={false} />
    );

    // Should not have bell icon
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
  });

  it('should show unread count badge when there are unread notifications', async () => {
    (useUnreadCount as any).mockReturnValue({
      data: 5,
      isLoading: false,
    });

    renderWithProviders(
      <Header isAuthenticated={true} userEmail="test@example.com" />
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should not show badge when unread count is 0', async () => {
    (useUnreadCount as any).mockReturnValue({
      data: 0,
      isLoading: false,
    });

    renderWithProviders(
      <Header isAuthenticated={true} userEmail="test@example.com" />
    );

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
