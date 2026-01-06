/**
 * Metrics Verification Service Tests
 * 
 * Tests for metrics verification service that validates metrics collection
 */

import {
  verifyMetricsEndpoint,
  verifyMetricsFormat,
  verifyMetricsContent,
} from '../../services/metricsVerificationService';
import { register } from '../../middleware/metrics';

// Mock the register from metrics middleware
jest.mock('../../middleware/metrics', () => {
  const mockRegister = {
    metrics: jest.fn(),
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    getMetricsAsJSON: jest.fn(),
  };
  return {
    register: mockRegister,
    metricsMiddleware: jest.fn(),
  };
});

describe('MetricsVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyMetricsEndpoint', () => {
    it('should verify metrics endpoint is accessible', async () => {
      const mockMetrics = '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\n';
      (register.metrics as jest.Mock) = jest.fn().mockResolvedValue(mockMetrics);

      const result = await verifyMetricsEndpoint();

      expect(result.success).toBe(true);
      expect(result.endpoint).toBe('/api/metrics');
      expect(result.accessible).toBe(true);
    });

    it('should detect when metrics endpoint fails', async () => {
      (register.metrics as jest.Mock) = jest.fn().mockRejectedValue(new Error('Metrics generation failed'));

      const result = await verifyMetricsEndpoint();

      expect(result.success).toBe(false);
      expect(result.accessible).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyMetricsFormat', () => {
    it('should verify Prometheus format is correct', async () => {
      const mockMetrics = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/health",status_code="200"} 100
`;

      (register.metrics as jest.Mock) = jest.fn().mockResolvedValue(mockMetrics);

      const result = await verifyMetricsFormat();

      expect(result.success).toBe(true);
      expect(result.hasHelpComments).toBe(true);
      expect(result.hasTypeComments).toBe(true);
      expect(result.isValidFormat).toBe(true);
    });

    it('should detect invalid Prometheus format', async () => {
      const mockMetrics = 'Invalid metrics format';

      (register.metrics as jest.Mock) = jest.fn().mockResolvedValue(mockMetrics);

      const result = await verifyMetricsFormat();

      expect(result.success).toBe(false);
      expect(result.isValidFormat).toBe(false);
    });

    it('should verify content type is correct', async () => {
      const mockMetrics = '# HELP test_metric Test metric\n# TYPE test_metric counter\n';
      (register.metrics as jest.Mock) = jest.fn().mockResolvedValue(mockMetrics);

      const result = await verifyMetricsFormat();

      expect(result.success).toBe(true);
      expect(result.contentType).toBe('text/plain; version=0.0.4; charset=utf-8');
    });
  });

  describe('verifyMetricsContent', () => {
    it('should verify required metrics are present', async () => {
      const mockMetricsJson = [
        {
          name: 'http_requests_total',
          type: 'counter',
          help: 'Total number of HTTP requests',
          values: [{ value: 100 }],
        },
        {
          name: 'http_request_errors_total',
          type: 'counter',
          help: 'Total number of HTTP request errors',
          values: [{ value: 5 }],
        },
        {
          name: 'http_request_duration_seconds',
          type: 'histogram',
          help: 'Duration of HTTP requests in seconds',
          values: [{ value: 0.5 }],
        },
      ];

      (register.getMetricsAsJSON as jest.Mock) = jest.fn().mockResolvedValue(mockMetricsJson);

      const result = await verifyMetricsContent();

      expect(result.success).toBe(true);
      expect(result.hasRequestMetrics).toBe(true);
      expect(result.hasErrorMetrics).toBe(true);
      expect(result.hasLatencyMetrics).toBe(true);
      expect(result.missingMetrics).toHaveLength(0);
    });

    it('should detect missing required metrics', async () => {
      const mockMetricsJson = [
        {
          name: 'http_requests_total',
          type: 'counter',
          help: 'Total number of HTTP requests',
          values: [{ value: 100 }],
        },
        // Missing error and latency metrics
      ];

      (register.getMetricsAsJSON as jest.Mock) = jest.fn().mockResolvedValue(mockMetricsJson);

      const result = await verifyMetricsContent();

      expect(result.success).toBe(false);
      expect(result.hasRequestMetrics).toBe(true);
      expect(result.hasErrorMetrics).toBe(false);
      expect(result.hasLatencyMetrics).toBe(false);
      expect(result.missingMetrics?.length).toBeGreaterThan(0);
    });

    it('should verify metrics have values', async () => {
      const mockMetricsJson = [
        {
          name: 'http_requests_total',
          type: 'counter',
          help: 'Total number of HTTP requests',
          values: [{ value: 100 }],
        },
        {
          name: 'http_request_errors_total',
          type: 'counter',
          help: 'Total number of HTTP request errors',
          values: [{ value: 5 }],
        },
        {
          name: 'http_request_duration_seconds',
          type: 'histogram',
          help: 'Duration of HTTP requests in seconds',
          values: [{ value: 0.5 }],
        },
      ];

      (register.getMetricsAsJSON as jest.Mock) = jest.fn().mockResolvedValue(mockMetricsJson);

      const result = await verifyMetricsContent();

      expect(result.success).toBe(true);
      expect(result.metricsWithValues).toBeGreaterThan(0);
    });
  });

  describe('full verification', () => {
    it('should perform complete metrics verification', async () => {
      const mockMetrics = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/health",status_code="200"} 100
`;

      const mockMetricsJson = [
        {
          name: 'http_requests_total',
          type: 'counter',
          help: 'Total number of HTTP requests',
          values: [{ value: 100 }],
        },
        {
          name: 'http_request_errors_total',
          type: 'counter',
          help: 'Total number of HTTP request errors',
          values: [{ value: 5 }],
        },
        {
          name: 'http_request_duration_seconds',
          type: 'histogram',
          help: 'Duration of HTTP requests in seconds',
          values: [{ value: 0.5 }],
        },
      ];

      (register.metrics as jest.Mock) = jest.fn().mockResolvedValue(mockMetrics);
      (register.getMetricsAsJSON as jest.Mock) = jest.fn().mockResolvedValue(mockMetricsJson);

      const endpointResult = await verifyMetricsEndpoint();
      const formatResult = await verifyMetricsFormat();
      const contentResult = await verifyMetricsContent();

      expect(endpointResult.success).toBe(true);
      expect(formatResult.success).toBe(true);
      expect(contentResult.success).toBe(true);
    });
  });
});
