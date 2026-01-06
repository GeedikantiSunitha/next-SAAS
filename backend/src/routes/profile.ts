/**
 * Profile Routes
 * API endpoints for user profile management
 */

import { Router } from 'express';
import { body } from 'express-validator';
import * as profileService from '../services/profileService';
import { validate, validators } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { getClientIp } from '../utils/getClientIp';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/**
 * @swagger
 * /api/profile/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "user@example.com"
 *                 name: "John Doe"
 *                 role: "USER"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/profile/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newemail@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
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
    const ipAddress = getClientIp(req) || undefined;
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
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Change current user password
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password (must meet strength requirements)
 *                 example: NewSecurePassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error or weak password
 *       401:
 *         description: Unauthorized or incorrect current password
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
    const ipAddress = getClientIp(req) || undefined;
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

