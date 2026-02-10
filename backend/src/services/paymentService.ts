/**
 * Payment Service
 * 
 * Unified payment service that works with any provider
 */

import { prisma } from '../config/database';
import { PaymentProviderFactory } from '../providers/PaymentProviderFactory';
import { CreatePaymentParams, PaymentProviderType, RefundPaymentParams } from '../types/payment';
import { PaymentStatus, PaymentProvider, Currency } from '@prisma/client';
import logger from '../utils/logger';
import { AppError, NotFoundError } from '../utils/errors';
import { createAuditLog } from './auditService';
import { createNotification } from './notificationService';

/**
 * Create a new payment with the configured payment provider
 * 
 * @description
 * Creates a payment intent with the active payment provider (Stripe, Razorpay, or Cashfree)
 * and stores the payment record in the database. Supports multiple payment providers
 * through a unified interface. Creates audit logs for compliance.
 * 
 * @param {CreatePaymentParams} params - Payment creation parameters
 * @param {string} params.userId - ID of the user making the payment
 * @param {number} params.amount - Payment amount (in smallest currency unit, e.g., cents)
 * @param {string} params.currency - Currency code (USD, INR, etc.)
 * @param {PaymentProviderType} [params.provider] - Override default provider (optional)
 * @param {string} [params.description] - Payment description
 * @param {string} [params.paymentMethod] - Payment method type
 * @param {Object} [params.metadata] - Additional metadata
 * 
 * @returns {Promise<Object>} Payment object with clientSecret for frontend
 * @returns {string} clientSecret - Client secret for payment confirmation (Stripe)
 * @returns {string} providerPaymentId - Provider's payment ID
 * @returns {PaymentStatus} status - Payment status (PENDING, COMPLETED, etc.)
 * 
 * @throws {AppError} If payment creation fails
 * 
 * @example
 * ```typescript
 * const payment = await createPayment({
 *   userId: 'user-123',
 *   amount: 10000, // $100.00 in cents
 *   currency: 'USD',
 *   description: 'Premium subscription',
 *   provider: 'STRIPE'
 * });
 * ```
 */
export const createPayment = async (params: CreatePaymentParams & { provider?: PaymentProviderType }) => {
  try {
    // Get the configured payment provider (Stripe, Razorpay, or Cashfree)
    const provider = PaymentProviderFactory.getProvider();
    
    // Create payment intent with provider (returns clientSecret for frontend)
    const paymentIntent = await provider.createPayment(params);

    // Store payment record in database for tracking and audit
    const payment = await prisma.payment.create({
      data: {
        userId: params.userId,
        provider: (params.provider || provider.name) as PaymentProvider,
        providerPaymentId: paymentIntent.providerPaymentId,
        amount: params.amount,
        currency: params.currency as Currency,
        status: mapProviderStatus(paymentIntent.status),
        paymentMethod: params.paymentMethod,
        description: params.description,
        metadata: paymentIntent.metadata || params.metadata,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: params.userId,
      action: 'PAYMENT_CREATED',
      resource: 'payments',
      resourceId: payment.id,
      details: {
        amount: params.amount,
        currency: params.currency,
        provider: provider.name,
      },
    });

    // Create notification for payment creation
    try {
      const amountFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: params.currency,
        minimumFractionDigits: 2,
      }).format(Number(params.amount) / 100);

      const paymentInitiatedMessage = `A payment of ${amountFormatted} has been initiated.`;
      await createNotification({
        userId: params.userId,
        type: 'INFO',
        channel: 'IN_APP',
        title: 'Payment Initiated',
        message: paymentInitiatedMessage,
        data: {
          action: 'PAYMENT_CREATED',
          paymentId: payment.id,
          amount: params.amount,
          currency: params.currency,
          timestamp: new Date().toISOString(),
        },
      });
      await createNotification({
        userId: params.userId,
        type: 'INFO',
        channel: 'EMAIL',
        title: 'Payment Initiated',
        message: paymentInitiatedMessage,
        data: {
          action: 'PAYMENT_CREATED',
          paymentId: payment.id,
          amount: params.amount,
          currency: params.currency,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      // Log error but don't fail payment creation
      logger.warn('Failed to create payment notification', {
        userId: params.userId,
        paymentId: payment.id,
        error: error.message,
      });
    }

    logger.info('Payment created', {
      paymentId: payment.id,
      userId: params.userId,
      amount: params.amount,
      provider: provider.name,
    });

    return {
      ...payment,
      clientSecret: paymentIntent.clientSecret,
    };
  } catch (error: any) {
    logger.error('Payment creation failed', {
      error: error.message,
      userId: params.userId,
    });
    throw new AppError(`Payment creation failed: ${error.message}`, 500);
  }
};

/**
 * Capture/confirm a pending payment
 * 
 * @description
 * Captures a previously created payment intent. This finalizes the payment
 * and transfers funds from the customer to the merchant. Only pending payments
 * can be captured. Creates audit logs for compliance.
 * 
 * @param {string} paymentId - ID of the payment to capture
 * @param {string} userId - ID of the user making the request (must own the payment)
 * @param {number} [amount] - Optional partial capture amount (if not provided, captures full amount)
 * 
 * @returns {Promise<Object>} Updated payment object with SUCCEEDED status
 * 
 * @throws {NotFoundError} If payment doesn't exist
 * @throws {AppError} If user doesn't own the payment (403)
 * @throws {AppError} If payment is already captured (400)
 * @throws {AppError} If capture fails with payment provider (500)
 * 
 * @example
 * ```typescript
 * // Capture full payment
 * const payment = await capturePayment('payment-id', 'user-id');
 * 
 * // Capture partial payment
 * const payment = await capturePayment('payment-id', 'user-id', 5000);
 * ```
 */
export const capturePayment = async (paymentId: string, userId: string, amount?: number) => {
  try {
    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Verify user owns this payment (security check)
    if (payment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Prevent double-capture (idempotency check)
    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw new AppError('Payment already captured', 400);
    }

    // Capture payment with provider (Stripe, Razorpay, or Cashfree)
    const provider = PaymentProviderFactory.getProvider();
    const paymentIntent = await provider.capturePayment({
      paymentId: payment.providerPaymentId!,
      amount, // If undefined, captures full amount
    });

    // Update database
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: mapProviderStatus(paymentIntent.status),
        capturedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'PAYMENT_CAPTURED',
      resource: 'payments',
      resourceId: payment.id,
      details: {
        amount: amount || payment.amount,
        capturedAmount: amount,
      },
    });

    logger.info('Payment captured', {
      paymentId: payment.id,
      userId,
    });

    // Create notification when payment is successfully completed
    if (updatedPayment.status === PaymentStatus.SUCCEEDED) {
      try {
        const amountFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: updatedPayment.currency,
          minimumFractionDigits: 2,
        }).format(Number(updatedPayment.amount) / 100);

        const paymentSuccessMessage = `Your payment of ${amountFormatted} has been successfully processed.`;
        await createNotification({
          userId,
          type: 'SUCCESS',
          channel: 'IN_APP',
          title: 'Payment Successful',
          message: paymentSuccessMessage,
          data: {
            action: 'PAYMENT_COMPLETED',
            paymentId: payment.id,
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            timestamp: new Date().toISOString(),
          },
        });
        await createNotification({
          userId,
          type: 'SUCCESS',
          channel: 'EMAIL',
          title: 'Payment Successful',
          message: paymentSuccessMessage,
          data: {
            action: 'PAYMENT_COMPLETED',
            paymentId: payment.id,
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error: any) {
        // Log error but don't fail payment capture
        logger.warn('Failed to create payment notification', {
          userId,
          paymentId: payment.id,
          error: error.message,
        });
      }
    }

    return updatedPayment;
  } catch (error: any) {
    logger.error('Payment capture failed', {
      error: error.message,
      paymentId,
    });
    throw error;
  }
};

/**
 * Refund a payment
 */
export const refundPayment = async (params: RefundPaymentParams & { userId: string }) => {
  try {
    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== params.userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new AppError('Payment not eligible for refund', 400);
    }

    // Create refund with provider
    const provider = PaymentProviderFactory.getProvider();
    const refundResult = await provider.refundPayment({
      paymentId: payment.providerPaymentId!,
      amount: params.amount,
      reason: params.reason,
    });

    // Store refund in database
    const refund = await prisma.paymentRefund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: refundResult.providerRefundId,
        amount: refundResult.amount,
        reason: params.reason,
        status: mapProviderStatus(refundResult.status),
        processedAt: new Date(),
      },
    });

    // Update payment status
    const refundedAmount = Number(payment.refundedAmount || 0) + refundResult.amount;
    const isFullRefund = refundedAmount >= Number(payment.amount);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount,
        refundedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      userId: params.userId,
      action: 'PAYMENT_REFUNDED',
      resource: 'payments',
      resourceId: payment.id,
      details: {
        refundId: refund.id,
        amount: refundResult.amount,
        reason: params.reason,
      },
    });

    logger.info('Payment refunded', {
      paymentId: payment.id,
      refundId: refund.id,
      amount: refundResult.amount,
    });

    return refund;
  } catch (error: any) {
    logger.error('Payment refund failed', {
      error: error.message,
      paymentId: params.paymentId,
    });
    throw error;
  }
};

/**
 * Refund a payment as admin (no ownership check).
 * Used by POST /api/admin/payments/:id/refund.
 */
export const refundPaymentAsAdmin = async (
  paymentId: string,
  adminUserId: string,
  params: { amount?: number; reason?: string }
) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new AppError('Payment not eligible for refund', 400);
    }

    if (!payment.providerPaymentId) {
      throw new AppError(
        'Payment has no provider payment ID (e.g. demo or manual record). Refunds require a real payment from the provider.',
        400
      );
    }

    const provider = PaymentProviderFactory.getProvider();
    const refundResult = await provider.refundPayment({
      paymentId: payment.providerPaymentId!,
      amount: params.amount,
      reason: params.reason,
    });

    const refund = await prisma.paymentRefund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: refundResult.providerRefundId,
        amount: refundResult.amount,
        reason: params.reason,
        status: mapProviderStatus(refundResult.status),
        processedAt: new Date(),
      },
    });

    const refundedAmount = Number(payment.refundedAmount || 0) + refundResult.amount;
    const isFullRefund = refundedAmount >= Number(payment.amount);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount,
        refundedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: adminUserId,
      action: 'PAYMENT_REFUNDED',
      resource: 'payments',
      resourceId: payment.id,
      details: {
        refundId: refund.id,
        amount: refundResult.amount,
        reason: params.reason,
        performedBy: 'admin',
      },
    });

    logger.info('Payment refunded by admin', {
      paymentId: payment.id,
      refundId: refund.id,
      adminUserId,
    });

    return refund;
  } catch (error: any) {
    logger.error('Admin payment refund failed', {
      error: error.message,
      paymentId,
    });
    if (error instanceof AppError) throw error;
    throw new AppError(
      error?.message ?? 'Payment provider refund failed. Check that the payment is from the configured provider (e.g. Stripe).',
      400
    );
  }
};

/**
 * Get payment by ID
 */
export const getPayment = async (paymentId: string, userId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      refunds: true,
    },
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.userId !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  return payment;
};

/**
 * Get user's payments
 */
export const getUserPayments = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  status?: PaymentStatus
) => {
  const skip = (page - 1) * pageSize;
  const where: any = { userId };
  
  if (status) {
    where.status = status;
  }

  const [payments, totalCount] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        refunds: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};

/**
 * Handle webhook event
 */
export const handleWebhook = async (
  provider: PaymentProviderType,
  payload: any,
  signature: string
) => {
  try {
    const providerInstance = PaymentProviderFactory.createProvider(provider, {
      apiKey: process.env[`${provider}_API_KEY`] || '',
      webhookSecret: process.env[`${provider}_WEBHOOK_SECRET`] || '',
    });

    // Verify webhook signature
    const isValid = providerInstance.verifyWebhook({
      payload,
      signature,
      secret: process.env[`${provider}_WEBHOOK_SECRET`] || '',
    });

    if (!isValid) {
      throw new AppError('Invalid webhook signature', 401);
    }

    // Parse webhook event
    const event = providerInstance.parseWebhookEvent(payload);

    // Store webhook log
    const webhookLog = await prisma.paymentWebhookLog.create({
      data: {
        provider: provider as PaymentProvider,
        eventType: event.type,
        eventId: event.id,
        payload: event.data,
        signature,
        verified: true,
        processed: false,
      },
    });

    // Process webhook based on event type
    await processWebhookEvent(webhookLog.id, event);

    logger.info('Webhook processed', {
      provider,
      eventType: event.type,
      webhookId: webhookLog.id,
    });

    return { success: true, webhookId: webhookLog.id };
  } catch (error: any) {
    logger.error('Webhook processing failed', {
      provider,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Process webhook event
 */
async function processWebhookEvent(webhookId: string, event: any) {
  // Handle different event types
  // This is provider-agnostic - implement based on your needs
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment.captured':
        // Update payment status
        await updatePaymentFromWebhook(event.data.id, PaymentStatus.SUCCEEDED);
        break;

      case 'payment_intent.payment_failed':
      case 'payment.failed':
        await updatePaymentFromWebhook(event.data.id, PaymentStatus.FAILED);
        break;

      case 'charge.refunded':
      case 'refund.processed':
        // Handle refund
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    // Mark webhook as processed
    await prisma.paymentWebhookLog.update({
      where: { id: webhookId },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (error: any) {
    await prisma.paymentWebhookLog.update({
      where: { id: webhookId },
      data: {
        processed: false,
        errorMessage: error.message,
      },
    });
    throw error;
  }
}

/**
 * Update payment from webhook
 */
async function updatePaymentFromWebhook(providerPaymentId: string, status: PaymentStatus) {
  await prisma.payment.updateMany({
    where: { providerPaymentId },
    data: { status },
  });
}

/**
 * Map provider status to our status enum
 */
function mapProviderStatus(providerStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'pending': PaymentStatus.PENDING,
    'processing': PaymentStatus.PROCESSING,
    'succeeded': PaymentStatus.SUCCEEDED,
    'success': PaymentStatus.SUCCEEDED,
    'captured': PaymentStatus.SUCCEEDED,
    'paid': PaymentStatus.SUCCEEDED,
    'SUCCESS': PaymentStatus.SUCCEEDED,
    'failed': PaymentStatus.FAILED,
    'FAILED': PaymentStatus.FAILED,
    'canceled': PaymentStatus.CANCELLED,
    'cancelled': PaymentStatus.CANCELLED,
    'refunded': PaymentStatus.REFUNDED,
  };

  return statusMap[providerStatus] || PaymentStatus.PENDING;
}



