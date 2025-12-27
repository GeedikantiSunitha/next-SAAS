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
 * GET /api/feature-flags/:flagName
 * Get a specific feature flag
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
 * GET /api/feature-flags
 * Get all feature flags
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

