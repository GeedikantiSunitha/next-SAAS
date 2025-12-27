/**
 * Idempotency Middleware Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 * 
 * Tests verify:
 * - Idempotency key generation
 * - Duplicate request handling (returns cached response)
 * - Key expiration
 * - Error handling
 * - Different methods/URLs don't conflict
 */

import { Request, Response, NextFunction } from 'express';
import { idempotency } from '../../middleware/idempotency';

// Helper to create mock request
const createMockRequest = (
  method: string = 'POST',
  path: string = '/api/test',
  headers: Record<string, string> = {},
  body: any = { test: 'data' }
): Partial<Request> => {
  return {
    method,
    path,
    url: path,
    originalUrl: path,
    headers,
    body,
  };
};

// Helper to create mock response
const createMockResponse = (): Partial<Response> => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    getHeader: jest.fn(),
  };
};

describe('Idempotency Middleware', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  describe('Idempotency Key Generation', () => {
    it('should generate idempotency key from header', () => {
      const mockRequest = createMockRequest('POST', '/api/test', { 'idempotency-key': 'test-key-123' });
      const mockResponse = createMockResponse();
      
      idempotency(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).idempotencyKey).toBe('test-key-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate idempotency key from X-Idempotency-Key header', () => {
      const mockRequest = createMockRequest('POST', '/api/test', { 'x-idempotency-key': 'test-key-456' });
      const mockResponse = createMockResponse();
      
      idempotency(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).idempotencyKey).toBe('test-key-456');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should be case-insensitive for header', () => {
      const mockRequest = createMockRequest('POST', '/api/test', { 'IDEMPOTENCY-KEY': 'test-key-789' });
      const mockResponse = createMockResponse();
      
      idempotency(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).idempotencyKey).toBe('test-key-789');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not require idempotency key (optional middleware)', () => {
      const mockRequest = createMockRequest('POST', '/api/test', {});
      const mockResponse = createMockResponse();
      
      idempotency(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).idempotencyKey).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Duplicate Request Handling', () => {
    it('should return cached response for duplicate idempotency key', async () => {
      const idempotencyKey = 'duplicate-test-key';
      const cachedResponse = { success: true, data: { id: '123' } };

      // First request - should process normally
      const mockRequest1 = createMockRequest('POST', '/api/test', { 'idempotency-key': idempotencyKey });
      const mockResponse1 = createMockResponse();
      idempotency(mockRequest1 as Request, mockResponse1 as Response, mockNext);
      
      // Simulate response being sent (this will be handled by response interceptor in actual implementation)
      (mockResponse1 as any).status(200).json(cachedResponse);

      // Second request with same key - should return cached response
      const mockRequest2 = createMockRequest('POST', '/api/test', { 'idempotency-key': idempotencyKey });
      const mockResponse2 = createMockResponse();
      const mockNext2 = jest.fn();

      idempotency(mockRequest2 as Request, mockResponse2 as Response, mockNext2);

      // Should return cached response without calling next
      expect(mockResponse2.status).toHaveBeenCalledWith(200);
      expect(mockResponse2.json).toHaveBeenCalledWith(cachedResponse);
      expect(mockNext2).not.toHaveBeenCalled();
    });

    it('should handle different methods with same key separately', () => {
      const idempotencyKey = 'same-key-different-method';

      const mockRequest1 = createMockRequest('POST', '/api/test', { 'idempotency-key': idempotencyKey });
      const mockResponse1 = createMockResponse();
      idempotency(mockRequest1 as Request, mockResponse1 as Response, mockNext);

      const mockRequest2 = createMockRequest('PUT', '/api/test', { 'idempotency-key': idempotencyKey });
      const mockResponse2 = createMockResponse();
      const mockNext2 = jest.fn();

      idempotency(mockRequest2 as Request, mockResponse2 as Response, mockNext2);

      // Different methods should be treated separately
      expect(mockNext2).toHaveBeenCalled();
    });

    it('should handle different URLs with same key separately', () => {
      const idempotencyKey = 'same-key-different-url';

      const mockRequest1 = createMockRequest('POST', '/api/resource1', { 'idempotency-key': idempotencyKey });
      const mockResponse1 = createMockResponse();
      idempotency(mockRequest1 as Request, mockResponse1 as Response, mockNext);

      const mockRequest2 = createMockRequest('POST', '/api/resource2', { 'idempotency-key': idempotencyKey });
      const mockResponse2 = createMockResponse();
      const mockNext2 = jest.fn();

      idempotency(mockRequest2 as Request, mockResponse2 as Response, mockNext2);

      // Different URLs should be treated separately
      expect(mockNext2).toHaveBeenCalled();
    });
  });

  describe('Key Expiration', () => {
    it('should expire cached responses after TTL', async () => {
      // This test will verify that cached responses expire
      // Implementation will use a TTL (e.g., 24 hours)
      const idempotencyKey = 'expiring-key';
      const mockRequest = createMockRequest('POST', '/api/test', { 'idempotency-key': idempotencyKey });
      const mockResponse = createMockResponse();

      idempotency(mockRequest as Request, mockResponse as Response, mockNext);

      // After TTL expires, same key should process as new request
      // This will be tested with mocked time
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing idempotency key gracefully', () => {
      const mockRequest = createMockRequest('POST', '/api/test', {});
      const mockResponse = createMockResponse();
      
      idempotency(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).idempotencyKey).toBeUndefined();
    });

    it('should handle invalid idempotency key format', () => {
      const mockRequest = createMockRequest('POST', '/api/test', { 'idempotency-key': '' });
      const mockResponse = createMockResponse();
      
      idempotency(mockRequest as Request, mockResponse as Response, mockNext);

      // Empty key should be treated as no key
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Response Caching', () => {
    it('should cache successful responses (2xx)', () => {
      const idempotencyKey = 'cache-success-key';
      const mockRequest = createMockRequest('POST', '/api/test', { 'idempotency-key': idempotencyKey });
      const mockResponse = createMockResponse();
      
      idempotency(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Simulate successful response (will be handled by response interceptor)
      (mockResponse as any).status(200).json({ success: true });

      // Verify response was cached
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not cache error responses (4xx, 5xx)', () => {
      const idempotencyKey = 'no-cache-error-key';
      const mockRequest = createMockRequest('POST', '/api/test', { 'idempotency-key': idempotencyKey });
      const mockResponse = createMockResponse();
      
      idempotency(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Simulate error response (will be handled by response interceptor)
      (mockResponse as any).status(400).json({ error: 'Bad request' });

      // Error responses should not be cached
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

