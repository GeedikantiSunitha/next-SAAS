/**
 * CSRF (Cross-Site Request Forgery) protection middleware
 * Double-submit cookie: token in cookie and must match X-CSRF-Token header on state-changing requests.
 * Disabled when NODE_ENV === 'test' so existing tests do not need to send token.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config';

const COOKIE_NAME = 'csrf_token';
const HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function isCsrfEnabled(): boolean {
  return config.nodeEnv !== 'test';
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Set CSRF cookie (not HttpOnly so same-origin JS can read for double-submit).
 */
export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: false,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite === 'none' ? 'lax' : config.cookie.sameSite,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * CSRF middleware: validate token on state-changing requests; set cookie on response when missing.
 */
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!isCsrfEnabled()) {
    return next();
  }

  const method = (req.method || 'GET').toUpperCase();

  if (SAFE_METHODS.includes(method)) {
    // Optionally set cookie if not present (so next state-changing request has it)
    const existing = req.cookies?.[COOKIE_NAME];
    if (!existing) {
      const token = generateToken();
      setCsrfCookie(res, token);
    }
    return next();
  }

  // POST, PUT, PATCH, DELETE: require valid CSRF token
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const headerToken = req.headers[HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid or missing CSRF token',
    });
    return;
  }

  next();
};

/**
 * GET /api/csrf-token: returns token and sets cookie (for frontend to get token without reading cookie).
 */
export function getCsrfToken(req: Request, res: Response): void {
  const token = req.cookies?.[COOKIE_NAME] || generateToken();
  setCsrfCookie(res, token);
  res.json({ token });
}
