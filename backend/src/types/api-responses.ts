/**
 * API Response Type Definitions
 * 
 * Centralized type definitions for all API responses.
 * Use these types in tests and route handlers for type safety.
 */

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Login response - can be user directly or MFA required
 */
export interface LoginResponse {
  success: boolean;
  data: 
    | {
        // When MFA not required - user is returned directly
        id: string;
        email: string;
        name: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
      }
    | {
        // When MFA required
        requiresMfa: true;
        mfaMethod: 'TOTP' | 'EMAIL';
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
        };
      };
}

/**
 * User profile response
 */
export interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * MFA methods response
 */
export interface MfaMethodsResponse {
  success: boolean;
  data: {
    methods: Array<{
      method: 'TOTP' | 'EMAIL';
      isEnabled: boolean;
      isPrimary: boolean;
      createdAt: Date;
    }>;
  };
}

/**
 * Feature flags response
 */
export interface FeatureFlagsResponse {
  success: boolean;
  data: {
    flags: Array<{
      key: string;
      description: string | null;
      enabled: boolean;
      updatedAt: Date;
    }>;
  };
}

/**
 * Audit logs response
 */
export interface AuditLogsResponse {
  success: boolean;
  data: {
    logs: Array<{
      id: string;
      userId: string | null;
      action: string;
      resource: string;
      resourceId: string | null;
      ipAddress: string | null;
      userAgent: string | null;
      createdAt: Date;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Health check response
 */
export interface HealthResponse {
  success: boolean;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    services: {
      database: 'connected' | 'disconnected';
      email: 'configured' | 'not_configured';
    };
  };
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
}
