import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * TDD Tests for Audit Logs (Issue #13)
 * 
 * Test Case from Manual Assessment:
 * - 8.3.1: Audit Logs page not displaying logs
 * 
 * Following TDD: Write tests first, see them fail, then implement fixes
 */

test.describe('Audit Logs - TDD Tests (Issue #13)', () => {
  // Use seed admin users (from backend/prisma/seed.ts)
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
      adminEmail = `admin-audit-${Date.now()}@example.com`;
      adminPassword = 'AdminPass123!';
      
      const createAdminResponse = await request.post(`${API_URL}/api/test-helpers/users/admin`, {
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Admin Audit Test',
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

  // Test Case 8.3.1: Audit Logs page should display logs
  test('8.3.1: should display audit logs on admin page', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to audit logs page
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');

    // Wait for page to load - check for heading
    await expect(page.locator('h1:has-text("Audit Logs")')).toBeVisible({ timeout: 10000 });

    // TDD Assertion 1: Page should load without errors
    const errorMessage = page.getByText(/error|failed|not found/i);
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // TDD Assertion 2: Should show either logs or empty state
    const logsTable = page.locator('table, [class*="table"]');
    const emptyState = page.getByText(/no.*logs|no.*audit|empty/i);
    
    const hasTable = await logsTable.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    // Either table with logs OR empty state should be visible
    expect(hasTable || hasEmptyState).toBeTruthy();

    // TDD Assertion 3: If logs exist, they should be displayed
    if (hasTable) {
      const logRows = logsTable.locator('tr, [class*="row"]').filter({ hasNot: page.locator('th') });
      const rowCount = await logRows.count();
      if (rowCount > 0) {
        // At least one log row should be visible
        await expect(logRows.first()).toBeVisible({ timeout: 2000 });
        console.log('✅ Audit logs are displayed');
      }
    } else if (hasEmptyState) {
      console.log('✅ Empty state displayed (no logs in database)');
    }
  });

  // Test: Audit logs API should return data
  test('should fetch audit logs via API', async ({ page, request }) => {
    // Login as admin via browser to get cookies
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Get cookies from browser context
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // TDD: Test API endpoint
    const apiResponse = await request.get(`${API_URL}/api/admin/audit-logs`, {
      headers: { Cookie: cookieHeader },
    });

    // TDD Assertion: API should return 200
    expect(apiResponse.status()).toBe(200);

    const data = await apiResponse.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    
    // Should have logs array and pagination
    expect(data.data.logs).toBeDefined();
    expect(Array.isArray(data.data.logs)).toBe(true);
    expect(data.data.pagination).toBeDefined();
    
    console.log(`✅ API returns ${data.data.logs.length} audit logs`);
  });
});
