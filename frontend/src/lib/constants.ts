/**
 * Application Constants
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'App Template';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

// Feature Flags
export const ENABLE_REGISTRATION = import.meta.env.VITE_ENABLE_REGISTRATION !== 'false';
export const ENABLE_PASSWORD_RESET = import.meta.env.VITE_ENABLE_PASSWORD_RESET !== 'false';

/** Flags that exist in DB but are not implemented - hide from admin UI to avoid confusion */
export const FEATURE_FLAGS_HIDDEN_FROM_ADMIN = ['email_verification'] as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

