/**
 * Sentry Configuration
 * 
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import config from './index';

/**
 * Initialize Sentry
 */
export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn || dsn === 'your-sentry-dsn-here') {
    console.log('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: config.nodeEnv,
    integrations: [
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    // Profiling
    profilesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
  });
};

export default Sentry;


