import { test, expect } from '@playwright/test';

/**
 * E2E Tests for User Profile Management
 * 
 * These tests verify the complete profile management flow:
 * 1. View profile page (authenticated)
 * 2. Update profile (name, email)
 * 3. Validate email format
 * 4. Prevent duplicate email
 * 5. Change password
 * 6. Validate password strength
 * 7. Error handling
 * 8. Authentication required
 * 
 * Both frontend (port 3000) and backend (port 3001) must be running.
 */

test.describe('Full-Stack Profile Management E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear HTTP-only cookies (can't be cleared via JS)
    await context.clearCookies();
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('User can view profile page when authenticated', async ({ page }) => {
    const uniqueEmail = `profile-view-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // Register user - Playwright auto-waits for elements
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Profile View User');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Verify profile page loads
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible({ timeout: 10000 });
    
    // Verify profile information is displayed
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    
    // Verify current user data is shown
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveValue(uniqueEmail);
    
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).toHaveValue('Profile View User');
  });

  test('User can update profile name', async ({ page }) => {
    const uniqueEmail = `profile-name-update-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // Register user
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Original Name');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Wait for profile to load
    await expect(page.getByLabel(/name/i)).toBeVisible();
    
    // Update name
    const nameInput = page.getByLabel(/name/i);
    await nameInput.clear();
    await nameInput.fill('Updated Name');
    
    // Click save button
    await page.click('button:has-text("Save Profile")');
    
    // Wait for success message
    await expect(page.getByText(/profile updated successfully/i).first()).toBeVisible({ timeout: 5000 });
    
    // Verify name is updated (should still be visible in input)
    await expect(nameInput).toHaveValue('Updated Name');
  });

  test('User can update profile email', async ({ page }) => {
    const uniqueEmail = `profile-email-update-${Date.now()}@example.com`;
    const newEmail = `updated-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // Register user
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Email Update User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Wait for profile to load
    await expect(page.getByLabel(/email/i)).toBeVisible();
    
    // Update email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.clear();
    await emailInput.fill(newEmail);
    
    // Click save button
    await page.click('button:has-text("Save Profile")');
    
    // Wait for success message
    await expect(page.getByText(/profile updated successfully/i).first()).toBeVisible({ timeout: 5000 });
    
    // Verify email is updated
    await expect(emailInput).toHaveValue(newEmail);
  });

  test('Email validation shows error for invalid email format', async ({ page }) => {
    const uniqueEmail = `profile-email-validate-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // Register user
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Email Validate User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Wait for profile to load
    await expect(page.getByLabel(/email/i)).toBeVisible();
    
    // Enter invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.clear();
    await emailInput.fill('invalid-email-format');
    
    // Click save profile button (first form)
    await page.click('button:has-text("Save Profile")');
    
    // Verify validation error is shown
    await expect(page.getByTestId('email-error')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('email-error')).toContainText(/invalid email/i);
    
    // Verify update was NOT called (check that success message doesn't appear)
    await expect(page.getByText(/profile updated successfully/i).first()).not.toBeVisible({ timeout: 2000 });
  });

  test('Profile update prevents duplicate email', async ({ page }) => {
    const uniqueEmail1 = `profile-dup1-${Date.now()}@example.com`;
    const uniqueEmail2 = `profile-dup2-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // Register first user
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail1);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'User 1');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Logout first user (by clearing cookies)
    await page.evaluate(() => {
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
    });
    
    // Register second user
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail2);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'User 2');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Wait for profile to load
    await expect(page.getByLabel(/email/i)).toBeVisible();
    
    // Try to update email to first user's email (should fail)
    const emailInput = page.getByLabel(/email/i);
    await emailInput.clear();
    await emailInput.fill(uniqueEmail1);
    
    // Click save button
    await page.click('button:has-text("Save Profile")');
    
    // Verify error message is shown
    await expect(page.getByText(/email already registered/i).first()).toBeVisible({ timeout: 5000 });
    
    // Verify email was NOT updated (should still be original)
    await expect(emailInput).toHaveValue(uniqueEmail2);
  });

  test('User can change password', async ({ page }) => {
    const uniqueEmail = `profile-password-change-${Date.now()}@example.com`;
    const oldPassword = 'Password123!';
    const newPassword = 'NewPassword456!';
    
    // Register user
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', oldPassword);
    await page.fill('input[name="name"]', 'Password Change User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Wait for password change section
    await expect(page.getByLabel(/current password/i)).toBeVisible();
    
    // Fill password change form
    await page.getByLabel(/current password/i).fill(oldPassword);
    await page.getByLabel(/new password/i).fill(newPassword);
    
    // Click change password button
    await page.click('button:has-text("Change Password")');
    
    // Wait for success message
    await expect(page.getByText(/password changed successfully/i).first()).toBeVisible({ timeout: 5000 });
    
    // Verify password fields are cleared
    await expect(page.getByLabel(/current password/i)).toHaveValue('');
    await expect(page.getByLabel(/new password/i)).toHaveValue('');
    
    // Logout by clearing cookies
    await page.evaluate(() => {
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
    });
    
    // Try to login with old password (should fail)
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', oldPassword);
    await page.click('button[type="submit"]');
    
    // Should not redirect to dashboard (login failed)
    await expect(page).not.toHaveURL('**/dashboard', { timeout: 3000 });
    
    // Try to login with new password (should succeed)
    await page.fill('input[name="password"]', newPassword);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('**/dashboard', { timeout: 10000 });
  });

  test('Password change validates password strength', async ({ page }) => {
    const uniqueEmail = `profile-password-strength-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // Register user
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Password Strength User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Wait for password change section
    await expect(page.getByLabel(/current password/i)).toBeVisible();
    
    // Try to change to weak password
    await page.getByLabel(/current password/i).fill(password);
    await page.getByLabel(/new password/i).fill('weak'); // Too weak
    
    // Click change password button
    await page.click('button:has-text("Change Password")');
    
    // Verify validation error is shown
    await expect(page.getByTestId('newPassword-error')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('newPassword-error')).toContainText(/password must be at least/i);
  });

  test('Password change rejects incorrect current password', async ({ page }) => {
    const uniqueEmail = `profile-password-wrong-${Date.now()}@example.com`;
    const password = 'Password123!';
    const wrongPassword = 'WrongPassword123!';
    const newPassword = 'NewPassword456!';
    
    // Register user
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Password Wrong User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    // Wait for password change section
    await expect(page.getByLabel(/current password/i)).toBeVisible();
    
    // Try to change password with wrong current password
    await page.getByLabel(/current password/i).fill(wrongPassword);
    await page.getByLabel(/new password/i).fill(newPassword);
    
    // Click change password button
    await page.click('button:has-text("Change Password")');
    
    // Verify error message is shown
    await expect(page.getByText(/current password is incorrect/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Profile page requires authentication', async ({ page }) => {
    // Try to access profile page without authentication
    await page.goto('/profile');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
    
    // Or if protected route middleware works differently, verify profile is not accessible
    const profileHeading = page.locator('h1:has-text("Profile")');
    await expect(profileHeading).not.toBeVisible({ timeout: 3000 });
  });

  test('Complete profile management user journey', async ({ page }) => {
    const uniqueEmail = `profile-journey-${Date.now()}@example.com`;
    const password = 'Password123!';
    const newPassword = 'NewPassword456!';
    
    // Step 1: Register
    await page.goto('/register');
    await page.waitForSelector('form');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Original Name');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Step 2: Navigate to profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible({ timeout: 10000 });
    
    // Step 3: Update name
    const nameInput = page.getByLabel(/name/i);
    await nameInput.clear();
    await nameInput.fill('Updated Name');
    await page.click('button:has-text("Save Profile")');
    await expect(page.getByText(/profile updated successfully/i).first()).toBeVisible({ timeout: 5000 });
    
    // Step 4: Change password
    await page.getByLabel(/current password/i).fill(password);
    await page.getByLabel(/new password/i).fill(newPassword);
    await page.click('button:has-text("Change Password")');
    await expect(page.getByText(/password changed successfully/i).first()).toBeVisible({ timeout: 5000 });
    
    // Step 5: Verify changes persisted (logout and login again)
    await page.evaluate(() => {
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
    });
    
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', newPassword); // Use new password
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Step 6: Verify profile changes persisted
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    const nameInputAfter = page.getByLabel(/name/i);
    await expect(nameInputAfter).toHaveValue('Updated Name');
  });
});

