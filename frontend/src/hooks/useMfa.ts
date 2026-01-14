/**
 * MFA Hooks
 * 
 * React Query hooks for MFA operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mfaApi } from '../api/mfa';
import { useToast } from './use-toast';

/**
 * Get user's MFA methods
 */
export const useMfaMethods = () => {
  return useQuery({
    queryKey: ['mfa', 'methods'],
    queryFn: async () => {
      const response = await mfaApi.getMfaMethods();
      return response.data.methods;
    },
  });
};

/**
 * Setup TOTP MFA mutation
 */
export const useSetupTotp = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => mfaApi.setupTotp(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa', 'methods'] });
      toast({
        title: 'TOTP Setup Initiated',
        description: 'Scan the QR code with your authenticator app',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to setup TOTP',
        variant: 'error',
      });
    },
  });
};

/**
 * Setup Email MFA mutation
 */
export const useSetupEmailMfa = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => mfaApi.setupEmailMfa(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa', 'methods'] });
      toast({
        title: 'Email MFA Setup Initiated',
        description: 'Check your email for the verification code',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to setup Email MFA',
        variant: 'error',
      });
    },
  });
};

/**
 * Enable MFA mutation
 */
export const useEnableMfa = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ method, code }: { method: 'TOTP' | 'EMAIL'; code: string }) =>
      mfaApi.enableMfa(method, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa', 'methods'] });
      toast({
        title: 'Success',
        description: 'MFA enabled successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to enable MFA',
        variant: 'error',
      });
    },
  });
};

/**
 * Disable MFA mutation
 */
export const useDisableMfa = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (method: 'TOTP' | 'EMAIL') => mfaApi.disableMfa(method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa', 'methods'] });
      toast({
        title: 'Success',
        description: 'MFA disabled successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to disable MFA',
        variant: 'error',
      });
    },
  });
};

/**
 * Generate backup codes mutation
 */
export const useGenerateBackupCodes = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => mfaApi.generateBackupCodes(),
    onSuccess: () => {
      toast({
        title: 'Backup Codes Generated',
        description: 'Save these codes in a safe place',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to generate backup codes',
        variant: 'error',
      });
    },
  });
};

/**
 * Send email OTP mutation
 */
export const useSendEmailOtp = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => mfaApi.sendEmailOtp(),
    onSuccess: () => {
      toast({
        title: 'OTP Sent',
        description: 'Check your email for the verification code',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send OTP',
        variant: 'error',
      });
    },
  });
};
