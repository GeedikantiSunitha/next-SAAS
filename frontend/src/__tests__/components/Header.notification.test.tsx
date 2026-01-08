/**
 * Header Component - Notification Bell Tests (TDD)
 * 
 * Tests to verify notification bell icon appears in header
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { notificationApi } from '../../api/notifications';

// Mock notification API
vi.mock('../../../api/notifications', () => ({
  notificationApi: {
    getUnreadCount: vi.fn(),
  },
}));

// Mock useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('Header - Notification Bell Icon', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show notification bell icon when user is authenticated', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Header isAuthenticated={true} userEmail="test@example.com" />
      </QueryClientProvider>
    );

    // Should have bell icon
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('should not show notification bell when user is not authenticated', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Header isAuthenticated={false} />
      </QueryClientProvider>
    );

    // Should not have bell icon
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
  });

  it('should show unread count badge when there are unread notifications', async () => {
    const { useQuery } = await import('@tanstack/react-query');
    (useQuery as any).mockReturnValue({
      data: { unreadCount: 5 },
      isLoading: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Header isAuthenticated={true} userEmail="test@example.com" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should not show badge when unread count is 0', async () => {
    const { useQuery } = await import('@tanstack/react-query');
    (useQuery as any).mockReturnValue({
      data: { unreadCount: 0 },
      isLoading: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Header isAuthenticated={true} userEmail="test@example.com" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
