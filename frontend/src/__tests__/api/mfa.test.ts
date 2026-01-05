/**
 * MFA API Service Tests (TDD)
 * 
 * Comprehensive tests for MFA API integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mfaApi } from '../../api/mfa';
import apiClient from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedApiClient = apiClient as any;

describe('MFA API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setupTotp', () => {
    it('should call correct endpoint and return TOTP setup data', async () => {
      const mockResponse = {
        success: true,
        data: {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
          backupCodes: ['12345678', '87654321'],
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.setupTotp();

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/setup/totp');
      expect(result).toEqual(mockResponse);
      expect(result.data.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.data.qrCodeUrl).toContain('data:image');
      expect(result.data.backupCodes).toHaveLength(2);
    });

    it('should handle API errors', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(mfaApi.setupTotp()).rejects.toThrow('Network error');
    });
  });

  describe('setupEmailMfa', () => {
    it('should call correct endpoint and return success', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Email MFA setup initiated',
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.setupEmailMfa();

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/setup/email');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyMfa', () => {
    it('should verify TOTP code', async () => {
      const mockResponse = {
        success: true,
        data: {
          valid: true,
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.verifyMfa('TOTP', '123456');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/verify', {
        method: 'TOTP',
        code: '123456',
      });
      expect(result.data.valid).toBe(true);
    });

    it('should verify Email OTP code', async () => {
      const mockResponse = {
        success: true,
        data: {
          valid: true,
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.verifyMfa('EMAIL', '654321');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/verify', {
        method: 'EMAIL',
        code: '654321',
      });
      expect(result.data.valid).toBe(true);
    });

    it('should return false for invalid code', async () => {
      const mockResponse = {
        success: true,
        data: {
          valid: false,
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.verifyMfa('TOTP', '000000');

      expect(result.data.valid).toBe(false);
    });
  });

  describe('enableMfa', () => {
    it('should enable TOTP MFA', async () => {
      const mockResponse = {
        success: true,
        message: 'MFA enabled successfully',
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.enableMfa('TOTP', '123456');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/enable', {
        method: 'TOTP',
        code: '123456',
      });
      expect(result.message).toBe('MFA enabled successfully');
    });

    it('should enable Email MFA', async () => {
      const mockResponse = {
        success: true,
        message: 'MFA enabled successfully',
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.enableMfa('EMAIL', '654321');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/enable', {
        method: 'EMAIL',
        code: '654321',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('disableMfa', () => {
    it('should disable TOTP MFA', async () => {
      const mockResponse = {
        success: true,
        message: 'MFA disabled successfully',
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.disableMfa('TOTP');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/disable', {
        method: 'TOTP',
      });
      expect(result.message).toBe('MFA disabled successfully');
    });

    it('should disable Email MFA', async () => {
      const mockResponse = {
        success: true,
        message: 'MFA disabled successfully',
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.disableMfa('EMAIL');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/disable', {
        method: 'EMAIL',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getMfaMethods', () => {
    it('should get user MFA methods', async () => {
      const mockResponse = {
        success: true,
        data: {
          methods: [
            {
              id: '1',
              method: 'TOTP',
              isEnabled: true,
              isPrimary: true,
              createdAt: '2025-01-01T00:00:00Z',
            },
            {
              id: '2',
              method: 'EMAIL',
              isEnabled: false,
              isPrimary: false,
              createdAt: '2025-01-01T00:00:00Z',
            },
          ],
        },
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.getMfaMethods();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/auth/mfa/methods');
      expect(result.data.methods).toHaveLength(2);
      expect(result.data.methods[0].method).toBe('TOTP');
      expect(result.data.methods[0].isEnabled).toBe(true);
    });

    it('should return empty array when no methods exist', async () => {
      const mockResponse = {
        success: true,
        data: {
          methods: [],
        },
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.getMfaMethods();

      expect(result.data.methods).toEqual([]);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate backup codes', async () => {
      const mockResponse = {
        success: true,
        data: {
          codes: ['12345678', '87654321', '11223344', '44332211'],
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.generateBackupCodes();

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/backup-codes');
      expect(result.data.codes).toHaveLength(4);
      expect(result.data.codes[0]).toBe('12345678');
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup code', async () => {
      const mockResponse = {
        success: true,
        data: {
          valid: true,
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.verifyBackupCode('12345678');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/verify-backup', {
        code: '12345678',
      });
      expect(result.data.valid).toBe(true);
    });

    it('should return false for invalid backup code', async () => {
      const mockResponse = {
        success: true,
        data: {
          valid: false,
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.verifyBackupCode('00000000');

      expect(result.data.valid).toBe(false);
    });
  });

  describe('sendEmailOtp', () => {
    it('should send email OTP', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'OTP sent to your email',
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await mfaApi.sendEmailOtp();

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/mfa/send-email-otp');
      expect(result.data.message).toBe('OTP sent to your email');
    });
  });
});
