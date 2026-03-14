/**
 * TDD: CSRF 403 retry - when backend returns "Invalid or missing CSRF token",
 * client should clear cache and retry the request once.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/mocks/server';
import apiClient, { clearCsrfToken } from '../../api/client';

describe('API Client - CSRF 403 Retry', () => {
  beforeEach(() => {
    clearCsrfToken();
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should clear CSRF cache and retry request on 403 "Invalid or missing CSRF token"', async () => {
    let loginCallCount = 0;
    server.use(
      http.get('http://localhost:3001/api/csrf-token', () =>
        HttpResponse.json({ token: 'csrf-token' })
      ),
      http.post('http://localhost:3001/api/auth/login', () => {
        loginCallCount++;
        if (loginCallCount === 1) {
          return HttpResponse.json(
            { success: false, error: 'Invalid or missing CSRF token' },
            { status: 403 }
          );
        }
        return HttpResponse.json({
          success: true,
          data: { user: { id: '1', email: 'test@example.com' } },
        });
      })
    );

    const response = await apiClient.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'test',
    });

    expect(loginCallCount).toBe(2);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});
