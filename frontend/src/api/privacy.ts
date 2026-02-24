/**
 * Privacy Center API Client
 */

import axios from 'axios';

// Use same backend as auth (VITE_API_BASE_URL). Default 3001, not 5000.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

export interface PrivacyCenterOverview {
  user: {
    id: string;
    email: string;
    createdAt: string;
    dataRetentionDays: number;
  };
  dataCategories: Array<{
    category: string;
    description: string;
    count: number;
    lastUpdated: string;
    fields?: string[];
    purpose?: string;
    retention?: string;
  }>;
  consents: Array<{
    type: string;
    granted: boolean;
    version: string;
    grantedAt?: string;
    expiresAt?: string;
  }>;
  privacyPreferences: {
    emailMarketing: boolean;
    smsMarketing: boolean;
    pushNotifications: boolean;
    shareWithPartners: boolean;
    profileVisibility: string;
    newsletterSubscription?: boolean;
    shareForAnalytics?: boolean;
    shareForAdvertising?: boolean;
    showActivityStatus?: boolean;
  };
  dataRequests: {
    exports: Array<{
      id: string;
      status: string;
      requestedAt: string;
      completedAt?: string;
      downloadUrl?: string;
    }>;
    deletions: Array<{
      id: string;
      status: string;
      requestedAt: string;
      scheduledFor?: string;
    }>;
  };
  cookiePreferences: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
  connectedAccounts: Array<{
    provider: string;
    connectedAt: string;
  }>;
  recentAccess: Array<{
    accessedBy: string;
    accessType: string;
    dataCategory: string;
    purpose: string;
    timestamp: string;
  }>;
  metrics: {
    totalDataPoints: number;
    activeConsents: number;
    pendingRequests: number;
    daysUntilDeletion?: number;
  };
}

export interface DataCategory {
  category: string;
  description: string;
  fields: string[];
  purpose: string;
  retention: string;
  count: number;
}

export interface AccessLogEntry {
  id: string;
  accessedBy: string;
  accessType: string;
  dataCategory: string;
  purpose: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface PrivacyMetrics {
  dataCollection: {
    totalDataPoints: number;
    byCategory: Record<string, number>;
    lastUpdated: string;
  };
  consents: {
    total: number;
    granted: number;
    revoked: number;
    expiringSoon: number;
  };
  requests: {
    totalExports: number;
    totalDeletions: number;
    pendingExports: number;
    pendingDeletions: number;
  };
  privacy: {
    profileVisibility: string;
    dataSharing: boolean;
    marketingOptOut: boolean;
  };
  retention: {
    daysUntilDeletion?: number;
    scheduledDeletionDate?: string;
    dataRetentionPeriod: number;
  };
}

class PrivacyApi {
  private axios = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    withCredentials: true,
  });

  /**
   * Get complete privacy overview
   */
  async getPrivacyOverview(): Promise<PrivacyCenterOverview> {
    const response = await this.axios.get('/privacy-center/overview');
    return response.data.data;
  }

  /**
   * Get detailed data categories
   */
  async getDataCategories(): Promise<DataCategory[]> {
    const response = await this.axios.get('/privacy-center/data-categories');
    return response.data.data;
  }

  /**
   * Get access log with pagination
   */
  async getAccessLog(params?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    accessType?: string;
    dataCategory?: string;
  }): Promise<{
    entries: AccessLogEntry[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await this.axios.get('/privacy-center/access-log', { params });
    return response.data.data;
  }

  /**
   * Get privacy metrics
   */
  async getPrivacyMetrics(): Promise<PrivacyMetrics> {
    const response = await this.axios.get('/privacy-center/metrics');
    return response.data.data;
  }

  /**
   * Update privacy preferences
   */
  async updatePrivacyPreferences(preferences: Partial<{
    emailMarketing: boolean;
    smsMarketing: boolean;
    pushNotifications: boolean;
    newsletterSubscription: boolean;
    shareWithPartners: boolean;
    shareForAnalytics: boolean;
    shareForAdvertising: boolean;
    profileVisibility: string;
    showActivityStatus: boolean;
  }>): Promise<any> {
    const response = await this.axios.post('/privacy-center/privacy-preferences', preferences);
    return response.data;
  }

  /**
   * Clear privacy cache
   */
  async clearCache(): Promise<void> {
    await this.axios.post('/privacy-center/clear-cache');
  }

  /**
   * Request data export
   */
  async requestDataExport(): Promise<{ id: string; message: string }> {
    const response = await this.axios.post('/gdpr/export');
    return response.data;
  }

  /**
   * Request account deletion
   */
  async requestAccountDeletion(reason?: string): Promise<{ id: string; message: string }> {
    const response = await this.axios.post('/gdpr/deletion', { reason, deletionType: 'SOFT' });
    return response.data;
  }

  /**
   * Update consent
   */
  async updateConsent(consentType: string, granted: boolean): Promise<any> {
    const response = await this.axios.post('/gdpr/consents/update-version', {
      consentType,
      granted,
    });
    return response.data;
  }

  /**
   * Unlink an OAuth provider from the current account
   */
  async unlinkOAuthAccount(provider: string): Promise<void> {
    await this.axios.post('/auth/oauth/unlink', { provider });
  }

  /**
   * Update cookie preferences
   */
  async updateCookiePreferences(preferences: {
    essential?: boolean;
    analytics?: boolean;
    marketing?: boolean;
    functional?: boolean;
  }): Promise<any> {
    const response = await this.axios.post('/gdpr/cookie-consent', preferences);
    return response.data;
  }
}

export const privacyApi = new PrivacyApi();