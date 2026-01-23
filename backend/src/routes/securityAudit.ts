/**
 * Security Audit API Routes
 *
 * Task 3.3: Security Monitoring & Alerting
 * Provides endpoints for security dashboard and monitoring
 */

import { Router, Request, Response } from 'express';
import { securityAuditService } from '../services/securityAuditService';
import { SecurityEventSeverity } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';

const router = Router();

/**
 * Get recent security events
 * GET /api/security/events
 */
router.get(
  '/events',
  isAuthenticated,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const hoursBack = parseInt(req.query.hoursBack as string) || 24;
      const events = await securityAuditService.getRecentSecurityEvents(hoursBack);

      res.json({
        success: true,
        data: events,
        count: events.length,
      });
    } catch (error) {
      console.error('Error fetching security events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security events',
      });
    }
  }
);

/**
 * Get security events by severity
 * GET /api/security/events/severity/:severity
 */
router.get(
  '/events/severity/:severity',
  isAuthenticated,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const severity = req.params.severity as SecurityEventSeverity;

      if (!Object.values(SecurityEventSeverity).includes(severity)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid severity level',
        });
      }

      const events = await securityAuditService.getEventsBySeverity(severity);

      res.json({
        success: true,
        data: events,
        count: events.length,
      });
    } catch (error) {
      console.error('Error fetching events by severity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch events by severity',
      });
    }
  }
);

/**
 * Get threat indicators
 * GET /api/security/threat-indicators
 */
router.get(
  '/threat-indicators',
  isAuthenticated,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const hoursBack = parseInt(req.query.hoursBack as string) || 24;
      const indicators = await securityAuditService.getThreatIndicators(hoursBack);

      res.json({
        success: true,
        data: indicators,
      });
    } catch (error) {
      console.error('Error fetching threat indicators:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch threat indicators',
      });
    }
  }
);

/**
 * Check if user account is locked
 * GET /api/security/account-status/:userId
 */
router.get(
  '/account-status/:userId',
  isAuthenticated,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Get recent failed login attempts for user
      const bruteForceDetected = await securityAuditService.detectBruteForce(
        userId,
        5, // threshold
        5  // window in minutes
      );

      res.json({
        success: true,
        data: {
          userId,
          bruteForceDetected,
          accountLocked: bruteForceDetected, // In production, check user.isActive
        },
      });
    } catch (error) {
      console.error('Error checking account status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check account status',
      });
    }
  }
);

/**
 * Archive old security logs
 * POST /api/security/archive
 */
router.post(
  '/archive',
  isAuthenticated,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const daysToKeep = parseInt(req.body.daysToKeep) || 90;

      const result = await securityAuditService.archiveOldLogs(daysToKeep);

      res.json({
        success: true,
        data: result,
        message: `Archived ${result.archived} security logs older than ${daysToKeep} days`,
      });
    } catch (error) {
      console.error('Error archiving logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to archive logs',
      });
    }
  }
);

/**
 * Get security event statistics
 * GET /api/security/statistics
 */
router.get(
  '/statistics',
  isAuthenticated,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const hoursBack = parseInt(req.query.hoursBack as string) || 24;

      // Get various statistics
      const [events, indicators] = await Promise.all([
        securityAuditService.getRecentSecurityEvents(hoursBack),
        securityAuditService.getThreatIndicators(hoursBack),
      ]);

      // Calculate statistics
      const stats = {
        totalEvents: events.length,
        eventsBySeverity: {
          critical: events.filter(e => e.severity === 'CRITICAL').length,
          high: events.filter(e => e.severity === 'HIGH').length,
          medium: events.filter(e => e.severity === 'MEDIUM').length,
          low: events.filter(e => e.severity === 'LOW').length,
          info: events.filter(e => e.severity === 'INFO').length,
        },
        threatLevel: indicators.threatLevel,
        failedLogins: indicators.failedLogins,
        bruteForceAttempts: indicators.bruteForceAttempts,
        rateLimitViolations: indicators.rateLimitViolations,
        unauthorizedAccess: indicators.unauthorizedAccess,
        suspiciousActivity: indicators.suspiciousActivity,
        timeRange: {
          from: new Date(Date.now() - hoursBack * 60 * 60 * 1000),
          to: new Date(),
        },
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  }
);

/**
 * Get security timeline
 * GET /api/security/timeline
 */
router.get(
  '/timeline',
  isAuthenticated,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const hoursBack = parseInt(req.query.hoursBack as string) || 24;
      const limit = parseInt(req.query.limit as string) || 100;

      const events = await securityAuditService.getRecentSecurityEvents(hoursBack);

      // Sort by time and limit
      const timeline = events
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map(event => ({
          id: event.id,
          timestamp: event.createdAt,
          type: event.eventType,
          severity: event.severity,
          user: event.user ? {
            id: event.userId,
            email: event.user.email,
            name: event.user.name,
          } : null,
          ipAddress: event.ipAddress,
          resource: event.resource,
          action: event.action,
          outcome: event.outcome,
          details: event.details,
          alertSent: event.alertSent,
        }));

      res.json({
        success: true,
        data: timeline,
        count: timeline.length,
        totalEvents: events.length,
      });
    } catch (error) {
      console.error('Error fetching timeline:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch timeline',
      });
    }
  }
);

export default router;