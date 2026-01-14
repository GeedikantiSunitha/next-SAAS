import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

test.describe('Email Format Validation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies
    await context.clearCookies();
    // Navigate to a page first before accessing localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should show validation error for invalid email in registration form', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Wait for form to be visible
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 });

    // Enter invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('invalid-email');
    
    // Blur the input to trigger validation (mode: 'onBlur')
    await emailInput.blur();
    
    // Wait for validation error to appear
    await page.waitForTimeout(300);

    // Check for email validation error using test ID (Input component uses "email-error")
    const emailError = page.getByTestId('email-error');
    
    // Verify error is visible
    await expect(emailError).toBeVisible({ timeout: 2000 });
    await expect(emailError).toContainText(/invalid.*email/i);

    // Enter valid password (so we can test email validation specifically)
    await page.fill('input[name="password"]', 'ValidPass123!');

    // Try to submit form - should be blocked by validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Verify form was NOT submitted (user should still be on register page)
    expect(page.url()).toContain('/register');

    console.log('✅ Email validation error displayed in registration form');
  });

  test('should show validation error for invalid email in login form', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for form to be visible
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 });

    // Enter invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('invalid-email');
    
    // Blur the input to trigger validation (mode: 'onBlur')
    await emailInput.blur();
    await page.waitForTimeout(300);

    // Check for email validation error using test ID
    const emailError = page.getByTestId('email-error');
    
    // Verify error is visible
    await expect(emailError).toBeVisible({ timeout: 2000 });
    await expect(emailError).toContainText(/invalid.*email/i);

    // Enter password
    await page.fill('input[name="password"]', 'SomePassword123!');

    // Try to submit form - should be blocked by validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Verify form was NOT submitted (user should still be on login page)
    expect(page.url()).toContain('/login');

    console.log('✅ Email validation error displayed in login form');
  });

  test('should show validation error for invalid email in forgot password form', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Wait for form to be visible
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 });

    // Enter invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('invalid-email');
    
    // Blur the input to trigger validation (mode: 'onBlur')
    await emailInput.blur();
    await page.waitForTimeout(300);

    // Check for email validation error using test ID
    const emailError = page.getByTestId('email-error');
    
    // Verify error is visible
    await expect(emailError).toBeVisible({ timeout: 2000 });
    await expect(emailError).toContainText(/invalid.*email/i);

    // Try to submit form - should be blocked by validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Verify form was NOT submitted (user should still be on forgot-password page)
    expect(page.url()).toContain('/forgot-password');

    console.log('✅ Email validation error displayed in forgot password form');
  });

  test('should accept valid email formats in registration form', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Wait for form to be visible
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 });

    // Test various valid email formats
    const validEmails = [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user123@test-domain.com',
    ];

    for (const email of validEmails) {
      // Clear and enter valid email
      const emailInput = page.getByLabel(/email/i);
      await emailInput.clear();
      await emailInput.fill(email);

      // Enter valid password
      await page.fill('input[name="password"]', 'ValidPass123!');

      // Check that no validation error appears
      await page.waitForTimeout(300);
      
      const emailError = page.locator('text=/invalid.*email|email.*invalid/i').first();
      await expect(emailError).not.toBeVisible({ timeout: 1000 });

      console.log(`✅ Valid email format accepted: ${email}`);
    }
  });

  test('should reject invalid email formats in registration form', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Wait for form to be visible
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 });

    // Test various invalid email formats
    const invalidEmails = [
      'invalid-email',
      'invalid@',
      '@example.com',
      'invalid@.com',
      'invalid..email@example.com',
      'invalid@example',
      'invalid email@example.com', // space in email
    ];

    for (const email of invalidEmails) {
      // Clear and enter invalid email
      const emailInput = page.getByLabel(/email/i);
      await emailInput.clear();
      await emailInput.fill(email);

      // Enter valid password
      await page.fill('input[name="password"]', 'ValidPass123!');

      // Try to submit
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      // Check that validation error appears
      const emailError = page.locator('text=/invalid.*email|email.*invalid/i').first();
      await expect(emailError).toBeVisible({ timeout: 2000 });

      // Verify form was NOT submitted
      expect(page.url()).toContain('/register');

      console.log(`✅ Invalid email format rejected: ${email}`);
    }
  });
});
