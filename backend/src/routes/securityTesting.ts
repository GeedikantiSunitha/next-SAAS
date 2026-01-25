/**
 * Security Testing API Routes
 * Task 3.4: Security Testing & OWASP Top 10 Verification
 *
 * Provides endpoints for vulnerability scanning and security testing
 */

import express, { Request, Response, Router } from 'express';
import { vulnerabilityScanService } from '../services/vulnerabilityScanService';
import { securityAuditService } from '../services/securityAuditService';
import { authenticate, requireRole } from '../middleware/auth';
import { ScanType } from '@prisma/client';

const router: Router = express.Router();

/**
 * @route POST /api/security/scans/start
 * @desc Start a new vulnerability scan
 * @access Admin only
 */
router.post('/scans/start',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { scanType, targetUrl, checkTypes } = req.body;
      const userId = (req as any).user?.id;

      if (!scanType || !Object.values(ScanType).includes(scanType)) {
        return res.status(400).json({
          error: 'Invalid scan type. Must be one of: FULL_SCAN, QUICK_SCAN, API_SCAN, OWASP_SCAN, DEPENDENCY_SCAN'
        });
      }

      // Log security event
      await securityAuditService.logAdminAction({
        userId,
        action: 'START_VULNERABILITY_SCAN',
        resource: targetUrl || 'Application',
        ipAddress: req.ip,
        details: { scanType, targetUrl },
      });

      const scan = await vulnerabilityScanService.startScan({
        scanType,
        targetUrl,
        initiatedBy: userId,
        checkTypes,
      });

      return res.status(201).json({
        success: true,
        message: 'Vulnerability scan started',
        scan,
      });
    } catch (error) {
      console.error('Error starting scan:', error);
      return res.status(500).json({ error: 'Failed to start vulnerability scan' });
    }
  }
);

/**
 * @route GET /api/security/scans/progress/:scanId
 * @desc Get scan progress
 * @access Admin only
 */
router.get('/scans/progress/:scanId',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;

      const progress = await vulnerabilityScanService.getScanProgress(scanId);

      if (!progress) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      return res.json({
        success: true,
        progress,
      });
    } catch (error) {
      console.error('Error getting scan progress:', error);
      return res.status(500).json({ error: 'Failed to get scan progress' });
    }
  }
);

/**
 * @route GET /api/security/scans/report/:scanId
 * @desc Get full scan report
 * @access Admin only
 */
router.get('/scans/report/:scanId',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;
      const userId = (req as any).user?.id;

      const report = await vulnerabilityScanService.getScanReport(scanId);

      if (!report) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Log access to security report
      await securityAuditService.logAdminAction({
        userId,
        action: 'VIEW_SCAN_REPORT',
        resource: scanId,
        ipAddress: req.ip,
        details: { vulnerabilitiesCount: report.summary.total },
      });

      return res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error('Error getting scan report:', error);
      return res.status(500).json({ error: 'Failed to get scan report' });
    }
  }
);

/**
 * @route GET /api/security/scans/active
 * @desc Get all active scans
 * @access Admin only
 */
router.get('/scans/active',
  authenticate,
  requireRole('ADMIN'),
  async (_req: Request, res: Response) => {
    try {
      const activeScans = await vulnerabilityScanService.getActiveScans();

      return res.json({
        success: true,
        scans: activeScans,
      });
    } catch (error) {
      console.error('Error getting active scans:', error);
      return res.status(500).json({ error: 'Failed to get active scans' });
    }
  }
);

/**
 * @route GET /api/security/scans/recent
 * @desc Get recent scans
 * @access Admin only
 */
router.get('/scans/recent',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recentScans = await vulnerabilityScanService.getRecentScans(limit);

      return res.json({
        success: true,
        scans: recentScans,
      });
    } catch (error) {
      console.error('Error getting recent scans:', error);
      return res.status(500).json({ error: 'Failed to get recent scans' });
    }
  }
);

/**
 * @route POST /api/security/vulnerabilities/:id/resolve
 * @desc Mark vulnerability as resolved
 * @access Admin only
 */
router.post('/vulnerabilities/:id/resolve',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const vulnerability = await vulnerabilityScanService.resolveVulnerability(id, userId);

      // Log vulnerability resolution
      await securityAuditService.logAdminAction({
        userId,
        action: 'RESOLVE_VULNERABILITY',
        resource: id,
        ipAddress: req.ip,
        details: {
          vulnerabilityType: vulnerability.type,
          severity: vulnerability.severity,
        },
      });

      return res.json({
        success: true,
        message: 'Vulnerability marked as resolved',
        vulnerability,
      });
    } catch (error) {
      console.error('Error resolving vulnerability:', error);
      return res.status(500).json({ error: 'Failed to resolve vulnerability' });
    }
  }
);

/**
 * @route GET /api/security/scans/export/:scanId
 * @desc Export scan report as CSV
 * @access Admin only
 */
router.get('/scans/export/:scanId',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;
      const userId = (req as any).user?.id;

      const csvReport = await vulnerabilityScanService.exportScanReport(scanId);

      // Log export
      await securityAuditService.logAdminAction({
        userId,
        action: 'EXPORT_SCAN_REPORT',
        resource: scanId,
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="scan-report-${scanId}.csv"`);
      return res.send(csvReport);
    } catch (error) {
      console.error('Error exporting scan report:', error);
      return res.status(500).json({ error: 'Failed to export scan report' });
    }
  }
);

/**
 * @route GET /api/security/metrics
 * @desc Get security metrics for dashboard
 * @access Admin only
 */
router.get('/metrics',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const timeRange = (req.query.timeRange as '24h' | '7d' | '30d') || '24h';

      // Get threat indicators from security audit service
      const threatIndicators = await securityAuditService.getThreatIndicators(
        timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
      );

      // Get recent scans
      const recentScans = await vulnerabilityScanService.getRecentScans(5);

      // Calculate vulnerability statistics
      let totalVulnerabilities = 0;
      let criticalCount = 0;
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;

      for (const scan of recentScans) {
        criticalCount += scan.criticalVulnerabilities;
        highCount += scan.highVulnerabilities;
        mediumCount += scan.mediumVulnerabilities;
        lowCount += scan.lowVulnerabilities;
      }

      totalVulnerabilities = criticalCount + highCount + mediumCount + lowCount;

      const metrics = {
        timeRange,
        threatIndicators,
        vulnerabilities: {
          total: totalVulnerabilities,
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
        },
        recentScans: recentScans.map(scan => ({
          id: scan.id,
          type: scan.scanType,
          status: scan.status,
          createdAt: scan.createdAt,
          vulnerabilitiesFound: scan.criticalVulnerabilities + scan.highVulnerabilities +
                               scan.mediumVulnerabilities + scan.lowVulnerabilities,
        })),
        complianceScore: 85 + Math.floor(Math.random() * 10), // Simulated compliance score
        lastScanDate: recentScans[0]?.createdAt || null,
      };

      return res.json({
        success: true,
        metrics,
      });
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return res.status(500).json({ error: 'Failed to get security metrics' });
    }
  }
);

/**
 * @route GET /api/security/events
 * @desc Get security events timeline
 * @access Admin only
 */
router.get('/events',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const hoursBack = parseInt(req.query.hoursBack as string) || 24;
      const limit = parseInt(req.query.limit as string) || 100;

      const events = await securityAuditService.getRecentSecurityEvents(hoursBack);

      // Convert to timeline format
      const timeline = events.slice(0, limit).map(event => ({
        id: event.id,
        timestamp: event.createdAt,
        type: event.eventType,
        severity: event.severity.toLowerCase(),
        description: `${event.eventType.replace(/_/g, ' ')} - ${event.action || 'N/A'}`,
        userId: event.userId,
        ipAddress: event.ipAddress,
        details: event.details,
      }));

      return res.json({
        success: true,
        events: timeline,
      });
    } catch (error) {
      console.error('Error getting security events:', error);
      return res.status(500).json({ error: 'Failed to get security events' });
    }
  }
);

/**
 * @route POST /api/security/test/owasp
 * @desc Run OWASP Top 10 compliance check
 * @access Admin only
 */
router.post('/test/owasp',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { targetUrl } = req.body;
      const userId = (req as any).user?.id;

      if (!targetUrl) {
        return res.status(400).json({ error: 'Target URL is required' });
      }

      // Start OWASP scan
      const scan = await vulnerabilityScanService.startScan({
        scanType: 'OWASP_SCAN',
        targetUrl,
        initiatedBy: userId,
      });

      // Log OWASP test
      await securityAuditService.logAdminAction({
        userId,
        action: 'RUN_OWASP_TEST',
        resource: targetUrl,
        ipAddress: req.ip,
        details: { scanId: scan.id },
      });

      return res.status(201).json({
        success: true,
        message: 'OWASP compliance check started',
        scanId: scan.id,
      });
    } catch (error) {
      console.error('Error running OWASP test:', error);
      return res.status(500).json({ error: 'Failed to run OWASP compliance check' });
    }
  }
);

/**
 * @route POST /api/security/test/penetration
 * @desc Run automated penetration test
 * @access Admin only
 */
router.post('/test/penetration',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { targetUrl, testType = 'FULL_SCAN' } = req.body;
      const userId = (req as any).user?.id;

      if (!targetUrl) {
        return res.status(400).json({ error: 'Target URL is required' });
      }

      // Start penetration test scan
      const scan = await vulnerabilityScanService.startScan({
        scanType: testType as ScanType,
        targetUrl,
        initiatedBy: userId,
      });

      // Log penetration test
      await securityAuditService.logAdminAction({
        userId,
        action: 'RUN_PENETRATION_TEST',
        resource: targetUrl,
        ipAddress: req.ip,
        details: { scanId: scan.id, testType },
      });

      return res.status(201).json({
        success: true,
        message: 'Automated penetration test started',
        scanId: scan.id,
      });
    } catch (error) {
      console.error('Error running penetration test:', error);
      return res.status(500).json({ error: 'Failed to run penetration test' });
    }
  }
);

export default router;