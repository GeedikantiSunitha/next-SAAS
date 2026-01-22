/**
 * Privacy Center Routes
 * Unified dashboard API for privacy management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as privacyCenterService from '../services/privacyCenterService';
import { AppError } from '../utils/errors';

const router = Router();

// All privacy center routes require authentication
router.use(authenticate);

/**
 * GET /api/privacy-center/overview
 * Get complete privacy overview for authenticated user
 */
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const overview = await privacyCenterService.getPrivacyOverview(userId);

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/privacy-center/data-categories
 * Get detailed data categories with counts
 */
router.get('/data-categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const categories = await privacyCenterService.getDataCategories(userId);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/privacy-center/access-log
 * Get paginated data access log
 */
router.get('/access-log', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Parse query parameters
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      accessType: req.query.accessType as string | undefined,
    };

    const accessLog = await privacyCenterService.getDataAccessLog(userId, filters);

    res.json({
      success: true,
      data: accessLog,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/privacy-center/metrics
 * Get privacy metrics summary
 */
router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const metrics = await privacyCenterService.getPrivacyMetrics(userId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/privacy-center/privacy-preferences
 * Update privacy preferences
 */
router.post('/privacy-preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    // Validate profile visibility if provided
    if (updates.profileVisibility) {
      const validValues = ['PRIVATE', 'FRIENDS', 'PUBLIC'];
      if (!validValues.includes(updates.profileVisibility)) {
        throw new AppError('Invalid profile visibility value', 400);
      }
    }

    const preferences = await privacyCenterService.updatePrivacyPreferences(
      userId,
      updates,
      { logChange: true }
    );

    res.json({
      success: true,
      message: 'Privacy preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/privacy-center/clear-cache
 * Clear user's privacy cache
 */
router.post('/clear-cache', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await privacyCenterService.clearUserCache(userId);

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;