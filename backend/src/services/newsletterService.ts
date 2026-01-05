/**
 * Newsletter Service
 * 
 * Handles newsletter subscription, creation, and sending
 */

import { prisma } from '../config/database';
import { NewsletterStatus, Newsletter, NewsletterSubscription, Prisma } from '@prisma/client';
import * as emailService from './emailService';
import logger from '../utils/logger';
import { NotFoundError, AppError } from '../utils/errors';
import crypto from 'crypto';

/**
 * Subscribe to newsletter
 */
export const subscribe = async (
  email: string,
  userId?: string
): Promise<NewsletterSubscription> => {
  try {
    // Check if subscription already exists
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        return await prisma.newsletterSubscription.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            userId: userId || existing.userId,
            unsubscribedAt: null,
            subscribedAt: new Date(),
          },
        });
      }
      // Update userId if provided and different
      if (userId && existing.userId !== userId) {
        return await prisma.newsletterSubscription.update({
          where: { id: existing.id },
          data: { userId },
        });
      }
      return existing;
    }

    // Create new subscription
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email,
        userId: userId || null,
        isActive: true,
        unsubscribeToken,
      },
    });

    logger.info('Newsletter subscription created', { email, userId });

    return subscription;
  } catch (error: any) {
    logger.error('Newsletter subscription failed', { email, error: error.message });
    throw new AppError('Failed to subscribe to newsletter', 500);
  }
};

/**
 * Unsubscribe from newsletter
 */
export const unsubscribe = async (token: string): Promise<NewsletterSubscription> => {
  try {
    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscription) {
      throw new NotFoundError('Unsubscribe token not found');
    }

    const updated = await prisma.newsletterSubscription.update({
      where: { id: subscription.id },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    logger.info('Newsletter unsubscribed', { email: subscription.email });

    return updated;
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Newsletter unsubscribe failed', { error: error.message });
    throw new AppError('Failed to unsubscribe from newsletter', 500);
  }
};

/**
 * Create newsletter
 */
export const createNewsletter = async (data: {
  title: string;
  subject: string;
  content: string;
  createdBy: string;
  scheduledAt?: Date;
}): Promise<Newsletter> => {
  try {
    const status = data.scheduledAt
      ? NewsletterStatus.SCHEDULED
      : NewsletterStatus.DRAFT;

    const newsletter = await prisma.newsletter.create({
      data: {
        title: data.title,
        subject: data.subject,
        content: data.content,
        createdBy: data.createdBy,
        status,
        scheduledAt: data.scheduledAt || null,
      },
    });

    logger.info('Newsletter created', {
      newsletterId: newsletter.id,
      createdBy: data.createdBy,
    });

    return newsletter;
  } catch (error: any) {
    logger.error('Newsletter creation failed', { error: error.message });
    throw new AppError('Failed to create newsletter', 500);
  }
};

/**
 * Update newsletter
 */
export const updateNewsletter = async (
  id: string,
  data: {
    title?: string;
    subject?: string;
    content?: string;
    scheduledAt?: Date;
    status?: NewsletterStatus;
  }
): Promise<Newsletter> => {
  try {
    const existing = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Newsletter not found');
    }

    // Determine status
    let status = data.status || existing.status;
    if (data.scheduledAt && !data.status) {
      status = NewsletterStatus.SCHEDULED;
    } else if (!data.scheduledAt && status === NewsletterStatus.SCHEDULED && !data.status) {
      status = NewsletterStatus.DRAFT;
    }

    const updated = await prisma.newsletter.update({
      where: { id },
      data: {
        ...data,
        status,
      },
    });

    logger.info('Newsletter updated', { newsletterId: id });

    return updated;
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Newsletter update failed', { newsletterId: id, error: error.message });
    throw new AppError('Failed to update newsletter', 500);
  }
};

/**
 * Get subscriptions
 */
export const getSubscriptions = async (filters: {
  isActive?: boolean;
  userId?: string;
  page?: number;
  pageSize?: number;
}): Promise<NewsletterSubscription[]> => {
  try {
    const where: Prisma.NewsletterSubscriptionWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 100;

    const subscriptions = await prisma.newsletterSubscription.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { subscribedAt: 'desc' },
    });

    return subscriptions;
  } catch (error: any) {
    logger.error('Get subscriptions failed', { error: error.message });
    throw new AppError('Failed to get subscriptions', 500);
  }
};

/**
 * Get newsletters
 */
export const getNewsletters = async (filters: {
  status?: NewsletterStatus;
  createdBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<Newsletter[]> => {
  try {
    const where: Prisma.NewsletterWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;

    const newsletters = await prisma.newsletter.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return newsletters;
  } catch (error: any) {
    logger.error('Get newsletters failed', { error: error.message });
    throw new AppError('Failed to get newsletters', 500);
  }
};

/**
 * Send newsletter
 */
export const sendNewsletter = async (newsletterId: string): Promise<Newsletter> => {
  try {
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
    });

    if (!newsletter) {
      throw new NotFoundError('Newsletter not found');
    }

    if (newsletter.status === NewsletterStatus.SENT) {
      throw new AppError('Newsletter already sent', 400);
    }

    // Get all active subscriptions
    const subscriptions = await prisma.newsletterSubscription.findMany({
      where: { isActive: true },
    });

    let sentCount = 0;
    const errors: string[] = [];

    // Send to each subscriber
    for (const subscription of subscriptions) {
      try {
        const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/newsletter/unsubscribe?token=${subscription.unsubscribeToken}`;
        
        await emailService.sendEmail({
          to: subscription.email,
          subject: newsletter.subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${newsletter.content}
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #666;">
                You're receiving this because you subscribed to our newsletter.
                <br />
                <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
              </p>
            </div>
          `,
        });

        sentCount++;
      } catch (error: any) {
        logger.error('Failed to send newsletter email', {
          email: subscription.email,
          error: error.message,
        });
        errors.push(subscription.email);
      }
    }

    // Update newsletter
    const updated = await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: NewsletterStatus.SENT,
        sentAt: new Date(),
        sentCount,
      },
    });

    logger.info('Newsletter sent', {
      newsletterId,
      sentCount,
      errorCount: errors.length,
    });

    return updated;
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      throw error;
    }
    logger.error('Send newsletter failed', { newsletterId, error: error.message });
    throw new AppError('Failed to send newsletter', 500);
  }
};

/**
 * Schedule newsletter
 */
export const scheduleNewsletter = async (
  newsletterId: string,
  scheduledAt: Date
): Promise<Newsletter> => {
  try {
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
    });

    if (!newsletter) {
      throw new NotFoundError('Newsletter not found');
    }

    const updated = await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: NewsletterStatus.SCHEDULED,
        scheduledAt,
      },
    });

    logger.info('Newsletter scheduled', { newsletterId, scheduledAt });

    return updated;
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Schedule newsletter failed', { newsletterId, error: error.message });
    throw new AppError('Failed to schedule newsletter', 500);
  }
};

/**
 * Get newsletter by ID
 */
export const getNewsletterById = async (id: string): Promise<Newsletter | null> => {
  try {
    return await prisma.newsletter.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  } catch (error: any) {
    logger.error('Get newsletter failed', { newsletterId: id, error: error.message });
    throw new AppError('Failed to get newsletter', 500);
  }
};

/**
 * Get user subscription
 */
export const getUserSubscription = async (
  userId: string
): Promise<NewsletterSubscription | null> => {
  try {
    return await prisma.newsletterSubscription.findFirst({
      where: { userId, isActive: true },
    });
  } catch (error: any) {
    logger.error('Get user subscription failed', { userId, error: error.message });
    throw new AppError('Failed to get user subscription', 500);
  }
};
