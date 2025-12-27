/**
 * API Versioning Middleware
 * 
 * Detects API version from:
 * 1. URL path (/api/v1/, /api/v2/)
 * 2. X-API-Version header (takes priority)
 * 
 * Defaults to v1 for backward compatibility (/api/ → /api/v1/)
 * 
 * Adds API-Version header to all responses
 */

import { Request, Response, NextFunction } from 'express';

// Supported API versions
const SUPPORTED_VERSIONS = ['v1', 'v2'];
const DEFAULT_VERSION = 'v1';

// Extend Request type for apiVersion
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

/**
 * Extract version from URL path
 * Examples:
 * - /api/v1/auth/login → v1
 * - /api/v2/profile/me → v2
 * - /api/v99/profile/me → v99 (for validation)
 * - /api/auth/login → null (no version)
 */
const extractVersionFromPath = (path: string): string | null => {
  // Match /api/v<digits>/ pattern
  const versionMatch = path.match(/^\/api\/(v\d+)\//);
  return versionMatch ? versionMatch[1] : null;
};

/**
 * Extract version from headers
 * Express normalizes headers to lowercase, but we check both for safety
 */
const extractVersionFromHeader = (headers: Request['headers']): string | null => {
  // Express normalizes headers to lowercase, but check both for safety
  const versionHeader = 
    headers['x-api-version'] || 
    headers['X-API-Version'] ||
    (headers as any)['X-API-VERSION'];
  
  if (typeof versionHeader === 'string') {
    return versionHeader.toLowerCase();
  }
  
  // Also check if it's an array (Express can return arrays for headers)
  if (Array.isArray(versionHeader) && versionHeader.length > 0) {
    return versionHeader[0].toLowerCase();
  }
  
  return null;
};

/**
 * Validate version is supported
 */
const isValidVersion = (version: string): boolean => {
  return SUPPORTED_VERSIONS.includes(version);
};

/**
 * API Versioning Middleware
 * 
 * Detects API version and attaches to request
 * Strips version from path for route matching
 * Adds version header to response
 */
export const apiVersioning = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Try to get version from header first (takes priority)
  let version = extractVersionFromHeader(req.headers);
  
  // Check if path has version (we need to strip it even if header version is used)
  const urlToCheck = req.originalUrl || req.url || req.path || '';
  const pathVersion = extractVersionFromPath(urlToCheck);
  const pathHasVersion = pathVersion !== null;

  // If no header version, use path version
  if (!version && pathVersion) {
    version = pathVersion;
  }

  // Default to v1 for backward compatibility
  if (!version) {
    version = DEFAULT_VERSION;
  }

  // Validate version (must happen before path stripping)
  if (!isValidVersion(version)) {
    res.status(400).json({
      success: false,
      error: `Invalid API version. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
    });
    return; // Early return - don't continue to routes
  }

  // If path had version, strip it from URL for route matching
  // Example: /api/v1/profile/me → /api/profile/me
  // Note: When mounted at /api, req.path is /v1/... so we strip /v1/ to get /...
  // Note: req.path is read-only, so we modify req.url which Express uses for routing
  if (pathHasVersion && req.url) {
    // Strip /v1/, /v2/, etc. from the beginning of the path
    req.url = req.url.replace(/^\/v\d+\//, '/');
  }

  // Attach version to request
  req.apiVersion = version;

  // Add version to response header
  res.setHeader('API-Version', version);

  next();
};

export default apiVersioning;

