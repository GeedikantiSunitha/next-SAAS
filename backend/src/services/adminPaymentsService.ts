/**
 * Admin Payments Service
 * 
 * Provides payment and subscription management for admin dashboard
 */

import { prisma } from '../config/database';
import { createAuditLog } from './auditService';

export interface PaymentFilters {
  userId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Get payments with filters
 */
export const getPayments = async (filters: PaymentFilters, adminUserId: string) => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 100);
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  await createAuditLog({
    userId: adminUserId,
    action: 'PAYMENTS_VIEWED',
    resource: 'payments',
  });

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get subscriptions
 */
export const getSubscriptions = async (filters: { userId?: string; status?: string }, adminUserId: string) => {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.status) where.status = filters.status;

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  await createAuditLog({
    userId: adminUserId,
    action: 'SUBSCRIPTIONS_VIEWED',
    resource: 'subscriptions',
  });

  return { subscriptions };
};

