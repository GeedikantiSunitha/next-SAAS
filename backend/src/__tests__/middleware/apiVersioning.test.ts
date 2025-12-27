/**
 * API Versioning Middleware Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 * 
 * Tests verify:
 * - Version detection from URL path
 * - Version detection from headers
 * - Backward compatibility (/api/ → /api/v1/)
 * - Version info in response headers
 * - Invalid version handling
 */

import { Request, Response, NextFunction } from 'express';
import { apiVersioning } from '../../middleware/apiVersioning';

// Extend Request type for apiVersion
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

describe('API Versioning Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const createMockRequest = (path: string, headers: Record<string, string> = {}): Partial<Request> => {
    return {
      path,
      url: path,
      headers: headers as any,
    } as Partial<Request>;
  };

  beforeEach(() => {
    mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('Version Detection from URL Path', () => {
    it('should detect version from URL path /api/v1/', () => {
      mockRequest = createMockRequest('/api/v1/auth/login');

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).apiVersion).toBe('v1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect version from URL path /api/v2/', () => {
      mockRequest = createMockRequest('/api/v2/profile/me');

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).apiVersion).toBe('v2');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should default to v1 when no version in path', () => {
      mockRequest = createMockRequest('/api/auth/login');

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).apiVersion).toBe('v1');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Version Detection from Headers', () => {
    it('should detect version from X-API-Version header', () => {
      mockRequest = createMockRequest('/api/auth/login', { 'x-api-version': 'v2' });

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).apiVersion).toBe('v2');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize header over URL path', () => {
      mockRequest = createMockRequest('/api/v1/auth/login', { 'x-api-version': 'v2' });

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).apiVersion).toBe('v2');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should be case-insensitive for header', () => {
      mockRequest = createMockRequest('/api/auth/login', { 'X-API-VERSION': 'v2' });

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).apiVersion).toBe('v2');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Response Headers', () => {
    it('should add API-Version header to response', () => {
      mockRequest = createMockRequest('/api/v2/auth/login');

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('API-Version', 'v2');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should add API-Version header for default v1', () => {
      mockRequest = createMockRequest('/api/auth/login');

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('API-Version', 'v1');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Invalid Version Handling', () => {
    it('should reject invalid version format', () => {
      mockRequest = createMockRequest('/api/auth/login', { 'x-api-version': 'invalid' });

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid API version. Supported versions: v1, v2',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unsupported version', () => {
      mockRequest = createMockRequest('/api/auth/login', { 'x-api-version': 'v99' });

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid API version. Supported versions: v1, v2',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Backward Compatibility', () => {
    it('should treat /api/ as /api/v1/ for backward compatibility', () => {
      mockRequest = createMockRequest('/api/auth/login');

      apiVersioning(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).apiVersion).toBe('v1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('API-Version', 'v1');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

