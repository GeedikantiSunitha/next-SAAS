/**
 * GDPR Hooks
 * 
 * React Query hooks for GDPR compliance operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  gdprApi,
  type ConsentType,
  type DeletionType,
  type ConsentRecord,
  type DataDeletionRequest,
  type DataExportRequest,
} from '../api/gdpr';
import { useToast } from './use-toast';

/**
 * Query keys for GDPR
 */
export const gdprKeys = {
  all: ['gdpr'] as const,
  consents: () => [...gdprKeys.all, 'consents'] as const,
  consent: (type: ConsentType) => [...gdprKeys.consents(), type] as const,
  hasConsent: (type: ConsentType) => [...gdprKeys.consents(), 'check', type] as const,
  deletions: () => [...gdprKeys.all, 'deletions'] as const,
  exports: () => [...gdprKeys.all, 'exports'] as const,
};

/**
 * Hook to fetch user's consents
 */
export const useConsents = () => {
  return useQuery({
    queryKey: gdprKeys.consents(),
    queryFn: async () => {
      const response = await gdprApi.getConsents();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

/**
 * Hook to check if user has specific consent
 */
export const useHasConsent = (consentType: ConsentType) => {
  return useQuery({
    queryKey: gdprKeys.hasConsent(consentType),
    queryFn: async () => {
      const response = await gdprApi.hasConsent(consentType);
      return response.data.hasConsent;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to grant consent
 */
export const useGrantConsent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (consentType: ConsentType) =>
      gdprApi.grantConsent({ consentType }),
    onSuccess: (data, consentType) => {
      // Invalidate consents list and specific consent check
      queryClient.invalidateQueries({ queryKey: gdprKeys.consents() });
      queryClient.invalidateQueries({ queryKey: gdprKeys.hasConsent(consentType) });
      toast({
        title: 'Success',
        description: data.message || 'Consent granted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to grant consent',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to revoke consent
 */
export const useRevokeConsent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (consentType: ConsentType) =>
      gdprApi.revokeConsent(consentType),
    onSuccess: (data, consentType) => {
      // Invalidate consents list and specific consent check
      queryClient.invalidateQueries({ queryKey: gdprKeys.consents() });
      queryClient.invalidateQueries({ queryKey: gdprKeys.hasConsent(consentType) });
      toast({
        title: 'Success',
        description: data.message || 'Consent revoked successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to revoke consent',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to fetch user's deletion requests
 */
export const useDeletionRequests = () => {
  return useQuery({
    queryKey: gdprKeys.deletions(),
    queryFn: async () => {
      const response = await gdprApi.getDeletions();
      return response.data;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
};

/**
 * Hook to request data deletion
 */
export const useRequestDeletion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: { deletionType?: DeletionType; reason?: string }) =>
      gdprApi.requestDeletion(request),
    onSuccess: (data) => {
      // Invalidate deletions list
      queryClient.invalidateQueries({ queryKey: gdprKeys.deletions() });
      toast({
        title: 'Success',
        description: data.message || 'Data deletion requested. Please check your email to confirm.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to request data deletion',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to confirm data deletion
 */
export const useConfirmDeletion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (token: string) => gdprApi.confirmDeletion(token),
    onSuccess: (data) => {
      // Invalidate deletions list
      queryClient.invalidateQueries({ queryKey: gdprKeys.deletions() });
      toast({
        title: 'Success',
        description: data.message || 'Data deletion confirmed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to confirm deletion',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to fetch user's export requests
 */
export const useExportRequests = () => {
  return useQuery({
    queryKey: gdprKeys.exports(),
    queryFn: async () => {
      const response = await gdprApi.getExports();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to request data export
 */
export const useRequestExport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => gdprApi.requestExport(),
    onSuccess: (data) => {
      // Invalidate exports list
      queryClient.invalidateQueries({ queryKey: gdprKeys.exports() });
      toast({
        title: 'Success',
        description: data.message || 'Data export requested successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to request data export',
        variant: 'destructive',
      });
    },
  });
};
