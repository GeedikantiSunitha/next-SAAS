/**
 * Admin Refund Route Tests (TDD - Fix #7)
 *
 * POST /api/admin/payments/:id/refund — admin-only refund;
 * tests auth, 404, 400, and success.
 */

import request from 'supertest';
import express from 'express';
import { prisma } from '../../config/database';
import { createTestUser, createTestAdmin } from '../../tests/setup';
import * as authService from '../../services/authService';
import * as paymentService from '../../services/paymentService';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import cookieParser from 'cookie-parser';
import adminRoutes from '../../routes/admin';
import { PaymentStatus, PaymentProvider, Currency } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

jest.mock('../../services/paymentService', () => ({
  ...jest.requireActual('../../services/paymentService'),
  refundPaymentAsAdmin: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

describe('Admin Refund Route (POST /api/admin/payments/:id/refund)', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let userToken: string;
  let payment: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    await prisma.paymentRefund.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    adminUser = await createTestAdmin({ email: 'admin-refund@example.com' });
    regularUser = await createTestUser({ email: 'user-refund@example.com' });

    const adminTokens = authService.generateTokens(adminUser.id);
    const userTokens = authService.generateTokens(regularUser.id);
    adminToken = adminTokens.accessToken;
    userToken = userTokens.accessToken;

    payment = await prisma.payment.create({
      data: {
        userId: regularUser.id,
        provider: PaymentProvider.STRIPE,
        providerPaymentId: 'pi_admin_refund_test',
        amount: 50.00,
        currency: Currency.USD,
        status: PaymentStatus.SUCCEEDED,
      },
    });
  });

  afterEach(async () => {
    await prisma.paymentRefund.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should return 200 and refund data when admin refunds a payment', async () => {
    const mockRefund = {
      id: 'refund-1',
      paymentId: payment.id,
      amount: 50,
      status: 'succeeded',
      providerRefundId: 're_1',
      reason: 'Admin refund',
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
      metadata: null,
    };

    (paymentService.refundPaymentAsAdmin as jest.Mock).mockResolvedValue(mockRefund);

    const response = await request(app)
      .post(`/api/admin/payments/${payment.id}/refund`)
      .set('Cookie', `accessToken=${adminToken}`)
      .send({ reason: 'Admin refund' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe('refund-1');
    expect(response.body.message).toMatch(/refunded/i);
    expect(paymentService.refundPaymentAsAdmin).toHaveBeenCalledWith(
      payment.id,
      adminUser.id,
      expect.objectContaining({ reason: 'Admin refund' })
    );
  });

  it('should return 403 when non-admin tries to refund', async () => {
    const response = await request(app)
      .post(`/api/admin/payments/${payment.id}/refund`)
      .set('Cookie', `accessToken=${userToken}`)
      .send({ reason: 'User refund' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(paymentService.refundPaymentAsAdmin).not.toHaveBeenCalled();
  });

  it('should return 404 when payment does not exist', async () => {
    (paymentService.refundPaymentAsAdmin as jest.Mock).mockRejectedValue(
      new NotFoundError('Payment not found')
    );

    const response = await request(app)
      .post('/api/admin/payments/non-existent-id/refund')
      .set('Cookie', `accessToken=${adminToken}`)
      .send({ reason: 'Test' })
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  it('should return 400 when payment is not eligible for refund', async () => {
    const { AppError } = require('../../utils/errors');
    (paymentService.refundPaymentAsAdmin as jest.Mock).mockRejectedValue(
      new AppError('Payment not eligible for refund', 400)
    );

    const response = await request(app)
      .post(`/api/admin/payments/${payment.id}/refund`)
      .set('Cookie', `accessToken=${adminToken}`)
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should require authentication', async () => {
    await request(app)
      .post(`/api/admin/payments/${payment.id}/refund`)
      .send({ reason: 'Test' })
      .expect(401);

    expect(paymentService.refundPaymentAsAdmin).not.toHaveBeenCalled();
  });
});
