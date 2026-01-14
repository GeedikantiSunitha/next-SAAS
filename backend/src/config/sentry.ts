/**
 * Sentry Configuration
 * 
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import config from './index';
import logger from '../utils/logger';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * 
 * @description
 * Sets up Sentry integration for production error tracking.
 * Only initializes if SENTRY_DSN environment variable is configured.
 * 
 * @example
 * ```typescript
 * // In server.ts
 * initSentry();
 * ```
 */
export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn || dsn === 'your-sentry-dsn-here') {
    logger.info('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: config.nodeEnv,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    // Profiling
    profilesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
  });
};

export default Sentry;


