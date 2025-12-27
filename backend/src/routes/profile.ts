/**
 * Profile Routes
 * API endpoints for user profile management
 */

import { Router } from 'express';
import { body } from 'express-validator';
import * as profileService from '../services/profileService';
import { validate, validators } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/**
 * GET /api/profile/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await profileService.getUserProfile(req.user!.id);

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * PUT /api/profile/me
 * Update current user profile
 */
router.put(
  '/me',
  authenticate,
  validate([
    validators.name.optional(),
    validators.email.optional(),
  ]),
  asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const updatedUser = await profileService.updateProfile(
      req.user!.id,
      { name, email },
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: updatedUser,
    });
  })
);

/**
 * PUT /api/profile/password
 * Change current user password
 */
router.put(
  '/password',
  authenticate,
  validate([
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[@$!%*?&#]/)
      .withMessage('Password must contain at least one special character (@$!%*?&#)'),
  ]),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await profileService.changePassword(
      req.user!.id,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;

