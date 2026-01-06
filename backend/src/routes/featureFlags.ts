/**
 * Feature Flags Routes
 * 
 * Exposes feature flags to frontend via API
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as featureFlagsService from '../services/featureFlagsService';

const router = Router();

// All routes require authentication
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
    const enabled = featureFlagsService.isFeatureEnabled(flagName);
    const value = featureFlagsService.getFeatureFlag(flagName);

    return res.json({
      success: true,
      data: {
        enabled,
        value: value || undefined,
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

