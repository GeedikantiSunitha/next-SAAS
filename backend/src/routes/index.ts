import { Router } from 'express';
import { getCsrfToken } from '../middleware/csrf';
import authRoutes from './auth';
import healthRoutes from './health';
import profileRoutes from './profile';
import notificationRoutes from './notifications';
import auditRoutes from './audit';
import rbacRoutes from './rbac';
import paymentRoutes from './payments';
import gdprRoutes from './gdpr';
import newsletterRoutes from './newsletter';
import featureFlagsRoutes from './featureFlags';
import adminRoutes from './admin';
import observabilityRoutes from './observability';
import testHelpersRoutes from './testHelpers';
import securityIncidentRoutes from './securityIncident';
import privacyCenterRoutes from './privacyCenter';
import securityTestingRoutes from './securityTesting';
import accessibilityRoutes from './accessibility';
import { getMetrics } from './metrics';

const router = Router();

// CSRF token endpoint (GET; no auth required so frontend can get token before login)
router.get('/csrf-token', (req, res) => getCsrfToken(req, res));

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/rbac', rbacRoutes);
router.use('/payments', paymentRoutes);
router.use('/gdpr', gdprRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/feature-flags', featureFlagsRoutes);
router.use('/security-incidents', securityIncidentRoutes); // Security incident management
router.use('/privacy-center', privacyCenterRoutes); // Privacy Center dashboard
router.use('/security', securityTestingRoutes); // Security testing and vulnerability scanning
router.use('/accessibility', accessibilityRoutes); // Accessibility preferences and reporting
router.use('/admin', adminRoutes); // Admin routes (protected by role)
router.use('/observability', observabilityRoutes); // Observability routes (protected by role)
router.use('/test-helpers', testHelpersRoutes); // Test helpers (test environment only)
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

