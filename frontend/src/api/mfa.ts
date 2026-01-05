/**
 * MFA API Service
 * 
 * Multi-Factor Authentication API endpoints
 */

import apiClient from './client';

export interface MfaMethod {
  id: string;
  method: 'TOTP' | 'EMAIL';
  isEnabled: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface SetupTotpResponse {
  success: boolean;
  data: {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  };
}

export interface SetupEmailMfaResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export interface VerifyMfaResponse {
  success: boolean;
  data: {
    valid: boolean;
  };
}

export interface EnableMfaResponse {
  success: boolean;
  message: string;
}

export interface DisableMfaResponse {
  success: boolean;
  message: string;
}

export interface GetMfaMethodsResponse {
  success: boolean;
  data: {
    methods: MfaMethod[];
  };
}

export interface GenerateBackupCodesResponse {
  success: boolean;
  data: {
    codes: string[];
  };
}

export interface SendEmailOtpResponse {
  success: boolean;
  data: {
    message: string;
    otp?: string; // Only in development/testing
  };
}

export const mfaApi = {
  /**
   * Setup TOTP MFA
   * Returns secret, QR code URL, and backup codes
   */
  setupTotp: async (): Promise<SetupTotpResponse> => {
    const response = await apiClient.post<SetupTotpResponse>('/api/auth/mfa/setup/totp');
    return response.data;
  },

  /**
   * Setup Email MFA
   */
  setupEmailMfa: async (): Promise<SetupEmailMfaResponse> => {
    const response = await apiClient.post<SetupEmailMfaResponse>('/api/auth/mfa/setup/email');
    return response.data;
  },

  /**
   * Verify MFA code
   */
  verifyMfa: async (method: 'TOTP' | 'EMAIL', code: string): Promise<VerifyMfaResponse> => {
    const response = await apiClient.post<VerifyMfaResponse>('/api/auth/mfa/verify', {
      method,
      code,
    });
    return response.data;
  },

  /**
   * Enable MFA method
   */
  enableMfa: async (method: 'TOTP' | 'EMAIL', code: string): Promise<EnableMfaResponse> => {
    const response = await apiClient.post<EnableMfaResponse>('/api/auth/mfa/enable', {
      method,
      code,
    });
    return response.data;
  },

  /**
   * Disable MFA method
   */
  disableMfa: async (method: 'TOTP' | 'EMAIL'): Promise<DisableMfaResponse> => {
    const response = await apiClient.post<DisableMfaResponse>('/api/auth/mfa/disable', {
      method,
    });
    return response.data;
  },

  /**
   * Get user's MFA methods
   */
  getMfaMethods: async (): Promise<GetMfaMethodsResponse> => {
    const response = await apiClient.get<GetMfaMethodsResponse>('/api/auth/mfa/methods');
    return response.data;
  },

  /**
   * Generate backup codes
   */
  generateBackupCodes: async (): Promise<GenerateBackupCodesResponse> => {
    const response = await apiClient.post<GenerateBackupCodesResponse>('/api/auth/mfa/backup-codes');
    return response.data;
  },

  /**
   * Verify backup code
   */
  verifyBackupCode: async (code: string): Promise<VerifyMfaResponse> => {
    const response = await apiClient.post<VerifyMfaResponse>('/api/auth/mfa/verify-backup', {
      code,
    });
    return response.data;
  },

  /**
   * Send email OTP
   */
  sendEmailOtp: async (): Promise<SendEmailOtpResponse> => {
    const response = await apiClient.post<SendEmailOtpResponse>('/api/auth/mfa/send-email-otp');
    return response.data;
  },
};
