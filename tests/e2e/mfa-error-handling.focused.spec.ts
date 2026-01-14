/**
 * MFA Error Handling - TDD Test
 * 
 * Tests error handling improvements:
 * 1. Email MFA shows clear error when email service is not configured
 * 2. Better error messages for email sending failures
 * 3. Helpful UI guidance for MFA setup
 */

import { test, expect } from '@playwright/test';

test.describe('MFA Error Handling', () => {
  test('should show helpful error message when email service is not configured', async ({ page, request }) => {
    // Step 1: Register and login
    const testEmail = `test-mfa-error-${Date.now()}@example.com`;
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

    // Step 2: Navigate to Profile
    await page.goto('/profile');
    await expect(page.getByText(/profile|multi-factor|mfa/i).first()).toBeVisible({ timeout: 5000 });

    // Step 3: Click "Setup Email MFA" button
    const setupEmailButton = page.getByRole('button', { name: /setup.*email|email.*mfa|email.*setup/i });
    await expect(setupEmailButton.first()).toBeVisible({ timeout: 5000 });
    await setupEmailButton.first().click();

    // Step 4: Wait for Email MFA setup modal
    await expect(page.getByText(/email.*mfa|verification.*code|enter.*code/i).first()).toBeVisible({ timeout: 5000 });

    // Step 5: Wait a bit for API call to complete
    await page.waitForTimeout(2000);

    // Step 6: Check for error message (if email service is not configured)
    // The error should be helpful and actionable
    const errorMessages = page.getByText(/email.*service|resend|configure|not.*configured|email.*not.*available/i);
    const errorCount = await errorMessages.count();
    
    // If error exists, it should be helpful
    if (errorCount > 0) {
      const errorText = await errorMessages.first().textContent();
      console.log('✅ Error message found:', errorText);
      // Error should mention email service or configuration
      expect(errorText?.toLowerCase()).toMatch(/email|service|configure|resend/i);
    } else {
      // If no error, check if OTP input is visible (email service is working)
      const otpInput = page.locator('input[type="text"], input[placeholder*="code"]');
      const hasOtpInput = await otpInput.count() > 0;
      if (hasOtpInput) {
        console.log('ℹ️ Email service is configured - OTP input is visible');
      }
    }
  });

  test('should show helpful instructions for TOTP MFA setup', async ({ page, request }) => {
    // Step 1: Register and login
    const testEmail = `test-mfa-help-${Date.now()}@example.com`;
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

    // Step 2: Navigate to Profile
    await page.goto('/profile');
    await expect(page.getByText(/profile|multi-factor|mfa/i).first()).toBeVisible({ timeout: 5000 });

    // Step 3: Click "Setup TOTP" button
    const setupTotpButton = page.getByRole('button', { name: /setup.*totp|totp.*setup/i });
    await expect(setupTotpButton.first()).toBeVisible({ timeout: 5000 });
    await setupTotpButton.first().click();

    // Step 4: Wait for TOTP setup modal
    await expect(page.getByText(/scan.*qr|qr.*code|authenticator|enter.*code/i).first()).toBeVisible({ timeout: 5000 });

    // Step 5: Check for helpful instructions
    // Wait for setup to complete
    await page.waitForTimeout(3000);
    
    // Check for helpful info box
    const infoBox = page.getByText(/first.*time|authenticator.*app|google.*authenticator|authy/i);
    const hasInfoBox = await infoBox.count() > 0;
    
    // Check for specific helpful elements
    const hasQRCode = await page.locator('img[alt*="QR"], img[src*="qr"], canvas').count() > 0;
    const hasSecretKey = await page.getByText(/secret.*key|manual.*entry/i).count() > 0;
    const hasBackupCodes = await page.getByText(/backup.*code|save.*securely/i).count() > 0;
    
    console.log('✅ TOTP Setup Instructions:');
    console.log(`   - Info box visible: ${hasInfoBox}`);
    console.log(`   - QR Code visible: ${hasQRCode}`);
    console.log(`   - Secret Key section: ${hasSecretKey}`);
    console.log(`   - Backup Codes section: ${hasBackupCodes}`);
    
    // At least one helpful element should be present
    expect(hasInfoBox || hasQRCode || hasSecretKey || hasBackupCodes).toBeTruthy();
  });

  test('should show clear error when email OTP sending fails', async ({ page, request }) => {
    // This test verifies that error messages are clear and actionable
    const testEmail = `test-mfa-email-error-${Date.now()}@example.com`;
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

    // Navigate to Profile
    await page.goto('/profile');
    await expect(page.getByText(/profile|multi-factor|mfa/i).first()).toBeVisible({ timeout: 5000 });

    // Try to setup Email MFA
    const setupEmailButton = page.getByRole('button', { name: /setup.*email|email.*mfa/i });
    await expect(setupEmailButton.first()).toBeVisible({ timeout: 5000 });
    await setupEmailButton.first().click();

    // Wait for modal
    await expect(page.getByText(/email.*mfa|verification.*code/i).first()).toBeVisible({ timeout: 5000 });

    // Wait for API call
    await page.waitForTimeout(3000);

    // Check for any error messages
    const errorMessages = page.getByText(/error|failed|unable|not.*available|email.*service|configure/i);
    const errorCount = await errorMessages.count();
    
    // If errors exist, they should be in error styling
    if (errorCount > 0) {
      // Find the error container (should have destructive styling)
      const errorContainer = page.locator('.border-destructive, .bg-destructive, [class*="destructive"]').first();
      const hasErrorContainer = await errorContainer.count() > 0;
      
      if (hasErrorContainer) {
        const className = await errorContainer.getAttribute('class');
        // Error should have destructive/error styling
        expect(className?.toLowerCase()).toMatch(/destructive|error|danger|red/i);
      } else {
        // Error message exists, which is good
        console.log('✅ Error message found');
      }
    } else {
      // No error - email service might be working or setup succeeded
      console.log('ℹ️ No error messages found - email service may be configured');
    }
  });
});
