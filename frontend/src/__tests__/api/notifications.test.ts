/**
 * Notification API Service Tests (TDD)
 * 
 * Tests for the notification API service functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationApi } from '../../api/notifications';
import apiClient from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('notificationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch all notifications', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'SYSTEM',
          channel: 'IN_APP',
          title: 'Test Notification',
          message: 'This is a test',
          status: 'SENT',
          createdAt: '2025-01-05T00:00:00Z',
        },
      ];

      (apiClient.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockNotifications,
        },
      });

      const result = await notificationApi.getNotifications();

      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications', {});
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNotifications);
    });

    it('should fetch unread notifications only', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'SYSTEM',
          channel: 'IN_APP',
          title: 'Unread Notification',
          message: 'This is unread',
          status: 'SENT',
          createdAt: '2025-01-05T00:00:00Z',
        },
      ];

      (apiClient.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockNotifications,
        },
      });

      const result = await notificationApi.getNotifications({ unreadOnly: true });

      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications', {
        params: { unreadOnly: 'true' },
      });
      expect(result.data).toEqual(mockNotifications);
    });

    it('should fetch notifications with pagination', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'SYSTEM',
          channel: 'IN_APP',
          title: 'Notification 1',
          message: 'Message 1',
          status: 'SENT',
          createdAt: '2025-01-05T00:00:00Z',
        },
      ];

      (apiClient.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockNotifications,
        },
      });

      const result = await notificationApi.getNotifications({
        limit: 10,
        offset: 20,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications', {
        params: { limit: 10, offset: 20 },
      });
      expect(result.data).toEqual(mockNotifications);
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch unread notification count', async () => {
      (apiClient.get as any).mockResolvedValue({
        data: {
          success: true,
          data: { count: 5 },
        },
      });

      const result = await notificationApi.getUnreadCount();

      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications/unread-count');
      expect(result.success).toBe(true);
      expect(result.data.count).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockNotification = {
        id: '1',
        userId: 'user1',
        type: 'SYSTEM',
        channel: 'IN_APP',
        title: 'Test',
        message: 'Test message',
        status: 'READ',
        readAt: '2025-01-05T00:00:00Z',
        createdAt: '2025-01-05T00:00:00Z',
      };

      (apiClient.put as any).mockResolvedValue({
        data: {
          success: true,
          data: mockNotification,
        },
      });

      const result = await notificationApi.markAsRead('1');

      expect(apiClient.put).toHaveBeenCalledWith('/api/notifications/1/read');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNotification);
      expect(result.data.status).toBe('READ');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      (apiClient.put as any).mockResolvedValue({
        data: {
          success: true,
          data: { count: 3 },
        },
      });

      const result = await notificationApi.markAllAsRead();

      expect(apiClient.put).toHaveBeenCalledWith('/api/notifications/read-all');
      expect(result.success).toBe(true);
      expect(result.data.count).toBe(3);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      (apiClient.delete as any).mockResolvedValue({
        data: {
          success: true,
          message: 'Notification deleted',
        },
      });

      const result = await notificationApi.deleteNotification('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/notifications/1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Notification deleted');
    });
  });

  describe('getPreferences', () => {
    it('should fetch user notification preferences', async () => {
      const mockPreferences = {
        id: '1',
        userId: 'user1',
        emailEnabled: true,
        inAppEnabled: true,
        smsEnabled: false,
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      };

      (apiClient.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockPreferences,
        },
      });

      const result = await notificationApi.getPreferences();

      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications/preferences');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
    });
  });

  describe('updatePreferences', () => {
    it('should update user notification preferences', async () => {
      const mockPreferences = {
        id: '1',
        userId: 'user1',
        emailEnabled: false,
        inAppEnabled: true,
        smsEnabled: false,
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      };

      (apiClient.put as any).mockResolvedValue({
        data: {
          success: true,
          data: mockPreferences,
        },
      });

      const result = await notificationApi.updatePreferences({
        emailEnabled: false,
        inAppEnabled: true,
      });

      expect(apiClient.put).toHaveBeenCalledWith('/api/notifications/preferences', {
        emailEnabled: false,
        inAppEnabled: true,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
    });
  });
});
