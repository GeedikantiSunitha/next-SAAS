/**
 * Feature Flags Routes
 *
 * Exposes feature flags to frontend via API.
 * For admin-togglable flags (password_reset, registration, email_verification),
 * reads from database so Admin UI changes take effect immediately.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as featureFlagsService from '../services/featureFlagsService';
import * as featureFlagRuntimeService from '../services/featureFlagRuntimeService';

const router = Router();

/** Flags managed in DB by admin - use runtime service (DB-first) */
const RUNTIME_FLAGS = [
  'password_reset',
  'registration',
  'email_verification',
  'google_oauth',
  'github_oauth',
  'microsoft_oauth',
];

/** Public flags - safe to expose without auth (Login, Register, OAuth buttons) */
const PUBLIC_FLAGS = [
  'password_reset',
  'registration',
  'google_oauth',
  'github_oauth',
  'microsoft_oauth',
];

// Public route - no auth required (for Login, ForgotPassword, Header before login)
router.get(
  '/public/:flagName',
  asyncHandler(async (req, res) => {
    const { flagName } = req.params;
    if (!PUBLIC_FLAGS.includes(flagName)) {
      return res.status(400).json({ success: false, error: 'Invalid public flag' });
    }
    const enabled = await featureFlagRuntimeService.isFeatureEnabled(flagName);
    return res.json({
      success: true,
      data: { enabled },
    });
  })
);

// All routes below require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/feature-flags/{flagName}:
 *   get:
 *     summary: Get a specific feature flag
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: flagName
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature flag name
 *     responses:
 *       200:
 *         description: Feature flag status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  '/:flagName',
  asyncHandler(async (req, res) => {
    const { flagName } = req.params;

    let enabled: boolean;
    let value: string | undefined;

    if (RUNTIME_FLAGS.includes(flagName)) {
      enabled = await featureFlagRuntimeService.isFeatureEnabled(flagName);
      value = undefined;
    } else {
      enabled = featureFlagsService.isFeatureEnabled(flagName);
      value = featureFlagsService.getFeatureFlag(flagName) || undefined;
    }

    return res.json({
      success: true,
      data: {
        enabled,
        value,
      },
    });
  })
);

/**
 * @swagger
 * /api/feature-flags:
 *   get:
 *     summary: Get all feature flags
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All feature flags
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const flags = featureFlagsService.getAllFeatureFlags();

    return res.json({
      success: true,
      data: flags,
    });
  })
);

export default router;

