import { Router, CookieOptions } from 'express';
import { body } from 'express-validator';
import * as authService from '../services/authService';
import { validate, validators } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/security';
import asyncHandler from '../utils/asyncHandler';
import config from '../config';
import { prisma } from '../config/database';

const router = Router();

/**
 * Build cookie options, excluding domain if not set (for development)
 */
const getCookieOptions = (maxAge: number): CookieOptions => {
  const options: CookieOptions = {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge,
    path: '/',
  };
  
  // Only set domain if explicitly configured (for production)
  if (config.cookie.domain) {
    options.domain = config.cookie.domain;
  }
  
  return options;
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  validate([
    validators.email,
    validators.password,
    validators.name,
  ]),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const user = await authService.register(email, password, name, ipAddress, userAgent);

    // Auto-login after registration: generate tokens and set as cookies
    const { accessToken, refreshToken } = authService.generateTokens(user.id);

    // Save refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Set access token as HTTP-only cookie
    res.cookie('accessToken', accessToken, getCookieOptions(config.cookie.accessTokenMaxAge));

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions(config.cookie.maxAge));

    res.status(201).json({
      success: true,
      data: user,
    });
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  validate([
    validators.email,
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const { user, accessToken, refreshToken } = await authService.login(
      email,
      password,
      ipAddress,
      userAgent
    );

    // Set access token as HTTP-only cookie
    res.cookie('accessToken', accessToken, getCookieOptions(config.cookie.accessTokenMaxAge));

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions(config.cookie.maxAge));

    // Return user only (no tokens in body)
    // Match register response format: data is user directly
    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'No refresh token provided',
      });
      return;
    }

    const { accessToken } = await authService.refreshAccessToken(refreshToken);

    // Set new access token as HTTP-only cookie
    res.cookie('accessToken', accessToken, getCookieOptions(config.cookie.accessTokenMaxAge));

    // Return success only (no tokens in body)
    res.json({
      success: true,
      data: {},
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user (delete session)
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear access token cookie (use same options as when setting, but maxAge=0 effectively clears)
    res.clearCookie('accessToken', getCookieOptions(0));

    // Clear refresh token cookie
    res.clearCookie('refreshToken', getCookieOptions(0));

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user!.id);

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate([validators.email]),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

/**
 * POST /api/auth/reset-password/:token
 * Reset password using token
 */
router.post(
  '/reset-password/:token',
  authLimiter,
  validate([
    validators.password,
  ]),
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const result = await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

/**
 * POST /api/auth/oauth/link
 * Link OAuth provider to existing account
 */
router.post(
  '/oauth/link',
  authenticate,
  authLimiter,
  validate([
    body('provider').isIn(['google', 'github', 'microsoft']).withMessage('Invalid OAuth provider'),
    body('token').notEmpty().withMessage('OAuth token is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { provider, token } = req.body;
    const userId = req.user!.id;

    // Import here to avoid circular dependency
    const { verifyOAuthToken } = await import('../utils/oauthTokenVerifier');
    const { linkOAuthToUser } = await import('../services/oauthService');

    // Verify token and get profile
    const profile = await verifyOAuthToken(provider as 'google' | 'github' | 'microsoft', token);

    // Link OAuth to user
    const user = await linkOAuthToUser(userId, provider as 'google' | 'github' | 'microsoft', profile);

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'OAUTH_LINKED',
        resource: 'users',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          provider,
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * POST /api/auth/oauth/unlink
 * Unlink OAuth provider from account
 */
router.post(
  '/oauth/unlink',
  authenticate,
  authLimiter,
  validate([
    body('provider').isIn(['google', 'github', 'microsoft']).withMessage('Invalid OAuth provider'),
  ]),
  asyncHandler(async (req, res) => {
    const { provider } = req.body;
    const userId = req.user!.id;

    // Import here to avoid circular dependency
    const { unlinkOAuthFromUser } = await import('../services/oauthService');

    // Unlink OAuth from user
    const user = await unlinkOAuthFromUser(userId, provider as 'google' | 'github' | 'microsoft');

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'OAUTH_UNLINKED',
        resource: 'users',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          provider,
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * GET /api/auth/oauth/methods
 * Get user's linked OAuth methods
 */
router.get(
  '/oauth/methods',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Import here to avoid circular dependency
    const { getUserOAuthMethods } = await import('../services/oauthService');

    const methods = await getUserOAuthMethods(userId);

    res.json({
      success: true,
      data: methods,
    });
  })
);

/**
 * POST /api/auth/oauth/:provider
 * Authenticate with OAuth provider (token-based flow)
 */
router.post(
  '/oauth/:provider',
  authLimiter,
  validate([
    body('token').notEmpty().withMessage('OAuth token is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const { token } = req.body;

    // Validate provider
    const validProviders = ['google', 'github', 'microsoft'];
    if (!validProviders.includes(provider)) {
      res.status(400).json({
        success: false,
        error: `Invalid OAuth provider. Supported providers: ${validProviders.join(', ')}`,
      });
      return;
    }

    // Import here to avoid circular dependency
    const { verifyOAuthToken } = await import('../utils/oauthTokenVerifier');
    const { createOrUpdateUserFromOAuth } = await import('../services/oauthService');

    // Verify token and get profile
    const profile = await verifyOAuthToken(provider as 'google' | 'github' | 'microsoft', token);

    // Create or update user
    const user = await createOrUpdateUserFromOAuth(provider as 'google' | 'github' | 'microsoft', profile);

    // Generate tokens and set cookies (same as login)
    const { accessToken, refreshToken } = authService.generateTokens(user.id);

    // Save refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Set access token as HTTP-only cookie
    res.cookie('accessToken', accessToken, getCookieOptions(config.cookie.accessTokenMaxAge));

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions(config.cookie.maxAge));

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OAUTH_LOGIN',
        resource: 'users',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          provider,
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * POST /api/auth/oauth/link
 * Link OAuth provider to existing account
 */
router.post(
  '/oauth/link',
  authenticate,
  authLimiter,
  validate([
    body('provider').isIn(['google', 'github', 'microsoft']).withMessage('Invalid OAuth provider'),
    body('token').notEmpty().withMessage('OAuth token is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { provider, token } = req.body;
    const userId = req.user!.id;

    // Import here to avoid circular dependency
    const { verifyOAuthToken } = await import('../utils/oauthTokenVerifier');
    const { linkOAuthToUser } = await import('../services/oauthService');

    // Verify token and get profile
    const profile = await verifyOAuthToken(provider as 'google' | 'github' | 'microsoft', token);

    // Link OAuth to user
    const user = await linkOAuthToUser(userId, provider as 'google' | 'github' | 'microsoft', profile);

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'OAUTH_LINKED',
        resource: 'users',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          provider,
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * POST /api/auth/oauth/unlink
 * Unlink OAuth provider from account
 */
router.post(
  '/oauth/unlink',
  authenticate,
  authLimiter,
  validate([
    body('provider').isIn(['google', 'github', 'microsoft']).withMessage('Invalid OAuth provider'),
  ]),
  asyncHandler(async (req, res) => {
    const { provider } = req.body;
    const userId = req.user!.id;

    // Import here to avoid circular dependency
    const { unlinkOAuthFromUser } = await import('../services/oauthService');

    // Unlink OAuth from user
    const user = await unlinkOAuthFromUser(userId, provider as 'google' | 'github' | 'microsoft');

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'OAUTH_UNLINKED',
        resource: 'users',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          provider,
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * GET /api/auth/oauth/methods
 * Get user's linked OAuth methods
 */
router.get(
  '/oauth/methods',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Import here to avoid circular dependency
    const { getUserOAuthMethods } = await import('../services/oauthService');

    const methods = await getUserOAuthMethods(userId);

    res.json({
      success: true,
      data: methods,
    });
  })
);

/**
 * MFA Routes
 */

import * as mfaService from '../services/mfaService';

/**
 * POST /api/auth/mfa/setup/totp
 * Setup TOTP MFA
 */
router.post(
  '/mfa/setup/totp',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await mfaService.setupTotp(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/auth/mfa/setup/email
 * Setup Email MFA
 */
router.post(
  '/mfa/setup/email',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await mfaService.setupEmailMfa(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/auth/mfa/verify
 * Verify MFA code
 */
router.post(
  '/mfa/verify',
  authenticate,
  validate([
    body('method').isIn(['TOTP', 'EMAIL']),
    body('code').isString().notEmpty(),
  ]),
  asyncHandler(async (req, res) => {
    const { method, code } = req.body;
    let valid = false;

    if (method === 'TOTP') {
      valid = await mfaService.verifyTotp(req.user!.id, code);
    } else if (method === 'EMAIL') {
      valid = await mfaService.verifyEmailOtp(req.user!.id, code);
    }

    res.json({
      success: true,
      data: { valid },
    });
  })
);

/**
 * POST /api/auth/mfa/enable
 * Enable MFA method
 */
router.post(
  '/mfa/enable',
  authenticate,
  validate([
    body('method').isIn(['TOTP', 'EMAIL']),
    body('code').isString().notEmpty(),
  ]),
  asyncHandler(async (req, res) => {
    const { method, code } = req.body;
    await mfaService.enableMfa(req.user!.id, method, code);

    res.json({
      success: true,
      message: 'MFA enabled successfully',
    });
  })
);

/**
 * POST /api/auth/mfa/disable
 * Disable MFA method
 */
router.post(
  '/mfa/disable',
  authenticate,
  validate([body('method').isIn(['TOTP', 'EMAIL'])]),
  asyncHandler(async (req, res) => {
    const { method } = req.body;
    await mfaService.disableMfa(req.user!.id, method);

    res.json({
      success: true,
      message: 'MFA disabled successfully',
    });
  })
);

/**
 * POST /api/auth/mfa/backup-codes
 * Generate backup codes
 */
router.post(
  '/mfa/backup-codes',
  authenticate,
  asyncHandler(async (req, res) => {
    const codes = await mfaService.generateBackupCodes(req.user!.id);

    res.json({
      success: true,
      data: { codes },
    });
  })
);

/**
 * POST /api/auth/mfa/verify-backup
 * Verify backup code
 */
router.post(
  '/mfa/verify-backup',
  authenticate,
  validate([body('code').isString().notEmpty()]),
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    const valid = await mfaService.verifyBackupCode(req.user!.id, code);

    res.json({
      success: true,
      data: { valid },
    });
  })
);

/**
 * GET /api/auth/mfa/methods
 * Get user's MFA methods
 */
router.get(
  '/mfa/methods',
  authenticate,
  asyncHandler(async (req, res) => {
    const methods = await mfaService.getMfaMethods(req.user!.id);

    res.json({
      success: true,
      data: { methods },
    });
  })
);

/**
 * POST /api/auth/mfa/send-email-otp
 * Send email OTP
 */
router.post(
  '/mfa/send-email-otp',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await mfaService.sendEmailOtp(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;

