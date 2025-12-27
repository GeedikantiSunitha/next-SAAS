import { Router } from 'express';
import authRoutes from './auth';
import healthRoutes from './health';
import profileRoutes from './profile';
import notificationRoutes from './notifications';
import auditRoutes from './audit';
import rbacRoutes from './rbac';
import paymentRoutes from './payments';
import gdprRoutes from './gdpr';
import featureFlagsRoutes from './featureFlags';
import adminRoutes from './admin';
import { getMetrics } from './metrics';

const router = Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/rbac', rbacRoutes);
router.use('/payments', paymentRoutes);
router.use('/gdpr', gdprRoutes);
router.use('/feature-flags', featureFlagsRoutes);
router.use('/admin', adminRoutes); // Admin routes (protected by role)
router.get('/metrics', getMetrics); // Expose metrics endpoint

// Root endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'App Template API',
    version: '1.0.0',
  });
});

export default router;

