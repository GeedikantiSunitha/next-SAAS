/**
 * Notifications End-to-End Integration Tests (TDD)
 * 
 * Comprehensive E2E tests for complete notification flows:
 * 1. View notifications
 * 2. Mark as read
 * 3. Mark all as read
 * 4. Delete notification
 * 5. Update preferences
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../../config/database';
import { createTestUserWithPassword } from '../utils/testUsers';
import { findCookie } from '../utils/cookies';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import authRoutes from '../../routes/auth';
import notificationRoutes from '../../routes/notifications';
import * as notificationService from '../../services/notificationService';
import { NotificationType, NotificationChannel } from '@prisma/client';

// Prisma schema uses: INFO, SUCCESS, WARNING, ERROR (not SYSTEM, PAYMENT)
// Use INFO as default type for tests

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

describe('Notifications E2E Integration Tests', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;
  let accessTokenCookie: string;

  beforeEach(async () => {
    // ⚠️ IMPORTANT: Clean up in correct order (child tables before parent tables)
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    userEmail = `notif-e2e-${Date.now()}@example.com`;
    userPassword = 'Password123!';
    testUser = await createTestUserWithPassword(userEmail, userPassword);

    // ⚠️ IMPORTANT: Clean up any existing sessions before login
    await prisma.session.deleteMany({ where: { userId: testUser.id } });

    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: userPassword,
      })
      .expect(200);

    const accessToken = findCookie(loginResponse.headers, 'accessToken');
    accessTokenCookie = `accessToken=${accessToken}`;
  });

  afterEach(async () => {
    // Same order as beforeEach
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('E2E: View Notifications', () => {
    it('should fetch user notifications', async () => {
      // Create test notifications
      await notificationService.createNotification({
        userId: testUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Test Notification 1',
        message: 'This is a test notification',
      });

      await notificationService.createNotification({
        userId: testUser.id,
        type: 'SUCCESS' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Test Notification 2',
        message: 'Payment received',
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].title).toBe('Test Notification 2'); // Most recent first
    });

    it('should fetch unread count', async () => {
      // Create unread notifications
      await notificationService.createNotification({
        userId: testUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Unread Notification',
        message: 'This is unread',
      });

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(1);
    });

    it('should filter unread notifications only', async () => {
      // Create both read and unread notifications
      const notification1 = await notificationService.createNotification({
        userId: testUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Unread Notification',
        message: 'This is unread',
      });

      const notification2 = await notificationService.createNotification({
        userId: testUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Read Notification',
        message: 'This is read',
      });

      // Mark one as read
      await notificationService.markAsRead(notification2.id, testUser.id);

      const response = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(notification1.id);
    });
  });

  describe('E2E: Mark as Read', () => {
    it('should mark notification as read', async () => {
      const notification = await notificationService.createNotification({
        userId: testUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Test Notification',
        message: 'This is a test',
      });

      const response = await request(app)
        .put(`/api/notifications/${notification.id}/read`)
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('READ');
      expect(response.body.data.readAt).toBeDefined();

      // Verify in database
      const updated = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(updated?.status).toBe('READ');
    });

    it('should mark all notifications as read', async () => {
      // Create multiple notifications
      await notificationService.createNotification({
        userId: testUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Notification 1',
        message: 'Message 1',
      });

      await notificationService.createNotification({
        userId: testUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Notification 2',
        message: 'Message 2',
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2);

      // Verify all are read
      const notifications = await prisma.notification.findMany({
        where: { userId: testUser.id },
      });
      expect(notifications.every((n) => n.status === 'READ')).toBe(true);
    });
  });

  describe('E2E: Delete Notification', () => {
    it('should delete notification', async () => {
      const notification = await notificationService.createNotification({
        userId: testUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Test Notification',
        message: 'This will be deleted',
      });

      const response = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted/i);

      // Verify deleted from database
      const deleted = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('E2E: Notification Preferences', () => {
    it('should fetch notification preferences', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emailEnabled).toBeDefined();
      expect(response.body.data.inAppEnabled).toBeDefined();
      expect(response.body.data.smsEnabled).toBeDefined();
    });

    it('should update notification preferences', async () => {
      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Cookie', accessTokenCookie)
        .send({
          emailEnabled: false,
          inAppEnabled: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emailEnabled).toBe(false);
      expect(response.body.data.inAppEnabled).toBe(true);

      // Verify in database
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId: testUser.id },
      });
      expect(preferences?.emailEnabled).toBe(false);
      expect(preferences?.inAppEnabled).toBe(true);
    });
  });

  describe('E2E: Authorization', () => {
    it('should not allow accessing another user\'s notifications', async () => {
      // Create another user
      const otherUser = await createTestUserWithPassword(
        `other-${Date.now()}@example.com`,
        'Password123!'
      );

      // Create notification for other user
      const notification = await notificationService.createNotification({
        userId: otherUser.id,
        type: 'INFO' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: 'Other User Notification',
        message: 'This belongs to another user',
      });

      // Try to mark it as read (should fail)
      const response = await request(app)
        .put(`/api/notifications/${notification.id}/read`)
        .set('Cookie', accessTokenCookie)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toMatch(/forbidden|permission|another user|cannot/i);
    });
  });
});
