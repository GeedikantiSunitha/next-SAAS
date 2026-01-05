/**
 * Notification Hooks Tests (TDD)
 * 
 * Tests for React Query hooks for notifications
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdatePreferences,
} from '../../hooks/useNotifications';
import { notificationApi } from '../../api/notifications';

// Mock the notification API
vi.mock('../../api/notifications', () => ({
  notificationApi: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

// Mock toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notifications', async () => {
    const mockNotifications = [
      {
        id: '1',
        userId: 'user1',
        type: 'SYSTEM' as const,
        channel: 'IN_APP' as const,
        title: 'Test',
        message: 'Test message',
        status: 'SENT' as const,
        createdAt: '2025-01-05T00:00:00Z',
      },
    ];

    (notificationApi.getNotifications as any).mockResolvedValue({
      success: true,
      data: mockNotifications,
    });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(notificationApi.getNotifications).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockNotifications);
  });

  it('should fetch unread notifications only when option provided', async () => {
    const mockNotifications = [
      {
        id: '1',
        userId: 'user1',
        type: 'SYSTEM' as const,
        channel: 'IN_APP' as const,
        title: 'Unread',
        message: 'Unread message',
        status: 'SENT' as const,
        createdAt: '2025-01-05T00:00:00Z',
      },
    ];

    (notificationApi.getNotifications as any).mockResolvedValue({
      success: true,
      data: mockNotifications,
    });

    const { result } = renderHook(() => useNotifications({ unreadOnly: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(notificationApi.getNotifications).toHaveBeenCalledWith({ unreadOnly: true });
  });
});

describe('useUnreadCount', () => {
  it('should fetch unread count', async () => {
    (notificationApi.getUnreadCount as any).mockResolvedValue({
      success: true,
      data: { count: 5 },
    });

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(notificationApi.getUnreadCount).toHaveBeenCalled();
    expect(result.current.data).toBe(5);
  });
});

describe('useMarkAsRead', () => {
  it('should mark notification as read', async () => {
    const mockNotification = {
      id: '1',
      userId: 'user1',
      type: 'SYSTEM' as const,
      channel: 'IN_APP' as const,
      title: 'Test',
      message: 'Test message',
      status: 'READ' as const,
      readAt: '2025-01-05T00:00:00Z',
      createdAt: '2025-01-05T00:00:00Z',
    };

    (notificationApi.markAsRead as any).mockResolvedValue({
      success: true,
      data: mockNotification,
    });

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(notificationApi.markAsRead).toHaveBeenCalledWith('1');
  });
});

describe('useMarkAllAsRead', () => {
  it('should mark all notifications as read', async () => {
    (notificationApi.markAllAsRead as any).mockResolvedValue({
      success: true,
      data: { count: 3 },
    });

    const { result } = renderHook(() => useMarkAllAsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(notificationApi.markAllAsRead).toHaveBeenCalled();
  });
});

describe('useDeleteNotification', () => {
  it('should delete notification', async () => {
    (notificationApi.deleteNotification as any).mockResolvedValue({
      success: true,
      message: 'Notification deleted',
    });

    const { result } = renderHook(() => useDeleteNotification(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(notificationApi.deleteNotification).toHaveBeenCalledWith('1');
  });
});

describe('useNotificationPreferences', () => {
  it('should fetch preferences', async () => {
    const mockPreferences = {
      id: '1',
      userId: 'user1',
      emailEnabled: true,
      inAppEnabled: true,
      smsEnabled: false,
      createdAt: '2025-01-05T00:00:00Z',
      updatedAt: '2025-01-05T00:00:00Z',
    };

    (notificationApi.getPreferences as any).mockResolvedValue({
      success: true,
      data: mockPreferences,
    });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(notificationApi.getPreferences).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockPreferences);
  });
});

describe('useUpdatePreferences', () => {
  it('should update preferences', async () => {
    const mockPreferences = {
      id: '1',
      userId: 'user1',
      emailEnabled: false,
      inAppEnabled: true,
      smsEnabled: false,
      createdAt: '2025-01-05T00:00:00Z',
      updatedAt: '2025-01-05T00:00:00Z',
    };

    (notificationApi.updatePreferences as any).mockResolvedValue({
      success: true,
      data: mockPreferences,
    });

    const { result } = renderHook(() => useUpdatePreferences(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ emailEnabled: false, inAppEnabled: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(notificationApi.updatePreferences).toHaveBeenCalledWith({
      emailEnabled: false,
      inAppEnabled: true,
    });
  });
});
