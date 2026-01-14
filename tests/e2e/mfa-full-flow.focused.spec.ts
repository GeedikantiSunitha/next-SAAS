/**
 * MFA Full Flow - Comprehensive TDD Test
 * 
 * Tests the complete MFA flow using test helper to enable MFA:
 * 1. Enable MFA via test helper
 * 2. Login with MFA enabled - should show verification step
 * 3. Verify MFA verification component is displayed
 * 4. Test Disable MFA button exists
 */

import { test, expect } from '@playwright/test';

test.describe('MFA Full Flow', () => {
  test('should show MFA verification step after password login when MFA is enabled via test helper', async ({ page, request }) => {
    // Step 1: Register user
    const testEmail = `test-mfa-full-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await request.post('/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Step 2: Enable MFA via test helper
    const enableMfaResponse = await request.post(`/api/test-helpers/users/${testEmail}/mfa/enable`);
    expect(enableMfaResponse.ok()).toBeTruthy();
    const mfaData = await enableMfaResponse.json();
    expect(mfaData.success).toBe(true);
    expect(mfaData.data.secret).toBeDefined();

    // Step 3: Logout (clear any existing session)
    await page.goto('/logout');
    await page.waitForTimeout(1000);

    // Step 4: Attempt login - should show MFA verification
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Intercept login response
    const loginResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.click('button[type="submit"]');

    // Step 5: Wait for login response
    const loginResponse = await loginResponsePromise;
    const loginData = await loginResponse.json();
    
    // Step 6: Verify response includes requiresMfa
    expect(loginData.success).toBe(true);
    expect(loginData.data).toHaveProperty('requiresMfa');
    expect(loginData.data.requiresMfa).toBe(true);
    expect(loginData.data.mfaMethod).toBe('TOTP');
    expect(loginData.data.user).toBeDefined();

    // Step 7: Verify MFA verification component is shown
    await expect(page.getByText(/multi-factor|verification.*code|enter.*code|authenticator/i).first()).toBeVisible({ timeout: 5000 });
    
    // Step 8: Verify MFA code input is visible
    const mfaCodeInput = page.getByPlaceholder(/000000|123456/i).or(page.locator('input[type="text"]').filter({ hasText: /code/i }));
    await expect(mfaCodeInput.first()).toBeVisible({ timeout: 5000 });

    // Step 9: Verify "Use Backup Code" option exists
    const backupCodeButton = page.getByRole('button', { name: /backup.*code|use.*backup/i });
    await expect(backupCodeButton.first()).toBeVisible({ timeout: 5000 });

    console.log('✅ MFA verification step is correctly displayed after login');
  });

  test('should have Disable MFA button when MFA is enabled', async ({ page, request }) => {
    // Step 1: Register and login
    const testEmail = `test-mfa-disable-full-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await request.post('/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 2: Enable MFA via test helper
    const enableMfaResponse = await request.post(`/api/test-helpers/users/${testEmail}/mfa/enable`);
    expect(enableMfaResponse.ok()).toBeTruthy();

    // Step 3: Navigate to Profile
    await page.goto('/profile');
    await expect(page.getByText(/profile|multi-factor|mfa/i).first()).toBeVisible({ timeout: 5000 });

    // Step 4: Check MFA Settings section
    const mfaSection = page.getByText(/multi-factor|mfa|authentication/i);
    await expect(mfaSection.first()).toBeVisible({ timeout: 5000 });

    // Step 5: Verify "Disable" button is visible (MFA is enabled)
    const disableButton = page.getByRole('button', { name: /disable/i });
    await expect(disableButton.first()).toBeVisible({ timeout: 5000 });
    
    // Step 6: Verify "Enabled" status is shown
    const enabledStatus = page.getByText(/enabled/i);
    await expect(enabledStatus.first()).toBeVisible({ timeout: 5000 });

    console.log('✅ Disable MFA button is visible when MFA is enabled');
  });
});
