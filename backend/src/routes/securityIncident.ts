/**
 * Security Incident Routes
 *
 * GDPR breach notification API endpoints (Article 33 & 34)
 * Admin-only routes for managing security incidents
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import * as securityIncidentService from '../services/securityIncidentService';
import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * POST /api/security-incidents
 * Report a new security incident
 */
router.post(
  '/',
  [
    body('type')
      .isIn(Object.values(IncidentType))
      .withMessage('Invalid incident type'),
    body('severity')
      .isIn(Object.values(IncidentSeverity))
      .withMessage('Invalid severity level'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('affectedDataTypes')
      .isArray({ min: 0 })
      .withMessage('Affected data types must be an array'),
    body('affectedUserCount')
      .isInt({ min: 0 })
      .withMessage('Affected user count must be a non-negative integer'),
    body('detectedAt')
      .isISO8601()
      .withMessage('Detected at must be a valid date'),
    body('reportedBy')
      .optional()
      .isString()
      .withMessage('Reported by must be a string'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const {
        type,
        severity,
        title,
        description,
        affectedDataTypes,
        affectedUserCount,
        detectedAt,
        reportedBy,
      } = req.body;

      const incident = await securityIncidentService.reportIncident({
        type,
        severity,
        title,
        description,
        affectedDataTypes,
        affectedUserCount,
        detectedAt: new Date(detectedAt),
        reportedBy: reportedBy || (req as any).user.id,
      });

      logger.info('Security incident reported via API', {
        incidentId: incident.id,
        reportedBy: (req as any).user.id,
      });

      return res.status(201).json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/security-incidents
 * List all security incidents with optional filtering
 */
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(Object.values(IncidentStatus))
      .withMessage('Invalid status'),
    query('severity')
      .optional()
      .isIn(Object.values(IncidentSeverity))
      .withMessage('Invalid severity'),
    query('type')
      .optional()
      .isIn(Object.values(IncidentType))
      .withMessage('Invalid type'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { status, severity, type } = req.query;

      // Build where clause for filtering
      const where: any = {};
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (type) where.type = type;

      const { prisma } = require('../config/database');
      const incidents = await prisma.securityIncident.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        include: {
          _count: {
            select: { notifications: true },
          },
        },
      });

      return res.json({
        success: true,
        data: incidents,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/security-incidents/:id
 * Get a specific security incident by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Incident ID is required'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;

      const { prisma } = require('../config/database');
      const incident = await prisma.securityIncident.findUnique({
        where: { id },
        include: {
          notifications: {
            orderBy: { sentAt: 'desc' },
          },
        },
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          error: 'Incident not found',
        });
      }

      return res.json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/security-incidents/:id
 * Update a security incident
 */
router.patch(
  '/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Incident ID is required'),
    body('status')
      .optional()
      .isIn(Object.values(IncidentStatus))
      .withMessage('Invalid status'),
    body('containedAt')
      .optional()
      .isISO8601()
      .withMessage('Contained at must be a valid date'),
    body('resolvedAt')
      .optional()
      .isISO8601()
      .withMessage('Resolved at must be a valid date'),
    body('remediationSteps')
      .optional()
      .isString()
      .withMessage('Remediation steps must be a string'),
    body('lessonsLearned')
      .optional()
      .isString()
      .withMessage('Lessons learned must be a string'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const updates: any = {};

      if (req.body.status) updates.status = req.body.status;
      if (req.body.containedAt) updates.containedAt = new Date(req.body.containedAt);
      if (req.body.resolvedAt) updates.resolvedAt = new Date(req.body.resolvedAt);
      if (req.body.remediationSteps) updates.remediationSteps = req.body.remediationSteps;
      if (req.body.lessonsLearned) updates.lessonsLearned = req.body.lessonsLearned;

      const incident = await securityIncidentService.updateIncidentStatus(id, updates);

      logger.info('Security incident updated', {
        incidentId: id,
        updatedBy: (req as any).user.id,
      });

      return res.json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/security-incidents/:id/notify-users
 * Notify affected users about the breach
 */
router.post(
  '/:id/notify-users',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Incident ID is required'),
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('User IDs must be a non-empty array'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { userIds } = req.body;

      const result = await securityIncidentService.notifyAffectedUsers(id, userIds);

      logger.info('Breach notifications sent', {
        incidentId: id,
        notificationsSent: result.notificationsSent,
        initiatedBy: (req as any).user.id,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/security-incidents/:id/report-ico
 * Report the incident to the ICO (Information Commissioner's Office)
 */
router.post(
  '/:id/report-ico',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Incident ID is required'),
    body('icoReferenceNumber')
      .trim()
      .notEmpty()
      .withMessage('ICO reference number is required'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { icoReferenceNumber } = req.body;

      const incident = await securityIncidentService.reportToICO(id, icoReferenceNumber);

      logger.info('Incident reported to ICO', {
        incidentId: id,
        icoReferenceNumber,
        reportedBy: (req as any).user.id,
      });

      return res.json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/security-incidents/:id/deadline
 * Calculate the 72-hour ICO notification deadline
 */
router.get(
  '/:id/deadline',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Incident ID is required'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;

      const { prisma } = require('../config/database');
      const incident = await prisma.securityIncident.findUnique({
        where: { id },
        select: { detectedAt: true },
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          error: 'Incident not found',
        });
      }

      const deadline = securityIncidentService.get72HourDeadline(incident.detectedAt);
      const now = new Date();
      const hoursRemaining = Math.max(
        0,
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      return res.json({
        success: true,
        data: {
          deadline: deadline.toISOString(),
          hoursRemaining: Math.round(hoursRemaining * 100) / 100,
          isPastDeadline: hoursRemaining <= 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
