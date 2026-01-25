/**
 * Unit Tests for Security Testing API Routes
 * Task 3.4: Security Testing & OWASP Top 10 Verification
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import securityTestingRoutes from '../../routes/securityTesting';
import { vulnerabilityScanService } from '../../services/vulnerabilityScanService';
import { securityAuditService } from '../../services/securityAuditService';

// Mock services
jest.mock('../../services/vulnerabilityScanService', () => ({
  vulnerabilityScanService: {
    startScan: jest.fn(),
    getScanProgress: jest.fn(),
    getScanReport: jest.fn(),
    getActiveScans: jest.fn(),
    getRecentScans: jest.fn(),
    resolveVulnerability: jest.fn(),
    exportScanReport: jest.fn(),
  },
}));

jest.mock('../../services/securityAuditService', () => ({
  securityAuditService: {
    logAdminAction: jest.fn(),
    getThreatIndicators: jest.fn(),
    getRecentSecurityEvents: jest.fn(),
  },
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Security Testing Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());

    // Set up default user for authenticated routes - must be before routes
    app.use((req: any, _res, next) => {
      req.user = { id: 'test-user-123', role: 'ADMIN' };
      next();
    });

    app.use('/api/security', securityTestingRoutes);
  });

  describe('POST /api/security/scans/start', () => {
    it('should start a new vulnerability scan', async () => {
      const mockScan = {
        id: 'scan-123',
        scanType: 'OWASP_SCAN',
        status: 'PENDING',
        targetUrl: 'https://example.com',
        initiatedBy: 'test-user-123',
      };

      (vulnerabilityScanService.startScan as any).mockResolvedValue(mockScan);
      (securityAuditService.logAdminAction as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/security/scans/start')
        .send({
          scanType: 'OWASP_SCAN',
          targetUrl: 'https://example.com',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Vulnerability scan started',
        scan: mockScan,
      });

      expect(vulnerabilityScanService.startScan).toHaveBeenCalledWith({
        scanType: 'OWASP_SCAN',
        targetUrl: 'https://example.com',
        initiatedBy: 'test-user-123',
        checkTypes: undefined,
      });
    });

    it('should return 400 for invalid scan type', async () => {
      const response = await request(app)
        .post('/api/security/scans/start')
        .send({
          scanType: 'INVALID_TYPE',
          targetUrl: 'https://example.com',
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid scan type');
      expect(vulnerabilityScanService.startScan).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/security/scans/progress/:scanId', () => {
    it('should return scan progress', async () => {
      const mockProgress = {
        scanId: 'scan-123',
        status: 'IN_PROGRESS',
        progress: 50,
        totalChecks: 100,
        completedChecks: 50,
        vulnerabilitiesFound: 5,
      };

      (vulnerabilityScanService.getScanProgress as any).mockResolvedValue(mockProgress);

      const response = await request(app)
        .get('/api/security/scans/progress/scan-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        progress: mockProgress,
      });
    });

    it('should return 404 for non-existent scan', async () => {
      (vulnerabilityScanService.getScanProgress as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/security/scans/progress/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Scan not found');
    });
  });

  describe('GET /api/security/scans/report/:scanId', () => {
    it('should return full scan report', async () => {
      const mockReport = {
        scan: { id: 'scan-123', status: 'COMPLETED' },
        vulnerabilities: [
          { id: 'vuln-1', type: 'SQL_INJECTION', severity: 'HIGH' },
        ],
        summary: {
          critical: 0,
          high: 1,
          medium: 0,
          low: 0,
          info: 0,
          total: 1,
        },
        owaspCompliance: {
          compliant: false,
          failedCategories: ['A03'],
          score: 90,
        },
      };

      (vulnerabilityScanService.getScanReport as any).mockResolvedValue(mockReport);
      (securityAuditService.logAdminAction as any).mockResolvedValue({});

      const response = await request(app)
        .get('/api/security/scans/report/scan-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        report: mockReport,
      });
    });
  });

  describe('GET /api/security/scans/active', () => {
    it('should return active scans', async () => {
      const mockScans = [
        { id: 'scan-1', status: 'IN_PROGRESS' },
        { id: 'scan-2', status: 'IN_PROGRESS' },
      ];

      (vulnerabilityScanService.getActiveScans as any).mockResolvedValue(mockScans);

      const response = await request(app)
        .get('/api/security/scans/active')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        scans: mockScans,
      });
    });
  });

  describe('GET /api/security/scans/recent', () => {
    it('should return recent scans with default limit', async () => {
      const mockScans = [
        { id: 'scan-1', createdAt: new Date() },
        { id: 'scan-2', createdAt: new Date() },
      ];

      (vulnerabilityScanService.getRecentScans as any).mockResolvedValue(mockScans);

      const response = await request(app)
        .get('/api/security/scans/recent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.scans).toHaveLength(2);
      expect(response.body.scans[0].id).toBe('scan-1');
      expect(response.body.scans[1].id).toBe('scan-2');
      expect(vulnerabilityScanService.getRecentScans).toHaveBeenCalledWith(10);
    });

    it('should accept custom limit', async () => {
      (vulnerabilityScanService.getRecentScans as any).mockResolvedValue([]);

      await request(app)
        .get('/api/security/scans/recent?limit=5')
        .expect(200);

      expect(vulnerabilityScanService.getRecentScans).toHaveBeenCalledWith(5);
    });
  });

  describe('POST /api/security/vulnerabilities/:id/resolve', () => {
    it('should mark vulnerability as resolved', async () => {
      const mockVulnerability = {
        id: 'vuln-123',
        type: 'XSS',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        resolvedBy: 'test-user-123',
      };

      (vulnerabilityScanService.resolveVulnerability as any).mockResolvedValue(mockVulnerability);
      (securityAuditService.logAdminAction as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/security/vulnerabilities/vuln-123/resolve')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Vulnerability marked as resolved',
        vulnerability: mockVulnerability,
      });
    });
  });

  describe('GET /api/security/scans/export/:scanId', () => {
    it('should export scan report as CSV', async () => {
      const csvContent = 'Type,Severity,Title\nSQL_INJECTION,HIGH,Test';

      (vulnerabilityScanService.exportScanReport as any).mockResolvedValue(csvContent);
      (securityAuditService.logAdminAction as any).mockResolvedValue({});

      const response = await request(app)
        .get('/api/security/scans/export/scan-123')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('scan-report-scan-123.csv');
      expect(response.text).toBe(csvContent);
    });
  });

  describe('GET /api/security/metrics', () => {
    it('should return security metrics', async () => {
      const mockThreatIndicators = {
        failedLogins: 10,
        bruteForceAttempts: 0,
        rateLimitViolations: 5,
        unauthorizedAccess: 2,
        suspiciousActivity: 3,
        threatLevel: 'MEDIUM' as const,
      };

      const mockScans = [
        {
          id: 'scan-1',
          criticalVulnerabilities: 0,
          highVulnerabilities: 2,
          mediumVulnerabilities: 3,
          lowVulnerabilities: 5,
          createdAt: new Date(),
        },
      ];

      (securityAuditService.getThreatIndicators as any).mockResolvedValue(mockThreatIndicators);
      (vulnerabilityScanService.getRecentScans as any).mockResolvedValue(mockScans);

      const response = await request(app)
        .get('/api/security/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.threatIndicators).toEqual(mockThreatIndicators);
      expect(response.body.metrics.vulnerabilities.total).toBe(10);
    });

    it('should accept time range parameter', async () => {
      (securityAuditService.getThreatIndicators as any).mockResolvedValue({});
      (vulnerabilityScanService.getRecentScans as any).mockResolvedValue([]);

      await request(app)
        .get('/api/security/metrics?timeRange=7d')
        .expect(200);

      expect(securityAuditService.getThreatIndicators).toHaveBeenCalledWith(168);
    });
  });

  describe('GET /api/security/events', () => {
    it('should return security events timeline', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          createdAt: new Date(),
          eventType: 'FAILED_LOGIN',
          severity: 'LOW',
          userId: 'user-123',
          ipAddress: '192.168.1.1',
        },
      ];

      (securityAuditService.getRecentSecurityEvents as any).mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/security/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toBeDefined();
      expect(response.body.events[0].type).toBe('FAILED_LOGIN');
    });
  });

  describe('POST /api/security/test/owasp', () => {
    it('should start OWASP compliance check', async () => {
      const mockScan = {
        id: 'scan-owasp-123',
        scanType: 'OWASP_SCAN',
        status: 'PENDING',
      };

      (vulnerabilityScanService.startScan as any).mockResolvedValue(mockScan);
      (securityAuditService.logAdminAction as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/security/test/owasp')
        .send({ targetUrl: 'https://example.com' })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'OWASP compliance check started',
        scanId: 'scan-owasp-123',
      });
    });

    it('should return 400 if target URL is missing', async () => {
      const response = await request(app)
        .post('/api/security/test/owasp')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Target URL is required');
    });
  });

  describe('POST /api/security/test/penetration', () => {
    it('should start penetration test', async () => {
      const mockScan = {
        id: 'scan-pen-123',
        scanType: 'FULL_SCAN',
        status: 'PENDING',
      };

      (vulnerabilityScanService.startScan as any).mockResolvedValue(mockScan);
      (securityAuditService.logAdminAction as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/security/test/penetration')
        .send({
          targetUrl: 'https://example.com',
          testType: 'FULL_SCAN',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Automated penetration test started',
        scanId: 'scan-pen-123',
      });
    });

    it('should use default test type if not provided', async () => {
      const mockScan = { id: 'scan-123' };
      (vulnerabilityScanService.startScan as any).mockResolvedValue(mockScan);
      (securityAuditService.logAdminAction as any).mockResolvedValue({});

      await request(app)
        .post('/api/security/test/penetration')
        .send({ targetUrl: 'https://example.com' })
        .expect(201);

      expect(vulnerabilityScanService.startScan).toHaveBeenCalledWith(
        expect.objectContaining({ scanType: 'FULL_SCAN' })
      );
    });
  });
});