# Observability Setup Guide

## Overview

This guide covers the minimal observability implementation for the NextSaaS template, including Sentry alerts and metrics verification.

## Features Implemented

### 1. Alerting Service
- Monitors system metrics (error rate, latency)
- Sends alerts to Sentry when thresholds are exceeded
- Configurable alert rules
- Supports multiple severity levels (CRITICAL, WARNING, INFO)

### 2. Metrics Verification Service
- Verifies metrics endpoint accessibility
- Validates Prometheus format
- Checks for required metrics (request count, errors, latency)
- Provides comprehensive verification results

### 3. Observability API Endpoints
All endpoints require ADMIN or SUPER_ADMIN role:

- `GET /api/observability/alerts/check` - Check current alerts
- `GET /api/observability/alerts/rules` - Get alert rules
- `POST /api/observability/alerts/check` - Trigger alert check with custom rules
- `GET /api/observability/metrics/verify` - Complete metrics verification
- `GET /api/observability/metrics/verify/endpoint` - Verify endpoint accessibility
- `GET /api/observability/metrics/verify/format` - Verify Prometheus format
- `GET /api/observability/metrics/verify/content` - Verify metrics content

## Setup

### 1. Sentry Configuration

Add Sentry DSN to your `.env` file:

```env
SENTRY_DSN=your-sentry-dsn-here
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**To get a Sentry DSN:**
1. Go to [sentry.io](https://sentry.io)
2. Create a new project (Node.js)
3. Copy the DSN from project settings
4. Add it to your `.env` file

**Note:** Sentry is optional. If not configured, error tracking will be disabled but the application will continue to work.

### 2. Metrics Endpoint

The metrics endpoint is already configured at `/api/metrics` and exposes Prometheus-formatted metrics.

**To verify metrics are working:**
```bash
curl http://localhost:3001/api/metrics
```

You should see Prometheus-formatted output with metrics like:
- `http_requests_total`
- `http_request_errors_total`
- `http_request_duration_seconds`

### 3. Default Alert Rules

The system comes with default alert rules:

1. **High Error Rate** (CRITICAL)
   - Metric: `errorRate`
   - Threshold: 1.0% (1%)
   - Triggers when error rate exceeds 1%

2. **High Latency** (WARNING)
   - Metric: `avgLatency`
   - Threshold: 2000ms (2 seconds)
   - Triggers when average latency exceeds 2 seconds

3. **Very High Latency** (CRITICAL)
   - Metric: `avgLatency`
   - Threshold: 5000ms (5 seconds)
   - Triggers when average latency exceeds 5 seconds

## Usage

### Checking Alerts

```bash
# As admin user
curl -X GET http://localhost:3001/api/observability/alerts/check \
  -H "Cookie: accessToken=your-token"
```

Response:
```json
{
  "success": true,
  "data": {
    "checkedAt": "2025-01-05T19:00:00.000Z",
    "alerts": [],
    "totalAlerts": 0
  }
}
```

### Verifying Metrics

```bash
# Complete verification
curl -X GET http://localhost:3001/api/observability/metrics/verify \
  -H "Cookie: accessToken=your-token"
```

Response:
```json
{
  "success": true,
  "data": {
    "endpoint": {
      "success": true,
      "accessible": true
    },
    "format": {
      "success": true,
      "isValidFormat": true,
      "hasHelpComments": true,
      "hasTypeComments": true
    },
    "content": {
      "success": true,
      "hasRequestMetrics": true,
      "hasErrorMetrics": true,
      "hasLatencyMetrics": true
    },
    "overall": true
  }
}
```

### Triggering Alert Check with Custom Rules

```bash
curl -X POST http://localhost:3001/api/observability/alerts/check \
  -H "Cookie: accessToken=your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "name": "Custom Alert",
        "metric": "errorRate",
        "threshold": 0.5,
        "severity": "warning",
        "enabled": true
      }
    ]
  }'
```

## Testing

### Unit Tests
```bash
cd backend
npm test -- alertingService.test.ts
npm test -- metricsVerificationService.test.ts
```

### Backend E2E Tests
```bash
cd backend
npm test -- observability.e2e.test.ts
```

### Full-Stack E2E Tests
```bash
# Ensure both frontend and backend are running
npx playwright test tests/e2e/full-stack-observability.spec.ts
```

## Alert Configuration

### Customizing Alert Rules

Alert rules can be customized by modifying `DEFAULT_ALERT_RULES` in `backend/src/services/alertingService.ts`:

```typescript
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    name: 'High Error Rate',
    metric: 'errorRate',
    threshold: 1.0, // 1%
    severity: AlertSeverity.CRITICAL,
    enabled: true,
  },
  // Add more rules...
];
```

### Alert Metrics

Supported metrics:
- `errorRate` - Error rate percentage
- `avgLatency` - Average latency in milliseconds
- `totalRequests` - Total request count
- `activeSessions` - Active session count

### Alert Severity Levels

- `CRITICAL` - Sent to Sentry as `error` level
- `WARNING` - Sent to Sentry as `warning` level
- `INFO` - Sent to Sentry as `info` level

## Monitoring Best Practices

1. **Set up Sentry alerts** in Sentry dashboard to receive notifications
2. **Monitor metrics endpoint** regularly to ensure metrics are being collected
3. **Review alert rules** periodically and adjust thresholds based on actual system behavior
4. **Use metrics verification** endpoint to ensure observability is working correctly

## Troubleshooting

### Alerts not being sent to Sentry

1. Check `SENTRY_DSN` is set in `.env`
2. Verify Sentry DSN is valid
3. Check Sentry dashboard for errors
4. Review application logs for Sentry initialization messages

### Metrics endpoint not accessible

1. Verify backend is running
2. Check `/api/metrics` endpoint is accessible
3. Run metrics verification endpoint to diagnose issues

### Alert checks returning no alerts

This is normal if system metrics are below thresholds. To test alerts:
1. Use custom rules with lower thresholds
2. Or wait for actual system issues to trigger alerts

## Next Steps

For production, consider:
1. Setting up Grafana dashboards for metrics visualization
2. Configuring log aggregation (ELK, Loki, CloudWatch)
3. Setting up additional alerting channels (Slack, PagerDuty, email)
4. Implementing distributed tracing (OpenTelemetry, Jaeger)
5. Adding business metrics tracking

## Related Documentation

- [Monitoring & Logging](../project_documentation/08-deployment/MONITORING_LOGGING.md)
- [Observability Options](./OBSERVABILITY_OPTIONS.md)
- [Critical Architect Review](./CRITICAL_ARCHITECT_REVIEW.md)
