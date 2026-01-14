/**
 * FOCUSED TDD TEST: Login Redirect Issue Fix Verification
 * 
 * This is a focused test to quickly verify the login redirect fix
 * without running the entire E2E test suite.
 * 
 * Issue: After successful login, users are redirected to /login instead of /dashboard
 * Root Cause: Duplicate login call + race condition with isAuthenticated state
 * Fix: Remove duplicate authApi.login() call, use refreshUser() to update auth state
 * 
 * Usage:
 *   npm run test:e2e:login-fix
 *   OR
 *   npx playwright test tests/e2e/login-redirect.focused.spec.ts --grep "Login redirect"
 */

import { test, expect } from '@playwright/test';

test.describe('Login Redirect Fix Verification (TDD)', () => {
  test('Login redirect: Should redirect to /dashboard after successful login', async ({ page, request }) => {
    // STEP 1: Create test user
    const uniqueEmail = `tdd-login-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    const registerResponse = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: password,
        name: 'TDD Test User',
      },
    });
    
    expect(registerResponse.status()).toBe(201);
    console.log('✅ User created:', uniqueEmail);
    
    // STEP 2: Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    console.log('✅ Navigated to /login');
    
    // STEP 3: Fill and submit login form
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    console.log('✅ Form filled');
    
    // STEP 4: Click login button and wait for navigation
    await page.click('button[type="submit"]');
    console.log('✅ Login button clicked');
    
    // STEP 5: Verify redirect to /dashboard (THIS IS THE KEY TEST)
    // This should pass after fix - previously was redirecting to /login
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    console.log('✅ Successfully redirected to /dashboard');
    
    // STEP 6: Verify user is actually authenticated (dashboard content visible)
    // Use specific locator to avoid strict mode violation (Welcome appears in heading, toast, notification)
    await expect(page.locator('main h3').getByText(/Welcome/i).first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Dashboard content visible');
    
    // STEP 7: Verify email appears on dashboard (confirms backend auth worked)
    await expect(page.locator('main').getByText(uniqueEmail).first()).toBeVisible({ timeout: 5000 });
    console.log('✅ User email visible on dashboard');
    
    // STEP 8: Verify cookies are set (cookie-based auth verification)
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    const refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');
    
    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
    expect(accessTokenCookie?.httpOnly).toBe(true);
    console.log('✅ Cookies set correctly (HTTP-only)');
    
    // STEP 9: Verify token is NOT in localStorage (security check)
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
    console.log('✅ Token NOT in localStorage (cookie-based auth confirmed)');
    
    console.log('\n✅✅✅ ALL CHECKS PASSED - Login redirect fix verified! ✅✅✅\n');
  });
  
  test('Login redirect: Should handle ProtectedRoute correctly after login', async ({ page, request }) => {
    // Additional test: Verify that ProtectedRoute allows access after login
    const uniqueEmail = `tdd-protected-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // Create user
    await request.post('http://localhost:3001/api/auth/register', {
      data: { email: uniqueEmail, password: password, name: 'TDD User' },
    });
    
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard (not /login)
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Try accessing another protected route directly
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile', { timeout: 5000 }); // Should NOT redirect to /login
    
    // Verify profile page is accessible (not login page)
    const url = page.url();
    expect(url).toContain('/profile');
    expect(url).not.toContain('/login');
    
    console.log('✅ ProtectedRoute access verified after login');
  });
});
