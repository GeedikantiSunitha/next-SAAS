/**
 * Newsletter API Client Tests (TDD)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as newsletterApi from '../../api/newsletter';
import apiClient from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Newsletter API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribe', () => {
    it('should subscribe to newsletter', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'sub-1',
          email: 'test@example.com',
          isActive: true,
          unsubscribeToken: 'token-123',
        },
      };

      (apiClient.post as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.subscribe('test@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/newsletter/subscribe', {
        email: 'test@example.com',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from newsletter', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'sub-1',
          email: 'test@example.com',
          isActive: false,
        },
      };

      (apiClient.post as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.unsubscribe('token-123');

      expect(apiClient.post).toHaveBeenCalledWith('/newsletter/unsubscribe', {
        token: 'token-123',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getSubscription', () => {
    it('should get user subscription', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'sub-1',
          email: 'test@example.com',
          isActive: true,
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.getSubscription();

      expect(apiClient.get).toHaveBeenCalledWith('/newsletter/subscription');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getNewsletters', () => {
    it('should get all newsletters', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'news-1',
            title: 'Test Newsletter',
            subject: 'Test Subject',
            status: 'DRAFT',
          },
        ],
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.getNewsletters();

      expect(apiClient.get).toHaveBeenCalledWith('/newsletter', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should get newsletters with filters', async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.getNewsletters({ status: 'SENT' });

      expect(apiClient.get).toHaveBeenCalledWith('/newsletter', {
        params: { status: 'SENT' },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getNewsletterById', () => {
    it('should get newsletter by ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'news-1',
          title: 'Test Newsletter',
          subject: 'Test Subject',
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.getNewsletterById('news-1');

      expect(apiClient.get).toHaveBeenCalledWith('/newsletter/news-1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createNewsletter', () => {
    it('should create newsletter', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'news-1',
          title: 'New Newsletter',
          subject: 'New Subject',
          content: '<p>Content</p>',
          status: 'DRAFT',
        },
      };

      (apiClient.post as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.createNewsletter({
        title: 'New Newsletter',
        subject: 'New Subject',
        content: '<p>Content</p>',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/newsletter', {
        title: 'New Newsletter',
        subject: 'New Subject',
        content: '<p>Content</p>',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateNewsletter', () => {
    it('should update newsletter', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'news-1',
          title: 'Updated Newsletter',
        },
      };

      (apiClient.put as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.updateNewsletter('news-1', {
        title: 'Updated Newsletter',
      });

      expect(apiClient.put).toHaveBeenCalledWith('/newsletter/news-1', {
        title: 'Updated Newsletter',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('sendNewsletter', () => {
    it('should send newsletter', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'news-1',
          status: 'SENT',
          sentCount: 10,
        },
      };

      (apiClient.post as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.sendNewsletter('news-1');

      expect(apiClient.post).toHaveBeenCalledWith('/newsletter/news-1/send');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getSubscriptions', () => {
    it('should get all subscriptions', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'sub-1',
            email: 'test@example.com',
            isActive: true,
          },
        ],
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.getSubscriptions();

      expect(apiClient.get).toHaveBeenCalledWith('/newsletter/subscriptions', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should get subscriptions with filters', async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await newsletterApi.getSubscriptions({ isActive: true });

      expect(apiClient.get).toHaveBeenCalledWith('/newsletter/subscriptions', {
        params: { isActive: true },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
