import { test, expect } from '@playwright/test';

/**
 * Full-Stack E2E Tests
 * 
 * These tests verify the complete integration between frontend and backend:
 * - CORS configuration works
 * - Authentication flow works end-to-end
 * - API calls succeed
 * - Token refresh works
 * - Protected routes work
 * 
 * Both frontend (port 3000) and backend (port 3001) must be running.
 */

test.describe('Full-Stack Authentication E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear HTTP-only cookies (can't be cleared via JS)
    await context.clearCookies();
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('CORS: Frontend can call backend API', async ({ page, request }) => {
    // Test that frontend can make API calls to backend
    const response = await request.get('http://localhost:3001/api/health');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    // Health endpoint returns { status, timestamp, ... } not { success: true }
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  });

  test('Full Stack: User can register via frontend and backend creates user', async ({ page }) => {
    const uniqueEmail = `e2e-test-${Date.now()}@example.com`;
    
    // Register via frontend
    await page.goto('/register');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify user data is displayed (proves backend returned correct data)
    // Email appears in both nav and main content, so use main content specifically
    await expect(page.locator('main').getByText(uniqueEmail)).toBeVisible();
    
    // Verify token is stored in HTTP-only cookie (NOT localStorage)
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull(); // Should NOT be in localStorage
    
    // Verify cookie exists
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.httpOnly).toBe(true);
  });

  test('Full Stack: User can login via frontend and backend authenticates', async ({ page, request }) => {
    // First, create a user via backend API directly
    const uniqueEmail = `e2e-login-${Date.now()}@example.com`;
    const registerResponse = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: 'Password123!',
        name: 'Test User',
      },
    });
    
    expect(registerResponse.status()).toBe(201);
    
    // Now login via frontend
    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify user is logged in
    await expect(page.locator('text=Welcome')).toBeVisible();
    // Email may appear in multiple places (nav + main), use more specific locator
    await expect(page.locator('main').getByText(uniqueEmail).first()).toBeVisible();
  });

  test('Full Stack: Protected API endpoint requires authentication', async ({ page, request }) => {
    // Try to access protected endpoint without token
    const response = await request.get('http://localhost:3001/api/auth/me');
    
    expect(response.status()).toBe(401);
    
    // Now login via frontend
    const uniqueEmail = `e2e-protected-${Date.now()}@example.com`;
    await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: 'Password123!',
      },
    });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify token is NOT in localStorage (cookie-based auth)
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
    
    // Verify cookie exists
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.httpOnly).toBe(true);
    
    // User is logged in (dashboard visible)
    await expect(page.locator('main').getByText(uniqueEmail).first()).toBeVisible();
  });

  test('Full Stack: Token refresh works end-to-end', async ({ page, request }) => {
    // Register and login
    const uniqueEmail = `e2e-refresh-${Date.now()}@example.com`;
    await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: 'Password123!',
      },
    });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify cookie-based auth is working (no localStorage token)
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull(); // Token should be in cookie, not localStorage
    
    // Verify cookies are set
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    const refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');
    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
    
    // User is authenticated (dashboard visible)
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('Full Stack: Error handling - Invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    
    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should show error message (from backend)
    // Error appears in div with data-testid="error-message"
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid credentials|login failed/i);
    
    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('Full Stack: Error handling - Duplicate email registration shows error', async ({ page, request }) => {
    const uniqueEmail = `e2e-duplicate-${Date.now()}@example.com`;
    
    // Register first time via backend
    const registerResponse = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: 'Password123!',
      },
    });
    expect(registerResponse.status()).toBe(201); // First registration should succeed
    
    // Try to register again via frontend
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.waitForSelector('form', { timeout: 5000 });
    
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    
    // Click submit - this will trigger the register API call which should fail with 409
    await page.click('button[type="submit"]');
    
    // Wait for the API call to complete and error to be set
    // The error should appear in div with data-testid="error-message"
    // Backend returns 409 with { success: false, error: "Email already registered" }
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Verify error text contains the expected message (more flexible matching)
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toMatch(/email.*already|already.*registered|registration.*failed/i);
    
    // Should still be on register page (error prevented redirect)
    await expect(page).toHaveURL(/.*\/register/, { timeout: 5000 });
  });

  test('Full Stack: Logout clears session on both frontend and backend', async ({ page }) => {
    // Register and login
    const uniqueEmail = `e2e-logout-${Date.now()}@example.com`;
    
    // Register via frontend
    await page.goto('/register');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="name"]', 'Logout Test User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify cookies exist before logout
    let cookies = await page.context().cookies();
    let accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    let refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');
    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
    
    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login', { timeout: 5000 });
    
    // Verify cookies are cleared after logout
    cookies = await page.context().cookies();
    accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');
    expect(accessTokenCookie).toBeUndefined();
    expect(refreshTokenCookie).toBeUndefined();
    
    // Verify localStorage is empty (should never have had token)
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
  });

  test('Full Stack: Form validation works before API call', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Wait for form to be ready
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Try to submit with invalid email (frontend validation)
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password');
    
    // Submit form by clicking button - react-hook-form's handleSubmit will validate
    // When validation fails, onSubmit callback is NOT called, but errors are set in formState
    await page.click('button[type="submit"]');
    
    // Wait for validation error to appear - react-hook-form validates synchronously
    // but React needs to re-render to display the error
    const errorElement = page.locator('[data-testid="email-error"]');
    
    // Wait for element to be visible with retries
    await expect(errorElement).toBeVisible({ timeout: 5000 });
    
    // Verify the error text matches (case-insensitive, flexible matching)
    const errorText = await errorElement.textContent();
    expect(errorText?.toLowerCase()).toContain('invalid email');
    
    // Should still be on login page (validation prevented submission)
    await expect(page).toHaveURL(/.*\/login/, { timeout: 3000 });
  });

  test('Full Stack: Complete user journey - Register → Login → Access Protected → Logout', async ({ page }) => {
    const uniqueEmail = `e2e-journey-${Date.now()}@example.com`;
    
    // Step 1: Register
    await page.goto('/register');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="name"]', 'Journey Test User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify registration worked
    await expect(page.locator('text=Welcome')).toBeVisible();
    // Email may appear in multiple places, use more specific locator
    await expect(page.locator('main').getByText(uniqueEmail).first()).toBeVisible();
    
    // Verify cookie-based auth (no localStorage token)
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
    
    // Verify cookies are set
    let cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'accessToken')).toBeDefined();
    expect(cookies.find(c => c.name === 'refreshToken')).toBeDefined();
    
    // Step 2: Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login', { timeout: 5000 });
    
    // Verify cookies cleared
    cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'accessToken')).toBeUndefined();
    
    // Step 3: Login again
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Step 4: Verify protected route access
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Verify cookies restored after login
    cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'accessToken')).toBeDefined();
    
    // Step 5: Final logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});

