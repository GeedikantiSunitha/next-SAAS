/**
 * Get Client IP Utility Tests (TDD)
 * 
 * Comprehensive tests for IP address extraction from requests.
 * Tests various proxy scenarios and edge cases.
 */

import { Request } from 'express';
import { getClientIp } from '../../utils/getClientIp';

// Mock Express Request
const createMockRequest = (overrides: any = {}): Partial<Request> => {
  return {
    headers: {},
    ip: undefined,
    socket: undefined,
    connection: undefined,
    ...overrides,
  } as Partial<Request>;
};

describe('getClientIp', () => {
  describe('X-Forwarded-For Header', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should extract first IP from X-Forwarded-For with multiple IPs', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should handle X-Forwarded-For as array', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': ['192.168.1.100', '10.0.0.1'],
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should trim whitespace from X-Forwarded-For IP', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '  192.168.1.100  , 10.0.0.1',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should reject invalid IP in X-Forwarded-For', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '999.999.999.999',
        },
      });

      const ip = getClientIp(req as Request);
      // Should fall through to next method
      expect(ip).not.toBe('999.999.999.999');
    });
  });

  describe('X-Real-IP Header', () => {
    it('should extract IP from X-Real-IP header', () => {
      const req = createMockRequest({
        headers: {
          'x-real-ip': '192.168.1.200',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.200');
    });

    it('should prefer X-Forwarded-For over X-Real-IP', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '192.168.1.100',
          'x-real-ip': '192.168.1.200',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should reject invalid IP in X-Real-IP', () => {
      const req = createMockRequest({
        headers: {
          'x-real-ip': 'invalid-ip',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).not.toBe('invalid-ip');
    });
  });

  describe('req.ip (Express trust proxy)', () => {
    it('should use req.ip when headers not available', () => {
      const req = createMockRequest({
        ip: '192.168.1.50',
        headers: {},
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.50');
    });

    it('should filter out localhost IPv4 from req.ip', () => {
      const req = createMockRequest({
        ip: '127.0.0.1',
        headers: {},
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBeNull();
    });

    it('should filter out localhost IPv6 from req.ip', () => {
      const req = createMockRequest({
        ip: '::1',
        headers: {},
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBeNull();
    });

    it('should filter out IPv4-mapped IPv6 localhost from req.ip', () => {
      const req = createMockRequest({
        ip: '::ffff:127.0.0.1',
        headers: {},
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBeNull();
    });
  });

  describe('req.socket.remoteAddress (Fallback)', () => {
    it('should use socket.remoteAddress as fallback', () => {
      const req = createMockRequest({
        socket: {
          remoteAddress: '192.168.1.75',
        } as any,
        headers: {},
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.75');
    });

    it('should use connection.remoteAddress as fallback', () => {
      const req = createMockRequest({
        connection: {
          remoteAddress: '192.168.1.80',
        } as any,
        headers: {},
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('192.168.1.80');
    });

    it('should filter out localhost from remoteAddress', () => {
      const req = createMockRequest({
        socket: {
          remoteAddress: '127.0.0.1',
        } as any,
        headers: {},
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBeNull();
    });
  });

  describe('IPv6 Support', () => {
    it('should handle IPv6 addresses', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should handle compressed IPv6 addresses', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '2001:db8::1',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBe('2001:db8::1');
    });
  });

  describe('Edge Cases', () => {
    it('should return null when no IP is available', () => {
      const req = createMockRequest({
        headers: {},
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBeNull();
    });

    it('should return null when all IPs are localhost', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
        ip: '::1',
      });

      const ip = getClientIp(req as Request);
      // Should filter out localhost
      expect(ip).toBeNull();
    });

    it('should handle empty X-Forwarded-For header', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).toBeNull();
    });

    it('should handle malformed X-Forwarded-For header', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': 'not-an-ip',
        },
      });

      const ip = getClientIp(req as Request);
      expect(ip).not.toBe('not-an-ip');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle nginx proxy scenario', () => {
      const req = createMockRequest({
        headers: {
          'x-real-ip': '203.0.113.1',
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        },
      });

      const ip = getClientIp(req as Request);
      // Should prefer X-Forwarded-For (first IP)
      expect(ip).toBe('203.0.113.1');
    });

    it('should handle cloudflare proxy scenario', () => {
      const req = createMockRequest({
        headers: {
          'cf-connecting-ip': '203.0.113.2', // Cloudflare specific
          'x-forwarded-for': '203.0.113.2, 198.51.100.2',
        },
      });

      const ip = getClientIp(req as Request);
      // Should use X-Forwarded-For (we don't handle CF-Connecting-IP yet, but X-Forwarded-For should work)
      expect(ip).toBe('203.0.113.2');
    });

    it('should handle AWS ALB scenario', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '203.0.113.3',
        },
        ip: '10.0.0.1', // Internal ALB IP
      });

      const ip = getClientIp(req as Request);
      // Should prefer X-Forwarded-For over internal IP
      expect(ip).toBe('203.0.113.3');
    });
  });
});
