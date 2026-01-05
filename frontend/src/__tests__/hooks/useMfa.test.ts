/**
 * MFA Hooks Tests (TDD)
 * 
 * Comprehensive tests for MFA React hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useMfaMethods,
  useSetupTotp,
  useEnableMfa,
  useDisableMfa,
  useGenerateBackupCodes,
  useSendEmailOtp,
} from '../../hooks/useMfa';
import { mfaApi } from '../../api/mfa';

// Mock the MFA API
vi.mock('../../api/mfa');
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

describe('MFA Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMfaMethods', () => {
    it('should fetch MFA methods successfully', async () => {
      const mockMethods = [
        {
          id: '1',
          method: 'TOTP' as const,
          isEnabled: true,
          isPrimary: true,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      vi.mocked(mfaApi.getMfaMethods).mockResolvedValue({
        success: true,
        data: { methods: mockMethods },
      });

      const { result } = renderHook(() => useMfaMethods(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMethods);
      expect(mfaApi.getMfaMethods).toHaveBeenCalledTimes(1);
    });

    it('should handle empty methods list', async () => {
      vi.mocked(mfaApi.getMfaMethods).mockResolvedValue({
        success: true,
        data: { methods: [] },
      });

      const { result } = renderHook(() => useMfaMethods(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      vi.mocked(mfaApi.getMfaMethods).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMfaMethods(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useSetupTotp', () => {
    it('should setup TOTP successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCodeUrl: 'data:image/png;base64,...',
          backupCodes: ['12345678', '87654321'],
        },
      };

      vi.mocked(mfaApi.setupTotp).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSetupTotp(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mfaApi.setupTotp).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle setup errors', async () => {
      vi.mocked(mfaApi.setupTotp).mockRejectedValue(new Error('Setup failed'));

      const { result } = renderHook(() => useSetupTotp(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useEnableMfa', () => {
    it('should enable TOTP MFA successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'MFA enabled successfully',
      };

      vi.mocked(mfaApi.enableMfa).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEnableMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ method: 'TOTP', code: '123456' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mfaApi.enableMfa).toHaveBeenCalledWith('TOTP', '123456');
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should enable Email MFA successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'MFA enabled successfully',
      };

      vi.mocked(mfaApi.enableMfa).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEnableMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ method: 'EMAIL', code: '654321' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mfaApi.enableMfa).toHaveBeenCalledWith('EMAIL', '654321');
    });
  });

  describe('useDisableMfa', () => {
    it('should disable TOTP MFA successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'MFA disabled successfully',
      };

      vi.mocked(mfaApi.disableMfa).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDisableMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('TOTP');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mfaApi.disableMfa).toHaveBeenCalledWith('TOTP');
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('useGenerateBackupCodes', () => {
    it('should generate backup codes successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          codes: ['12345678', '87654321', '11223344'],
        },
      };

      vi.mocked(mfaApi.generateBackupCodes).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGenerateBackupCodes(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mfaApi.generateBackupCodes).toHaveBeenCalledTimes(1);
      expect(result.current.data?.data.codes).toHaveLength(3);
    });
  });

  describe('useSendEmailOtp', () => {
    it('should send email OTP successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'OTP sent to your email',
        },
      };

      vi.mocked(mfaApi.sendEmailOtp).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSendEmailOtp(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mfaApi.sendEmailOtp).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockResponse);
    });
  });
});
