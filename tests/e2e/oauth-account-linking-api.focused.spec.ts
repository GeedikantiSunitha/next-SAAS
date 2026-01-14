/**
 * OAuth Account Linking - API Level Test
 * 
 * Tests the OAuth linking API endpoints (backend verification):
 * 1. Get OAuth methods endpoint works
 * 2. Link OAuth endpoint structure
 * 3. Unlink OAuth endpoint structure
 * 
 * Note: Full OAuth flow requires manual testing with actual OAuth providers
 */

import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe('OAuth Account Linking - API Tests', () => {
  test('should return empty array when no OAuth methods are linked', async ({ page, request }) => {
    // Step 1: Register and login
    const testEmail = `test-oauth-api-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await page.request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Step 2: Login via API to get cookies
    const loginResponse = await page.request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    
    // Step 3: Get cookies from login response
    const setCookieHeader = loginResponse.headers()['set-cookie'];
    const cookieHeader = Array.isArray(setCookieHeader) 
      ? setCookieHeader.join('; ') 
      : (setCookieHeader || '');

    // Step 4: Call OAuth methods endpoint
    const methodsResponse = await request.get(`${API_URL}/api/auth/oauth/methods`, {
      headers: { Cookie: cookieHeader },
    });
    
    expect(methodsResponse.ok()).toBeTruthy();
    const methodsData = await methodsResponse.json();
    
    // Step 5: Verify response structure
    expect(methodsData).toHaveProperty('success', true);
    expect(methodsData).toHaveProperty('data');
    expect(Array.isArray(methodsData.data)).toBe(true);
    
    // Step 6: For new user, should be empty array
    expect(methodsData.data).toEqual([]);
    
    console.log('✅ OAuth methods endpoint works correctly');
  });

  test('should have correct API structure for link endpoint', async ({ request }) => {
    // This test verifies the endpoint exists and has correct validation
    // We can't actually link without OAuth token, but we can verify the endpoint structure
    
    // Try to call link endpoint without auth (should fail with 401)
    const linkResponse = await request.post(`${API_URL}/api/auth/oauth/link`, {
      data: {
        provider: 'google',
        token: 'test-token',
      },
    });
    
    // Should return 401 (unauthorized) or 400 (validation error)
    expect([401, 400]).toContain(linkResponse.status());
    
    console.log('✅ OAuth link endpoint exists and requires authentication');
  });

  test('should have correct API structure for unlink endpoint', async ({ request }) => {
    // This test verifies the endpoint exists and has correct validation
    
    // Try to call unlink endpoint without auth (should fail with 401)
    const unlinkResponse = await request.post(`${API_URL}/api/auth/oauth/unlink`, {
      data: {
        provider: 'google',
      },
    });
    
    // Should return 401 (unauthorized) or 400 (validation error)
    expect([401, 400]).toContain(unlinkResponse.status());
    
    console.log('✅ OAuth unlink endpoint exists and requires authentication');
  });

  test('should validate provider parameter', async ({ page, request }) => {
    // Step 1: Register and login
    const testEmail = `test-oauth-validate-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await page.request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Step 2: Login via API to get cookies
    const loginResponse = await page.request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    
    // Step 3: Get cookies
    const setCookieHeader = loginResponse.headers()['set-cookie'];
    const cookieHeader = Array.isArray(setCookieHeader) 
      ? setCookieHeader.join('; ') 
      : (setCookieHeader || '');

    // Step 4: Try to link with invalid provider
    const linkResponse = await request.post(`${API_URL}/api/auth/oauth/link`, {
      headers: { Cookie: cookieHeader },
      data: {
        provider: 'invalid-provider',
        token: 'test-token',
      },
    });
    
    // Should return 400 (validation error)
    expect(linkResponse.status()).toBe(400);
    const errorData = await linkResponse.json();
    expect(errorData).toHaveProperty('error');
    
    console.log('✅ Provider validation works correctly');
  });
});
