/**
 * Newsletter Hooks Tests (TDD)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as newsletterApi from '../../api/newsletter';
import {
  useSubscribe,
  useUnsubscribe,
  useSubscription,
  useNewsletters,
  useNewsletter,
  useCreateNewsletter,
  useUpdateNewsletter,
  useSendNewsletter,
  useSubscriptions,
} from '../../hooks/useNewsletter';

// Mock the API
vi.mock('../../api/newsletter', () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  getSubscription: vi.fn(),
  getNewsletters: vi.fn(),
  getNewsletterById: vi.fn(),
  createNewsletter: vi.fn(),
  updateNewsletter: vi.fn(),
  sendNewsletter: vi.fn(),
  getSubscriptions: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('useNewsletter Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSubscribe', () => {
    it('should subscribe to newsletter', async () => {
      const mockSubscription = {
        id: 'sub-1',
        email: 'test@example.com',
        isActive: true,
        unsubscribeToken: 'token-123',
      };

      vi.mocked(newsletterApi.subscribe).mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => useSubscribe(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('test@example.com');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.subscribe).toHaveBeenCalledWith('test@example.com');
      expect(result.current.data).toEqual(mockSubscription);
    });
  });

  describe('useUnsubscribe', () => {
    it('should unsubscribe from newsletter', async () => {
      const mockSubscription = {
        id: 'sub-1',
        email: 'test@example.com',
        isActive: false,
      };

      vi.mocked(newsletterApi.unsubscribe).mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => useUnsubscribe(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('token-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.unsubscribe).toHaveBeenCalledWith('token-123');
      expect(result.current.data).toEqual(mockSubscription);
    });
  });

  describe('useSubscription', () => {
    it('should fetch user subscription', async () => {
      const mockSubscription = {
        id: 'sub-1',
        email: 'test@example.com',
        isActive: true,
      };

      vi.mocked(newsletterApi.getSubscription).mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.getSubscription).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockSubscription);
    });
  });

  describe('useNewsletters', () => {
    it('should fetch newsletters', async () => {
      const mockNewsletters = [
        {
          id: 'news-1',
          title: 'Test Newsletter',
          subject: 'Test Subject',
          status: 'DRAFT' as const,
        },
      ];

      vi.mocked(newsletterApi.getNewsletters).mockResolvedValue(mockNewsletters);

      const { result } = renderHook(() => useNewsletters(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.getNewsletters).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual(mockNewsletters);
    });

    it('should fetch newsletters with filters', async () => {
      const mockNewsletters: any[] = [];

      vi.mocked(newsletterApi.getNewsletters).mockResolvedValue(mockNewsletters);

      const { result } = renderHook(() => useNewsletters({ status: 'SENT' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.getNewsletters).toHaveBeenCalledWith({ status: 'SENT' });
    });
  });

  describe('useNewsletter', () => {
    it('should fetch newsletter by ID', async () => {
      const mockNewsletter = {
        id: 'news-1',
        title: 'Test Newsletter',
        subject: 'Test Subject',
        status: 'DRAFT' as const,
      };

      vi.mocked(newsletterApi.getNewsletterById).mockResolvedValue(mockNewsletter);

      const { result } = renderHook(() => useNewsletter('news-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.getNewsletterById).toHaveBeenCalledWith('news-1');
      expect(result.current.data).toEqual(mockNewsletter);
    });
  });

  describe('useCreateNewsletter', () => {
    it('should create newsletter', async () => {
      const mockNewsletter = {
        id: 'news-1',
        title: 'New Newsletter',
        subject: 'New Subject',
        content: '<p>Content</p>',
        status: 'DRAFT' as const,
      };

      vi.mocked(newsletterApi.createNewsletter).mockResolvedValue(mockNewsletter);

      const { result } = renderHook(() => useCreateNewsletter(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        title: 'New Newsletter',
        subject: 'New Subject',
        content: '<p>Content</p>',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.createNewsletter).toHaveBeenCalledWith({
        title: 'New Newsletter',
        subject: 'New Subject',
        content: '<p>Content</p>',
      });
      expect(result.current.data).toEqual(mockNewsletter);
    });
  });

  describe('useUpdateNewsletter', () => {
    it('should update newsletter', async () => {
      const mockNewsletter = {
        id: 'news-1',
        title: 'Updated Newsletter',
        status: 'DRAFT' as const,
      };

      vi.mocked(newsletterApi.updateNewsletter).mockResolvedValue(mockNewsletter);

      const { result } = renderHook(() => useUpdateNewsletter(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'news-1',
        data: { title: 'Updated Newsletter' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.updateNewsletter).toHaveBeenCalledWith('news-1', {
        title: 'Updated Newsletter',
      });
      expect(result.current.data).toEqual(mockNewsletter);
    });
  });

  describe('useSendNewsletter', () => {
    it('should send newsletter', async () => {
      const mockNewsletter = {
        id: 'news-1',
        status: 'SENT' as const,
        sentCount: 10,
      };

      vi.mocked(newsletterApi.sendNewsletter).mockResolvedValue(mockNewsletter);

      const { result } = renderHook(() => useSendNewsletter(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('news-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.sendNewsletter).toHaveBeenCalledWith('news-1');
      expect(result.current.data).toEqual(mockNewsletter);
    });
  });

  describe('useSubscriptions', () => {
    it('should fetch subscriptions', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          email: 'test@example.com',
          isActive: true,
          unsubscribeToken: 'token-123',
        },
      ];

      vi.mocked(newsletterApi.getSubscriptions).mockResolvedValue(mockSubscriptions);

      const { result } = renderHook(() => useSubscriptions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(newsletterApi.getSubscriptions).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual(mockSubscriptions);
    });
  });
});
