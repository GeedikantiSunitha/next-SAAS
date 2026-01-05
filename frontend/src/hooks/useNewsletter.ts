/**
 * Newsletter React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as newsletterApi from '../api/newsletter';
import type {
  Newsletter,
  NewsletterSubscription,
  CreateNewsletterData,
  UpdateNewsletterData,
  GetNewslettersParams,
  GetSubscriptionsParams,
} from '../api/newsletter';

/**
 * Subscribe to newsletter
 */
export const useSubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => newsletterApi.subscribe(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'subscription'] });
    },
  });
};

/**
 * Unsubscribe from newsletter
 */
export const useUnsubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => newsletterApi.unsubscribe(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'subscription'] });
    },
  });
};

/**
 * Get user's subscription
 */
export const useSubscription = () => {
  return useQuery({
    queryKey: ['newsletter', 'subscription'],
    queryFn: () => newsletterApi.getSubscription(),
    retry: false, // Don't retry on 404
  });
};

/**
 * Get all newsletters (admin only)
 */
export const useNewsletters = (params?: GetNewslettersParams) => {
  return useQuery({
    queryKey: ['newsletter', 'list', params],
    queryFn: () => newsletterApi.getNewsletters(params),
  });
};

/**
 * Get newsletter by ID (admin only)
 */
export const useNewsletter = (id: string) => {
  return useQuery({
    queryKey: ['newsletter', 'detail', id],
    queryFn: () => newsletterApi.getNewsletterById(id),
    enabled: !!id,
  });
};

/**
 * Create newsletter (admin only)
 */
export const useCreateNewsletter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNewsletterData) => newsletterApi.createNewsletter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'list'] });
    },
  });
};

/**
 * Update newsletter (admin only)
 */
export const useUpdateNewsletter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNewsletterData }) =>
      newsletterApi.updateNewsletter(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'detail', variables.id] });
    },
  });
};

/**
 * Send newsletter (admin only)
 */
export const useSendNewsletter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => newsletterApi.sendNewsletter(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'detail', id] });
    },
  });
};

/**
 * Get all subscriptions (admin only)
 */
export const useSubscriptions = (params?: GetSubscriptionsParams) => {
  return useQuery({
    queryKey: ['newsletter', 'subscriptions', params],
    queryFn: () => newsletterApi.getSubscriptions(params),
  });
};

/**
 * Schedule newsletter (admin only)
 */
export const useScheduleNewsletter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: Date }) =>
      newsletterApi.scheduleNewsletter(id, scheduledAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'detail', variables.id] });
    },
  });
};
