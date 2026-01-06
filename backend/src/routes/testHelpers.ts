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
      const { hashPassword } = await import('../utils/password');
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
}

export default router;
