import apiClient from './client';

/**
 * Admin API Service
 * 
 * All admin endpoints require ADMIN or SUPER_ADMIN role
 */

export interface AdminDashboardStats {
  totalUsers: number;
  activeSessions: number;
  recentActivity: any[];
}

export interface AdminDashboardResponse {
  success: boolean;
  data: {
    stats: AdminDashboardStats;
  };
}

export const adminApi = {
  /**
   * Get admin dashboard stats
   */
  getDashboard: async (): Promise<AdminDashboardResponse> => {
    const response = await apiClient.get<AdminDashboardResponse>('/api/admin/dashboard');
    return response.data;
  },

  /**
   * Get users list
   */
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{
    success: boolean;
    data: {
      users: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> => {
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUser: async (userId: string): Promise<{ success: boolean; data: { user: any } }> => {
    const response = await apiClient.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Create user
   */
  createUser: async (userData: {
    email: string;
    password: string;
    name?: string;
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    isActive?: boolean;
  }): Promise<{ success: boolean; data: { user: any } }> => {
    const response = await apiClient.post('/api/admin/users', userData);
    return response.data;
  },

  /**
   * Update user
   */
  updateUser: async (
    userId: string,
    userData: {
      email?: string;
      name?: string;
      role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
      isActive?: boolean;
      password?: string;
    }
  ): Promise<{ success: boolean; data: { user: any } }> => {
    const response = await apiClient.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Delete user
   */
  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Get user sessions
   */
  getUserSessions: async (userId: string): Promise<{
    success: boolean;
    data: { sessions: any[] };
  }> => {
    const response = await apiClient.get(`/api/admin/users/${userId}/sessions`);
    return response.data;
  },

  /**
   * Revoke user session
   */
  revokeUserSession: async (
    userId: string,
    sessionId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/admin/users/${userId}/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Get user activity
   */
  getUserActivity: async (
    userId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    success: boolean;
    data: {
      activity: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> => {
    const response = await apiClient.get(`/api/admin/users/${userId}/activity`, { params });
    return response.data;
  },

  /**
   * Get system metrics
   */
  getSystemMetrics: async (): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get('/api/admin/metrics/system');
    return response.data;
  },

  /**
   * Get database metrics
   */
  getDatabaseMetrics: async (): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get('/api/admin/metrics/database');
    return response.data;
  },

  /**
   * Get API metrics
   */
  getApiMetrics: async (): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get('/api/admin/metrics/api');
    return response.data;
  },

  /**
   * Get recent errors
   */
  getRecentErrors: async (limit?: number): Promise<{ success: boolean; data: { errors: any[] } }> => {
    const response = await apiClient.get('/api/admin/errors/recent', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async (params?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      logs: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> => {
    const response = await apiClient.get('/api/admin/audit-logs', { params });
    return response.data;
  },

  /**
   * Export audit logs
   */
  exportAuditLogs: async (params: any, format: 'csv' | 'json'): Promise<Blob> => {
    const response = await apiClient.get('/api/admin/audit-logs/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get feature flags
   */
  getFeatureFlags: async (): Promise<{ success: boolean; data: { flags: any[] } }> => {
    const response = await apiClient.get('/api/admin/feature-flags');
    return response.data;
  },

  /**
   * Update feature flag
   */
  updateFeatureFlag: async (
    key: string,
    enabled: boolean
  ): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.put(`/api/admin/feature-flags/${key}`, { enabled });
    return response.data;
  },

  /**
   * Get payments
   */
  getPayments: async (params?: {
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      payments: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> => {
    const response = await apiClient.get('/api/admin/payments', { params });
    return response.data;
  },

  /**
   * Get subscriptions
   */
  getSubscriptions: async (params?: {
    userId?: string;
    status?: string;
  }): Promise<{ success: boolean; data: { subscriptions: any[] } }> => {
    const response = await apiClient.get('/api/admin/subscriptions', { params });
    return response.data;
  },

  /**
   * Get settings
   */
  getSettings: async (): Promise<{ success: boolean; data: { settings: any } }> => {
    const response = await apiClient.get('/api/admin/settings');
    return response.data;
  },

  /**
   * Update settings
   */
  updateSettings: async (settings: any): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.put('/api/admin/settings', { settings });
    return response.data;
  },
};

