/**
 * Payment React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as paymentApi from '../api/payments';
import type {
  CreatePaymentData,
  GetPaymentsParams,
} from '../api/payments';

/**
 * Create a payment
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentData) => paymentApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

/**
 * Get user's payments
 */
export const usePayments = (params?: GetPaymentsParams) => {
  return useQuery({
    queryKey: ['payments', 'list', params],
    queryFn: () => paymentApi.getPayments(params),
  });
};

/**
 * Get payment by ID
 */
export const usePayment = (id: string) => {
  return useQuery({
    queryKey: ['payments', 'detail', id],
    queryFn: () => paymentApi.getPaymentById(id),
    enabled: !!id,
  });
};

/**
 * Capture a payment
 */
export const useCapturePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: number }) =>
      paymentApi.capturePayment(id, amount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'detail', variables.id] });
    },
  });
};

/**
 * Refund a payment
 */
export const useRefundPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount?: number; reason?: string }) =>
      paymentApi.refundPayment(id, { amount, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'detail', variables.id] });
    },
  });
};
