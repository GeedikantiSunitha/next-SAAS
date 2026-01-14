import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * TDD Tests for Newsletter Management (Issue #14)
 * 
 * Test Cases from Manual Assessment:
 * - 8.6.1, 8.6.2, 8.6.3: Newsletter management not available
 * 
 * Following TDD: Write tests first, see them fail, then implement fixes
 */

test.describe('Newsletter Management - TDD Tests (Issue #14)', () => {
  // Use seed admin users
  const seedAdminEmail = 'admin@example.com';
  const seedAdminPassword = 'Admin123!';

  let adminEmail: string;
  let adminPassword: string;

  test.beforeAll(async ({ request }) => {
    // Try to login with seed admin first
    const seedAdminLogin = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: seedAdminEmail,
        password: seedAdminPassword,
      },
    });

    if (seedAdminLogin.ok()) {
      adminEmail = seedAdminEmail;
      adminPassword = seedAdminPassword;
      console.log('✅ Using seed admin user');
    } else {
      // Create new admin user via test helper endpoint
      adminEmail = `admin-newsletter-${Date.now()}@example.com`;
      adminPassword = 'AdminPass123!';
      
      const createAdminResponse = await request.post(`${API_URL}/api/test-helpers/users/admin`, {
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Admin Newsletter Test',
          role: 'ADMIN',
        },
      });
      
      if (createAdminResponse.ok()) {
        console.log(`✅ Created admin user via test helper: ${adminEmail}`);
      } else {
        throw new Error('Failed to create admin user for testing');
      }
    }
  });

  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and localStorage
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  // Test Case 8.6.1: Newsletter Management page should be accessible
  test('8.6.1: should access newsletter management page', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to newsletter management page
    await page.goto('/admin/newsletters');
    await page.waitForLoadState('networkidle');

    // TDD Assertion 1: Page should load without errors
    const errorMessage = page.getByText(/error|failed|not found|404/i);
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // TDD Assertion 2: Should show newsletter management UI
    // Check for heading or key elements
    const heading = page.locator('h1, [class*="heading"], [class*="title"]');
    const hasHeading = await heading.first().isVisible().catch(() => false);
    
    // Should have either heading or newsletter-related content
    const newsletterContent = page.getByText(/newsletter|create|send|schedule/i);
    const hasContent = await newsletterContent.isVisible().catch(() => false);
    
    expect(hasHeading || hasContent).toBeTruthy();
    
    console.log('✅ Newsletter management page is accessible');
  });

  // Test Case 8.6.2: Should be able to view newsletters
  test('8.6.2: should display newsletters list', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to newsletter management page
    await page.goto('/admin/newsletters');
    await page.waitForLoadState('networkidle');

    // TDD Assertion: Should show either newsletters list or empty state
    const newslettersList = page.locator('[class*="list"], [class*="table"], [class*="card"]');
    const emptyState = page.getByText(/no.*newsletter|empty|create.*first/i);
    
    const hasList = await newslettersList.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    // Either list OR empty state should be visible
    expect(hasList || hasEmptyState).toBeTruthy();
    
    if (hasList) {
      console.log('✅ Newsletters list is displayed');
    } else if (hasEmptyState) {
      console.log('✅ Empty state displayed (no newsletters)');
    }
  });

  // Test Case 8.6.3: Should be able to create newsletter
  test('8.6.3: should have create newsletter functionality', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to newsletter management page
    await page.goto('/admin/newsletters');
    await page.waitForLoadState('networkidle');

    // TDD Assertion: Should have create button or form
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    const createForm = page.locator('form, [class*="form"]');
    
    const hasCreateButton = await createButton.isVisible().catch(() => false);
    const hasForm = await createForm.isVisible().catch(() => false);
    
    // Should have either create button OR form visible
    expect(hasCreateButton || hasForm).toBeTruthy();
    
    if (hasCreateButton) {
      console.log('✅ Create newsletter button is available');
    } else if (hasForm) {
      console.log('✅ Create newsletter form is available');
    }
  });
});
