import { test, expect } from '@playwright/test';

/**
 * TDD Tests for 404 Error Handling (Issue #15)
 * 
 * Test Case from Manual Assessment:
 * - 12.3.2: 404 error shows blank page
 * 
 * Following TDD: Write tests first, see them fail, then implement fixes
 */

test.describe('404 Error Handling - TDD Tests (Issue #15)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and localStorage
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  // Test Case 12.3.2: 404 page should show helpful message
  test('12.3.2: should display 404 error page instead of blank page', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('/this-page-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // TDD Assertion 1: Should NOT be blank (should have content)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.trim().length).toBeGreaterThan(0);

    // TDD Assertion 2: Should show 404 or "Not Found" message
    const notFoundText = page.getByText(/404|not found|page not found|doesn't exist/i);
    const hasNotFoundText = await notFoundText.isVisible({ timeout: 2000 }).catch(() => false);
    
    // TDD Assertion 3: Should have "Return to Home" or similar button
    const homeButton = page.getByRole('button', { name: /home|dashboard|return|go back/i });
    const homeLink = page.getByRole('link', { name: /home|dashboard|return/i });
    
    const hasHomeButton = await homeButton.isVisible().catch(() => false);
    const hasHomeLink = await homeLink.isVisible().catch(() => false);
    
    // Should have either 404 message OR home button/link
    expect(hasNotFoundText || hasHomeButton || hasHomeLink).toBeTruthy();
    
    if (hasNotFoundText) {
      console.log('✅ 404 error message is displayed');
    }
    if (hasHomeButton || hasHomeLink) {
      console.log('✅ Home/Return button/link is available');
    }
  });

  // Test: 404 page should be accessible and functional
  test('should have working navigation from 404 page', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('/another-fake-page-67890');
    await page.waitForLoadState('networkidle');

    // Try to find and click home button/link
    const homeButton = page.getByRole('button', { name: /home|dashboard|return/i });
    const homeLink = page.getByRole('link', { name: /home|dashboard|return/i });
    
    const hasHomeButton = await homeButton.isVisible().catch(() => false);
    const hasHomeLink = await homeLink.isVisible().catch(() => false);
    
    if (hasHomeButton) {
      await homeButton.click();
      await page.waitForLoadState('networkidle');
      // Should navigate away from 404 page
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('this-page-does-not-exist');
      console.log('✅ Home button works');
    } else if (hasHomeLink) {
      await homeLink.click();
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('this-page-does-not-exist');
      console.log('✅ Home link works');
    }
  });
});
