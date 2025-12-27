/**
 * Idempotency Middleware
 * 
 * Prevents duplicate operations by caching responses for idempotency keys
 * 
 * Features:
 * - Extracts idempotency key from headers (idempotency-key or x-idempotency-key)
 * - Caches successful responses (2xx) for 24 hours
 * - Returns cached response for duplicate requests
 * - Different methods/URLs are treated separately
 * - Error responses (4xx, 5xx) are not cached
 */

import { Request, Response, NextFunction } from 'express';

// Extend Request type for idempotency key
declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

interface CachedResponse {
  statusCode: number;
  body: any;
  timestamp: number;
}

// In-memory cache (in production, use Redis or similar)
const idempotencyCache = new Map<string, CachedResponse>();

// TTL: 24 hours in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Generate cache key from request
 * Format: {method}:{url}:{idempotencyKey}
 */
const generateCacheKey = (req: Request, idempotencyKey: string): string => {
  const method = req.method.toUpperCase();
  const url = req.originalUrl || req.url || req.path || '';
  return `${method}:${url}:${idempotencyKey}`;
};

/**
 * Extract idempotency key from headers
 * Supports: idempotency-key, x-idempotency-key (case-insensitive)
 */
const extractIdempotencyKey = (headers: Request['headers']): string | null => {
  // Check various header formats (case-insensitive)
  const key = 
    headers['idempotency-key'] ||
    headers['Idempotency-Key'] ||
    headers['IDEMPOTENCY-KEY'] ||
    headers['x-idempotency-key'] ||
    headers['X-Idempotency-Key'] ||
    headers['X-IDEMPOTENCY-KEY'] ||
    (headers as any)['idempotency-key'];

  if (typeof key === 'string' && key.trim().length > 0) {
    return key.trim();
  }

  return null;
};

/**
 * Check if response should be cached (only 2xx status codes)
 */
const shouldCacheResponse = (statusCode: number): boolean => {
  return statusCode >= 200 && statusCode < 300;
};

/**
 * Clean expired cache entries
 */
const cleanExpiredEntries = (): void => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      idempotencyCache.delete(key);
    }
  }
};

/**
 * Idempotency Middleware
 * 
 * Extracts idempotency key from headers and:
 * - If key exists and response is cached, returns cached response
 * - If key exists but not cached, processes request and caches response
 * - If no key, processes request normally
 */
export const idempotency = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Extract idempotency key
  const idempotencyKey = extractIdempotencyKey(req.headers);

  // If no key, proceed normally
  if (!idempotencyKey) {
    next();
    return;
  }

  // Attach key to request for potential use in routes
  req.idempotencyKey = idempotencyKey;

  // Generate cache key
  const cacheKey = generateCacheKey(req, idempotencyKey);

  // Check if response is cached
  const cachedResponse = idempotencyCache.get(cacheKey);

  if (cachedResponse) {
    // Check if cache is expired
    const now = Date.now();
    if (now - cachedResponse.timestamp < CACHE_TTL) {
      // Return cached response
      res.status(cachedResponse.statusCode).json(cachedResponse.body);
      return; // Don't call next() - response already sent
    } else {
      // Cache expired, remove it
      idempotencyCache.delete(cacheKey);
    }
  }

  // Clean expired entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanExpiredEntries();
  }

  // Store original json method
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);

  // Override res.json to cache response
  res.json = function (body: any) {
    const statusCode = (res as any).statusCode || 200;

    // Only cache successful responses
    if (shouldCacheResponse(statusCode)) {
      idempotencyCache.set(cacheKey, {
        statusCode,
        body,
        timestamp: Date.now(),
      });
    }

    // Call original json method
    return originalJson(body);
  };

  // Override res.status to capture status code
  res.status = function (code: number) {
    (res as any).statusCode = code;
    return originalStatus(code);
  };

  // Continue to next middleware
  next();
};

export default idempotency;

