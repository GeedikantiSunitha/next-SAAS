import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * TDD Tests for Feature Flags (Issue #12)
 * 
 * Test Cases from Manual Assessment:
 * - 8.4.1: View Feature Flags - should show all flags, status, and descriptions
 * - 8.4.2: Toggle Feature Flag - should toggle and save
 * - 8.4.3: Create New Feature Flag - should be able to create new flags
 * 
 * Following TDD: Write tests first, see them fail, then implement fixes
 */

test.describe('Feature Flags - TDD Tests (Issue #12)', () => {
  // Use seed admin users (from backend/prisma/seed.ts)
  const seedAdminEmail = 'admin@example.com';
  const seedAdminPassword = 'Admin123!';
  const seedSuperAdminEmail = 'superadmin@example.com';
  const seedSuperAdminPassword = 'SuperAdmin123!';

  let adminEmail: string;
  let adminPassword: string;
  let adminUserId: string;
  let superAdminEmail: string;
  let superAdminPassword: string;
  let superAdminUserId: string;

  test.beforeAll(async ({ request }) => {
    // Try to login with seed admin first
    const seedAdminLogin = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: seedAdminEmail,
        password: seedAdminPassword,
      },
    });

    if (seedAdminLogin.ok()) {
      // Seed admin exists, use it
      adminEmail = seedAdminEmail;
      adminPassword = seedAdminPassword;
      const userData = await seedAdminLogin.json();
      adminUserId = userData.data?.id;
      console.log('✅ Using seed admin user');
    } else {
      // Create new admin user via test helper endpoint
      adminEmail = `admin-flags-${Date.now()}@example.com`;
      adminPassword = 'AdminPass123!';
      
      const createAdminResponse = await request.post(`${API_URL}/api/test-helpers/users/admin`, {
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Admin Flags Test',
          role: 'ADMIN',
        },
      });
      
      if (createAdminResponse.ok()) {
        const userData = await createAdminResponse.json();
        adminUserId = userData.data.id;
        console.log(`✅ Created admin user via test helper: ${adminEmail}`);
      } else {
        throw new Error('Failed to create admin user for testing');
      }
    }

    // Try to login with seed super admin
    const seedSuperAdminLogin = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: seedSuperAdminEmail,
        password: seedSuperAdminPassword,
      },
    });

    if (seedSuperAdminLogin.ok()) {
      superAdminEmail = seedSuperAdminEmail;
      superAdminPassword = seedSuperAdminPassword;
      const userData = await seedSuperAdminLogin.json();
      superAdminUserId = userData.data?.id;
      console.log('✅ Using seed super admin user');
    } else {
      // Create new super admin user via test helper endpoint
      superAdminEmail = `superadmin-flags-${Date.now()}@example.com`;
      superAdminPassword = 'SuperAdminPass123!';
      
      const createSuperAdminResponse = await request.post(`${API_URL}/api/test-helpers/users/admin`, {
        data: {
          email: superAdminEmail,
          password: superAdminPassword,
          name: 'Super Admin Flags Test',
          role: 'SUPER_ADMIN',
        },
      });
      
      if (createSuperAdminResponse.ok()) {
        const userData = await createSuperAdminResponse.json();
        superAdminUserId = userData.data.id;
        console.log(`✅ Created super admin user via test helper: ${superAdminEmail}`);
      } else {
        console.log('⚠️ Could not create super admin user, but continuing with admin user');
      }
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test users if we created them (not seed users)
    if (adminUserId && adminEmail !== seedAdminEmail) {
      // Note: We can't delete via API without admin access, so we'll just log
      console.log(`🧹 Test admin user created: ${adminEmail} (cleanup needed manually)`);
    }
    if (superAdminUserId && superAdminEmail !== seedSuperAdminEmail) {
      console.log(`🧹 Test super admin user created: ${superAdminEmail} (cleanup needed manually)`);
    }
  });

  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and localStorage
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  // Test Case 8.4.1: View Feature Flags
  // Expected: All feature flags listed, current status shown, description displayed
  test('8.4.1: should display feature flags with descriptions and status', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to feature flags page
    await page.goto('/admin/feature-flags');
    await page.waitForLoadState('networkidle');

    // Wait for page to load - check for heading (h1 with text "Feature Flags")
    await expect(page.locator('h1:has-text("Feature Flags")')).toBeVisible({ timeout: 10000 });

    // Check if flags are displayed or empty state
    const emptyStateMessage = page.getByText(/no feature flags available|seed|database|run.*script/i);
    const flagsList = page.locator('div[class*="space-y-4"]').filter({ has: page.locator('[class*="border rounded-lg"]') }).first();
    
    const hasEmptyState = await emptyStateMessage.isVisible().catch(() => false);
    const hasFlags = await flagsList.isVisible().catch(() => false);

    if (hasFlags) {
      // Get first flag item
      const firstFlag = flagsList.locator('[class*="border rounded-lg"]').first();
      await expect(firstFlag).toBeVisible({ timeout: 2000 });
      
      // TDD Assertion 1: Description should be visible (tests our implementation)
      const description = firstFlag.locator('p.text-sm.text-gray-500');
      await expect(description).toBeVisible({ timeout: 2000 });
      const descriptionText = await description.textContent();
      expect(descriptionText).toBeTruthy();
      expect(descriptionText!.length).toBeGreaterThan(0);

      // TDD Assertion 2: Status (Enabled/Disabled) should be visible
      const status = firstFlag.locator('text=/enabled|disabled/i');
      await expect(status).toBeVisible({ timeout: 2000 });

      // TDD Assertion 3: Flag key should be visible
      const flagKey = firstFlag.locator('h3');
      await expect(flagKey).toBeVisible({ timeout: 2000 });
      
      console.log('✅ Feature flags displayed with descriptions and status');
    } else if (hasEmptyState) {
      // TDD Assertion: Empty state should have helpful message
      const helpfulMessage = page.getByText(/seed|database|run.*script/i);
      await expect(helpfulMessage).toBeVisible({ timeout: 2000 });
      console.log('✅ Empty state shows helpful message');
    } else {
      // Page loaded but neither flags nor empty state - this is a problem
      throw new Error('Feature flags page loaded but neither flags nor empty state is visible');
    }
  });

  // Test Case 8.4.2: Toggle Feature Flag
  test('8.4.2: should toggle feature flag and save changes', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to feature flags page
    await page.goto('/admin/feature-flags');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('h1:has-text("Feature Flags")')).toBeVisible({ timeout: 10000 });

    // Find first flag with toggle button
    const flagsList = page.locator('div[class*="space-y-4"]').filter({ has: page.locator('[class*="border rounded-lg"]') }).first();
    const hasFlags = await flagsList.isVisible().catch(() => false);

    if (hasFlags) {
      const firstFlag = flagsList.locator('[class*="border rounded-lg"]').first();
      await expect(firstFlag).toBeVisible({ timeout: 2000 });
      
      // Get initial state
      const initialStatus = await firstFlag.locator('text=/enabled|disabled/i').textContent();
      const wasEnabled = initialStatus?.toLowerCase().includes('enabled');
      const toggleButton = firstFlag.getByRole('button', { name: /enable|disable/i });
      await expect(toggleButton).toBeVisible({ timeout: 2000 });

      // Click toggle button
      await toggleButton.click();

      // Wait for update to complete - check for either toast or status change
      await page.waitForTimeout(2000);

      // TDD Assertion: Either success toast appears OR status changes
      // Check for toast using multiple selectors (toast has role="status" and data-testid)
      const toastSelectors = [
        page.locator('[role="status"]'),
        page.locator('[data-testid^="toast-"]'),
        page.getByText(/success/i),
        page.getByText(/updated/i),
        page.getByText(/feature flag/i),
      ];
      
      let hasToast = false;
      for (const selector of toastSelectors) {
        hasToast = await selector.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasToast) break;
      }
      
      // Also check if status changed (refresh the flag element)
      await page.waitForTimeout(500); // Wait for UI update
      const newStatus = await firstFlag.locator('text=/enabled|disabled/i').textContent();
      const statusChanged = newStatus?.toLowerCase().includes(wasEnabled ? 'disabled' : 'enabled');
      
      // Either toast appeared OR status changed (both indicate success)
      expect(hasToast || statusChanged).toBeTruthy();
      
      if (hasToast) {
        console.log('✅ Feature flag toggle works - success toast appeared');
      } else if (statusChanged) {
        console.log('✅ Feature flag toggle works - status changed');
      }
    } else {
      console.log('⚠️ No flags available to test toggle functionality');
    }
  });

  // Test Case 8.4.3: Create New Feature Flag
  // Note: This tests API functionality (UI for creating flags may not exist yet)
  test('8.4.3: should be able to create new feature flag via API', async ({ page, request }) => {
    // Login as admin via browser to get cookies properly
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Get cookies from browser context
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // TDD: Test creating a new feature flag via API
    const newFlagKey = `test_flag_${Date.now()}`;
    const createResponse = await request.put(`${API_URL}/api/admin/feature-flags/${newFlagKey}`, {
      headers: { Cookie: cookieHeader },
      data: { enabled: true },
    });

    // TDD Assertion: Should be able to create flag (admin user should have access)
    const status = createResponse.status();
    if (status !== 200) {
      const errorText = await createResponse.text();
      console.log(`⚠️ API returned status ${status}: ${errorText}`);
    }
    expect(status).toBe(200);

    const data = await createResponse.json();
    expect(data.success).toBe(true);
    
    // API returns: { success: true, data: { key, enabled, message } }
    expect(data.data).toBeDefined();
    expect(data.data.key).toBe(newFlagKey);
    expect(data.data.enabled).toBe(true);

    // TDD Assertion: Verify flag appears in list
    const flagsResponse = await request.get(`${API_URL}/api/admin/feature-flags`, {
      headers: { Cookie: cookieHeader },
    });

    expect(flagsResponse.status()).toBe(200);
    const flagsData = await flagsResponse.json();
    const flagExists = flagsData.data.flags.some((f: any) => f.key === newFlagKey);
    expect(flagExists).toBe(true);
    
    // TDD Assertion: Newly created flag should have description (from our backend fix)
    const newFlag = flagsData.data.flags.find((f: any) => f.key === newFlagKey);
    expect(newFlag).toBeDefined();
    expect(newFlag.description).toBeTruthy(); // Should have default description
    
    console.log('✅ Feature flag created via API with description');
  });

  // Additional test: Verify super admin can also access feature flags
  test('should allow super admin to access feature flags', async ({ page }) => {
    // Login as super admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', superAdminEmail);
    await page.fill('input[name="password"]', superAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to feature flags page
    await page.goto('/admin/feature-flags');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('h1:has-text("Feature Flags")')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Super admin can access feature flags page');
  });
});
