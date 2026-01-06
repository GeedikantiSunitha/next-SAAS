import { Router } from 'express';
import { prisma } from '../config/database';
import asyncHandler from '../utils/asyncHandler';
import config from '../config';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: healthy
 *       503:
 *         description: Service is degraded
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // Check database connection
    let dbStatus = 'healthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // Check email configuration
    const emailConfigured = !!(
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== 'your-resend-api-key-here' &&
      config.email.apiKey &&
      config.email.apiKey !== 'your-resend-api-key-here'
    );

    const health = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      email: {
        configured: emailConfigured,
        fromEmail: config.email.fromEmail || 'not configured',
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  })
);

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      // Check if database is accessible
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        ready: false,
        error: 'Database not accessible',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;

