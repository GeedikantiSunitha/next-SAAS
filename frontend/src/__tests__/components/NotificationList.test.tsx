/**
 * Notification List Component Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationList } from '../../components/NotificationList';
import { useNotifications, useMarkAllAsRead } from '../../hooks/useNotifications';
import { Notification } from '../../api/notifications';

// Mock the hooks
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  useMarkAllAsRead: vi.fn(),
}));

// Mock NotificationItem
vi.mock('../../components/NotificationItem', () => ({
  NotificationItem: ({ notification }: { notification: Notification }) => (
    <div data-testid={`notification-item-${notification.id}`}>
      {notification.title}
    </div>
  ),
}));

const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'INFO',
    channel: 'IN_APP',
    title: 'Notification 1',
    message: 'Message 1',
    status: 'SENT',
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user1',
    type: 'SUCCESS',
    channel: 'IN_APP',
    title: 'Notification 2',
    message: 'Message 2',
    status: 'READ',
    readAt: '2025-01-05T01:00:00Z',
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T01:00:00Z',
  },
];

describe('NotificationList', () => {
  const mockMarkAllAsRead = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMarkAllAsRead as any).mockReturnValue({
      mutate: mockMarkAllAsRead,
      isPending: false,
    });
  });

  it('should render loading state', () => {
    (useNotifications as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<NotificationList />);

    expect(screen.getByTestId('notifications-loading')).toBeInTheDocument();
  });

  it('should render empty state when no notifications', () => {
    (useNotifications as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<NotificationList />);

    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('should render list of notifications', () => {
    (useNotifications as any).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    });

    render(<NotificationList />);

    expect(screen.getByTestId('notification-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-2')).toBeInTheDocument();
  });

  it('should show mark all as read button when there are unread notifications', () => {
    (useNotifications as any).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    });

    render(<NotificationList />);

    const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
    expect(markAllButton).toBeInTheDocument();
  });

  it('should call markAllAsRead when button is clicked', () => {
    (useNotifications as any).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    });

    render(<NotificationList />);

    const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
    markAllButton.click();

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('should disable mark all as read button when mutation is pending', () => {
    (useNotifications as any).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    });
    (useMarkAllAsRead as any).mockReturnValue({
      mutate: mockMarkAllAsRead,
      isPending: true,
    });

    render(<NotificationList />);

    const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
    expect(markAllButton).toBeDisabled();
  });

  it('should render error state', () => {
    (useNotifications as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to load notifications' },
    });

    render(<NotificationList />);

    expect(screen.getByText(/error loading notifications/i)).toBeInTheDocument();
  });

  it('should filter unread notifications when unreadOnly is true', () => {
    // When unreadOnly is true, hook should return only unread notifications
    const unreadOnly = [mockNotifications[0]]; // Only the unread one
    (useNotifications as any).mockReturnValue({
      data: unreadOnly,
      isLoading: false,
      error: null,
    });

    render(<NotificationList unreadOnly={true} />);

    // Should only show unread notification
    expect(screen.getByTestId('notification-item-1')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-item-2')).not.toBeInTheDocument();
  });
});
