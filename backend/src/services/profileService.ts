/**
 * Profile Service
 * Business logic for user profile management
 */

import { prisma } from '../config/database';
import { NotFoundError, ConflictError, UnauthorizedError, ValidationError, ForbiddenError } from '../utils/errors';
import { hashPassword, comparePassword } from './authService';
import { shouldRejectPassword, checkPasswordStrength } from '../utils/passwordStrength';
import { createAuditLog } from './auditService';
import logger from '../utils/logger';
import { createNotification } from './notificationService';

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: { name?: string; email?: string },
  ipAddress?: string,
  userAgent?: string
) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  // Check if email is being changed and if new email already exists
  if (updates.email && updates.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: updates.email },
    });

    if (emailExists) {
      throw new ConflictError('Email already registered');
    }
  }

  // Prepare update data and track changes for audit log
  const updateData: { name?: string; email?: string } = {};
  const changes: string[] = [];

  if (updates.name !== undefined && updates.name !== existingUser.name) {
    updateData.name = updates.name;
    changes.push(`name: "${existingUser.name}" → "${updates.name}"`);
  }

  if (updates.email !== undefined && updates.email !== existingUser.email) {
    updateData.email = updates.email;
    changes.push(`email: "${existingUser.email}" → "${updates.email}"`);
  }

  // If no changes, return existing user
  if (Object.keys(updateData).length === 0) {
    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role,
      isActive: existingUser.isActive,
      createdAt: existingUser.createdAt,
      updatedAt: existingUser.updatedAt,
    };
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Create audit log for profile update
  await createAuditLog({
    userId: updatedUser.id,
    action: 'PROFILE_UPDATED',
    resource: 'users',
    resourceId: updatedUser.id,
    details: {
      changes: changes,
      previousEmail: existingUser.email,
      newEmail: updatedUser.email,
      previousName: existingUser.name,
      newName: updatedUser.name,
    },
    ipAddress,
    userAgent,
  });

  // Log profile update
  logger.info('User profile updated', {
    userId: updatedUser.id,
    email: updatedUser.email,
    changes: changes,
    ipAddress,
    userAgent,
  });

  // Create notification for profile update (in-app and email when user has email enabled)
  const profileMessage = `Your profile information has been updated. Changes: ${changes.join(', ')}`;
  try {
    await createNotification({
      userId: updatedUser.id,
      type: 'INFO',
      channel: 'IN_APP',
      title: 'Profile Updated',
      message: profileMessage,
      data: {
        action: 'PROFILE_UPDATED',
        changes: changes,
        timestamp: new Date().toISOString(),
      },
    });
    await createNotification({
      userId: updatedUser.id,
      type: 'INFO',
      channel: 'EMAIL',
      title: 'Profile Updated',
      message: profileMessage,
      data: {
        action: 'PROFILE_UPDATED',
        changes: changes,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    // Log error but don't fail profile update
    logger.warn('Failed to create profile update notification', {
      userId: updatedUser.id,
      error: error.message,
    });
  }

  return updatedUser;
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
) => {
  const { isFeatureEnabled } = await import('./featureFlagRuntimeService');
  if (!(await isFeatureEnabled('password_reset'))) {
    throw new ForbiddenError('Password reset is currently disabled');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // OAuth users don't have passwords
  if (!user.password) {
    throw new ValidationError('This account uses OAuth login. Password cannot be changed.');
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Check if new password is different from current password (user.password is guaranteed to be non-null here)
  const isSamePassword = await comparePassword(newPassword, user.password!);

  if (isSamePassword) {
    throw new ValidationError('New password must be different from current password');
  }

  // Check password strength (reject WEAK and FAIR)
  if (shouldRejectPassword(newPassword)) {
    const strengthResult = checkPasswordStrength(newPassword);
    throw new ValidationError(
      `Password is too weak. ${strengthResult.feedback.join(' ')}`
    );
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Create audit log for password change
  await createAuditLog({
    userId: user.id,
    action: 'PASSWORD_CHANGED',
    resource: 'users',
    resourceId: user.id,
    details: {
      changedBy: user.id,
      changedAt: new Date().toISOString(),
    },
    ipAddress,
    userAgent,
  });

  // Log password change
  logger.info('User password changed', {
    userId: user.id,
    email: user.email,
    ipAddress,
    userAgent,
  });

  return { message: 'Password changed successfully' };
};

