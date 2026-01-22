/**
 * AdminUsers Import Test (TDD)
 * 
 * Tests that AdminUsers component can be imported and rendered without errors.
 * This test specifically catches import path errors.
 * 
 * RED Phase: Test should fail if import path is wrong
 * GREEN Phase: Fix import path, test should pass
 */

import { describe, it, expect } from 'vitest';

describe('AdminUsers Import Test', () => {
  it('should import AdminUsers component without errors', async () => {
    // This test will fail if the import path is incorrect
    // The error will be: "Failed to resolve import"
    const AdminUsersModule = await import('../../../pages/admin/AdminUsers');

    expect(AdminUsersModule).toBeDefined();
    expect(AdminUsersModule.AdminUsers).toBeDefined();
    expect(typeof AdminUsersModule.AdminUsers).toBe('function');
  }, 10000); // Increase timeout to 10 seconds for dynamic import

  it('should have correct PasswordStrengthIndicator import path', async () => {
    // Verify that PasswordStrengthIndicator can be imported from correct location
    const PasswordStrengthIndicatorModule = await import('../../../components/PasswordStrengthIndicator');
    
    expect(PasswordStrengthIndicatorModule).toBeDefined();
    expect(PasswordStrengthIndicatorModule.PasswordStrengthIndicator).toBeDefined();
    expect(typeof PasswordStrengthIndicatorModule.PasswordStrengthIndicator).toBe('function');
  });

  it('should use correct import path for PasswordStrengthIndicator in AdminUsers', async () => {
    // Verify that AdminUsers uses correct import path
    // This test will pass if the import path in AdminUsers.tsx is correct
    const AdminUsersModule = await import('../../../pages/admin/AdminUsers');
    
    // If we get here, the import worked (no error)
    expect(AdminUsersModule).toBeDefined();
    expect(AdminUsersModule.AdminUsers).toBeDefined();
  });
});
