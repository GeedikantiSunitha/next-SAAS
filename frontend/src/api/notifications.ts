/**
 * Notification API Service
 * 
 * API client for notification endpoints
 */

import apiClient from './client';

/**
 * Notification types from backend (matches Prisma schema)
 */
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type NotificationChannel = 'EMAIL' | 'IN_APP' | 'SMS';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  data?: Record<string, any>;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Notification preferences interface
 */
export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get notifications request options
 */
export interface GetNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Update preferences request
 */
export interface UpdatePreferencesRequest {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  smsEnabled?: boolean;
}

/**
 * API Response types
 */
export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
}

export interface MarkAllAsReadResponse {
  success: boolean;
  data: { count: number };
}

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}

export interface PreferencesResponse {
  success: boolean;
  data: NotificationPreferences;
}

/**
 * Notification API client
 */
export const notificationApi = {
  /**
   * Get user notifications
   */
  getNotifications: async (options?: GetNotificationsOptions): Promise<NotificationsResponse> => {
    const params: Record<string, string | number> = {};
    
    if (options?.unreadOnly) {
      params.unreadOnly = 'true';
    }
    if (options?.limit !== undefined) {
      params.limit = options.limit;
    }
    if (options?.offset !== undefined) {
      params.offset = options.offset;
    }

    // Only include params in request if there are any
    const config = Object.keys(params).length > 0 ? { params } : {};
    const response = await apiClient.get<NotificationsResponse>('/api/notifications', config);
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get<UnreadCountResponse>('/api/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    const response = await apiClient.put<NotificationResponse>(
      `/api/notifications/${notificationId}/read`
    );
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<MarkAllAsReadResponse> => {
    const response = await apiClient.put<MarkAllAsReadResponse>('/api/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string): Promise<DeleteNotificationResponse> => {
    const response = await apiClient.delete<DeleteNotificationResponse>(
      `/api/notifications/${notificationId}`
    );
    return response.data;
  },

  /**
   * Get user notification preferences
   */
  getPreferences: async (): Promise<PreferencesResponse> => {
    const response = await apiClient.get<PreferencesResponse>('/api/notifications/preferences');
    return response.data;
  },

  /**
   * Update user notification preferences
   */
  updatePreferences: async (
    preferences: UpdatePreferencesRequest
  ): Promise<PreferencesResponse> => {
    const response = await apiClient.put<PreferencesResponse>(
      '/api/notifications/preferences',
      preferences
    );
    return response.data;
  },
};
