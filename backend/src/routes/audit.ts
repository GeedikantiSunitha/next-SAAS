import { Router } from 'express';
import * as auditService from '../services/auditService';
import { authenticate } from '../middleware/auth';
import { getClientIp } from '../utils/getClientIp';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs with optional filters
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    const logs = await auditService.getAuditLogs({
      userId: userId as string | undefined,
      action: action as string | undefined,
      resource: resource as string | undefined,
      resourceId: resourceId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    return res.json({
      success: true,
      data: logs,
    });
  })
);

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: Get audit log statistics
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Audit statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const stats = await auditService.getAuditStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/audit/user/:userId
 * Get audit logs for a specific user
 */
router.get(
  '/user/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit, offset } = req.query;

    const logs = await auditService.getUserAuditLogs(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    return res.json({
      success: true,
      data: logs,
    });
  })
);

/**
 * GET /api/audit/resource/:resource
 * Get audit logs for a specific resource type
 */
router.get(
  '/resource/:resource',
  asyncHandler(async (req, res) => {
    const { resource } = req.params;
    const { resourceId, limit, offset } = req.query;

    const logs = await auditService.getResourceAuditLogs(
      resource,
      resourceId as string | undefined,
      {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      }
    );

    return res.json({
      success: true,
      data: logs,
    });
  })
);

/**
 * GET /api/audit/:id
 * Get a specific audit log by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const log = await auditService.getAuditLogById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found',
      });
    }

    return res.json({
      success: true,
      data: log,
    });
  })
);

/**
 * POST /api/audit
 * Create an audit log entry (typically called by middleware, not directly)
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { action, resource, resourceId, details, ipAddress, userAgent } = req.body;

    const log = await auditService.createAuditLog({
      userId: req.user!.id,
      action,
      resource,
      resourceId,
      details,
      ipAddress: ipAddress || getClientIp(req) || undefined,
      userAgent: userAgent || req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      data: log,
    });
  })
);

/**
 * DELETE /api/audit/old/:days
 * Delete audit logs older than specified days (admin only in production)
 */
router.delete(
  '/old/:days',
  asyncHandler(async (req, res) => {
    const days = parseInt(req.params.days);

    if (isNaN(days) || days < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter',
      });
    }

    const deletedCount = await auditService.deleteOldAuditLogs(days);

    return res.json({
      success: true,
      data: { deletedCount },
      message: `Deleted ${deletedCount} audit logs older than ${days} days`,
    });
  })
);

export default router;

