# Observability Stack - Options, Costs & Implementation Guide

**Date**: December 23, 2025  
**Purpose**: Comprehensive analysis of observability options for the SaaS template

---

## Executive Summary

This document analyzes **three observability components** needed for production:
1. **Metrics** (Prometheus)
2. **Error Tracking & APM** (Sentry)
3. **Log Aggregation** (CloudWatch, ELK, Loki)

**Recommendation**: **Hybrid Approach** - Start with managed services (low cost, easy setup), migrate to self-hosted if needed.

---

## 1. Metrics Collection (Prometheus)

### Option A: Self-Hosted Prometheus (Free, Complex)

**Cost**: $0/month (infrastructure costs only)

**Pros**:
- ✅ Free (no per-metric charges)
- ✅ Full control
- ✅ No data limits
- ✅ Works offline

**Cons**:
- ❌ Requires server/infrastructure
- ❌ Setup complexity (medium-high)
- ❌ Maintenance burden
- ❌ Storage management

**Infrastructure Requirements**:
- Server/VM (2GB RAM, 1 CPU minimum)
- Storage: ~10-50GB depending on retention
- Estimated cost: $10-50/month (AWS EC2, DigitalOcean, etc.)

**Implementation**:
```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
```

**Setup Time**: 4-8 hours

---

### Option B: Managed Prometheus (Grafana Cloud, AWS Managed Prometheus)

#### Grafana Cloud (Recommended for Template)

**Cost**: 
- **Free Tier**: 10,000 metrics, 50GB logs, 14-day retention
- **Pro**: $49/month - 15,000 metrics, 100GB logs, 13-month retention
- **Advanced**: $199/month - 100,000 metrics, 500GB logs

**Pros**:
- ✅ Free tier for small apps
- ✅ No infrastructure management
- ✅ Includes Grafana dashboards
- ✅ Easy setup (5 minutes)
- ✅ Auto-scaling

**Cons**:
- ❌ Costs scale with metrics volume
- ❌ Vendor lock-in
- ❌ Internet required

**Setup Time**: 30 minutes

**Implementation**:
```typescript
// backend/src/middleware/metrics.ts
import promClient from 'prom-client';
import { Registry } from 'prom-client';

const register = new Registry();

// Push metrics to Grafana Cloud
const pushgateway = new promClient.Pushgateway(
  'https://prometheus-prod-01-eu-west-0.grafana.net/api/prom/push',
  {
    headers: {
      'Authorization': `Bearer ${process.env.GRAFANA_CLOUD_API_KEY}`,
    },
  },
  register
);

// Push every 15 seconds
setInterval(() => {
  pushgateway.pushAdd({ jobName: 'saas-template' });
}, 15000);
```

---

#### AWS Managed Prometheus

**Cost**:
- **Storage**: $0.02 per million samples ingested
- **Query**: $0.01 per million queries
- **Estimated**: $20-100/month for small-medium apps

**Pros**:
- ✅ Integrates with AWS ecosystem
- ✅ Auto-scaling
- ✅ Pay-per-use

**Cons**:
- ❌ AWS-only
- ❌ More expensive than self-hosted
- ❌ Requires AWS account

**Setup Time**: 2-4 hours

---

### Option C: Simple Metrics Endpoint (Free, Minimal)

**Cost**: $0/month

**Pros**:
- ✅ Zero cost
- ✅ Simple implementation
- ✅ No external dependencies

**Cons**:
- ❌ No historical data
- ❌ No visualization (need to build)
- ❌ Limited features

**Implementation**:
```typescript
// backend/src/middleware/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

// Basic metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Expose metrics endpoint
app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Setup Time**: 1-2 hours

---

## 2. Error Tracking & APM (Sentry)

### Option A: Sentry Cloud (Recommended)

**Cost**:
- **Developer**: Free - 5,000 errors/month, 1 project
- **Team**: $26/month - 50,000 errors/month, unlimited projects
- **Business**: $80/month - 200,000 errors/month, advanced features
- **Enterprise**: Custom pricing

**Pros**:
- ✅ Generous free tier
- ✅ Easy setup (5 minutes)
- ✅ Excellent error tracking
- ✅ Performance monitoring (APM)
- ✅ Source maps support
- ✅ Release tracking
- ✅ User context

**Cons**:
- ❌ Costs scale with errors
- ❌ Internet required

**Setup Time**: 30 minutes

**Implementation**:
```typescript
// backend/src/app.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1, // 10% of transactions
});
```

```typescript
// frontend/src/lib/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

---

### Option B: Self-Hosted Sentry

**Cost**: $0/month (infrastructure costs only)

**Pros**:
- ✅ Free (no per-error charges)
- ✅ Full control
- ✅ No data limits
- ✅ Privacy (data stays on-premise)

**Cons**:
- ❌ Complex setup (8-16 hours)
- ❌ Requires significant infrastructure
- ❌ Maintenance burden
- ❌ Estimated infrastructure: $50-200/month

**Infrastructure Requirements**:
- 4GB RAM minimum
- 2 CPUs minimum
- 50GB+ storage
- PostgreSQL database
- Redis

**Setup Time**: 8-16 hours

**Implementation**: Docker Compose with Sentry self-hosted

---

### Option C: Alternative Services

#### Rollbar
- **Cost**: Free tier (5,000 events/month), $19/month for 25,000 events
- **Pros**: Good error tracking, easy setup
- **Cons**: More expensive than Sentry

#### Datadog APM
- **Cost**: $31/month per host + $0.10 per million traces
- **Pros**: Comprehensive monitoring
- **Cons**: Expensive for small apps

#### New Relic
- **Cost**: Free tier (100GB/month), $99/month for full features
- **Pros**: Full APM suite
- **Cons**: Expensive, complex

---

## 3. Log Aggregation

### Option A: CloudWatch (AWS)

**Cost**:
- **Ingestion**: $0.50 per GB ingested
- **Storage**: $0.03 per GB/month
- **Query**: $0.005 per GB scanned
- **Estimated**: $10-50/month for small-medium apps

**Pros**:
- ✅ Integrates with AWS
- ✅ Easy setup
- ✅ Good for AWS deployments

**Cons**:
- ❌ AWS-only
- ❌ Can get expensive with high volume
- ❌ Limited query capabilities

**Setup Time**: 1-2 hours

**Implementation**:
```typescript
// backend/src/utils/logger.ts
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const logger = winston.createLogger({
  transports: [
    new WinstonCloudWatch({
      logGroupName: 'saas-template',
      logStreamName: process.env.NODE_ENV,
      awsRegion: process.env.AWS_REGION,
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    }),
  ],
});
```

---

### Option B: Grafana Loki (Self-Hosted)

**Cost**: $0/month (infrastructure costs only)

**Pros**:
- ✅ Free
- ✅ Lightweight
- ✅ Prometheus-compatible labels
- ✅ Good for small-medium apps

**Cons**:
- ❌ Requires infrastructure
- ❌ Setup complexity
- ❌ Estimated infrastructure: $20-50/month

**Infrastructure Requirements**:
- 2GB RAM
- 1 CPU
- 20-50GB storage

**Setup Time**: 4-8 hours

**Implementation**: Docker Compose with Loki + Promtail

---

### Option C: ELK Stack (Self-Hosted)

**Cost**: $0/month (infrastructure costs only)

**Pros**:
- ✅ Free
- ✅ Powerful search
- ✅ Full control

**Cons**:
- ❌ Resource-intensive (8GB+ RAM)
- ❌ Complex setup (16+ hours)
- ❌ Maintenance burden
- ❌ Estimated infrastructure: $100-300/month

**Infrastructure Requirements**:
- 8GB+ RAM
- 4 CPUs
- 100GB+ storage

**Setup Time**: 16+ hours

---

### Option D: Grafana Cloud Logs (Recommended for Template)

**Cost**:
- **Free Tier**: 50GB logs, 14-day retention
- **Pro**: $49/month - 100GB logs, 13-month retention
- **Advanced**: $199/month - 500GB logs

**Pros**:
- ✅ Free tier for small apps
- ✅ Easy setup
- ✅ Integrates with Grafana Cloud metrics
- ✅ No infrastructure management

**Cons**:
- ❌ Costs scale with log volume
- ❌ Internet required

**Setup Time**: 30 minutes

**Implementation**:
```typescript
// backend/src/utils/logger.ts
import winston from 'winston';
import { createLogger } from '@winston/logger';

// Use Grafana Cloud Loki endpoint
const logger = winston.createLogger({
  transports: [
    new winston.transports.Http({
      host: 'logs-prod-eu-west-0.grafana.net',
      path: '/loki/api/v1/push',
      headers: {
        'Authorization': `Bearer ${process.env.GRAFANA_CLOUD_API_KEY}`,
      },
    }),
  ],
});
```

---

### Option E: Simple File Logs (Current Implementation)

**Cost**: $0/month

**Pros**:
- ✅ Zero cost
- ✅ Already implemented
- ✅ No external dependencies

**Cons**:
- ❌ No centralized aggregation
- ❌ Hard to search across servers
- ❌ No real-time monitoring

**Current Implementation**: Winston with daily rotate files (already in place)

---

## 4. Recommended Approach for Template

### 🎯 **Recommended: Hybrid Approach (Start Simple, Scale as Needed)**

#### Phase 1: Minimal Setup (Free/Cheap)

**For Template Users Starting Out**:

1. **Metrics**: Simple Prometheus endpoint (free)
   - Expose `/api/metrics` endpoint
   - Users can scrape with their own Prometheus
   - Or use Grafana Cloud free tier

2. **Error Tracking**: Sentry Developer (free)
   - 5,000 errors/month free
   - Easy setup
   - Most users won't exceed free tier initially

3. **Logs**: Current Winston implementation (free)
   - File-based logging (already implemented)
   - Users can add log aggregation later if needed

**Total Cost**: $0/month  
**Setup Time**: 2-4 hours

---

#### Phase 2: Managed Services (Recommended for Most Users)

**For Template Users in Production**:

1. **Metrics**: Grafana Cloud Free/Pro ($0-49/month)
   - Free tier: 10,000 metrics
   - Easy upgrade path
   - Includes Grafana dashboards

2. **Error Tracking**: Sentry Team ($26/month)
   - 50,000 errors/month
   - Performance monitoring included

3. **Logs**: Grafana Cloud Logs (included with Grafana Cloud)
   - Free tier: 50GB logs
   - Integrates with metrics

**Total Cost**: $26-75/month  
**Setup Time**: 1-2 hours

---

#### Phase 3: Self-Hosted (For Enterprise/High Volume)

**For Template Users with High Volume or Privacy Requirements**:

1. **Metrics**: Self-hosted Prometheus
2. **Error Tracking**: Self-hosted Sentry
3. **Logs**: Self-hosted Loki or ELK

**Total Cost**: $50-300/month (infrastructure)  
**Setup Time**: 16-32 hours

---

## 5. Implementation Strategy for Template

### 5.1 Make It Configurable

**Environment Variables**:
```env
# Metrics
METRICS_ENABLED=true
METRICS_TYPE=prometheus|grafana-cloud|none
GRAFANA_CLOUD_API_KEY=your-key
GRAFANA_CLOUD_METRICS_ENDPOINT=https://...

# Error Tracking
SENTRY_ENABLED=true
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Logs
LOG_AGGREGATION=file|grafana-cloud|cloudwatch|loki|none
GRAFANA_CLOUD_LOGS_ENDPOINT=https://...
AWS_CLOUDWATCH_LOG_GROUP=saas-template
```

### 5.2 Abstraction Layer

**Create Observability Service**:
```typescript
// backend/src/services/observabilityService.ts
interface MetricsProvider {
  recordRequest(method: string, route: string, statusCode: number, duration: number): void;
  recordError(error: Error, context: object): void;
}

interface ErrorTrackingProvider {
  captureException(error: Error, context: object): void;
  captureMessage(message: string, level: string): void;
}

interface LogProvider {
  log(level: string, message: string, meta: object): void;
}

class ObservabilityService {
  private metrics: MetricsProvider;
  private errorTracking: ErrorTrackingProvider;
  private logging: LogProvider;

  constructor() {
    // Initialize based on config
    if (config.metricsType === 'grafana-cloud') {
      this.metrics = new GrafanaCloudMetrics();
    } else if (config.metricsType === 'prometheus') {
      this.metrics = new PrometheusMetrics();
    } else {
      this.metrics = new NoOpMetrics();
    }

    if (config.sentryEnabled) {
      this.errorTracking = new SentryErrorTracking();
    } else {
      this.errorTracking = new NoOpErrorTracking();
    }

    // ... logging setup
  }
}
```

### 5.3 Default Configuration

**Template Defaults**:
- ✅ Metrics: Prometheus endpoint (free, simple)
- ✅ Error Tracking: Sentry (free tier, easy setup)
- ✅ Logs: Winston file logs (already implemented)

**Users can upgrade** to managed services or self-hosted as needed.

---

## 6. Cost Comparison Summary

### Small App (< 10K users/month)

| Component | Option | Monthly Cost |
|-----------|--------|--------------|
| Metrics | Prometheus endpoint | $0 |
| Error Tracking | Sentry Developer | $0 |
| Logs | Winston files | $0 |
| **Total** | | **$0** |

### Medium App (10K-100K users/month)

| Component | Option | Monthly Cost |
|-----------|--------|--------------|
| Metrics | Grafana Cloud Pro | $49 |
| Error Tracking | Sentry Team | $26 |
| Logs | Grafana Cloud (included) | $0 |
| **Total** | | **$75** |

### Large App (100K+ users/month)

| Component | Option | Monthly Cost |
|-----------|--------|--------------|
| Metrics | Self-hosted Prometheus | $50 (infra) |
| Error Tracking | Sentry Business | $80 |
| Logs | Self-hosted Loki | $30 (infra) |
| **Total** | | **$160** |

### Enterprise (High Volume, Privacy Requirements)

| Component | Option | Monthly Cost |
|-----------|--------|--------------|
| Metrics | Self-hosted Prometheus | $100 (infra) |
| Error Tracking | Self-hosted Sentry | $200 (infra) |
| Logs | Self-hosted ELK | $200 (infra) |
| **Total** | | **$500** |

---

## 7. Implementation Time Estimates

### Minimal Setup (Free)
- Metrics endpoint: 1-2 hours
- Sentry integration: 30 minutes
- Logs (already done): 0 hours
- **Total**: 2-3 hours

### Managed Services Setup
- Grafana Cloud metrics: 1 hour
- Sentry setup: 30 minutes
- Grafana Cloud logs: 1 hour
- **Total**: 2-3 hours

### Self-Hosted Setup
- Prometheus: 4-8 hours
- Sentry: 8-16 hours
- Loki/ELK: 4-16 hours
- **Total**: 16-40 hours

---

## 8. Recommendations for Template

### ✅ **Recommended Default: Minimal + Sentry**

1. **Metrics**: Prometheus endpoint (free, simple)
   - Users can scrape with their own Prometheus
   - Or upgrade to Grafana Cloud if needed

2. **Error Tracking**: Sentry Developer (free)
   - Easy setup
   - Most users won't exceed free tier
   - Easy upgrade path

3. **Logs**: Winston file logs (already implemented)
   - Works for most use cases
   - Users can add aggregation later

**Total Cost**: $0/month  
**Setup Time**: 2-3 hours

### 📚 **Documentation Should Include**

1. **Quick Start**: Minimal setup (free)
2. **Production Setup**: Managed services ($26-75/month)
3. **Enterprise Setup**: Self-hosted options
4. **Migration Guides**: How to upgrade from one option to another

---

## 9. Conclusion

**For the Template**:
- ✅ Start with **free/minimal options** (Prometheus endpoint, Sentry free, Winston files)
- ✅ Make it **configurable** so users can upgrade
- ✅ Document **all options** with cost/effort estimates
- ✅ Provide **abstraction layer** for easy switching

**For Template Users**:
- ✅ Start free, upgrade as needed
- ✅ Choose based on volume and requirements
- ✅ Easy migration path between options

---

**Document Version**: 1.0  
**Date**: December 23, 2025  
**Next Review**: After Phase 1 implementation

