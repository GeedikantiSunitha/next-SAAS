import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from '../config';

/**
 * Security headers middleware (Helmet)
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for some frameworks
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * CORS configuration
 */
export const corsConfig = cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
});

/**
 * Skip API rate limiting in test and development to avoid 429 during local dev.
 */
export const shouldSkipApiRateLimit = () =>
  config.nodeEnv === 'test' || config.nodeEnv === 'development';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipApiRateLimit,
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: () => config.nodeEnv === 'test',
});

/**
 * OAuth rate limiter (more lenient for development)
 * 30 requests per 15 minutes per IP (configurable via OAUTH_RATE_LIMIT_MAX)
 * Allows more requests than authLimiter for OAuth setup/testing
 */
export const oauthLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: parseInt(process.env.OAUTH_RATE_LIMIT_MAX || '30', 10),
  message: 'Too many OAuth requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful OAuth attempts
  skip: () => config.nodeEnv === 'test' || config.nodeEnv === 'development',
});

/**
 * Request size limiter
 * Prevent large payloads
 */
export const requestSizeLimit = '10mb';

