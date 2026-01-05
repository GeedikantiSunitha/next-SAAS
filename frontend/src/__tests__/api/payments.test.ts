/**
 * Payment API Client Tests (TDD)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as paymentApi from '../../api/payments';
import apiClient from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('Payment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'pay-1',
          amount: 100.00,
          currency: 'USD',
          status: 'PENDING',
          clientSecret: 'pi_secret_123',
        },
      };

      (apiClient.post as any).mockResolvedValue({ data: mockResponse });

      const result = await paymentApi.createPayment({
        amount: 100,
        currency: 'USD',
        description: 'Test payment',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/payments', {
        amount: 100,
        currency: 'USD',
        description: 'Test payment',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPayments', () => {
    it('should get user payments', async () => {
      const mockResponse = {
        success: true,
        data: {
          payments: [
            {
              id: 'pay-1',
              amount: 100.00,
              status: 'SUCCEEDED',
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await paymentApi.getPayments();

      expect(apiClient.get).toHaveBeenCalledWith('/api/payments', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should get payments with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          payments: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await paymentApi.getPayments({ status: 'SUCCEEDED', page: 2 });

      expect(apiClient.get).toHaveBeenCalledWith('/api/payments', {
        params: { status: 'SUCCEEDED', page: 2 },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPaymentById', () => {
    it('should get payment by ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'pay-1',
          amount: 100.00,
          status: 'SUCCEEDED',
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: mockResponse });

      const result = await paymentApi.getPaymentById('pay-1');

      expect(apiClient.get).toHaveBeenCalledWith('/api/payments/pay-1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('capturePayment', () => {
    it('should capture payment', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'pay-1',
          status: 'SUCCEEDED',
        },
      };

      (apiClient.post as any).mockResolvedValue({ data: mockResponse });

      const result = await paymentApi.capturePayment('pay-1');

      expect(apiClient.post).toHaveBeenCalledWith('/api/payments/pay-1/capture', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should capture payment with amount', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'pay-1',
          status: 'SUCCEEDED',
        },
      };

      (apiClient.post as any).mockResolvedValue({ data: mockResponse });

      const result = await paymentApi.capturePayment('pay-1', 50);

      expect(apiClient.post).toHaveBeenCalledWith('/api/payments/pay-1/capture', {
        amount: 50,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
