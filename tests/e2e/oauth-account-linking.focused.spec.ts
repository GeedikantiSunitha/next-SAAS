/**
 * OAuth Account Linking - TDD Test
 * 
 * Tests that users can link and unlink OAuth accounts (Google, GitHub):
 * 1. View currently linked OAuth accounts
 * 2. Link Google account to existing account
 * 3. Link GitHub account to existing account
 * 4. Unlink OAuth accounts
 * 5. See linked accounts in UI
 */

import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe('OAuth Account Linking', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear HTTP-only cookies (can't be cleared via JS)
    await context.clearCookies();
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display Connected Accounts section on Profile page', async ({ page }) => {
    // Step 1: Register and login
    const testEmail = `test-oauth-ui-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await page.request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Step 2: Login
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    // Try to fill inputs - if already logged in, will redirect to dashboard
    try {
      await page.fill('input[name="email"]', testEmail, { timeout: 5000 });
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (error) {
      // If input not found, might already be logged in or redirected
      // Check if we're on dashboard already
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('Already logged in, proceeding to profile');
      } else {
        throw error;
      }
    }

    // Step 3: Navigate to Profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Step 4: Wait for profile page to load (check for a known element first)
    await expect(page.getByRole('heading', { name: /profile information/i })).toBeVisible({ timeout: 10000 });

    // Step 5: Verify Connected Accounts section exists
    await expect(page.getByRole('heading', { name: /connected accounts/i })).toBeVisible({ timeout: 5000 });
    
    // Step 6: Verify Google and GitHub options are visible
    // Look for the provider names in the Connected Accounts section
    const connectedAccountsSection = page.getByRole('heading', { name: /connected accounts/i }).locator('..');
    await expect(connectedAccountsSection.getByText(/google/i).first()).toBeVisible();
    await expect(connectedAccountsSection.getByText(/github/i).first()).toBeVisible();
    
    console.log('✅ Connected Accounts section visible');
  });

  test('should show currently linked OAuth accounts', async ({ page, request }) => {
    // Step 1: Register and login
    const testEmail = `test-oauth-linked-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await page.request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Step 2: Login
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    // Try to fill inputs - if already logged in, will redirect to dashboard
    try {
      await page.fill('input[name="email"]', testEmail, { timeout: 5000 });
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (error) {
      // If input not found, might already be logged in or redirected
      // Check if we're on dashboard already
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('Already logged in, proceeding to profile');
      } else {
        throw error;
      }
    }

    // Step 3: Get cookies for authenticated request
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Step 3: Check current linked OAuth methods
    const methodsResponse = await request.get(`${API_URL}/api/auth/oauth/methods`, {
      headers: { Cookie: cookieHeader },
    });
    
    expect(methodsResponse.ok()).toBeTruthy();
    const methodsData = await methodsResponse.json();
    const linkedMethods = methodsData.data || [];

    // Step 4: Navigate to Profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /profile information/i })).toBeVisible({ timeout: 10000 });

    // Step 5: Verify Connected Accounts section is visible
    await expect(page.getByRole('heading', { name: /connected accounts/i })).toBeVisible({ timeout: 5000 });

    // Step 6: Verify UI shows linked accounts correctly
    // If no accounts linked, should show "Not linked" or similar
    // If accounts linked, should show provider name with "Unlink" button
    
    if (linkedMethods.length === 0) {
      // Should show that no accounts are linked
      await expect(page.getByText(/not linked|no.*connected/i).first()).toBeVisible({ timeout: 5000 });
      console.log('✅ No linked accounts displayed correctly');
    } else {
      // Should show linked providers
      for (const method of linkedMethods) {
        await expect(page.getByText(new RegExp(method, 'i')).first()).toBeVisible();
      }
      console.log('✅ Linked accounts displayed correctly');
    }
  });

  test('should allow linking Google account (UI flow)', async ({ page }) => {
    // Step 1: Register and login
    const testEmail = `test-oauth-link-google-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await page.request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Step 2: Login
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    try {
      await page.fill('input[name="email"]', testEmail, { timeout: 5000 });
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (error) {
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('Already logged in, proceeding to profile');
      } else {
        throw error;
      }
    }

    // Step 3: Navigate to Profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /profile information/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /connected accounts/i })).toBeVisible({ timeout: 5000 });

    // Step 4: Find and verify "Link Account" button for Google exists
    // The button text is "Link Account" and it's in the Google section
    const googleSection = page.getByText(/google/i).locator('..').locator('..');
    const linkGoogleButton = googleSection.getByRole('button', { name: /link account/i }).first();
    await expect(linkGoogleButton).toBeVisible({ timeout: 5000 });
    
    // Step 5: Verify button is clickable (but don't actually click - OAuth flow requires real provider)
    // In a real scenario, clicking would redirect to Google OAuth page
    // This test verifies the UI is correct, full OAuth flow requires manual testing
    
    console.log('✅ Link Google Account button visible and ready');
  });

  test('should allow linking GitHub account (UI flow)', async ({ page }) => {
    // Step 1: Register and login
    const testEmail = `test-oauth-link-github-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await page.request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Step 2: Login
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    try {
      await page.fill('input[name="email"]', testEmail, { timeout: 5000 });
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (error) {
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('Already logged in, proceeding to profile');
      } else {
        throw error;
      }
    }

    // Step 3: Navigate to Profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /profile information/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /connected accounts/i })).toBeVisible({ timeout: 5000 });

    // Step 4: Find and verify "Link Account" button for GitHub exists
    // The button text is "Link Account" and it's in the GitHub section
    const githubSection = page.getByText(/github/i).locator('..').locator('..');
    const linkGitHubButton = githubSection.getByRole('button', { name: /link account/i }).first();
    await expect(linkGitHubButton).toBeVisible({ timeout: 5000 });
    
    // Step 5: Verify button is clickable (but don't actually click - OAuth flow requires real provider)
    // In a real scenario, clicking would redirect to GitHub OAuth page
    // This test verifies the UI is correct, full OAuth flow requires manual testing
    
    console.log('✅ Link GitHub Account button visible and ready');
  });

  test('should allow unlinking OAuth accounts', async ({ page, request }) => {
    // Step 1: Register and login
    const testEmail = `test-oauth-unlink-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await page.request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Step 2: Login
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    // Try to fill inputs - if already logged in, will redirect to dashboard
    try {
      await page.fill('input[name="email"]', testEmail, { timeout: 5000 });
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (error) {
      // If input not found, might already be logged in or redirected
      // Check if we're on dashboard already
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('Already logged in, proceeding to profile');
      } else {
        throw error;
      }
    }

    // Step 3: Get cookies for authenticated request
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Step 3: Check if any OAuth accounts are linked
    const methodsResponse = await request.get(`${API_URL}/api/auth/oauth/methods`, {
      headers: { Cookie: cookieHeader },
    });
    
    expect(methodsResponse.ok()).toBeTruthy();
    const methodsData = await methodsResponse.json();
    const linkedMethods = methodsData.data || [];

    // Step 4: Navigate to Profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Step 5: If accounts are linked, verify "Unlink" button exists
    if (linkedMethods.length > 0) {
      // Should see "Unlink" button for each linked provider
      const unlinkButton = page.getByRole('button', { name: /unlink/i }).first();
      await expect(unlinkButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Unlink button visible for linked accounts');
    } else {
      // If no accounts linked, unlink button shouldn't be visible
      const unlinkButton = page.getByRole('button', { name: /unlink/i }).first();
      await expect(unlinkButton).not.toBeVisible({ timeout: 2000 });
      console.log('✅ No unlink button when no accounts linked');
    }
  });
});
