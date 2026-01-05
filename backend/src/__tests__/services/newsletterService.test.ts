/**
 * Newsletter Service Tests (TDD)
 * 
 * Comprehensive unit tests for newsletter service
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '../../config/database';
import * as newsletterService from '../../services/newsletterService';
import * as emailService from '../../services/emailService';
import { createTestUser } from '../../tests/setup';
import { NewsletterStatus } from '@prisma/client';
import crypto from 'crypto';

// Mock email service
jest.mock('../../services/emailService', () => ({
  sendEmail: jest.fn(),
}));

describe('Newsletter Service', () => {
  let testUser: any;
  let adminUser: any;

  beforeEach(async () => {
    // Clean up
    await prisma.newsletterSubscription.deleteMany({});
    await prisma.newsletter.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    testUser = await createTestUser({
      email: 'user@example.com',
      name: 'Test User',
    });

    adminUser = await createTestUser({
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    });
  });

  afterEach(async () => {
    await prisma.newsletterSubscription.deleteMany({});
    await prisma.newsletter.deleteMany({});
    await prisma.user.deleteMany({});
    jest.clearAllMocks();
  });

  describe('subscribe', () => {
    it('should subscribe user with email', async () => {
      const result = await newsletterService.subscribe('newuser@example.com', testUser.id);

      expect(result).toBeDefined();
      expect(result.email).toBe('newuser@example.com');
      expect(result.userId).toBe(testUser.id);
      expect(result.isActive).toBe(true);
      expect(result.unsubscribeToken).toBeDefined();

      // Verify in database
      const subscription = await prisma.newsletterSubscription.findUnique({
        where: { email: 'newuser@example.com' },
      });
      expect(subscription).toBeDefined();
      expect(subscription?.isActive).toBe(true);
    });

    it('should subscribe without user account (email only)', async () => {
      const result = await newsletterService.subscribe('guest@example.com');

      expect(result).toBeDefined();
      expect(result.email).toBe('guest@example.com');
      expect(result.userId).toBeNull();
      expect(result.isActive).toBe(true);
    });

    it('should reactivate existing subscription if email already exists', async () => {
      // Create inactive subscription
      await prisma.newsletterSubscription.create({
        data: {
          email: 'existing@example.com',
          isActive: false,
          unsubscribedAt: new Date(),
          unsubscribeToken: crypto.randomBytes(32).toString('hex'),
        },
      });

      const result = await newsletterService.subscribe('existing@example.com', testUser.id);

      expect(result.isActive).toBe(true);
      expect(result.unsubscribedAt).toBeNull();
      expect(result.userId).toBe(testUser.id);
    });

    it('should not create duplicate subscription for active email', async () => {
      await newsletterService.subscribe('duplicate@example.com', testUser.id);
      
      // Try to subscribe again
      const result = await newsletterService.subscribe('duplicate@example.com', testUser.id);

      // Should return existing subscription
      expect(result.isActive).toBe(true);
      
      // Verify only one subscription exists
      const subscriptions = await prisma.newsletterSubscription.findMany({
        where: { email: 'duplicate@example.com' },
      });
      expect(subscriptions.length).toBe(1);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe using token', async () => {
      const subscription = await prisma.newsletterSubscription.create({
        data: {
          email: 'unsub@example.com',
          userId: testUser.id,
          isActive: true,
          unsubscribeToken: 'test-unsubscribe-token-123',
        },
      });

      const result = await newsletterService.unsubscribe('test-unsubscribe-token-123');

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
      expect(result.unsubscribedAt).toBeDefined();

      // Verify in database
      const updated = await prisma.newsletterSubscription.findUnique({
        where: { id: subscription.id },
      });
      expect(updated?.isActive).toBe(false);
    });

    it('should throw error for invalid token', async () => {
      await expect(
        newsletterService.unsubscribe('invalid-token-123')
      ).rejects.toThrow();
    });
  });

  describe('createNewsletter', () => {
    it('should create newsletter draft', async () => {
      const data = {
        title: 'Test Newsletter',
        subject: 'Test Subject',
        content: '<p>Test content</p>',
        createdBy: adminUser.id,
      };

      const result = await newsletterService.createNewsletter(data);

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Newsletter');
      expect(result.subject).toBe('Test Subject');
      expect(result.status).toBe(NewsletterStatus.DRAFT);
      expect(result.createdBy).toBe(adminUser.id);
      expect(result.sentCount).toBe(0);
    });

    it('should create scheduled newsletter', async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const data = {
        title: 'Scheduled Newsletter',
        subject: 'Scheduled Subject',
        content: '<p>Scheduled content</p>',
        createdBy: adminUser.id,
        scheduledAt,
      };

      const result = await newsletterService.createNewsletter(data);

      expect(result.status).toBe(NewsletterStatus.SCHEDULED);
      expect(result.scheduledAt).toEqual(scheduledAt);
    });
  });

  describe('updateNewsletter', () => {
    it('should update newsletter', async () => {
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Original Title',
          subject: 'Original Subject',
          content: '<p>Original</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.DRAFT,
        },
      });

      const result = await newsletterService.updateNewsletter(newsletter.id, {
        title: 'Updated Title',
        subject: 'Updated Subject',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.subject).toBe('Updated Subject');
      expect(result.content).toBe('<p>Original</p>'); // Unchanged
    });

    it('should throw error for non-existent newsletter', async () => {
      await expect(
        newsletterService.updateNewsletter('non-existent-id', { title: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('getSubscriptions', () => {
    it('should get all active subscriptions', async () => {
      // Create subscriptions
      await prisma.newsletterSubscription.createMany({
        data: [
          { email: 'active1@example.com', isActive: true, unsubscribeToken: 'token1' },
          { email: 'active2@example.com', isActive: true, unsubscribeToken: 'token2' },
          { email: 'inactive@example.com', isActive: false, unsubscribeToken: 'token3' },
        ],
      });

      const result = await newsletterService.getSubscriptions({ isActive: true });

      expect(result.length).toBe(2);
      expect(result.every((s) => s.isActive)).toBe(true);
    });

    it('should get subscriptions with pagination', async () => {
      // Create multiple subscriptions
      await prisma.newsletterSubscription.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          email: `user${i}@example.com`,
          isActive: true,
          unsubscribeToken: `token${i}`,
        })),
      });

      const result = await newsletterService.getSubscriptions({
        page: 1,
        pageSize: 10,
      });

      expect(result.length).toBe(10);
    });
  });

  describe('sendNewsletter', () => {
    it('should send newsletter to all active subscribers', async () => {
      // Create newsletter
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Test Newsletter',
          subject: 'Test Subject',
          content: '<p>Test content</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.DRAFT,
        },
      });

      // Create subscriptions
      await prisma.newsletterSubscription.createMany({
        data: [
          { email: 'sub1@example.com', isActive: true, unsubscribeToken: 'token1' },
          { email: 'sub2@example.com', isActive: true, unsubscribeToken: 'token2' },
          { email: 'inactive@example.com', isActive: false, unsubscribeToken: 'token3' },
        ],
      });

      const mockSendEmail = jest.mocked(emailService.sendEmail);
      mockSendEmail.mockResolvedValue({ id: 'mock-email-id' } as any);

      const result = await newsletterService.sendNewsletter(newsletter.id);

      expect(result.sentCount).toBe(2); // Only active subscribers
      expect(result.status).toBe(NewsletterStatus.SENT);
      expect(result.sentAt).toBeDefined();
      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });

    it('should throw error for non-existent newsletter', async () => {
      await expect(
        newsletterService.sendNewsletter('non-existent-id')
      ).rejects.toThrow();
    });

    it('should throw error if newsletter already sent', async () => {
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Sent Newsletter',
          subject: 'Sent Subject',
          content: '<p>Sent</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.SENT,
          sentAt: new Date(),
        },
      });

      await expect(
        newsletterService.sendNewsletter(newsletter.id)
      ).rejects.toThrow();
    });
  });

  describe('scheduleNewsletter', () => {
    it('should schedule newsletter', async () => {
      const newsletter = await prisma.newsletter.create({
        data: {
          title: 'Draft Newsletter',
          subject: 'Draft Subject',
          content: '<p>Draft</p>',
          createdBy: adminUser.id,
          status: NewsletterStatus.DRAFT,
        },
      });

      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = await newsletterService.scheduleNewsletter(newsletter.id, scheduledAt);

      expect(result.status).toBe(NewsletterStatus.SCHEDULED);
      expect(result.scheduledAt).toEqual(scheduledAt);
    });
  });

  describe('getNewsletters', () => {
    it('should get all newsletters', async () => {
      await prisma.newsletter.createMany({
        data: [
          {
            title: 'Newsletter 1',
            subject: 'Subject 1',
            content: '<p>Content 1</p>',
            createdBy: adminUser.id,
            status: NewsletterStatus.DRAFT,
          },
          {
            title: 'Newsletter 2',
            subject: 'Subject 2',
            content: '<p>Content 2</p>',
            createdBy: adminUser.id,
            status: NewsletterStatus.SENT,
            sentAt: new Date(),
          },
        ],
      });

      const result = await newsletterService.getNewsletters({});

      expect(result.length).toBe(2);
    });

    it('should filter newsletters by status', async () => {
      await prisma.newsletter.createMany({
        data: [
          {
            title: 'Draft',
            subject: 'Draft',
            content: '<p>Draft</p>',
            createdBy: adminUser.id,
            status: NewsletterStatus.DRAFT,
          },
          {
            title: 'Sent',
            subject: 'Sent',
            content: '<p>Sent</p>',
            createdBy: adminUser.id,
            status: NewsletterStatus.SENT,
            sentAt: new Date(),
          },
        ],
      });

      const result = await newsletterService.getNewsletters({ status: NewsletterStatus.DRAFT });

      expect(result.length).toBe(1);
      expect(result[0].status).toBe(NewsletterStatus.DRAFT);
    });
  });
});
