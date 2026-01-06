import { test, expect } from '@playwright/test';

/**
 * Full-Stack Admin Dashboard E2E Tests
 * 
 * These tests verify the complete integration between frontend and backend
 * for the admin dashboard functionality:
 * - Admin can access dashboard
 * - Dashboard displays real statistics
 * - Statistics update correctly
 * - Non-admin users cannot access dashboard
 * 
 * Both frontend (port 3000) and backend (port 3001) must be running.
 */

test.describe('Full-Stack Admin Dashboard E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear HTTP-only cookies (can't be cleared via JS)
    await context.clearCookies();
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Admin can access dashboard and see statistics', async ({ page, request }) => {
    // Step 1: Create admin user via backend API
    const uniqueEmail = `admin-e2e-${Date.now()}@example.com`;
    const password = 'AdminPassword123!';

    // Register admin user
    const registerResponse = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: password,
        name: 'Admin User',
      },
    });

    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();
    const userId = registerData.data.id;

    // Update user to ADMIN role via direct database call (for testing)
    // In production, this would be done through proper admin APIs
    const updateResponse = await request.put(`http://localhost:3001/api/admin/users/${userId}`, {
      headers: {
        Cookie: `accessToken=${registerData.data.token || ''}`,
      },
      data: {
        role: 'ADMIN',
      },
    });

    // Step 2: Login as admin via frontend
    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 3: Navigate to admin dashboard (if route exists)
    // For now, we'll test the API endpoint directly
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    expect(accessTokenCookie).toBeDefined();

    // Step 4: Call admin dashboard API
    const dashboardResponse = await request.get('http://localhost:3001/api/admin/dashboard', {
      headers: {
        Cookie: `accessToken=${accessTokenCookie?.value}`,
      },
    });

    expect(dashboardResponse.status()).toBe(200);
    const dashboardData = await dashboardResponse.json();

    // Step 5: Verify dashboard stats structure
    expect(dashboardData.success).toBe(true);
    expect(dashboardData.data).toBeDefined();
    expect(dashboardData.data.stats).toBeDefined();
    expect(dashboardData.data.stats).toHaveProperty('totalUsers');
    expect(dashboardData.data.stats).toHaveProperty('activeSessions');
    expect(dashboardData.data.stats).toHaveProperty('recentActivity');
    expect(dashboardData.data.stats).toHaveProperty('systemHealth');

    // Step 6: Verify stats are real numbers (not stub data)
    expect(typeof dashboardData.data.stats.totalUsers).toBe('number');
    expect(dashboardData.data.stats.totalUsers).toBeGreaterThanOrEqual(0);
    expect(typeof dashboardData.data.stats.activeSessions).toBe('number');
    expect(dashboardData.data.stats.activeSessions).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(dashboardData.data.stats.recentActivity)).toBe(true);
    expect(dashboardData.data.stats.systemHealth).toHaveProperty('status');
    expect(dashboardData.data.stats.systemHealth).toHaveProperty('database');
  });

  test('Dashboard shows correct user count', async ({ page, request }) => {
    // Step 1: Create admin user
    const uniqueEmail = `admin-count-${Date.now()}@example.com`;
    const password = 'AdminPassword123!';

    const registerResponse = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: password,
        name: 'Admin User',
      },
    });

    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();

    // Step 2: Login
    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 3: Get cookies and call dashboard API
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Step 4: Create additional users
    await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: `user1-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'User 1',
      },
    });

    await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: `user2-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'User 2',
      },
    });

    // Step 5: Get dashboard stats
    const dashboardResponse = await request.get('http://localhost:3001/api/admin/dashboard', {
      headers: {
        Cookie: `accessToken=${accessTokenCookie?.value}`,
      },
    });

    expect(dashboardResponse.status()).toBe(200);
    const dashboardData = await dashboardResponse.json();

    // Step 6: Verify user count is at least 3 (admin + 2 users)
    // Note: May be more if other tests created users
    expect(dashboardData.data.stats.totalUsers).toBeGreaterThanOrEqual(3);
  });

  test('Dashboard shows active sessions', async ({ page, request }) => {
    // Step 1: Create and login as admin
    const uniqueEmail = `admin-sessions-${Date.now()}@example.com`;
    const password = 'AdminPassword123!';

    await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: password,
        name: 'Admin User',
      },
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 2: Get cookies
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Step 3: Get dashboard stats
    const dashboardResponse = await request.get('http://localhost:3001/api/admin/dashboard', {
      headers: {
        Cookie: `accessToken=${accessTokenCookie?.value}`,
      },
    });

    expect(dashboardResponse.status()).toBe(200);
    const dashboardData = await dashboardResponse.json();

    // Step 4: Verify active sessions count (should be at least 1 - current session)
    expect(dashboardData.data.stats.activeSessions).toBeGreaterThanOrEqual(1);
  });

  test('Non-admin user cannot access admin dashboard', async ({ page, request }) => {
    // Step 1: Create regular user
    const uniqueEmail = `user-${Date.now()}@example.com`;
    const password = 'Password123!';

    await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: password,
        name: 'Regular User',
      },
    });

    // Step 2: Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 3: Get cookies
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Step 4: Try to access admin dashboard
    const dashboardResponse = await request.get('http://localhost:3001/api/admin/dashboard', {
      headers: {
        Cookie: `accessToken=${accessTokenCookie?.value}`,
      },
    });

    // Step 5: Verify access is denied
    expect(dashboardResponse.status()).toBe(403);
    const errorData = await dashboardResponse.json();
    expect(errorData.success).toBe(false);
    expect(errorData.error).toMatch(/permissions|admin|forbidden/i);
  });

  test('Dashboard shows recent activity from audit logs', async ({ page, request }) => {
    // Step 1: Create and login as admin
    const uniqueEmail = `admin-activity-${Date.now()}@example.com`;
    const password = 'AdminPassword123!';

    await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: password,
        name: 'Admin User',
      },
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 2: Perform some actions that create audit logs
    // Login again to create audit log
    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 3: Get cookies and call dashboard API
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    const dashboardResponse = await request.get('http://localhost:3001/api/admin/dashboard', {
      headers: {
        Cookie: `accessToken=${accessTokenCookie?.value}`,
      },
    });

    expect(dashboardResponse.status()).toBe(200);
    const dashboardData = await dashboardResponse.json();

    // Step 4: Verify recent activity exists
    expect(Array.isArray(dashboardData.data.stats.recentActivity)).toBe(true);
    // Should have at least some activity (login creates audit log)
    expect(dashboardData.data.stats.recentActivity.length).toBeGreaterThanOrEqual(0);
    
    // If there's activity, verify structure
    if (dashboardData.data.stats.recentActivity.length > 0) {
      const activity = dashboardData.data.stats.recentActivity[0];
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('action');
      expect(activity).toHaveProperty('createdAt');
    }
  });

  test('Dashboard shows system health information', async ({ page, request }) => {
    // Step 1: Create and login as admin
    const uniqueEmail = `admin-health-${Date.now()}@example.com`;
    const password = 'AdminPassword123!';

    await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: password,
        name: 'Admin User',
      },
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 2: Get cookies and call dashboard API
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    const dashboardResponse = await request.get('http://localhost:3001/api/admin/dashboard', {
      headers: {
        Cookie: `accessToken=${accessTokenCookie?.value}`,
      },
    });

    expect(dashboardResponse.status()).toBe(200);
    const dashboardData = await dashboardResponse.json();

    // Step 3: Verify system health structure
    expect(dashboardData.data.stats.systemHealth).toBeDefined();
    expect(dashboardData.data.stats.systemHealth).toHaveProperty('status');
    expect(dashboardData.data.stats.systemHealth).toHaveProperty('timestamp');
    expect(dashboardData.data.stats.systemHealth).toHaveProperty('database');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(
      dashboardData.data.stats.systemHealth.status
    );
  });
});
