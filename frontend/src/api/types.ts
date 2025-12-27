/**
 * API Response Types
 * 
 * Standard response format from backend template
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export interface ApiError {
  success: false;
  error: string;
  requestId?: string;
  stack?: string; // Only in development
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
}

