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
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter (public or authenticated)
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
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter (public)
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
 * GET /api/newsletter/subscription
 * Get user's subscription (authenticated)
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
 * POST /api/newsletter
 * Create newsletter (admin only)
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
 * GET /api/newsletter
 * Get all newsletters (admin only)
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
 * GET /api/newsletter/:id
 * Get newsletter by ID (admin only)
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
 * PUT /api/newsletter/:id
 * Update newsletter (admin only)
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
 * POST /api/newsletter/:id/send
 * Send newsletter (admin only)
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
 * POST /api/newsletter/:id/schedule
 * Schedule newsletter (admin only)
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
 * GET /api/newsletter/subscriptions
 * Get all subscriptions (admin only)
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
