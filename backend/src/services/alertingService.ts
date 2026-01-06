/**
 * Alerting Service
 * 
 * Monitors system metrics and sends alerts via Sentry when thresholds are exceeded
 */

import * as Sentry from '@sentry/node';
import { getSystemMetrics } from './adminMonitoringService';
import logger from '../utils/logger';

export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

export interface AlertRule {
  name: string;
  metric: 'errorRate' | 'avgLatency' | 'totalRequests' | 'activeSessions';
  threshold: number;
  severity: AlertSeverity;
  enabled?: boolean;
}

export interface Alert {
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  severity: AlertSeverity;
  timestamp: string;
}

export interface AlertResult {
  checkedAt: string;
  alerts: Alert[];
  totalAlerts: number;
}

/**
 * Default alert rules
 */
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    name: 'High Error Rate',
    metric: 'errorRate',
    threshold: 1.0, // 1%
    severity: AlertSeverity.CRITICAL,
    enabled: true,
  },
  {
    name: 'High Latency',
    metric: 'avgLatency',
    threshold: 2000, // 2 seconds in milliseconds
    severity: AlertSeverity.WARNING,
    enabled: true,
  },
  {
    name: 'Very High Latency',
    metric: 'avgLatency',
    threshold: 5000, // 5 seconds in milliseconds
    severity: AlertSeverity.CRITICAL,
    enabled: true,
  },
];

/**
 * Check alert rules and send alerts if thresholds are exceeded
 */
export const checkAlerts = async (rules: AlertRule[] = DEFAULT_ALERT_RULES): Promise<AlertResult> => {
  const alerts: Alert[] = [];
  const enabledRules = rules.filter((rule) => rule.enabled !== false);

  try {
    const metrics = await getSystemMetrics();

    for (const rule of enabledRules) {
      let value: number;
      let shouldAlert = false;

      switch (rule.metric) {
        case 'errorRate':
          value = metrics.requests.errorRate;
          shouldAlert = value > rule.threshold;
          break;
        case 'avgLatency':
          value = metrics.requests.avgLatency;
          shouldAlert = value > rule.threshold;
          break;
        case 'totalRequests':
          value = metrics.requests.total;
          shouldAlert = value > rule.threshold;
          break;
        case 'activeSessions':
          value = metrics.database.activeSessions;
          shouldAlert = value > rule.threshold;
          break;
        default:
          logger.warn('Unknown alert metric', { metric: rule.metric });
          continue;
      }

      if (shouldAlert) {
        const alert: Alert = {
          ruleName: rule.name,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          severity: rule.severity,
          timestamp: new Date().toISOString(),
        };

        alerts.push(alert);

        // Send alert to Sentry
        try {
          Sentry.setContext('alert', {
            ruleName: rule.name,
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            severity: rule.severity,
          });

          const sentryLevel = rule.severity === AlertSeverity.CRITICAL ? 'error' : 'warning';
          Sentry.captureMessage(
            `Alert: ${rule.name} - ${rule.metric} is ${value} (threshold: ${rule.threshold})`,
            sentryLevel
          );

          logger.warn('Alert triggered', {
            ruleName: rule.name,
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            severity: rule.severity,
          });
        } catch (error) {
          logger.error('Failed to send alert to Sentry', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ruleName: rule.name,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Failed to check alerts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return {
    checkedAt: new Date().toISOString(),
    alerts,
    totalAlerts: alerts.length,
  };
};

/**
 * Get current alert rules
 */
export const getAlertRules = (): AlertRule[] => {
  return DEFAULT_ALERT_RULES;
};

/**
 * Update alert rule
 */
export const updateAlertRule = (ruleName: string, updates: Partial<AlertRule>): AlertRule | null => {
  const rule = DEFAULT_ALERT_RULES.find((r) => r.name === ruleName);
  if (!rule) {
    return null;
  }

  Object.assign(rule, updates);
  return rule;
};
