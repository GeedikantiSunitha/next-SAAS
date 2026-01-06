/**
 * Newsletter API Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import * as newsletterService from '../services/newsletterService';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import asyncHandler from '../utils/asyncHandler';
import { NewsletterStatus } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     summary: Subscribe to newsletter (public or authenticated)
 *     tags: [Newsletter]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       201:
 *         description: Successfully subscribed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post(
  '/subscribe',
  optionalAuth,
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id; // Optional - can subscribe without account

    const subscription = await newsletterService.subscribe(req.body.email, userId);

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Successfully subscribed to newsletter',
    });
  })
);

/**
 * @swagger
 * /api/newsletter/unsubscribe:
 *   post:
 *     summary: Unsubscribe from newsletter (public)
 *     tags: [Newsletter]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Unsubscribe token from email
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post(
  '/unsubscribe',
  [
    body('token').notEmpty().withMessage('Token is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const subscription = await newsletterService.unsubscribe(req.body.token);

    res.json({
      success: true,
      data: subscription,
      message: 'Successfully unsubscribed from newsletter',
    });
  })
);

/**
 * @swagger
 * /api/newsletter/subscription:
 *   get:
 *     summary: Get user's subscription (authenticated)
 *     tags: [Newsletter]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User subscription details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Subscription not found
 */
router.get(
  '/subscription',
  authenticate,
  asyncHandler(async (req, res) => {
    const subscription = await newsletterService.getUserSubscription(req.user!.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    return res.json({
      success: true,
      data: subscription,
    });
  })
);

// Admin routes - require authentication and admin role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /api/newsletter:
 *   post:
 *     summary: Create newsletter (admin only)
 *     tags: [Newsletter]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - subject
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional scheduled send time
 *     responses:
 *       201:
 *         description: Newsletter created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('scheduledAt').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const newsletter = await newsletterService.createNewsletter({
      title: req.body.title,
      subject: req.body.subject,
      content: req.body.content,
      createdBy: req.user!.id,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
    });

    return res.status(201).json({
      success: true,
      data: newsletter,
      message: 'Newsletter created successfully',
    });
  })
);

/**
 * @swagger
 * /api/newsletter:
 *   get:
 *     summary: Get all newsletters (admin only)
 *     tags: [Newsletter]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SCHEDULED, SENT, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of newsletters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = req.query.status as NewsletterStatus | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const newsletters = await newsletterService.getNewsletters({
      status,
      page,
      pageSize,
    });

    res.json({
      success: true,
      data: newsletters,
    });
  })
);

/**
 * @swagger
 * /api/newsletter/{id}:
 *   get:
 *     summary: Get newsletter by ID (admin only)
 *     tags: [Newsletter]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Newsletter ID
 *     responses:
 *       200:
 *         description: Newsletter details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Newsletter not found
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const newsletter = await newsletterService.getNewsletterById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter not found',
      });
    }

    return res.json({
      success: true,
      data: newsletter,
    });
  })
);

/**
 * @swagger
 * /api/newsletter/{id}:
 *   put:
 *     summary: Update newsletter (admin only)
 *     tags: [Newsletter]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Newsletter ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [DRAFT, SCHEDULED, SENT, CANCELLED]
 *     responses:
 *       200:
 *         description: Newsletter updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Newsletter not found
 */
router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('scheduledAt').optional().isISO8601().withMessage('Invalid date format'),
    body('status').optional().isIn(['DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED']).withMessage('Invalid status'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const newsletter = await newsletterService.updateNewsletter(req.params.id, {
      title: req.body.title,
      subject: req.body.subject,
      content: req.body.content,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      status: req.body.status,
    });

    return res.json({
      success: true,
      data: newsletter,
      message: 'Newsletter updated successfully',
    });
  })
);

/**
 * @swagger
 * /api/newsletter/{id}/send:
 *   post:
 *     summary: Send newsletter immediately (admin only)
 *     tags: [Newsletter]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Newsletter ID
 *     responses:
 *       200:
 *         description: Newsletter sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Newsletter sent to 150 subscribers"
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Newsletter not found
 */
router.post(
  '/:id/send',
  asyncHandler(async (req, res) => {
    const newsletter = await newsletterService.sendNewsletter(req.params.id);

    res.json({
      success: true,
      data: newsletter,
      message: `Newsletter sent to ${newsletter.sentCount} subscribers`,
    });
  })
);

/**
 * @swagger
 * /api/newsletter/{id}/schedule:
 *   post:
 *     summary: Schedule newsletter for later (admin only)
 *     tags: [Newsletter]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Newsletter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledAt
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: When to send the newsletter
 *     responses:
 *       200:
 *         description: Newsletter scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid scheduledAt date
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Newsletter not found
 */
router.post(
  '/:id/schedule',
  asyncHandler(async (req, res) => {
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'scheduledAt is required',
      });
    }

    const newsletter = await newsletterService.scheduleNewsletter(
      req.params.id,
      new Date(scheduledAt)
    );

    return res.json({
      success: true,
      data: newsletter,
      message: 'Newsletter scheduled successfully',
    });
  })
);

/**
 * @swagger
 * /api/newsletter/subscriptions:
 *   get:
 *     summary: Get all newsletter subscriptions (admin only)
 *     tags: [Newsletter]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/subscriptions',
  asyncHandler(async (req, res) => {
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 100;

    const subscriptions = await newsletterService.getSubscriptions({
      isActive,
      page,
      pageSize,
    });

    res.json({
      success: true,
      data: subscriptions,
    });
  })
);

export default router;
