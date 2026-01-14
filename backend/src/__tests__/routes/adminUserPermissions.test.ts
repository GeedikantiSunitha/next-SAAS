/**
 * Admin User Permissions Tests (TDD)
 * 
 * Focused unit tests to verify admin user update permissions
 * Following TDD approach: write test → fix → verify
 */

import { prisma } from '../../config/database';
import * as adminUserService from '../../services/adminUserService';
import { ForbiddenError } from '../../utils/errors';
import bcrypt from 'bcryptjs';

jest.setTimeout(10000);

describe('Admin User Update Permissions', () => {
  let adminUser: any;
  let superAdminUser: any;
  let regularUser: any;

  beforeEach(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user (ADMIN role)
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    adminUser = await prisma.user.create({
      data: {
        email: `admin-perm-${Date.now()}@example.com`,
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    // Create super admin user (SUPER_ADMIN role)
    const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
    superAdminUser = await prisma.user.create({
      data: {
        email: `superadmin-perm-${Date.now()}@example.com`,
        password: superAdminPassword,
        name: 'Super Admin User',
        role: 'SUPER_ADMIN',
      },
    });

    // Create regular user (USER role)
    const userPassword = await bcrypt.hash('User123!', 10);
    regularUser = await prisma.user.create({
      data: {
        email: `user-perm-${Date.now()}@example.com`,
        password: userPassword,
        name: 'Regular User',
        role: 'USER',
      },
    });
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should verify ADMIN can update user name (non-role change)', async () => {
    // ADMIN should be able to update non-role fields
    const result = await adminUserService.updateUser(
      regularUser.id,
      { name: 'Updated Name' },
      adminUser.id
    );

    expect(result.user.name).toBe('Updated Name');
    expect(result.user.role).toBe(regularUser.role); // Role unchanged
  });

  it('should verify ADMIN can update user email', async () => {
    const newEmail = `updated-${Date.now()}@example.com`;
    
    const result = await adminUserService.updateUser(
      regularUser.id,
      { email: newEmail },
      adminUser.id
    );

    expect(result.user.email).toBe(newEmail);
  });

  it('should verify ADMIN can update user isActive status', async () => {
    const result = await adminUserService.updateUser(
      regularUser.id,
      { isActive: false },
      adminUser.id
    );

    expect(result.user.isActive).toBe(false);
  });

  it('should verify ADMIN can update user password', async () => {
    const newPassword = 'NewPassword123!';
    
    await adminUserService.updateUser(
      regularUser.id,
      { password: newPassword },
      adminUser.id
    );

    // Verify password was updated by checking if we can login with new password
    const updatedUser = await prisma.user.findUnique({
      where: { id: regularUser.id },
    });
    
    expect(updatedUser).toBeDefined();
    const isValid = await bcrypt.compare(newPassword, updatedUser!.password!);
    expect(isValid).toBe(true);
  });

  it('should verify ADMIN CANNOT change user role (requires SUPER_ADMIN)', async () => {
    // ADMIN trying to change role should throw ForbiddenError
    await expect(
      adminUserService.updateUser(
        regularUser.id,
        { role: 'ADMIN' }, // Trying to change role
        adminUser.id // ADMIN user (not SUPER_ADMIN)
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it('should verify SUPER_ADMIN CAN change user role', async () => {
    // SUPER_ADMIN should be able to change roles
    const result = await adminUserService.updateUser(
      regularUser.id,
      { role: 'ADMIN' },
      superAdminUser.id // SUPER_ADMIN user
    );

    expect(result.user.role).toBe('ADMIN');
  });

  it('should verify SUPER_ADMIN cannot change own role', async () => {
    // SUPER_ADMIN trying to change own role should throw ForbiddenError
    await expect(
      adminUserService.updateUser(
        superAdminUser.id,
        { role: 'USER' }, // Trying to change own role
        superAdminUser.id // Same user
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it('should verify test admin user has ADMIN role', async () => {
    // Verify admin user created in test has correct role
    const user = await prisma.user.findUnique({
      where: { id: adminUser.id },
      select: { role: true },
    });

    expect(user?.role).toBe('ADMIN');
  });

  it('should verify test super admin user has SUPER_ADMIN role', async () => {
    // Verify super admin user created in test has correct role
    const user = await prisma.user.findUnique({
      where: { id: superAdminUser.id },
      select: { role: true },
    });

    expect(user?.role).toBe('SUPER_ADMIN');
  });
});

describe('Admin User Test Setup Pattern', () => {
  it('should verify createTestAdmin creates ADMIN role user', async () => {
    // Import createTestAdmin helper
    const { createTestAdmin } = await import('../../tests/setup');
    
    // Clean up
    await prisma.user.deleteMany({});
    
    // Create admin using helper
    const admin = await createTestAdmin({
      email: 'test-admin-helper@example.com',
    });

    // Verify role is ADMIN
    expect(admin.role).toBe('ADMIN');
    
    // Cleanup
    await prisma.user.deleteMany({});
  });

  it('should verify test needs SUPER_ADMIN to change roles', async () => {
    // Test should use SUPER_ADMIN user when testing role changes
    // OR test should not change roles when using ADMIN user
    
    const { createTestAdmin } = await import('../../tests/setup');
    const { createTestUser } = await import('../../tests/setup');
    
    await prisma.user.deleteMany({});
    
    // Create ADMIN user (not SUPER_ADMIN)
    const admin = await createTestAdmin({
      email: 'admin-no-role-change@example.com',
    });
    expect(admin.role).toBe('ADMIN'); // Verify it's ADMIN, not SUPER_ADMIN
    
    // Create regular user
    const user = await createTestUser({
      email: 'test-user-role@example.com',
    });
    
    // ADMIN should NOT be able to change role
    await expect(
      adminUserService.updateUser(user.id, { role: 'ADMIN' }, admin.id)
    ).rejects.toThrow(ForbiddenError);
    
    // But ADMIN should be able to update other fields
    const result = await adminUserService.updateUser(
      user.id,
      { name: 'Updated Name' },
      admin.id
    );
    expect(result.user.name).toBe('Updated Name');
    
    await prisma.user.deleteMany({});
  });
});
