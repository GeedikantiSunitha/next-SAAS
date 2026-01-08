/**
 * Get Client IP Address Utility
 * 
 * Extracts the real client IP address from Express request object.
 * Handles various proxy scenarios and edge cases.
 * 
 * Priority order:
 * 1. X-Forwarded-For header (first IP in chain)
 * 2. X-Real-IP header
 * 3. req.ip (Express trust proxy)
 * 4. req.connection.remoteAddress (fallback)
 * 
 * @param req - Express request object
 * @returns Client IP address or null if not available
 */

import { Request } from 'express';

/**
 * Check if IP is localhost
 */
const isLocalhost = (ip: string): boolean => {
  return ip === '127.0.0.1' || 
         ip === '::1' || 
         ip === '::ffff:127.0.0.1' ||
         ip === 'localhost';
};

/**
 * Extract IP address from X-Forwarded-For header
 * Handles multiple IPs (proxy chain) - takes first one
 * Note: Localhost filtering is handled in getClientIp based on environment
 */
const getIpFromForwardedFor = (header: string | string[] | undefined): string | null => {
  if (!header) return null;
  
  const forwardedFor = Array.isArray(header) ? header[0] : header;
  if (!forwardedFor) return null;
  
  // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
  // We want the first (original client) IP
  const firstIp = forwardedFor.split(',')[0].trim();
  
  // Validate IP format (basic check)
  // Note: Localhost filtering is handled in getClientIp based on environment
  if (isValidIp(firstIp)) {
    return firstIp;
  }
  
  return null;
};

/**
 * Validate IP address format (IPv4 or IPv6)
 */
const isValidIp = (ip: string): boolean => {
  if (!ip || ip.length === 0) return false;
  
  // Basic validation - IPv4 or IPv6
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  // Check if it's a valid format
  if (ipv4Regex.test(ip)) {
    // Validate IPv4 ranges
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  if (ipv6Regex.test(ip)) {
    return true;
  }
  
  // Check for IPv6 compressed format
  if (ip.includes('::')) {
    return true;
  }
  
  return false;
};

/**
 * Get client IP address from request
 * 
 * In development mode, localhost IPs are allowed and returned.
 * In production mode, localhost IPs are filtered out (return null).
 * 
 * @param req - Express request object
 * @returns Client IP address or null if not available
 */
export const getClientIp = (req: Request): string | null => {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
  
  // Priority 1: X-Forwarded-For header (most reliable for proxied requests)
  const forwardedFor = getIpFromForwardedFor(req.headers['x-forwarded-for']);
  if (forwardedFor) {
    // In development, allow localhost; in production, filter it out
    if (isDevelopment || !isLocalhost(forwardedFor)) {
      return forwardedFor;
    }
  }
  
  // Priority 2: X-Real-IP header (common in nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string' && isValidIp(realIp)) {
    // In development, allow localhost; in production, filter it out
    if (isDevelopment || !isLocalhost(realIp)) {
      return realIp;
    }
  }
  
  // Priority 3: req.ip (Express trust proxy - already processed)
  if (req.ip && isValidIp(req.ip)) {
    // In development, allow localhost; in production, filter it out
    if (isDevelopment || !isLocalhost(req.ip)) {
      return req.ip;
    }
  }
  
  // Priority 4: req.connection.remoteAddress (fallback)
  const remoteAddress = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (remoteAddress && isValidIp(remoteAddress)) {
    // In development, allow localhost; in production, filter it out
    if (isDevelopment || !isLocalhost(remoteAddress)) {
      return remoteAddress;
    }
  }
  
  // If all else fails, return null (don't return invalid IPs)
  return null;
};
