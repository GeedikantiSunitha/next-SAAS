import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Cookie-based Authentication
 * 
 * These tests verify that:
 * 1. Access tokens are stored in HTTP-only cookies (not localStorage)
 * 2. JavaScript cannot access access token cookies
 * 3. Authentication works with cookie-based tokens
 * 4. Logout clears cookies properly
 */

test.describe('Cookie-based Authentication Security', () => {
  const password = 'Password123!';

  // Clear cookies before each test to ensure clean state
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies
    await context.clearCookies();
    // Clear localStorage
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
  });

  test('Access token stored in HTTP-only cookie, NOT in localStorage', async ({ page }) => {
    const uniqueEmail = `cookie-test-${Date.now()}@example.com`;
    // Register user
    await page.goto('http://localhost:3000/register');
    await page.fill('[name="email"]', uniqueEmail);
    await page.fill('[name="password"]', password);
    await page.fill('[name="name"]', 'Cookie Test User');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Check localStorage - should NOT have accessToken
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeNull();
    
    // Check cookies - should have accessToken cookie
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.httpOnly).toBe(true);
    // sameSite is 'Lax' in development, 'Strict' in production
    expect(accessTokenCookie?.sameSite).toBe('Lax');
  });

  test('JavaScript cannot access access token cookie', async ({ page }) => {
    // Register and login
    await page.goto('http://localhost:3000/register');
    await page.fill('[name="email"]', `js-test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', password);
    await page.fill('[name="name"]', 'JS Test User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify that document.cookie does NOT include accessToken
    // (HTTP-only cookies are not accessible via JavaScript)
    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toContain('accessToken');
    
    // Verify refreshToken is also HTTP-only
    expect(cookies).not.toContain('refreshToken');
  });

  test('Authentication works with cookie-based tokens', async ({ page }) => {
    const testEmail = `auth-test-${Date.now()}@example.com`;
    
    // Register
    await page.goto('http://localhost:3000/register');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', password);
    await page.fill('[name="name"]', 'Auth Test User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify user is authenticated (can see dashboard)
    await expect(page.locator('main').getByText('Welcome')).toBeVisible();
    await expect(page.locator('nav').getByText(testEmail)).toBeVisible();
    
    // Navigate to a protected route
    await page.goto('http://localhost:3000/dashboard');
    await expect(page.locator('main').getByText('Welcome')).toBeVisible();
    
    // Verify cookies are present
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    const refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');
    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
  });

  test('Logout clears cookies on both frontend and backend', async ({ page }) => {
    const testEmail = `logout-test-${Date.now()}@example.com`;
    
    // Register and login
    await page.goto('http://localhost:3000/register');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', password);
    await page.fill('[name="name"]', 'Logout Test User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify cookies exist
    let cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'accessToken')).toBeDefined();
    expect(cookies.find(c => c.name === 'refreshToken')).toBeDefined();
    
    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login', { timeout: 10000 });
    
    // Verify cookies are cleared
    cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    const refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');
    
    // Cookies should be cleared (or expired)
    // Note: Backend clears cookies, so they should be removed
    expect(accessTokenCookie).toBeUndefined();
    expect(refreshTokenCookie).toBeUndefined();
    
    // Verify localStorage is also empty (should never have had accessToken)
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeNull();
  });

  test('Complete user journey with cookie-based auth', async ({ page }) => {
    const testEmail = `journey-${Date.now()}@example.com`;
    
    // 1. Register
    await page.goto('http://localhost:3000/register');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', password);
    await page.fill('[name="name"]', 'Journey Test User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify cookies set
    let cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'accessToken')).toBeDefined();
    
    // 2. Access protected route
    await page.goto('http://localhost:3000/dashboard');
    await expect(page.locator('main').getByText('Welcome')).toBeVisible();
    
    // 3. Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login', { timeout: 10000 });
    
    // 4. Try to access protected route (should redirect to login)
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    
    // 5. Login again
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify cookies set again
    cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'accessToken')).toBeDefined();
  });

  test('Session persists across page refreshes with cookies', async ({ page }) => {
    const testEmail = `session-${Date.now()}@example.com`;
    
    // Register
    await page.goto('http://localhost:3000/register');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', password);
    await page.fill('[name="name"]', 'Session Test User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated (cookies persist)
    await expect(page.locator('main').getByText('Welcome')).toBeVisible();
    await expect(page.locator('nav').getByText(testEmail)).toBeVisible();
    
    // Verify cookies still exist
    const cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'accessToken')).toBeDefined();
  });
});

