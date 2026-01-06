/**
 * Alerting Service Tests
 * 
 * Tests for alerting service that monitors metrics and sends alerts via Sentry
 */

import { checkAlerts, AlertRule, AlertSeverity } from '../../services/alertingService';
import { getSystemMetrics } from '../../services/adminMonitoringService';

// Mock Sentry
jest.mock('@sentry/node', () => ({
  captureMessage: jest.fn(),
  setContext: jest.fn(),
}));

// Mock admin monitoring service
jest.mock('../../services/adminMonitoringService', () => ({
  getSystemMetrics: jest.fn(),
}));

describe('AlertingService', () => {
  const mockSentry = require('@sentry/node');
  const mockGetSystemMetrics = getSystemMetrics as jest.MockedFunction<typeof getSystemMetrics>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAlerts', () => {
    it('should not send alert when error rate is below threshold', async () => {
      mockGetSystemMetrics.mockResolvedValue({
        requests: {
          total: 1000,
          errors: 5,
          errorRate: 0.5, // 0.5% - below 1% threshold
          avgLatency: 500,
        },
        database: {
          totalUsers: 100,
          activeSessions: 50,
        },
        timestamp: new Date().toISOString(),
      });

      const rules: AlertRule[] = [
        {
          name: 'High Error Rate',
          metric: 'errorRate',
          threshold: 1.0,
          severity: AlertSeverity.CRITICAL,
        },
      ];

      const result = await checkAlerts(rules);

      expect(result.alerts).toHaveLength(0);
      expect(mockSentry.captureMessage).not.toHaveBeenCalled();
    });

    it('should send alert when error rate exceeds threshold', async () => {
      mockGetSystemMetrics.mockResolvedValue({
        requests: {
          total: 1000,
          errors: 15,
          errorRate: 1.5, // 1.5% - above 1% threshold
          avgLatency: 500,
        },
        database: {
          totalUsers: 100,
          activeSessions: 50,
        },
        timestamp: new Date().toISOString(),
      });

      const rules: AlertRule[] = [
        {
          name: 'High Error Rate',
          metric: 'errorRate',
          threshold: 1.0,
          severity: AlertSeverity.CRITICAL,
        },
      ];

      const result = await checkAlerts(rules);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].ruleName).toBe('High Error Rate');
      expect(result.alerts[0].severity).toBe(AlertSeverity.CRITICAL);
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('High Error Rate'),
        'error'
      );
    });

    it('should send alert when latency exceeds threshold', async () => {
      mockGetSystemMetrics.mockResolvedValue({
        requests: {
          total: 1000,
          errors: 5,
          errorRate: 0.5,
          avgLatency: 2500, // 2.5s - above 2s threshold
        },
        database: {
          totalUsers: 100,
          activeSessions: 50,
        },
        timestamp: new Date().toISOString(),
      });

      const rules: AlertRule[] = [
        {
          name: 'High Latency',
          metric: 'avgLatency',
          threshold: 2000, // 2 seconds in ms
          severity: AlertSeverity.WARNING,
        },
      ];

      const result = await checkAlerts(rules);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].ruleName).toBe('High Latency');
      expect(result.alerts[0].severity).toBe(AlertSeverity.WARNING);
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('High Latency'),
        'warning'
      );
    });

    it('should handle multiple alert rules', async () => {
      mockGetSystemMetrics.mockResolvedValue({
        requests: {
          total: 1000,
          errors: 15,
          errorRate: 1.5, // Triggers error rate alert
          avgLatency: 2500, // Triggers latency alert
        },
        database: {
          totalUsers: 100,
          activeSessions: 50,
        },
        timestamp: new Date().toISOString(),
      });

      const rules: AlertRule[] = [
        {
          name: 'High Error Rate',
          metric: 'errorRate',
          threshold: 1.0,
          severity: AlertSeverity.CRITICAL,
        },
        {
          name: 'High Latency',
          metric: 'avgLatency',
          threshold: 2000,
          severity: AlertSeverity.WARNING,
        },
      ];

      const result = await checkAlerts(rules);

      expect(result.alerts).toHaveLength(2);
      expect(mockSentry.captureMessage).toHaveBeenCalledTimes(2);
    });

    it('should include context in Sentry alerts', async () => {
      mockGetSystemMetrics.mockResolvedValue({
        requests: {
          total: 1000,
          errors: 15,
          errorRate: 1.5,
          avgLatency: 500,
        },
        database: {
          totalUsers: 100,
          activeSessions: 50,
        },
        timestamp: new Date().toISOString(),
      });

      const rules: AlertRule[] = [
        {
          name: 'High Error Rate',
          metric: 'errorRate',
          threshold: 1.0,
          severity: AlertSeverity.CRITICAL,
        },
      ];

      await checkAlerts(rules);

      expect(mockSentry.setContext).toHaveBeenCalledWith('alert', {
        ruleName: 'High Error Rate',
        metric: 'errorRate',
        value: 1.5,
        threshold: 1.0,
        severity: AlertSeverity.CRITICAL,
      });
    });

    it('should handle missing metrics gracefully', async () => {
      mockGetSystemMetrics.mockResolvedValue({
        requests: {
          total: 0,
          errors: 0,
          errorRate: 0,
          avgLatency: 0,
        },
        database: {
          totalUsers: 0,
          activeSessions: 0,
        },
        timestamp: new Date().toISOString(),
      });

      const rules: AlertRule[] = [
        {
          name: 'High Error Rate',
          metric: 'errorRate',
          threshold: 1.0,
          severity: AlertSeverity.CRITICAL,
        },
      ];

      const result = await checkAlerts(rules);

      expect(result.alerts).toHaveLength(0);
      expect(result.checkedAt).toBeDefined();
    });

    it('should return alert result with timestamp', async () => {
      mockGetSystemMetrics.mockResolvedValue({
        requests: {
          total: 1000,
          errors: 5,
          errorRate: 0.5,
          avgLatency: 500,
        },
        database: {
          totalUsers: 100,
          activeSessions: 50,
        },
        timestamp: new Date().toISOString(),
      });

      const rules: AlertRule[] = [];
      const result = await checkAlerts(rules);

      expect(result.checkedAt).toBeDefined();
      expect(result.alerts).toHaveLength(0);
    });
  });
});
