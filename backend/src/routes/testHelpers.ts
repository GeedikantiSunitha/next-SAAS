/**
 * Test Helpers Routes
 * 
 * Routes for E2E testing - allows creating admin users and other test utilities
 * ONLY AVAILABLE IN TEST ENVIRONMENT
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import asyncHandler from '../utils/asyncHandler';
import config from '../config';

const router = Router();

// Only allow in test environment
if (config.nodeEnv !== 'test') {
  // In non-test environments, return 404 for all routes
  router.use('*', (_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
    });
  });
} else {
  /**
   * POST /api/test-helpers/users/:userId/role
   * Update user role (test only)
   */
  router.post(
    '/users/:userId/role',
    asyncHandler(async (req, res) => {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
        res.status(400).json({
          success: false,
          error: 'Invalid role. Must be USER, ADMIN, or SUPER_ADMIN',
        });
        return;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      res.json({
        success: true,
        data: user,
      });
    })
  );

  /**
   * POST /api/test-helpers/users/admin
   * Create admin user directly (test only)
   */
  router.post(
    '/users/admin',
    asyncHandler(async (req, res) => {
      const { email, password, name, role = 'ADMIN' } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      // Use the same password hashing as authService
      const { hashPassword } = await import('../services/authService');
      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || 'Test Admin',
          role: role as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      res.status(201).json({
        success: true,
        data: user,
      });
    })
  );

  /**
   * DELETE /api/test-helpers/users/:userId/sessions
   * Delete all sessions for a user (test only)
   */
  router.delete(
    '/users/:userId/sessions',
    asyncHandler(async (req, res) => {
      const { userId } = req.params;

      const deletedCount = await prisma.session.deleteMany({
        where: { userId },
      });

      res.json({
        success: true,
        data: {
          deletedCount: deletedCount.count,
        },
      });
    })
  );

  /**
   * DELETE /api/test-helpers/sessions/email/:email
   * Delete all sessions for a user by email (test only)
   */
  router.delete(
    '/sessions/email/:email',
    asyncHandler(async (req, res) => {
      const { email } = req.params;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const deletedCount = await prisma.session.deleteMany({
        where: { userId: user.id },
      });

      res.json({
        success: true,
        data: {
          deletedCount: deletedCount.count,
        },
      });
    })
  );

  /**
   * GET /api/test-helpers/password-reset/email/:email
   * Get password reset token for a user by email (test only)
   * Returns the most recent unused reset token
   */
  router.get(
    '/password-reset/email/:email',
    asyncHandler(async (req, res) => {
      const { email } = req.params;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Find most recent unused reset token
      const passwordReset = await prisma.passwordReset.findFirst({
        where: {
          userId: user.id,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          token: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      if (!passwordReset) {
        res.status(404).json({
          success: false,
          error: 'No active password reset token found for this user',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          token: passwordReset.token,
          expiresAt: passwordReset.expiresAt,
          createdAt: passwordReset.createdAt,
        },
      });
    })
  );

  /**
   * POST /api/test-helpers/users/:email/mfa/enable
   * Enable MFA for a user by email (test only)
   * Creates TOTP MFA method and enables it
   */
  router.post(
    '/users/:email/mfa/enable',
    asyncHandler(async (req, res) => {
      const { email } = req.params;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Import MFA service
      const { setupTotp } = await import('../services/mfaService');
      const speakeasy = require('speakeasy');

      // Setup TOTP
      const { secret } = await setupTotp(user.id);

      // Generate TOTP code for verification
      const totpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Enable MFA
      const { enableMfa } = await import('../services/mfaService');
      await enableMfa(user.id, 'TOTP', totpCode);

      res.json({
        success: true,
        data: {
          message: 'MFA enabled successfully',
          secret, // Return secret for testing purposes
        },
      });
    })
  );
}

export default router;
