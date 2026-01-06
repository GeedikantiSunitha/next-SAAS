import { Router } from 'express';
import * as notificationService from '../services/notificationService';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread notifications
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of notifications to skip
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { unreadOnly, limit, offset } = req.query;

    const notifications = await notificationService.getUserNotifications(
      req.user!.id,
      {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      }
    );

    return res.json({
      success: true,
      data: notifications,
    });
  })
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 count: 5
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user!.id);

    return res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a notification
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - channel
 *               - title
 *               - message
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INFO, WARNING, ERROR, SUCCESS]
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, IN_APP, SMS]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *                 description: Additional notification data
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { type, channel, title, message, data } = req.body;

    const notification = await notificationService.createNotification({
      userId: req.user!.id,
      type,
      channel,
      title,
      message,
      data,
    });

    return res.status(201).json({
      success: true,
      data: notification,
    });
  })
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Notification not found
 */
router.put(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user!.id
    );

    return res.json({
      success: true,
      data: notification,
    });
  })
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 count: 10
 */
router.put(
  '/read-all',
  asyncHandler(async (req, res) => {
    const count = await notificationService.markAllAsRead(req.user!.id);

    return res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(
      req.params.id,
      req.user!.id
    );

    return res.json({
      success: true,
      message: 'Notification deleted',
    });
  })
);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User notification preferences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  '/preferences',
  asyncHandler(async (req, res) => {
    const preferences = await notificationService.getUserPreferences(
      req.user!.id
    );

    return res.json({
      success: true,
      data: preferences,
    });
  })
);

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               inAppEnabled:
 *                 type: boolean
 *               smsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put(
  '/preferences',
  asyncHandler(async (req, res) => {
    const preferences = await notificationService.updateUserPreferences(
      req.user!.id,
      req.body
    );

    return res.json({
      success: true,
      data: preferences,
    });
  })
);

export default router;

