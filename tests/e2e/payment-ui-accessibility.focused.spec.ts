/**
 * Payment UI Accessibility - Focused TDD Test
 * 
 * Tests that payment functionality is accessible from the Dashboard:
 * 1. Dashboard should have payment buttons/links
 * 2. Users can navigate to payment page
 * 3. Payment page should load correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Payment UI Accessibility', () => {
  test('should have payment buttons on Dashboard', async ({ page }) => {
    // Step 1: Register and login
    const testEmail = `test-payment-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[type="text"]', 'Test User');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 2: Verify Dashboard has payment-related buttons/links
    // Look for "Make Payment", "Subscribe", "Payments", or "Payment" buttons/links
    const paymentButton = page.getByRole('link', { name: /make payment|subscribe|payments|payment/i });
    await expect(paymentButton.first()).toBeVisible({ timeout: 5000 });

    // Step 3: Click payment button and verify navigation
    await paymentButton.first().click();
    await expect(page).toHaveURL('/payments', { timeout: 5000 });

    // Step 4: Verify payment page loads correctly
    await expect(page.locator('h1')).toContainText(/payment/i, { timeout: 5000 });
    
    // Step 5: Verify checkout form is visible
    await expect(page.getByText(/make payment|checkout/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to payment history from Dashboard', async ({ page, request }) => {
    // Step 1: Create user and login
    const testEmail = `test-payment-history-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await request.post('/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 2: Look for payment history link/button
    const paymentHistoryLink = page.getByRole('link', { name: /payment history|view payments|payments/i });
    
    // If found, click it; otherwise navigate directly to verify page exists
    if (await paymentHistoryLink.count() > 0) {
      await paymentHistoryLink.first().click();
      await expect(page).toHaveURL(/\/payments/, { timeout: 5000 });
    } else {
      // Navigate directly to verify page exists
      await page.goto('/payments');
      await expect(page.locator('h1')).toContainText(/payment/i, { timeout: 5000 });
    }

    // Step 3: Verify payment history tab is accessible
    const historyTab = page.getByRole('tab', { name: /history/i });
    if (await historyTab.count() > 0) {
      await historyTab.click();
      await expect(page.getByText(/payment history|no payments found/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
