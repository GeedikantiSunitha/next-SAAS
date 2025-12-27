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
 * GET /api/admin/dashboard
 * Get admin dashboard overview
 */
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    // TODO: Implement dashboard stats
    // - Total users
    // - Active sessions
    // - Recent activity
    // - System health
    
    res.json({
      success: true,
      data: {
        message: 'Admin dashboard',
        stats: {
          totalUsers: 0,
          activeSessions: 0,
          recentActivity: [],
        },
      },
    });
  })
);

/**
 * GET /api/admin/users
 * List all users (with pagination, filters)
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
 * GET /api/admin/users/:id
 * Get user details by ID
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
 * POST /api/admin/users
 * Create a new user
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
 * PUT /api/admin/users/:id
 * Update user
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
 * DELETE /api/admin/users/:id
 * Delete user
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

export default router;

