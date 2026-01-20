import apiClient from './client';

/**
 * GDPR API Service
 * 
 * API client for GDPR compliance endpoints
 */

export type ConsentType = 
  | 'MARKETING_EMAILS'
  | 'ANALYTICS'
  | 'THIRD_PARTY_SHARING'
  | 'COOKIES'
  | 'TERMS_OF_SERVICE'
  | 'PRIVACY_POLICY';

export type DeletionType = 'SOFT' | 'HARD';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  deletionType: DeletionType;
  requestedAt: string;
  scheduledFor?: string;
  completedAt?: string;
  reason?: string;
  confirmedAt?: string;
  confirmationToken?: string;
  errorMessage?: string;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  requestedAt: string;
  completedAt?: string;
  expiresAt?: string;
  downloadUrl?: string;
  fileSize?: number;
  errorMessage?: string;
}

export interface GrantConsentRequest {
  consentType: ConsentType;
}

export interface RequestDeletionRequest {
  deletionType?: DeletionType;
  reason?: string;
}

export interface ConsentResponse {
  success: boolean;
  data: ConsentRecord;
  message?: string;
}

export interface ConsentsResponse {
  success: boolean;
  data: ConsentRecord[];
}

export interface HasConsentResponse {
  success: boolean;
  data: { hasConsent: boolean };
}

export interface DeletionRequestResponse {
  success: boolean;
  data: DataDeletionRequest;
  message?: string;
}

export interface DeletionsResponse {
  success: boolean;
  data: DataDeletionRequest[];
}

export interface ExportRequestResponse {
  success: boolean;
  data: DataExportRequest;
  message?: string;
}

export interface ExportsResponse {
  success: boolean;
  data: DataExportRequest[];
}

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface SaveCookieConsentRequest {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  version: string;
}

export interface CookieConsentResponse {
  success: boolean;
  data: CookiePreferences | null;
  message?: string;
}

/**
 * GDPR API client
 */
export const gdprApi = {
  /**
   * Grant consent
   * POST /api/gdpr/consents
   */
  grantConsent: async (request: GrantConsentRequest): Promise<ConsentResponse> => {
    const response = await apiClient.post<ConsentResponse>('/api/gdpr/consents', request);
    return response.data;
  },

  /**
   * Revoke consent
   * DELETE /api/gdpr/consents/:consentType
   */
  revokeConsent: async (consentType: ConsentType): Promise<ConsentResponse> => {
    const response = await apiClient.delete<ConsentResponse>(`/api/gdpr/consents/${consentType}`);
    return response.data;
  },

  /**
   * Get user's consents
   * GET /api/gdpr/consents
   */
  getConsents: async (): Promise<ConsentsResponse> => {
    const response = await apiClient.get<ConsentsResponse>('/api/gdpr/consents');
    return response.data;
  },

  /**
   * Check if user has specific consent
   * GET /api/gdpr/consents/:consentType/check
   */
  hasConsent: async (consentType: ConsentType): Promise<HasConsentResponse> => {
    const response = await apiClient.get<HasConsentResponse>(`/api/gdpr/consents/${consentType}/check`);
    return response.data;
  },

  /**
   * Request data deletion
   * POST /api/gdpr/deletion
   */
  requestDeletion: async (request: RequestDeletionRequest): Promise<DeletionRequestResponse> => {
    const response = await apiClient.post<DeletionRequestResponse>('/api/gdpr/deletion', request);
    return response.data;
  },

  /**
   * Get user's deletion requests
   * GET /api/gdpr/deletions
   */
  getDeletions: async (): Promise<DeletionsResponse> => {
    const response = await apiClient.get<DeletionsResponse>('/api/gdpr/deletions');
    return response.data;
  },

  /**
   * Confirm data deletion
   * POST /api/gdpr/deletion/confirm/:token
   */
  confirmDeletion: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/api/gdpr/deletion/confirm/${token}`
    );
    return response.data;
  },

  /**
   * Request data export
   * POST /api/gdpr/export
   */
  requestExport: async (): Promise<ExportRequestResponse> => {
    const response = await apiClient.post<ExportRequestResponse>('/api/gdpr/export');
    return response.data;
  },

  /**
   * Get user's export requests
   * GET /api/gdpr/exports
   */
  getExports: async (): Promise<ExportsResponse> => {
    const response = await apiClient.get<ExportsResponse>('/api/gdpr/exports');
    return response.data;
  },

  /**
   * Save cookie consent preferences
   * POST /api/gdpr/consents/cookies
   */
  saveCookieConsent: async (request: SaveCookieConsentRequest): Promise<CookieConsentResponse> => {
    const response = await apiClient.post<CookieConsentResponse>('/api/gdpr/consents/cookies', request);
    return response.data;
  },

  /**
   * Get cookie consent preferences
   * GET /api/gdpr/consents/cookies
   */
  getCookieConsent: async (): Promise<CookieConsentResponse> => {
    const response = await apiClient.get<CookieConsentResponse>('/api/gdpr/consents/cookies');
    return response.data;
  },
};
