import express, { Request, Response, NextFunction } from 'express';
import accessibilityService from '../services/accessibilityService';
import { authenticate } from '../middleware/auth';
import validate from '../middleware/validation';
import { body, query } from 'express-validator';
import { AccessibilityIssueType } from '@prisma/client';

const router = express.Router();

/**
 * @route   GET /api/accessibility/preferences
 * @desc    Get user's accessibility preferences
 * @access  Private
 */
router.get('/preferences', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preferences = await accessibilityService.getPreferences(req.user!.id);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/accessibility/preferences
 * @desc    Update user's accessibility preferences
 * @access  Private
 */
router.put('/preferences',
  authenticate,
  validate([
    body('highContrast').optional().isBoolean()
      .withMessage('highContrast must be boolean'),
    body('reduceMotion').optional().isBoolean()
      .withMessage('reduceMotion must be boolean'),
    body('fontSize').optional().isIn(['small', 'medium', 'large'])
      .withMessage('Invalid font size. Must be small, medium, or large'),
    body('keyboardShortcuts').optional().isBoolean()
      .withMessage('keyboardShortcuts must be boolean'),
    body('screenReaderMode').optional().isBoolean()
      .withMessage('screenReaderMode must be boolean')
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preferences = await accessibilityService.updatePreferences(
        req.user!.id,
        req.body
      );

      res.json({
        message: 'Preferences updated successfully',
        preferences
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/accessibility/statement
 * @desc    Get accessibility statement data
 * @access  Public
 */
router.get('/statement', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const statement = await accessibilityService.getStatement();
    res.json(statement);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/accessibility/report-issue
 * @desc    Report an accessibility issue
 * @access  Public (optional authentication)
 */
router.post('/report-issue',
  validate([
    body('type').isIn(Object.values(AccessibilityIssueType))
      .withMessage('Invalid issue type'),
    body('description').trim().notEmpty()
      .withMessage('Description is required'),
    body('url').optional().isURL({ require_tld: false })
      .withMessage('Invalid URL format'),
    body('userAgent').optional().isString()
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get userId if authenticated
      let userId: string | undefined;

      // Check if authorization header exists
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          // Use authenticate middleware manually
          await new Promise((resolve, reject) => {
            authenticate(req, res, (err?: any) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
          userId = req.user?.id;
        } catch {
          // Continue without authentication
        }
      }

      const result = await accessibilityService.reportIssue({
        ...req.body,
        userId
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/accessibility/issues
 * @desc    Get accessibility issues (admin only)
 * @access  Private (Admin)
 */
router.get('/issues',
  authenticate,
  validate([
    query('status').optional().isString(),
    query('type').optional().isString(),
    query('priority').optional().isString()
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const issues = await accessibilityService.getIssues(req.query as any);
      return res.json(issues);
    } catch (error) {
      return next(error);
    }
  }
);

export default router;