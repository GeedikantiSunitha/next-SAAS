import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create a registry for metrics
const register = new promClient.Registry();

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // Response time buckets
  registers: [register],
});

// HTTP request total counter
const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request errors counter
const httpRequestErrors = new promClient.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Metrics middleware
 * Records HTTP request metrics (duration, count, errors)
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const method = req.method;
  const route = req.route?.path || req.path || 'unknown';
  
  // Record response finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const statusCode = res.statusCode.toString();
    
    // Record request duration
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);
    
    // Record request count
    httpRequestTotal
      .labels(method, route, statusCode)
      .inc();
    
    // Record errors (4xx and 5xx status codes)
    if (res.statusCode >= 400) {
      httpRequestErrors
        .labels(method, route, statusCode)
        .inc();
    }
  });
  
  next();
};

// Export register for metrics endpoint
export { register };

export default metricsMiddleware;

