/**
 * Security Monitoring Middleware
 *
 * Task 3.3: Security Monitoring & Alerting
 * Intercepts and monitors security-relevant events across the application
 */

import { Request, Response, NextFunction } from 'express';
import { securityAuditService } from '../services/securityAuditService';
import { SecurityEventType, SecurityEventSeverity } from '@prisma/client';

/**
 * Security patterns to detect
 */
const SECURITY_PATTERNS = {
  XSS_ATTEMPT: /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=|<iframe|<embed|<object/i,
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|DROP|UNION|CREATE|ALTER)\b|--|=\s*'|OR\s+1\s*=\s*1)/i,
  PATH_TRAVERSAL: /\.\.[\/\\]|\.\.%2[Ff]|%2e%2e/,
  COMMAND_INJECTION: /[;&|`$]|\$\(|\$\{|&&|\|\||>|</,
};

/**
 * Sensitive endpoints that require special monitoring
 */
const SENSITIVE_ENDPOINTS = [
  /\/api\/users\/sensitive-data/,
  /\/api\/admin\//,
  /\/api\/export\//,
  /\/api\/backup\//,
];

/**
 * Admin endpoints
 */
const ADMIN_ENDPOINTS = /^\/admin\//;

/**
 * Auth endpoints
 */
const AUTH_ENDPOINTS = /^\/api\/auth\/(login|signup)/;

export interface SecurityMonitoringOptions {
  rateLimitThreshold?: number;
  bruteForceEnabled?: boolean;
  suspiciousPatternDetection?: boolean;
}

/**
 * Security Monitoring Middleware Factory
 */
export function securityMonitoringMiddleware(options: SecurityMonitoringOptions = {}) {
  const {
    bruteForceEnabled = true,
    suspiciousPatternDetection = true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      const userId = req.user?.id || null;
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';
      const resource = req.originalUrl;
      const action = req.method;

      // Check if IP is rate limited
      const isRateLimited = await securityAuditService.isRateLimited(ipAddress);
      if (isRateLimited) {
        await securityAuditService.logSecurityEvent({
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: SecurityEventSeverity.MEDIUM,
          userId,
          ipAddress,
          userAgent,
          resource,
          action,
        });

        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
        });
      }

      // Check for rate limit violations in response locals
      if (res.locals.requestCount && res.locals.rateLimit) {
        if (res.locals.requestCount > res.locals.rateLimit) {
          await securityAuditService.logRateLimitViolation(
            ipAddress,
            resource,
            res.locals.requestCount,
            res.locals.rateLimit
          );
        }
      }

      // Monitor admin area access
      if (ADMIN_ENDPOINTS.test(resource)) {
        await securityAuditService.logSecurityEvent({
          eventType: SecurityEventType.ADMIN_ACCESS,
          severity: SecurityEventSeverity.INFO,
          userId,
          ipAddress,
          userAgent,
          resource,
          action,
        });
      }

      // Monitor sensitive data access
      const isSensitiveEndpoint = SENSITIVE_ENDPOINTS.some(pattern => pattern.test(resource));
      if (isSensitiveEndpoint) {
        await securityAuditService.logSecurityEvent({
          eventType: SecurityEventType.SENSITIVE_DATA_ACCESS,
          severity: SecurityEventSeverity.MEDIUM,
          userId,
          ipAddress,
          userAgent,
          resource,
          action,
        });
      }

      // Detect suspicious patterns
      if (suspiciousPatternDetection) {
        const url = resource + (req.url || '');

        for (const [pattern, regex] of Object.entries(SECURITY_PATTERNS)) {
          if (regex.test(url)) {
            await securityAuditService.logSecurityEvent({
              eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
              severity: SecurityEventSeverity.HIGH,
              userId,
              ipAddress,
              userAgent,
              resource,
              details: {
                pattern,
                url,
              },
            });
            break; // Log only the first matching pattern
          }
        }
      }

      // Monitor authentication failures
      if (AUTH_ENDPOINTS.test(resource) && req.method === 'POST') {
        if (res.locals.authFailed && bruteForceEnabled) {
          const targetUserId = res.locals.userId || userId;

          const result = await securityAuditService.handleFailedLogin(
            targetUserId,
            ipAddress,
            userAgent
          );

          if (result.bruteForceDetected && result.accountLocked) {
            return res.status(423).json({
              error: 'Account locked due to multiple failed login attempts.',
            });
          }
        }
      }

      // Monitor unauthorized access attempts
      if (res.locals.unauthorized) {
        await securityAuditService.logSecurityEvent({
          eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
          severity: SecurityEventSeverity.HIGH,
          userId,
          ipAddress,
          userAgent,
          resource,
          action,
        });
      }

      // Monitor large data exports
      if (res.locals.exportCount && res.locals.exportCount > 5000) {
        await securityAuditService.logSecurityEvent({
          eventType: SecurityEventType.DATA_EXPORT_LARGE,
          severity: res.locals.exportCount > 10000
            ? SecurityEventSeverity.HIGH
            : SecurityEventSeverity.MEDIUM,
          userId,
          ipAddress,
          resource,
          details: { recordCount: res.locals.exportCount },
        });
      }

      next();
    } catch (error) {
      // Log error but don't block the request
      console.error('Security monitoring error:', error);
      next();
    }
  };
}

/**
 * Helper middleware to set security context
 */
export function setSecurityContext(_req: Request, res: Response, next: NextFunction) {
  // Initialize security context
  res.locals.security = {
    monitoringEnabled: true,
    timestamp: new Date(),
  };
  next();
}

/**
 * Middleware to track failed authentication
 */
export function trackAuthFailure(userId: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.locals.authFailed = true;
    res.locals.userId = userId;
    next();
  };
}

/**
 * Middleware to track unauthorized access
 */
export function trackUnauthorizedAccess(_req: Request, res: Response, next: NextFunction) {
  res.locals.unauthorized = true;
  next();
}

/**
 * Middleware to track data export size
 */
export function trackDataExport(count: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.locals.exportCount = count;
    next();
  };
}

/**
 * Middleware to track request count for rate limiting
 */
export function trackRequestCount(count: number, limit: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.locals.requestCount = count;
    res.locals.rateLimit = limit;
    next();
  };
}