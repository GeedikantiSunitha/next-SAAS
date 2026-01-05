/**
 * Payment Hooks Tests (TDD)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as paymentApi from '../../api/payments';
import {
  useCreatePayment,
  usePayments,
  usePayment,
  useCapturePayment,
  useRefundPayment,
} from '../../hooks/usePayments';

// Mock the API
vi.mock('../../api/payments', () => ({
  createPayment: vi.fn(),
  getPayments: vi.fn(),
  getPaymentById: vi.fn(),
  capturePayment: vi.fn(),
  refundPayment: vi.fn(),
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

describe('usePayments Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreatePayment', () => {
    it('should create payment', async () => {
      const mockPayment = {
        id: 'pay-1',
        amount: 100,
        currency: 'USD' as const,
        status: 'PENDING' as const,
        clientSecret: 'pi_secret_123',
      };

      vi.mocked(paymentApi.createPayment).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => useCreatePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        amount: 100,
        currency: 'USD',
        description: 'Test payment',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(paymentApi.createPayment).toHaveBeenCalledWith({
        amount: 100,
        currency: 'USD',
        description: 'Test payment',
      });
      expect(result.current.data).toEqual(mockPayment);
    });
  });

  describe('usePayments', () => {
    it('should fetch payments', async () => {
      const mockResponse = {
        payments: [
          {
            id: 'pay-1',
            amount: 100,
            status: 'SUCCEEDED' as const,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      vi.mocked(paymentApi.getPayments).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(paymentApi.getPayments).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should fetch payments with filters', async () => {
      const mockResponse = {
        payments: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      vi.mocked(paymentApi.getPayments).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePayments({ status: 'SUCCEEDED' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(paymentApi.getPayments).toHaveBeenCalledWith({ status: 'SUCCEEDED' });
    });
  });

  describe('usePayment', () => {
    it('should fetch payment by ID', async () => {
      const mockPayment = {
        id: 'pay-1',
        amount: 100,
        status: 'SUCCEEDED' as const,
      };

      vi.mocked(paymentApi.getPaymentById).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => usePayment('pay-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(paymentApi.getPaymentById).toHaveBeenCalledWith('pay-1');
      expect(result.current.data).toEqual(mockPayment);
    });
  });

  describe('useCapturePayment', () => {
    it('should capture payment', async () => {
      const mockPayment = {
        id: 'pay-1',
        status: 'SUCCEEDED' as const,
      };

      vi.mocked(paymentApi.capturePayment).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => useCapturePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'pay-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(paymentApi.capturePayment).toHaveBeenCalledWith('pay-1', undefined);
      expect(result.current.data).toEqual(mockPayment);
    });
  });

  describe('useRefundPayment', () => {
    it('should refund payment', async () => {
      const mockPayment = {
        id: 'pay-1',
        status: 'REFUNDED' as const,
      };

      vi.mocked(paymentApi.refundPayment).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => useRefundPayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'pay-1', amount: 50 });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(paymentApi.refundPayment).toHaveBeenCalledWith('pay-1', { amount: 50 });
      expect(result.current.data).toEqual(mockPayment);
    });
  });
});
