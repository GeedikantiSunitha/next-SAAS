import { Request, Response } from 'express';
import { register } from '../middleware/metrics';

/**
 * Metrics endpoint
 * Exposes Prometheus metrics for scraping
 * GET /api/metrics
 */
export const getMetrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate metrics',
    });
  }
};

