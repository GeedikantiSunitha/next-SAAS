/**
 * Newsletter API Client
 */

import apiClient from './client';

export interface NewsletterSubscription {
  id: string;
  email: string;
  userId?: string | null;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string | null;
  unsubscribeToken: string;
  preferences?: Record<string, any> | null;
}

export type NewsletterStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';

export interface Newsletter {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: NewsletterStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface CreateNewsletterData {
  title: string;
  subject: string;
  content: string;
  scheduledAt?: string;
}

export interface UpdateNewsletterData {
  title?: string;
  subject?: string;
  content?: string;
  scheduledAt?: string;
  status?: NewsletterStatus;
}

export interface GetNewslettersParams {
  status?: NewsletterStatus;
  page?: number;
  pageSize?: number;
}

export interface GetSubscriptionsParams {
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/** Newsletter subscribe timeout (ms) - backend may be slow on cold start */
const SUBSCRIBE_TIMEOUT_MS = 30000;

/**
 * Subscribe to newsletter
 */
export const subscribe = async (email: string): Promise<NewsletterSubscription> => {
  const response = await apiClient.post<{ success: true; data: NewsletterSubscription }>(
    '/api/newsletter/subscribe',
    { email },
    { timeout: SUBSCRIBE_TIMEOUT_MS }
  );
  return response.data.data;
};

/**
 * Unsubscribe from newsletter
 */
export const unsubscribe = async (token: string): Promise<NewsletterSubscription> => {
  const response = await apiClient.post<{ success: true; data: NewsletterSubscription }>(
    '/api/newsletter/unsubscribe',
    { token }
  );
  return response.data.data;
};

/**
 * Get user's subscription
 */
export const getSubscription = async (): Promise<NewsletterSubscription> => {
  const response = await apiClient.get<{ success: true; data: NewsletterSubscription }>(
    '/api/newsletter/subscription'
  );
  return response.data.data;
};

/**
 * Get all newsletters (admin only)
 */
export const getNewsletters = async (
  params?: GetNewslettersParams
): Promise<Newsletter[]> => {
  const response = await apiClient.get<{ success: true; data: Newsletter[] }>(
    '/api/newsletter',
    params ? { params } : undefined
  );
  return response.data.data;
};

/**
 * Get newsletter by ID (admin only)
 */
export const getNewsletterById = async (id: string): Promise<Newsletter> => {
  const response = await apiClient.get<{ success: true; data: Newsletter }>(
    `/api/newsletter/${id}`
  );
  return response.data.data;
};

/**
 * Create newsletter (admin only)
 */
export const createNewsletter = async (
  data: CreateNewsletterData
): Promise<Newsletter> => {
  const response = await apiClient.post<{ success: true; data: Newsletter }>(
    '/api/newsletter',
    data
  );
  return response.data.data;
};

/**
 * Update newsletter (admin only)
 */
export const updateNewsletter = async (
  id: string,
  data: UpdateNewsletterData
): Promise<Newsletter> => {
  const response = await apiClient.put<{ success: true; data: Newsletter }>(
    `/api/newsletter/${id}`,
    data
  );
  return response.data.data;
};

/**
 * Send newsletter (admin only)
 */
export const sendNewsletter = async (id: string): Promise<Newsletter> => {
  const response = await apiClient.post<{ success: true; data: Newsletter }>(
    `/api/newsletter/${id}/send`
  );
  return response.data.data;
};

/**
 * Get all subscriptions (admin only)
 */
export const getSubscriptions = async (
  params?: GetSubscriptionsParams
): Promise<NewsletterSubscription[]> => {
  const response = await apiClient.get<{ success: true; data: NewsletterSubscription[] }>(
    '/api/newsletter/subscriptions',
    params ? { params } : undefined
  );
  return response.data.data;
};

/**
 * Schedule newsletter (admin only)
 */
export const scheduleNewsletter = async (
  id: string,
  scheduledAt: Date
): Promise<Newsletter> => {
  const response = await apiClient.post<{ success: true; data: Newsletter }>(
    `/api/newsletter/${id}/schedule`,
    { scheduledAt: scheduledAt.toISOString() }
  );
  return response.data.data;
};
