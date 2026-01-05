/**
 * Notification Hooks
 * 
 * React Query hooks for notification operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, type Notification, type NotificationPreferences } from '../api/notifications';
import { useToast } from './use-toast';

/**
 * Query keys for React Query
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters?: { unreadOnly?: boolean }) => [...notificationKeys.lists(), filters] as const,
  detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

/**
 * Hook to fetch user notifications
 */
export const useNotifications = (options?: { unreadOnly?: boolean; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: notificationKeys.list(options),
    queryFn: async () => {
      const response = await notificationApi.getNotifications(options);
      return response.data;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
};

/**
 * Hook to fetch unread notification count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      return response.data.count;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook to mark notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationApi.markAsRead(notificationId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await notificationApi.markAllAsRead();
      return response.data.count;
    },
    onSuccess: (count) => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      toast({
        title: 'Success',
        description: `Marked ${count} notification${count !== 1 ? 's' : ''} as read`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to delete notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await notificationApi.deleteNotification(notificationId);
      return notificationId;
    },
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete notification',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to fetch notification preferences
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: async () => {
      const response = await notificationApi.getPreferences();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

/**
 * Hook to update notification preferences
 */
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: { emailEnabled?: boolean; inAppEnabled?: boolean; smsEnabled?: boolean }) => {
      const response = await notificationApi.updatePreferences(preferences);
      return response.data;
    },
    onSuccess: (data) => {
      // Update cache with new preferences
      queryClient.setQueryData<NotificationPreferences>(notificationKeys.preferences(), data);
      toast({
        title: 'Success',
        description: 'Notification preferences updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update preferences',
        variant: 'destructive',
      });
    },
  });
};
