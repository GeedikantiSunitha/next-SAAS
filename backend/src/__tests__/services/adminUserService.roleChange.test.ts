/**
 * Admin User Service - Role Change Permission Tests (TDD)
 * 
 * Tests to verify only SUPER_ADMIN can change user roles
 */

import { updateUser } from '../../services/adminUserService';
import { prisma } from '../../config/database';
import { ForbiddenError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../services/auditService', () => ({
  createAuditLog: jest.fn(),
}));

describe('AdminUserService - Role Change Permissions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow SUPER_ADMIN to change user role', async () => {
    const superAdmin = {
      id: 'admin-123',
      role: 'SUPER_ADMIN',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockUser) // Target user
      .mockResolvedValueOnce(superAdmin); // Admin user

    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'ADMIN',
    });

    const result = await updateUser(
      mockUser.id,
      { role: 'ADMIN' },
      superAdmin.id
    );

    expect(result.user.role).toBe('ADMIN');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('should prevent ADMIN from changing user role', async () => {
    const admin = {
      id: 'admin-123',
      role: 'ADMIN',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockUser) // Target user
      .mockResolvedValueOnce(admin); // Admin user

    await expect(
      updateUser(mockUser.id, { role: 'ADMIN' }, admin.id)
    ).rejects.toThrow(ForbiddenError);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should prevent user from changing their own role', async () => {
    const superAdmin = {
      id: 'admin-123',
      role: 'SUPER_ADMIN',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(superAdmin) // Target user (same as admin)
      .mockResolvedValueOnce(superAdmin); // Admin user

    await expect(
      updateUser(superAdmin.id, { role: 'USER' }, superAdmin.id)
    ).rejects.toThrow(ForbiddenError);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should allow ADMIN to update other fields (name, email) even if role is not SUPER_ADMIN', async () => {
    const admin = {
      id: 'admin-123',
      role: 'ADMIN',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockUser) // Target user
      .mockResolvedValueOnce(admin); // Admin user

    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockUser,
      name: 'Updated Name',
    });

    const result = await updateUser(
      mockUser.id,
      { name: 'Updated Name' },
      admin.id
    );

    expect(result.user.name).toBe('Updated Name');
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
