/**
 * TDD Tests for Security Monitoring Middleware
 *
 * Task 3.3: Security Monitoring & Alerting
 * Middleware to intercept and monitor security-relevant events
 */

import { Request, Response, NextFunction } from 'express';
import { securityMonitoringMiddleware } from '../../middleware/securityMonitoring';
import { securityAuditService } from '../../services/securityAuditService';
import { SecurityEventType, SecurityEventSeverity } from '@prisma/client';

// Mock the security audit service
jest.mock('../../services/securityAuditService', () => ({
  securityAuditService: {
    logSecurityEvent: jest.fn(),
    handleFailedLogin: jest.fn(),
    logRateLimitViolation: jest.fn(),
    isRateLimited: jest.fn(),
  },
}));

describe('Security Monitoring Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mocks to their default values
    (securityAuditService.logSecurityEvent as jest.Mock).mockResolvedValue(undefined);
    (securityAuditService.handleFailedLogin as jest.Mock).mockResolvedValue({
      bruteForceDetected: false,
      accountLocked: false,
      alertSent: false,
    });
    (securityAuditService.logRateLimitViolation as jest.Mock).mockResolvedValue(undefined);
    (securityAuditService.isRateLimited as jest.Mock).mockResolvedValue(false);

    mockRequest = {
      method: 'GET',
      originalUrl: '/api/users',
      ip: '192.168.1.1',
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'Mozilla/5.0';
        if (header === 'set-cookie') return undefined;
        return undefined;
      }) as any,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {},
    };

    mockNext = jest.fn();
  });

  describe('Request Monitoring', () => {
    it('should pass through normal requests', async () => {
      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(securityAuditService.logSecurityEvent).not.toHaveBeenCalled();
    });

    it('should log admin area access', async () => {
      mockRequest.originalUrl = '/admin/dashboard';
      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.ADMIN_ACCESS,
        severity: SecurityEventSeverity.INFO,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        resource: '/admin/dashboard',
        action: 'GET',
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect and log suspicious patterns', async () => {
      // Simulate SQL injection attempt
      mockRequest.originalUrl = "/api/users?id=1' OR '1'='1";
      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.HIGH,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        resource: expect.any(String),
        details: expect.objectContaining({
          pattern: 'SQL_INJECTION',
        }),
      });
    });

    it('should detect XSS attempts', async () => {
      mockRequest.originalUrl = '/api/comment?text=<script>alert("XSS")</script>';
      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.HIGH,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        resource: expect.any(String),
        details: expect.objectContaining({
          pattern: 'XSS_ATTEMPT',
        }),
      });
    });

    it('should detect path traversal attempts', async () => {
      mockRequest.originalUrl = '/api/file?path=../../../etc/passwd';
      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.HIGH,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        resource: expect.any(String),
        details: expect.objectContaining({
          pattern: 'PATH_TRAVERSAL',
        }),
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should check for rate limiting', async () => {
      (securityAuditService.isRateLimited as jest.Mock).mockResolvedValue(false);
      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.isRateLimited).toHaveBeenCalledWith('192.168.1.1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block rate limited IPs', async () => {
      (securityAuditService.isRateLimited as jest.Mock).mockResolvedValue(true);
      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Too many requests. Please try again later.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should track API rate limits', async () => {
      // Set up to simulate multiple requests
      mockResponse.locals!.requestCount = 100;
      mockResponse.locals!.rateLimit = 50;
      mockRequest.originalUrl = '/api/data';

      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logRateLimitViolation).toHaveBeenCalledWith(
        '192.168.1.1',
        '/api/data',
        100,
        50
      );
    });
  });

  describe('Authentication Monitoring', () => {
    it('should monitor failed login attempts', async () => {
      mockRequest.originalUrl = '/api/auth/login';
      mockRequest.method = 'POST';
      mockResponse.locals!.authFailed = true;
      mockResponse.locals!.userId = 'user-456';

      (securityAuditService.handleFailedLogin as jest.Mock).mockResolvedValue({
        bruteForceDetected: false,
        accountLocked: false,
        alertSent: false,
      });

      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.handleFailedLogin).toHaveBeenCalledWith(
        'user-456',
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });

    it('should block access after brute force detection', async () => {
      mockRequest.originalUrl = '/api/auth/login';
      mockRequest.method = 'POST';
      mockResponse.locals!.authFailed = true;
      mockResponse.locals!.userId = 'user-456';

      (securityAuditService.handleFailedLogin as jest.Mock).mockResolvedValue({
        bruteForceDetected: true,
        accountLocked: true,
        alertSent: true,
      });

      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(423);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Account locked due to multiple failed login attempts.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should track unauthorized access attempts', async () => {
      mockResponse.locals!.unauthorized = true;
      mockRequest.originalUrl = '/api/admin/users';

      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        severity: SecurityEventSeverity.HIGH,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        resource: '/api/admin/users',
        action: 'GET',
      });
    });
  });

  describe('Data Access Monitoring', () => {
    it('should log large data exports', async () => {
      mockRequest.originalUrl = '/api/export/users';
      mockResponse.locals!.exportCount = 10000;

      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.DATA_EXPORT_LARGE,
        severity: SecurityEventSeverity.MEDIUM,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        resource: '/api/export/users',
        details: { recordCount: 10000 },
      });
    });

    it('should detect sensitive data access', async () => {
      mockRequest.originalUrl = '/api/users/sensitive-data';
      mockRequest.method = 'GET';

      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.SENSITIVE_DATA_ACCESS,
        severity: SecurityEventSeverity.MEDIUM,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        resource: '/api/users/sensitive-data',
        action: 'GET',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      (securityAuditService.isRateLimited as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Should continue even if monitoring fails
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing user context', async () => {
      // Reset mocks to resolve properly
      (securityAuditService.isRateLimited as jest.Mock).mockResolvedValue(false);

      delete mockRequest.user;
      mockRequest.originalUrl = '/admin/dashboard';

      const middleware = securityMonitoringMiddleware();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(securityAuditService.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.ADMIN_ACCESS,
        severity: SecurityEventSeverity.INFO,
        userId: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        resource: '/admin/dashboard',
        action: 'GET',
      });
    });
  });
});