/**
 * CSRF middleware tests (TDD - Fix #10, 11.3.3)
 * Verifies: safe methods pass; state-changing without token rejected; with valid token pass.
 */

import { Request, Response } from 'express';
import { csrfMiddleware } from '../../middleware/csrf';

// Mock config so we can test both enabled and disabled
jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    nodeEnv: 'test', // default test env = CSRF disabled
    cookie: { secure: false, sameSite: 'lax' as const },
  },
}));

const mockNext = jest.fn();

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    cookies: {},
    headers: {},
    ...overrides,
  } as Request;
}

function createMockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.cookie = jest.fn().mockReturnThis();
  return res;
}

describe('csrfMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (require('../../config').default.nodeEnv as string) = 'test';
  });

  describe('when NODE_ENV is test (CSRF disabled)', () => {
    it('should call next() for POST without token', () => {
      const req = createMockReq({ method: 'POST' });
      const res = createMockRes();
      csrfMiddleware(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() for PUT without token', () => {
      const req = createMockReq({ method: 'PUT' });
      const res = createMockRes();
      csrfMiddleware(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('when NODE_ENV is development (CSRF enabled)', () => {
    beforeEach(() => {
      (require('../../config').default.nodeEnv as string) = 'development';
    });

    it('should call next() for GET without token', () => {
      const req = createMockReq({ method: 'GET' });
      const res = createMockRes();
      csrfMiddleware(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 for POST without X-CSRF-Token header', () => {
      const req = createMockReq({ method: 'POST', cookies: {}, headers: {} });
      const res = createMockRes();
      csrfMiddleware(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or missing CSRF token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for POST with cookie but no header', () => {
      const req = createMockReq({
        method: 'POST',
        cookies: { csrf_token: 'abc123' },
        headers: {},
      });
      const res = createMockRes();
      csrfMiddleware(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for POST with header but no cookie', () => {
      const req = createMockReq({
        method: 'POST',
        cookies: {},
        headers: { 'x-csrf-token': 'abc123' },
      });
      const res = createMockRes();
      csrfMiddleware(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for POST when token does not match', () => {
      const req = createMockReq({
        method: 'POST',
        cookies: { csrf_token: 'token-from-cookie' },
        headers: { 'x-csrf-token': 'different-token' },
      });
      const res = createMockRes();
      csrfMiddleware(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() for POST when cookie and header match', () => {
      const token = 'valid-token-123';
      const req = createMockReq({
        method: 'POST',
        cookies: { csrf_token: token },
        headers: { 'x-csrf-token': token },
      });
      const res = createMockRes();
      csrfMiddleware(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
