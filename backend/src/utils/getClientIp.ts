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
 */
const getIpFromForwardedFor = (header: string | string[] | undefined): string | null => {
  if (!header) return null;
  
  const forwardedFor = Array.isArray(header) ? header[0] : header;
  if (!forwardedFor) return null;
  
  // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
  // We want the first (original client) IP
  const firstIp = forwardedFor.split(',')[0].trim();
  
  // Validate IP format (basic check) and filter out localhost
  if (isValidIp(firstIp) && !isLocalhost(firstIp)) {
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
 * @param req - Express request object
 * @returns Client IP address or null if not available
 */
export const getClientIp = (req: Request): string | null => {
  // Priority 1: X-Forwarded-For header (most reliable for proxied requests)
  const forwardedFor = getIpFromForwardedFor(req.headers['x-forwarded-for']);
  if (forwardedFor) {
    return forwardedFor;
  }
  
  // Priority 2: X-Real-IP header (common in nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string' && isValidIp(realIp) && !isLocalhost(realIp)) {
    return realIp;
  }
  
  // Priority 3: req.ip (Express trust proxy - already processed)
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1' && isValidIp(req.ip)) {
    // Filter out localhost IPv6 representation
    if (req.ip !== '::ffff:127.0.0.1') {
      return req.ip;
    }
  }
  
  // Priority 4: req.connection.remoteAddress (fallback)
  const remoteAddress = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (remoteAddress && isValidIp(remoteAddress)) {
    // Filter out localhost
    if (remoteAddress !== '::1' && remoteAddress !== '127.0.0.1' && remoteAddress !== '::ffff:127.0.0.1') {
      return remoteAddress;
    }
  }
  
  // If all else fails, return null (don't return invalid IPs)
  return null;
};
