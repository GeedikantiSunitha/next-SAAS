/**
 * GDPR Compliance API Routes
 */

import { Router } from 'express';
import * as gdprService from '../services/gdprService';
import { authenticate } from '../middleware/auth';
import { getClientIp } from '../utils/getClientIp';
import asyncHandler from '../utils/asyncHandler';
import { DeletionType, ConsentType } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/gdpr/export:
 *   post:
 *     summary: Request data export (GDPR)
 *     tags: [GDPR]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Data export requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 id: "export-id"
 *                 downloadUrl: "https://..."
 *               message: "Data export generated successfully. Download link expires in 7 days."
 */
router.post(
  '/export',
  asyncHandler(async (req, res) => {
    const exportRequest = await gdprService.requestDataExport(req.user!.id);

    // Trigger background job to generate export
    // For now, generate immediately
    const exportData = await gdprService.generateDataExport(exportRequest.id);

    res.status(201).json({
      success: true,
      data: exportData,
      message: 'Data export generated successfully. Download link expires in 7 days.',
    });
  })
);

/**
 * @swagger
 * /api/gdpr/exports:
 *   get:
 *     summary: Get user's export requests (GDPR)
 *     tags: [GDPR]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of export requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  '/exports',
  asyncHandler(async (req, res) => {
    const exports = await gdprService.getUserExportRequests(req.user!.id);

    res.json({
      success: true,
      data: exports,
    });
  })
);

/**
 * @swagger
 * /api/gdpr/deletion:
 *   post:
 *     summary: Request data deletion (GDPR)
 *     tags: [GDPR]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deletionType:
 *                 type: string
 *                 enum: [SOFT, HARD]
 *                 description: Type of deletion (SOFT = anonymize, HARD = permanent)
 *               reason:
 *                 type: string
 *                 description: Reason for deletion request
 *     responses:
 *       201:
 *         description: Deletion request created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Data deletion requested. Please check your email to confirm."
 */
router.post(
  '/deletion',
  asyncHandler(async (req, res) => {
    const { deletionType, reason } = req.body;

    const deletionRequest = await gdprService.requestDataDeletion(
      req.user!.id,
      (deletionType as DeletionType) || DeletionType.SOFT,
      reason
    );

    res.status(201).json({
      success: true,
      data: deletionRequest,
      message: 'Data deletion requested. Please check your email to confirm.',
    });
  })
);

/**
 * @swagger
 * /api/gdpr/deletions:
 *   get:
 *     summary: Get user's deletion requests (GDPR)
 *     tags: [GDPR]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of deletion requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  '/deletions',
  asyncHandler(async (req, res) => {
    const deletions = await gdprService.getUserDeletionRequests(req.user!.id);

    res.json({
      success: true,
      data: deletions,
    });
  })
);

/**
 * @swagger
 * /api/gdpr/deletion/confirm/{token}:
 *   post:
 *     summary: Confirm data deletion request (GDPR) - Public endpoint
 *     tags: [GDPR]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Deletion confirmation token from email
 *     responses:
 *       200:
 *         description: Deletion confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Data deletion confirmed. Your data will be deleted within 24 hours."
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/deletion/confirm/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    await gdprService.confirmDataDeletion(token);

    res.json({
      success: true,
      message: 'Data deletion confirmed. Your data will be deleted within 24 hours.',
    });
  })
);

/**
 * @swagger
 * /api/gdpr/consents:
 *   post:
 *     summary: Grant consent (GDPR)
 *     tags: [GDPR]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consentType
 *             properties:
 *               consentType:
 *                 type: string
 *                 enum: [MARKETING, ANALYTICS, FUNCTIONAL]
 *     responses:
 *       200:
 *         description: Consent granted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post(
  '/consents',
  asyncHandler(async (req, res) => {
    const { consentType } = req.body;

    if (!consentType || !Object.values(ConsentType).includes(consentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consent type',
      });
    }

    const consent = await gdprService.grantConsent(
      req.user!.id,
      consentType as ConsentType,
      getClientIp(req) || undefined,
      req.headers['user-agent']
    );

    return res.json({
      success: true,
      data: consent,
      message: 'Consent granted successfully',
    });
  })
);

/**
 * @swagger
 * /api/gdpr/consents/{consentType}:
 *   delete:
 *     summary: Revoke consent (GDPR)
 *     tags: [GDPR]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: consentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [MARKETING, ANALYTICS, FUNCTIONAL]
 *         description: Type of consent to revoke
 *     responses:
 *       200:
 *         description: Consent revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid consent type
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/consents/:consentType',
  asyncHandler(async (req, res) => {
    const { consentType } = req.params;

    if (!Object.values(ConsentType).includes(consentType as ConsentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consent type',
      });
    }

    const consent = await gdprService.revokeConsent(
      req.user!.id,
      consentType as ConsentType,
      getClientIp(req) || undefined,
      req.headers['user-agent']
    );

    return res.json({
      success: true,
      data: consent,
      message: 'Consent revoked successfully',
    });
  })
);

/**
 * @swagger
 * /api/gdpr/consents:
 *   get:
 *     summary: Get user's consent records (GDPR)
 *     tags: [GDPR]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of user consents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/consents',
  asyncHandler(async (req, res) => {
    const consents = await gdprService.getUserConsents(req.user!.id);

    res.json({
      success: true,
      data: consents,
    });
  })
);

/**
 * @swagger
 * /api/gdpr/consents/{consentType}/check:
 *   get:
 *     summary: Check if user has specific consent (GDPR)
 *     tags: [GDPR]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: consentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [MARKETING, ANALYTICS, FUNCTIONAL]
 *         description: Type of consent to check
 *     responses:
 *       200:
 *         description: Consent status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 hasConsent: true
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/consents/:consentType/check',
  asyncHandler(async (req, res) => {
    const { consentType } = req.params;

    const hasConsent = await gdprService.hasConsent(
      req.user!.id,
      consentType as ConsentType
    );

    res.json({
      success: true,
      data: { hasConsent },
    });
  })
);

export default router;

