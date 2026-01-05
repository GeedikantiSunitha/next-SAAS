/**
 * Notification Item Component Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationItem } from '../../components/NotificationItem';
import { Notification } from '../../api/notifications';
import { useMarkAsRead, useDeleteNotification } from '../../hooks/useNotifications';

// Mock the hooks
vi.mock('../../hooks/useNotifications', () => ({
  useMarkAsRead: vi.fn(),
  useDeleteNotification: vi.fn(),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

const mockNotification: Notification = {
  id: '1',
  userId: 'user1',
  type: 'SYSTEM',
  channel: 'IN_APP',
  title: 'Test Notification',
  message: 'This is a test notification',
  status: 'SENT',
  createdAt: '2025-01-05T00:00:00Z',
  updatedAt: '2025-01-05T00:00:00Z',
};

describe('NotificationItem', () => {
  const mockMarkAsRead = vi.fn();
  const mockDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMarkAsRead as any).mockReturnValue({
      mutate: mockMarkAsRead,
      isPending: false,
    });
    (useDeleteNotification as any).mockReturnValue({
      mutate: mockDelete,
      isPending: false,
    });
  });

  it('should render notification details', () => {
    render(<NotificationItem notification={mockNotification} />);

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('should show unread indicator for unread notifications', () => {
    render(<NotificationItem notification={mockNotification} />);

    expect(screen.getByTestId('unread-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('mark-as-read-button')).toBeInTheDocument();
  });

  it('should not show unread indicator for read notifications', () => {
    const readNotification: Notification = {
      ...mockNotification,
      status: 'READ',
      readAt: '2025-01-05T01:00:00Z',
    };

    render(<NotificationItem notification={readNotification} />);

    expect(screen.queryByTestId('unread-indicator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mark-as-read-button')).not.toBeInTheDocument();
  });

  it('should call markAsRead when mark as read button is clicked', () => {
    render(<NotificationItem notification={mockNotification} />);

    const markAsReadButton = screen.getByTestId('mark-as-read-button');
    markAsReadButton.click();

    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('should call delete when delete button is clicked', () => {
    render(<NotificationItem notification={mockNotification} />);

    const deleteButton = screen.getByTestId('delete-button');
    deleteButton.click();

    expect(mockDelete).toHaveBeenCalledWith('1');
  });

  it('should disable buttons when mutation is pending', () => {
    (useMarkAsRead as any).mockReturnValue({
      mutate: mockMarkAsRead,
      isPending: true,
    });
    (useDeleteNotification as any).mockReturnValue({
      mutate: mockDelete,
      isPending: true,
    });

    render(<NotificationItem notification={mockNotification} />);

    const markAsReadButton = screen.getByTestId('mark-as-read-button');
    const deleteButton = screen.getByTestId('delete-button');

    expect(markAsReadButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('should display notification type and channel', () => {
    render(<NotificationItem notification={mockNotification} />);

    expect(screen.getByText(/system/i)).toBeInTheDocument();
    expect(screen.getByText(/in app/i)).toBeInTheDocument();
  });
});
