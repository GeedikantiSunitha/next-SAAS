/**
 * Payment API Client
 */

import apiClient from './client';

export type PaymentProvider = 'STRIPE' | 'RAZORPAY' | 'CASHFREE';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'EMI';
export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP';

export interface Payment {
  id: string;
  userId: string;
  provider: PaymentProvider;
  providerPaymentId?: string | null;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  refundedAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  capturedAt?: string | null;
  refundedAt?: string | null;
  clientSecret?: string; // For Stripe payment intents
}

export interface CreatePaymentData {
  amount: number;
  currency: Currency;
  description?: string;
  paymentMethod?: PaymentMethod;
  provider?: PaymentProvider;
  metadata?: Record<string, any>;
}

export interface GetPaymentsParams {
  status?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

/** Backend returns totalCount, page, pageSize, totalPages at top level. */
export interface PaymentsResponse {
  payments: Payment[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create a new payment
 */
export const createPayment = async (data: CreatePaymentData): Promise<Payment> => {
  const response = await apiClient.post<{ success: true; data: Payment }>(
    '/api/payments',
    data
  );
  return response.data.data;
};

/**
 * Get user's payments
 */
export const getPayments = async (
  params?: GetPaymentsParams
): Promise<PaymentsResponse> => {
  const response = await apiClient.get<{ success: true; data: PaymentsResponse }>(
    '/api/payments',
    params ? { params } : undefined
  );
  return response.data.data;
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (id: string): Promise<Payment> => {
  const response = await apiClient.get<{ success: true; data: Payment }>(
    `/api/payments/${id}`
  );
  return response.data.data;
};

/**
 * Capture a payment
 */
export const capturePayment = async (id: string, amount?: number): Promise<Payment> => {
  const response = await apiClient.post<{ success: true; data: Payment }>(
    `/api/payments/${id}/capture`,
    amount ? { amount } : undefined
  );
  return response.data.data;
};

/**
 * Refund a payment
 */
export const refundPayment = async (
  id: string,
  data: { amount?: number; reason?: string }
): Promise<Payment> => {
  const response = await apiClient.post<{ success: true; data: Payment }>(
    `/api/payments/${id}/refund`,
    data
  );
  return response.data.data;
};
