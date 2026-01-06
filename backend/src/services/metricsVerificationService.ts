/**
 * Metrics Verification Service
 * 
 * Verifies that metrics collection is working correctly
 */

import { register } from '../middleware/metrics';
import logger from '../utils/logger';

export interface MetricsVerificationResult {
  success: boolean;
  endpoint?: string;
  accessible?: boolean;
  hasHelpComments?: boolean;
  hasTypeComments?: boolean;
  isValidFormat?: boolean;
  contentType?: string;
  hasRequestMetrics?: boolean;
  hasErrorMetrics?: boolean;
  hasLatencyMetrics?: boolean;
  missingMetrics?: string[];
  metricsWithValues?: number;
  error?: string;
  timestamp?: string;
}

const REQUIRED_METRICS = [
  'http_requests_total',
  'http_request_errors_total',
  'http_request_duration_seconds',
];

/**
 * Verify metrics endpoint is accessible
 */
export const verifyMetricsEndpoint = async (): Promise<MetricsVerificationResult> => {
  try {
    await register.metrics();
    return {
      success: true,
      endpoint: '/api/metrics',
      accessible: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Metrics endpoint verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      endpoint: '/api/metrics',
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Verify metrics format is valid Prometheus format
 */
export const verifyMetricsFormat = async (): Promise<MetricsVerificationResult> => {
  try {
    const metrics = await register.metrics();
    const contentType = register.contentType;

    const hasHelpComments = metrics.includes('# HELP');
    const hasTypeComments = metrics.includes('# TYPE');
    const isValidFormat = hasHelpComments && hasTypeComments;

    return {
      success: isValidFormat,
      hasHelpComments,
      hasTypeComments,
      isValidFormat,
      contentType,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Metrics format verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      isValidFormat: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Verify metrics content includes required metrics
 */
export const verifyMetricsContent = async (): Promise<MetricsVerificationResult> => {
  try {
    const metricsJson = await register.getMetricsAsJSON();
    const metricNames = metricsJson.map((m: any) => m.name);

    const hasRequestMetrics = metricNames.includes('http_requests_total');
    const hasErrorMetrics = metricNames.includes('http_request_errors_total');
    const hasLatencyMetrics = metricNames.includes('http_request_duration_seconds');

    const missingMetrics = REQUIRED_METRICS.filter((name) => !metricNames.includes(name));

    // Count metrics with values
    const metricsWithValues = metricsJson.filter((m: any) => {
      return m.values && Array.isArray(m.values) && m.values.length > 0;
    }).length;

    const success = missingMetrics.length === 0 && metricsWithValues > 0;

    return {
      success,
      hasRequestMetrics,
      hasErrorMetrics,
      hasLatencyMetrics,
      missingMetrics,
      metricsWithValues,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Metrics content verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Perform complete metrics verification
 */
export const verifyMetrics = async (): Promise<{
  endpoint: MetricsVerificationResult;
  format: MetricsVerificationResult;
  content: MetricsVerificationResult;
  overall: boolean;
}> => {
  const [endpoint, format, content] = await Promise.all([
    verifyMetricsEndpoint(),
    verifyMetricsFormat(),
    verifyMetricsContent(),
  ]);

  const overall = endpoint.success && format.success && content.success;

  return {
    endpoint,
    format,
    content,
    overall,
  };
};
