/**
 * Observability Routes
 * 
 * Routes for monitoring, alerting, and metrics verification
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { checkAlerts, getAlertRules, DEFAULT_ALERT_RULES } from '../services/alertingService';
import { verifyMetrics, verifyMetricsEndpoint, verifyMetricsFormat, verifyMetricsContent } from '../services/metricsVerificationService';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/observability/alerts/check:
 *   get:
 *     summary: Check alert rules and return current alerts
 *     tags: [Observability]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Alert check results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/alerts/check',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await checkAlerts();
    
    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/observability/alerts/rules:
 *   get:
 *     summary: Get current alert rules
 *     tags: [Observability]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Alert rules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/alerts/rules',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const rules = getAlertRules();
    
    res.json({
      success: true,
      data: { rules },
    });
  })
);

/**
 * POST /api/observability/alerts/check
 * Manually trigger alert check
 * Requires: ADMIN or SUPER_ADMIN
 */
router.post(
  '/alerts/check',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const customRules = req.body.rules || DEFAULT_ALERT_RULES;
    const result = await checkAlerts(customRules);
    
    logger.info('Alert check triggered manually', {
      userId: (req as any).user?.id,
      totalAlerts: result.totalAlerts,
    });
    
    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/observability/metrics/verify:
 *   get:
 *     summary: Verify metrics collection is working
 *     tags: [Observability]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Metrics verification results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/metrics/verify',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const verification = await verifyMetrics();
    
    res.json({
      success: verification.overall,
      data: verification,
    });
  })
);

/**
 * GET /api/observability/metrics/verify/endpoint
 * Verify metrics endpoint accessibility
 * Requires: ADMIN or SUPER_ADMIN
 */
router.get(
  '/metrics/verify/endpoint',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await verifyMetricsEndpoint();
    
    res.json({
      success: result.success,
      data: result,
    });
  })
);

/**
 * GET /api/observability/metrics/verify/format
 * Verify metrics format
 * Requires: ADMIN or SUPER_ADMIN
 */
router.get(
  '/metrics/verify/format',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await verifyMetricsFormat();
    
    res.json({
      success: result.success,
      data: result,
    });
  })
);

/**
 * GET /api/observability/metrics/verify/content
 * Verify metrics content
 * Requires: ADMIN or SUPER_ADMIN
 */
router.get(
  '/metrics/verify/content',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await verifyMetricsContent();
    
    res.json({
      success: result.success,
      data: result,
    });
  })
);

export default router;
