/**
 * Admin routes for consent version management
 * TDD Phase 2: GREEN - Minimal implementation to make tests pass
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ConsentType } from '@prisma/client';
import * as consentVersionService from '../../services/consentVersionService';

const router = Router();

// Middleware will be added during route registration
// This allows for proper mocking in tests

// POST /api/admin/consent-versions
router.post(
  '/',
  [
    body('consentType').isIn(Object.values(ConsentType)).withMessage('Invalid consent type'),
    body('version').matches(/^\d+\.\d+\.\d+$/).withMessage('Version must follow semver format (e.g., 1.0.0)'),
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
  async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      const { consentType, version, title, content } = req.body;

      const consentVersion = await consentVersionService.createConsentVersion(
        consentType,
        version,
        title,
        content
      );

      return res.status(201).json({
        success: true,
        data: consentVersion,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
);

// GET /api/admin/consent-versions/:consentType
router.get('/:consentType', async (req: Request, res: Response): Promise<Response> => {
  const consentType = req.params.consentType;

  // Validate consent type
  if (!Object.values(ConsentType).includes(consentType as ConsentType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid consent type'
    });
  }

  try {
    const versions = await consentVersionService.getConsentVersions(consentType as ConsentType);
    return res.json({ success: true, data: versions });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/consent-versions/:consentType/active
router.get('/:consentType/active', async (req: Request, res: Response): Promise<Response> => {
  const consentType = req.params.consentType;

  if (!Object.values(ConsentType).includes(consentType as ConsentType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid consent type'
    });
  }

  try {
    const activeVersion = await consentVersionService.getActiveConsentVersion(consentType as ConsentType);

    if (!activeVersion) {
      return res.status(404).json({
        success: false,
        error: 'No active version found'
      });
    }

    return res.json({ success: true, data: activeVersion });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/consent-versions/:consentType/users-needing-reconsent
router.get('/:consentType/users-needing-reconsent', async (req: Request, res: Response): Promise<Response> => {
  const consentType = req.params.consentType;

  if (!Object.values(ConsentType).includes(consentType as ConsentType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid consent type'
    });
  }

  try {
    const users = await consentVersionService.getUsersNeedingReConsent(consentType as ConsentType);
    return res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/consent-versions/compare
router.post('/compare',
  [
    body('consentType').isIn(Object.values(ConsentType)).withMessage('Invalid consent type'),
    body('version1').notEmpty().withMessage('version1 is required').matches(/^\d+\.\d+\.\d+$/).withMessage('Version 1 must follow semver format'),
    body('version2').notEmpty().withMessage('version2 is required').matches(/^\d+\.\d+\.\d+$/).withMessage('Version 2 must follow semver format'),
  ],
  async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { consentType, version1, version2 } = req.body;

    try {
      const comparison = await consentVersionService.compareVersions(consentType, version1, version2);
      return res.json({ success: true, data: comparison });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
);

// POST /api/admin/consent-versions/expired/handle
router.post('/expired/handle', async (_req: Request, res: Response): Promise<Response> => {
  try {
    const count = await consentVersionService.handleExpiredConsents();
    return res.json({
      success: true,
      message: `Successfully handled ${count} expired consent(s)`,
      count
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;