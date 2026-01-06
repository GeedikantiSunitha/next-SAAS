/**
 * Payment API Routes
 */

import { Router } from 'express';
import * as paymentService from '../services/paymentService';
import { authenticate, requireRole } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import { PaymentStatus } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - provider
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100.00
 *               currency:
 *                 type: string
 *                 example: USD
 *               provider:
 *                 type: string
 *                 enum: [STRIPE, RAZORPAY, CASHFREE]
 *                 note: CASHFREE support coming soon
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payment = await paymentService.createPayment({
      ...req.body,
      userId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  })
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get user's payments
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as PaymentStatus | undefined;

    const result = await paymentService.getUserPayments(
      req.user!.id,
      page,
      pageSize,
      status
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Payment not found
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await paymentService.getPayment(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: payment,
    });
  })
);

/**
 * @swagger
 * /api/payments/{id}/capture:
 *   post:
 *     summary: Capture a payment
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to capture (optional, defaults to full amount)
 *     responses:
 *       200:
 *         description: Payment captured successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid request
 */
router.post(
  '/:id/capture',
  asyncHandler(async (req, res) => {
    const { amount } = req.body;

    const payment = await paymentService.capturePayment(
      req.params.id,
      req.user!.id,
      amount
    );

    res.json({
      success: true,
      data: payment,
      message: 'Payment captured successfully',
    });
  })
);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Refund amount (optional, defaults to full amount)
 *               reason:
 *                 type: string
 *                 description: Refund reason
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Payment not found
 */
router.post(
  '/:id/refund',
  asyncHandler(async (req, res) => {
    const refund = await paymentService.refundPayment({
      paymentId: req.params.id,
      userId: req.user!.id,
      ...req.body,
    });

    res.json({
      success: true,
      data: refund,
      message: 'Payment refunded successfully',
    });
  })
);

/**
 * @swagger
 * /api/payments/webhook/{provider}:
 *   post:
 *     summary: Handle payment webhooks from providers
 *     tags: [Payments]
 *     security: []
 *     description: This endpoint receives webhooks from payment providers (Stripe, Razorpay, Cashfree). Authentication is handled via webhook signatures.
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stripe, razorpay, cashfree]
 *         description: Payment provider name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Webhook payload from payment provider
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid webhook signature or payload
 */
router.post(
  '/webhook/:provider',
  asyncHandler(async (req, res) => {
    const provider = req.params.provider.toUpperCase() as any;
    let signature = req.headers['stripe-signature'] ||
                    req.headers['x-razorpay-signature'] ||
                    req.headers['x-cashfree-signature'];
    
    // Handle array or string
    if (Array.isArray(signature)) {
      signature = signature[0];
    }

    const result = await paymentService.handleWebhook(
      provider,
      req.body,
      (signature as string) || ''
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/payments/admin/all:
 *   get:
 *     summary: Get all payments (admin only)
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *     responses:
 *       200:
 *         description: List of all payments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/admin/all',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req, res) => {
    // This would need a separate service function to get all payments
    res.json({
      success: true,
      message: 'Admin payment listing - implement as needed',
    });
  })
);

export default router;

