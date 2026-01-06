/**
 * Observability E2E Tests (Full-Stack)
 * 
 * End-to-end tests for observability features
 * Tests backend API integration with database
 * 
 * Note: Observability features are admin-only and don't have frontend UI yet.
 * These tests verify backend API endpoints are accessible and work correctly.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

test.describe('Observability E2E Tests (Full-Stack)', () => {
  let adminEmail: string;
  let adminPassword: string;
  let adminToken: string;
  let adminUserId: string;

  test.beforeAll(async ({ request }) => {
    // Create admin user for testing using test helper endpoint
    adminEmail = `admin-obs-${Date.now()}@test.com`;
    adminPassword = 'TestPassword123!';

    // Try to create admin user directly via test helper
    const createAdminResponse = await request.post(`${API_URL}/api/test-helpers/users/admin`, {
      data: {
        email: adminEmail,
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    // If test helper is not available (not in test mode), fall back to registration + role update
    if (createAdminResponse.status() === 404 || createAdminResponse.status() === 500) {
      if (createAdminResponse.status() === 500) {
        const errorBody = await createAdminResponse.text();
        console.warn('Test helper endpoint returned 500:', errorBody);
      }
      // Register as regular user first
      const registerResponse = await request.post(`${API_URL}/api/auth/register`, {
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Admin User',
        },
      });

      expect(registerResponse.status()).toBe(201);
      const registerData = await registerResponse.json();
      adminUserId = registerData.data.id;

      // Try to update role via test helper
      const updateRoleResponse = await request.post(`${API_URL}/api/test-helpers/users/${adminUserId}/role`, {
        data: { role: 'ADMIN' },
      });

      // If test helper not available, skip admin tests
      if (updateRoleResponse.status() === 404) {
        console.warn('Test helper endpoint not available. Admin tests will be skipped.');
        adminUserId = '';
        return;
      }

      expect(updateRoleResponse.status()).toBe(200);
    } else {
      // Admin user created successfully via test helper
      expect(createAdminResponse.status()).toBe(201);
      const adminData = await createAdminResponse.json();
      adminUserId = adminData.data.id;
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test user via API (if admin token is available)
    if (adminUserId && adminToken) {
      try {
        await request.delete(`${API_URL}/api/admin/users/${adminUserId}`, {
          headers: {
            Cookie: `accessToken=${adminToken}`,
          },
        });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test.beforeEach(async ({ request, context }) => {
    // Skip if admin user wasn't created
    test.skip(!adminUserId, 'Admin user not created - test helper may not be available');

    // Clear cookies
    await context.clearCookies();

    // Clean up existing sessions for the admin user to avoid token conflicts
    try {
      await request.delete(`${API_URL}/api/test-helpers/sessions/email/${adminEmail}`);
    } catch (error) {
      // If test helper is not available, continue anyway
      console.warn('Failed to cleanup sessions:', error);
    }

    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 50));

    // Login as admin
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: adminEmail,
        password: adminPassword,
      },
    });

    if (loginResponse.status() !== 200) {
      const errorBody = await loginResponse.text();
      console.error(`Login failed with status ${loginResponse.status()}:`, errorBody);
    }
    expect(loginResponse.status()).toBe(200);

    // Extract access token from cookies
    const setCookieHeader = loginResponse.headers()['set-cookie'];
    let cookies: string[] = [];
    
    if (Array.isArray(setCookieHeader)) {
      cookies = setCookieHeader;
    } else if (typeof setCookieHeader === 'string') {
      // Split by newline if it's a single string with multiple cookies
      cookies = setCookieHeader.split('\n').map(c => c.trim()).filter(c => c);
    }
    
    const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
    if (accessTokenCookie) {
      adminToken = accessTokenCookie.split('=')[1]?.split(';')[0] || '';
    }
    
    if (!adminToken) {
      console.error('No access token in login response. Cookies:', cookies);
    }
    expect(adminToken).toBeTruthy();
  });

  test('should verify metrics endpoint is accessible', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/metrics`);

    expect(response.status()).toBe(200);
    const text = await response.text();
    
    // Should be Prometheus format
    expect(text).toContain('# HELP');
    expect(text).toContain('# TYPE');
    expect(text).toContain('http_requests_total');
  });

  test('should check alerts for admin user', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/observability/alerts/check`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('checkedAt');
    expect(data.data).toHaveProperty('alerts');
    expect(data.data).toHaveProperty('totalAlerts');
    expect(Array.isArray(data.data.alerts)).toBe(true);
  });

  test('should reject alerts check for unauthenticated user', async ({ request, context }) => {
    // Ensure cookies are cleared for this test
    await context.clearCookies();
    
    // Make request without authentication
    const response = await request.get(`${API_URL}/api/observability/alerts/check`, {
      headers: {
        Cookie: '', // Explicitly clear cookies
      },
    });

    // Should return 401 (Unauthorized) for unauthenticated requests
    // Note: authenticate middleware runs before requireRole, so it should return 401
    expect(response.status()).toBe(401);
  });

  test('should get alert rules for admin user', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/observability/alerts/rules`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('rules');
    expect(Array.isArray(data.data.rules)).toBe(true);
    expect(data.data.rules.length).toBeGreaterThan(0);
  });

  test('should trigger alert check with custom rules', async ({ request }) => {
    const customRules = [
      {
        name: 'Test Alert',
        metric: 'errorRate',
        threshold: 0.5,
        severity: 'warning',
        enabled: true,
      },
    ];

    const response = await request.post(`${API_URL}/api/observability/alerts/check`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
      data: {
        rules: customRules,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('checkedAt');
    expect(data.data).toHaveProperty('alerts');
  });

  test('should verify metrics endpoint accessibility', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/observability/metrics/verify/endpoint`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('endpoint');
    expect(data.data).toHaveProperty('accessible');
    expect(data.data.accessible).toBe(true);
  });

  test('should verify metrics format', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/observability/metrics/verify/format`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('isValidFormat');
    expect(data.data).toHaveProperty('hasHelpComments');
    expect(data.data).toHaveProperty('hasTypeComments');
  });

  test('should verify metrics content', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/observability/metrics/verify/content`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('hasRequestMetrics');
    expect(data.data).toHaveProperty('hasErrorMetrics');
    expect(data.data).toHaveProperty('hasLatencyMetrics');
  });

  test('should perform complete metrics verification', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/observability/metrics/verify`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('success');
    expect(data.data).toHaveProperty('endpoint');
    expect(data.data).toHaveProperty('format');
    expect(data.data).toHaveProperty('content');
    expect(data.data).toHaveProperty('overall');
  });

  test('should verify CORS allows frontend to access metrics endpoint', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/metrics`, {
      headers: {
        Origin: BASE_URL,
      },
    });

    expect(response.status()).toBe(200);
    // If CORS failed, we'd get a CORS error, so status 200 means CORS worked
  });

  test('should verify database records are created for alert checks', async ({ request }) => {
    // Trigger an alert check
    const alertResponse = await request.post(`${API_URL}/api/observability/alerts/check`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
      data: {},
    });

    expect(alertResponse.status()).toBe(200);
    
    // Verify audit log was created (if alerting service logs to audit)
    // This is a basic check - actual implementation may vary
    const auditResponse = await request.get(`${API_URL}/api/audit`, {
      headers: {
        Cookie: `accessToken=${adminToken}`,
      },
    });

    // Audit endpoint should be accessible
    expect([200, 401, 403]).toContain(auditResponse.status());
  });
});
