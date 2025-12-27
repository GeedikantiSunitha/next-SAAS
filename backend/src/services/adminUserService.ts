/**
 * Admin User Management Service
 * 
 * Business logic for admin user management operations
 */

import { prisma } from '../config/database';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../utils/errors';
import { hashPassword } from './authService';
import { shouldRejectPassword } from '../utils/passwordStrength';
import { createAuditLog } from './auditService';
import logger from '../utils/logger';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive?: boolean;
  password?: string;
}

/**
 * List users with pagination and filters
 */
export const listUsers = async (params: ListUsersParams, adminUserId: string) => {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100); // Max 100 per page
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (params.search) {
    where.OR = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { name: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.role) {
    where.role = params.role;
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  // Get users and total count
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        oauthProvider: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Log audit trail
  await createAuditLog({
    userId: adminUserId,
    action: 'USERS_LISTED',
    resource: 'users',
    details: { filters: params },
  });

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user details by ID
 */
export const getUserById = async (userId: string, adminUserId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      oauthProvider: true,
      oauthEmail: true,
      emailVerified: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          sessions: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Log audit trail
  await createAuditLog({
    userId: adminUserId,
    action: 'USER_VIEWED',
    resource: 'users',
    resourceId: userId,
  });

  return { user };
};

/**
 * Create a new user
 */
export const createUser = async (data: CreateUserData, adminUserId: string) => {
  // Validate email
  if (!data.email || !data.email.includes('@')) {
    throw new ValidationError('Valid email is required');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Validate password strength
  if (shouldRejectPassword(data.password)) {
    throw new ValidationError('Password is too weak. Please use a stronger password.');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'USER',
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
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

  // Log audit trail
  await createAuditLog({
    userId: adminUserId,
    action: 'USER_CREATED',
    resource: 'users',
    resourceId: user.id,
    details: { email: user.email, role: user.role },
  });

  logger.info('User created by admin', {
    userId: user.id,
    createdBy: adminUserId,
    email: user.email,
  });

  return { user };
};

/**
 * Update user
 */
export const updateUser = async (
  userId: string,
  data: UpdateUserData,
  adminUserId: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Build update data
  const updateData: any = {};

  if (data.email !== undefined) {
    // Check if email is already taken by another user
    if (data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new ConflictError('Email is already taken');
      }
      updateData.email = data.email;
    }
  }

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.role !== undefined) {
    updateData.role = data.role;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  if (data.password !== undefined) {
    // Validate password strength
    if (shouldRejectPassword(data.password)) {
      throw new ValidationError('Password is too weak. Please use a stronger password.');
    }
    updateData.password = await hashPassword(data.password);
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

  // Log audit trail
  await createAuditLog({
    userId: adminUserId,
    action: 'USER_UPDATED',
    resource: 'users',
    resourceId: userId,
    details: { changes: Object.keys(updateData) },
  });

  logger.info('User updated by admin', {
    userId,
    updatedBy: adminUserId,
    changes: Object.keys(updateData),
  });

  return { user: updatedUser };
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string, adminUserId: string) => {
  // Prevent admin from deleting themselves
  if (userId === adminUserId) {
    throw new ForbiddenError('You cannot delete your own account');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id: userId },
  });

  // Log audit trail
  await createAuditLog({
    userId: adminUserId,
    action: 'USER_DELETED',
    resource: 'users',
    resourceId: userId,
    details: { email: user.email },
  });

  logger.info('User deleted by admin', {
    deletedUserId: userId,
    deletedBy: adminUserId,
    email: user.email,
  });

  return { success: true };
};

/**
 * Get user sessions
 */
export const getUserSessions = async (userId: string, adminUserId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  // Log audit trail
  await createAuditLog({
    userId: adminUserId,
    action: 'USER_SESSIONS_VIEWED',
    resource: 'users',
    resourceId: userId,
  });

  return { sessions };
};

/**
 * Revoke user session
 */
export const revokeUserSession = async (
  userId: string,
  sessionId: string,
  adminUserId: string
) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ValidationError('Session does not belong to this user');
  }

  // Delete session
  await prisma.session.delete({
    where: { id: sessionId },
  });

  // Log audit trail
  await createAuditLog({
    userId: adminUserId,
    action: 'USER_SESSION_REVOKED',
    resource: 'users',
    resourceId: userId,
    details: { sessionId },
  });

  logger.info('User session revoked by admin', {
    userId,
    sessionId,
    revokedBy: adminUserId,
  });

  return { success: true };
};

/**
 * Get user activity log
 */
export const getUserActivity = async (
  userId: string,
  params: { page?: number; limit?: number },
  adminUserId: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;

  const [activity, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        ipAddress: true,
        userAgent: true,
        details: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where: { userId } }),
  ]);

  // Log audit trail
  await createAuditLog({
    userId: adminUserId,
    action: 'USER_ACTIVITY_VIEWED',
    resource: 'users',
    resourceId: userId,
  });

  return {
    activity,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

