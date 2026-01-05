import express from 'express';
import cookieParser from 'cookie-parser';
import { securityHeaders, corsConfig, apiLimiter, requestSizeLimit } from './middleware/security';
import requestId from './middleware/requestId';
import apiVersioning from './middleware/apiVersioning';
import metricsMiddleware from './middleware/metrics';
import { idempotency } from './middleware/idempotency';
import errorHandler from './middleware/errorHandler';
import routes from './routes';
import logger from './utils/logger';

// Initialize Sentry (optional, only if DSN is provided)
if (process.env.SENTRY_DSN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      integrations: [],
    });
    logger.info('Sentry initialized', { environment: process.env.NODE_ENV });
  } catch (error: any) {
    logger.warn('Failed to initialize Sentry', { error: error?.message || 'Unknown error' });
  }
}

// Create Express app
const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Apply security middleware
app.use(securityHeaders);
app.use(corsConfig);

// Body parsers
app.use(express.json({ limit: requestSizeLimit }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimit }));

// Cookie parser
app.use(cookieParser());

// Request ID middleware
app.use(requestId);

// Metrics middleware (before routes to capture all requests)
app.use(metricsMiddleware);

// API Versioning middleware (before routes)
app.use('/api', apiVersioning);

// Idempotency middleware (before routes, optional - only works if idempotency-key header is present)
// Prevents duplicate operations for POST/PUT/PATCH requests
app.use('/api', idempotency);

// Apply rate limiting to all routes
app.use('/api', apiLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    requestId: (req as any).id,
    ip: req.ip,
  });
  next();
});

// Mount API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requestId: (req as any).id,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;

