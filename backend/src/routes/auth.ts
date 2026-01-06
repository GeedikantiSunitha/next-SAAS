import { Router, CookieOptions } from 'express';
import { body } from 'express-validator';
import * as authService from '../services/authService';
import { validate, validators } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/security';
import asyncHandler from '../utils/asyncHandler';
import { getClientIp } from '../utils/getClientIp';
import config from '../config';
import { prisma } from '../config/database';
import logger from '../utils/logger';

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
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePassword123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
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
    const ipAddress = getClientIp(req) || undefined;
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
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only cookies containing accessToken and refreshToken
 *             schema:
 *               type: string
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
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
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
    const ipAddress = getClientIp(req) || undefined;
    const userAgent = req.headers['user-agent'];

    const loginResult = await authService.login(
      email,
      password,
      ipAddress,
      userAgent
    );

    // If MFA is required, return requiresMfa flag and temporary token
    if (loginResult.requiresMfa) {
      // Create temporary session for MFA verification
      const tempToken = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

      await prisma.session.create({
        data: {
          userId: loginResult.user.id,
          token: tempToken,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });

      // Set temporary token as cookie
      res.cookie('tempLoginToken', tempToken, getCookieOptions(10 * 60)); // 10 minutes

      return res.json({
        success: true,
        data: {
          requiresMfa: true,
          mfaMethod: loginResult.mfaMethod,
          user: loginResult.user,
        },
      });
    }

    // No MFA required - complete login normally
    // Set access token as HTTP-only cookie
    res.cookie('accessToken', loginResult.accessToken!, getCookieOptions(config.cookie.accessTokenMaxAge));

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', loginResult.refreshToken!, getCookieOptions(config.cookie.maxAge));

    // Return user only (no tokens in body)
    return res.json({
      success: true,
      data: loginResult.user,
    });
  })
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New accessToken cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (delete session)
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Logged out successfully"
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user information
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
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent (always returns success for security)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "If an account exists with this email, you will receive password reset instructions."
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests
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
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewSecurePassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid or expired token
 *       429:
 *         description: Too many requests
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
        ipAddress: getClientIp(req) || undefined,
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
        ipAddress: getClientIp(req) || undefined,
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
 * @swagger
 * /api/auth/oauth/{provider}:
 *   post:
 *     summary: Authenticate with OAuth provider (token-based flow)
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, microsoft]
 *         description: OAuth provider name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: OAuth access token from provider
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid provider or token
 *       429:
 *         description: Too many requests
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
        ipAddress: getClientIp(req) || undefined,
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
        ipAddress: getClientIp(req) || undefined,
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
        ipAddress: getClientIp(req) || undefined,
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
        ipAddress: getClientIp(req) || undefined,
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
 * @swagger
 * /api/auth/oauth/github/exchange:
 *   post:
 *     summary: Exchange GitHub authorization code for access token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: GitHub authorization code
 *     responses:
 *       200:
 *         description: Token exchange successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 token: "gho_xxxxxxxxxxxxx"
 *       400:
 *         description: Invalid code or GitHub OAuth not enabled
 *       429:
 *         description: Too many requests
 */
router.post(
  '/oauth/github/exchange',
  authLimiter,
  validate([
    body('code').notEmpty().withMessage('Authorization code is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!config.oauth.github.enabled) {
      res.status(400).json({
        success: false,
        error: 'GitHub OAuth is not enabled',
      });
      return;
    }

    try {
      // Exchange code for access token
      const axios = require('axios');
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: config.oauth.github.clientId,
          client_secret: config.oauth.github.clientSecret,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (tokenResponse.data.error) {
        res.status(400).json({
          success: false,
          error: tokenResponse.data.error_description || 'Failed to exchange GitHub code',
        });
        return;
      }

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        res.status(400).json({
          success: false,
          error: 'Failed to get access token from GitHub',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          token: accessToken,
        },
      });
    } catch (error: any) {
      logger.error('Failed to exchange GitHub code', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to exchange GitHub authorization code',
      });
    }
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
 * @swagger
 * /api/auth/mfa/setup/totp:
 *   post:
 *     summary: Setup TOTP (Time-based One-Time Password) MFA
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: TOTP setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 secret: "JBSWY3DPEHPK3PXP"
 *                 qrCode: "data:image/png;base64,..."
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/mfa/setup/email:
 *   post:
 *     summary: Setup Email MFA
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Email MFA setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 message: "OTP sent to email"
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/mfa/verify:
 *   post:
 *     summary: Verify MFA code
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - code
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [TOTP, EMAIL]
 *                 example: TOTP
 *               code:
 *                 type: string
 *                 description: MFA verification code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: MFA code verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 valid: true
 *       400:
 *         description: Invalid code
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/mfa/enable:
 *   post:
 *     summary: Enable MFA method
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - code
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [TOTP, EMAIL]
 *                 example: TOTP
 *               code:
 *                 type: string
 *                 description: Verification code from setup
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid code
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/mfa/disable:
 *   post:
 *     summary: Disable MFA method
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [TOTP, EMAIL]
 *                 example: TOTP
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/mfa/backup-codes:
 *   post:
 *     summary: Generate backup codes for MFA
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Backup codes generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 codes: ["ABC123", "DEF456", "GHI789"]
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/mfa/verify-backup:
 *   post:
 *     summary: Verify backup code
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Backup code to verify
 *                 example: "ABC123"
 *     responses:
 *       200:
 *         description: Backup code verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 valid: true
 *       400:
 *         description: Invalid backup code
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/mfa/methods:
 *   get:
 *     summary: Get user's enabled MFA methods
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of enabled MFA methods
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 methods: [TOTP, EMAIL]
 *       401:
 *         description: Unauthorized
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
 * @swagger
 * /api/auth/mfa/send-email-otp:
 *   post:
 *     summary: Send email OTP for MFA
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Email OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 message: "OTP sent to email"
 *       401:
 *         description: Unauthorized
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

/**
 * @swagger
 * /api/auth/login/mfa:
 *   post:
 *     summary: Complete login with MFA verification
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - method
 *             properties:
 *               code:
 *                 type: string
 *                 description: MFA code or backup code
 *                 example: "123456"
 *               method:
 *                 type: string
 *                 enum: [TOTP, EMAIL]
 *                 example: TOTP
 *               isBackupCode:
 *                 type: boolean
 *                 description: Whether the code is a backup code
 *                 default: false
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Invalid MFA code or expired token
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests
 */
router.post(
  '/login/mfa',
  validate([
    body('code').isString().notEmpty().withMessage('MFA code is required'),
    body('method').isIn(['TOTP', 'EMAIL']).withMessage('Invalid MFA method'),
    body('isBackupCode').optional().isBoolean(),
  ]),
  asyncHandler(async (req, res) => {
    const { code, method, isBackupCode } = req.body;
    const ipAddress = getClientIp(req) || undefined;
    const userAgent = req.headers['user-agent'];

    // Get user from temporary session token
    const tempToken = req.cookies.tempLoginToken;
    if (!tempToken) {
      return res.status(401).json({
        success: false,
        error: 'Temporary login token required. Please login again.',
      });
    }

    // Find temporary session
    const tempSession = await prisma.session.findFirst({
      where: {
        token: tempToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!tempSession) {
      return res.status(401).json({
        success: false,
        error: 'Temporary login token expired. Please login again.',
      });
    }

    const userId = tempSession.userId;

    // Verify MFA code
    let isValid = false;
    if (isBackupCode) {
      isValid = await mfaService.verifyBackupCode(userId, code);
    } else if (method === 'TOTP') {
      isValid = await mfaService.verifyTotp(userId, code);
    } else if (method === 'EMAIL') {
      isValid = await mfaService.verifyEmailOtp(userId, code);
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid MFA code',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(userId);

    // Save refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.session.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Delete temporary session
    await prisma.session.delete({
      where: {
        id: tempSession.id,
      },
    });

    // Clear temp token cookie
    res.clearCookie('tempLoginToken');

    // Set access token as HTTP-only cookie
    res.cookie('accessToken', accessToken, getCookieOptions(config.cookie.accessTokenMaxAge));

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions(config.cookie.maxAge));

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_LOGIN',
        resource: 'users',
        resourceId: userId,
        ipAddress,
        userAgent,
      },
    });

    return res.json({
      success: true,
      data: user,
    });
  })
);

export default router;

