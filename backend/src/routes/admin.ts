import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { validate, validators } from '../middleware/validation';
import asyncHandler from '../utils/asyncHandler';
import * as adminUserService from '../services/adminUserService';

const router = Router();

// All admin routes require authentication and ADMIN/SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard overview
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const adminDashboardService = await import('../services/adminDashboardService');
    const stats = await adminDashboardService.getDashboardStats();
    
    res.json({
      success: true,
      data: {
        message: 'Admin dashboard',
        stats,
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users (with pagination, filters)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN, SUPER_ADMIN]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string | undefined,
      role: req.query.role as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    };

    const result = await adminUserService.listUsers(params, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminUserService.getUserById(id, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, SUPER_ADMIN]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post(
  '/users',
  validate([
    validators.email,
    validators.password,
    body('name').optional().isString().trim(),
    body('role').optional().isIn(['USER', 'ADMIN', 'SUPER_ADMIN']),
    body('isActive').optional().isBoolean(),
  ]),
  asyncHandler(async (req, res) => {
    const userData = {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      role: req.body.role,
      isActive: req.body.isActive,
    };

    const result = await adminUserService.createUser(userData, req.user!.id);

    res.status(201).json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, SUPER_ADMIN]
 *               isActive:
 *                 type: boolean
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 */
router.put(
  '/users/:id',
  validate([
    body('email').optional().isEmail(),
    body('name').optional().isString().trim(),
    body('role').optional().isIn(['USER', 'ADMIN', 'SUPER_ADMIN']),
    body('isActive').optional().isBoolean(),
    body('password').optional().isString(),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {
      email: req.body.email,
      name: req.body.name,
      role: req.body.role,
      isActive: req.body.isActive,
      password: req.body.password,
    };

    const result = await adminUserService.updateUser(id, updateData, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 */
router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await adminUserService.deleteUser(id, req.user!.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  })
);

/**
 * GET /api/admin/users/:id/sessions
 * Get user sessions
 */
router.get(
  '/users/:id/sessions',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminUserService.getUserSessions(id, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * DELETE /api/admin/users/:id/sessions/:sessionId
 * Revoke user session
 */
router.delete(
  '/users/:id/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const { id, sessionId } = req.params;
    await adminUserService.revokeUserSession(id, sessionId, req.user!.id);

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  })
);

/**
 * GET /api/admin/users/:id/activity
 * Get user activity log
 */
router.get(
  '/users/:id/activity',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await adminUserService.getUserActivity(id, params, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/admin/metrics/system
 * Get system metrics
 */
router.get(
  '/metrics/system',
  asyncHandler(async (_req, res) => {
    const adminMonitoringService = await import('../services/adminMonitoringService');
    const metrics = await adminMonitoringService.getSystemMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  })
);

/**
 * GET /api/admin/metrics/database
 * Get database metrics
 */
router.get(
  '/metrics/database',
  asyncHandler(async (_req, res) => {
    const adminMonitoringService = await import('../services/adminMonitoringService');
    const metrics = await adminMonitoringService.getDatabaseMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  })
);

/**
 * GET /api/admin/metrics/api
 * Get API usage metrics
 */
router.get(
  '/metrics/api',
  asyncHandler(async (_req, res) => {
    const adminMonitoringService = await import('../services/adminMonitoringService');
    const metrics = await adminMonitoringService.getApiMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  })
);

/**
 * GET /api/admin/errors/recent
 * Get recent errors
 */
router.get(
  '/errors/recent',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const adminMonitoringService = await import('../services/adminMonitoringService');
    const result = await adminMonitoringService.getRecentErrors(limit);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filters
 */
router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const adminAuditService = await import('../services/adminAuditService');
    const filters = {
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      resource: req.query.resource as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await adminAuditService.getAuditLogs(filters, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/admin/audit-logs/export
 * Export audit logs
 */
router.get(
  '/audit-logs/export',
  asyncHandler(async (req, res) => {
    const adminAuditService = await import('../services/adminAuditService');
    const format = (req.query.format as 'csv' | 'json') || 'json';
    const filters = {
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      resource: req.query.resource as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const data = await adminAuditService.exportAuditLogs(filters, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
      res.json(JSON.parse(data));
    }
  })
);

/**
 * GET /api/admin/feature-flags
 * Get all feature flags
 */
router.get(
  '/feature-flags',
  asyncHandler(async (req, res) => {
    const adminFeatureFlagsService = await import('../services/adminFeatureFlagsService');
    const result = await adminFeatureFlagsService.getAllFeatureFlags(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * PUT /api/admin/feature-flags/:key
 * Update feature flag
 */
router.put(
  '/feature-flags/:key',
  validate([body('enabled').isBoolean()]),
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const adminFeatureFlagsService = await import('../services/adminFeatureFlagsService');
    const result = await adminFeatureFlagsService.updateFeatureFlag(
      key,
      req.body.enabled,
      req.user!.id
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/admin/payments
 * Get payments with filters
 */
router.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const adminPaymentsService = await import('../services/adminPaymentsService');
    const filters = {
      userId: req.query.userId as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await adminPaymentsService.getPayments(filters, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/admin/subscriptions
 * Get subscriptions
 */
router.get(
  '/subscriptions',
  asyncHandler(async (req, res) => {
    const adminPaymentsService = await import('../services/adminPaymentsService');
    const filters = {
      userId: req.query.userId as string | undefined,
      status: req.query.status as string | undefined,
    };

    const result = await adminPaymentsService.getSubscriptions(filters, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/admin/settings
 * Get system settings
 */
router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const adminSettingsService = await import('../services/adminSettingsService');
    const result = await adminSettingsService.getSettings(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * PUT /api/admin/settings
 * Update system settings
 */
router.put(
  '/settings',
  validate([body('settings').isObject()]),
  asyncHandler(async (req, res) => {
    const adminSettingsService = await import('../services/adminSettingsService');
    const result = await adminSettingsService.updateSettings(req.body.settings, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/admin/retention/enforce
 * Manually trigger retention policy enforcement
 */
router.post(
  '/retention/enforce',
  asyncHandler(async (_req, res) => {
    const dataRetentionService = await import('../services/dataRetentionService');
    const result = await dataRetentionService.enforceRetentionPolicies();

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/admin/users/:id/legal-hold
 * Place a user on legal hold
 */
router.post(
  '/users/:id/legal-hold',
  validate([
    body('reason')
      .notEmpty()
      .withMessage('Legal hold reason is required')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Legal hold reason cannot be empty'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const dataRetentionService = await import('../services/dataRetentionService');
    await dataRetentionService.placeOnLegalHold(id, reason);

    res.json({
      success: true,
      message: `User placed on legal hold successfully`,
    });
  })
);

/**
 * DELETE /api/admin/users/:id/legal-hold
 * Release a user from legal hold
 */
router.delete(
  '/users/:id/legal-hold',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const dataRetentionService = await import('../services/dataRetentionService');
    await dataRetentionService.releaseLegalHold(id);

    res.json({
      success: true,
      message: `User released from legal hold successfully`,
    });
  })
);

export default router;

