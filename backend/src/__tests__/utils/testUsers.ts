/**
 * Test User Creation Utilities
 * 
 * Provides consistent helpers for creating test users in E2E and integration tests.
 * Ensures password hashing is handled correctly.
 */

import { prisma } from '../../config/database';
import { createTestUser } from '../../tests/setup';

/**
 * Create a test user with a plain password (will be hashed automatically)
 * 
 * @param email - User email address
 * @param plainPassword - Plain text password (will be hashed)
 * @param overrides - Additional user fields to override defaults
 * @returns Created user from database
 * 
 * @example
 * ```typescript
 * const user = await createTestUserWithPassword(
 *   'test@example.com',
 *   'Password123!',
 *   { name: 'Test User', role: 'ADMIN' }
 * );
 * ```
 */
export const createTestUserWithPassword = async (
  email: string,
  plainPassword: string,
  overrides?: {
    name?: string;
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    [key: string]: any;
  }
) => {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  
  return createTestUser({
    email,
    password: hashedPassword,
    name: overrides?.name || 'Test User',
    role: overrides?.role || 'USER',
    ...overrides,
  });
};

/**
 * Create a test admin user with a plain password
 * 
 * @param email - Admin email address
 * @param plainPassword - Plain text password (will be hashed)
 * @param overrides - Additional user fields to override defaults
 * @returns Created admin user from database
 */
export const createTestAdminWithPassword = async (
  email: string,
  plainPassword: string,
  overrides?: {
    name?: string;
    role?: 'ADMIN' | 'SUPER_ADMIN';
    [key: string]: any;
  }
) => {
  return createTestUserWithPassword(email, plainPassword, {
    role: overrides?.role || 'ADMIN',
    ...overrides,
  });
};

/**
 * Create multiple test users at once
 * 
 * @param count - Number of users to create
 * @param baseEmail - Base email (will append index)
 * @param basePassword - Password for all users
 * @returns Array of created users
 */
export const createMultipleTestUsers = async (
  count: number,
  baseEmail: string = 'test',
  basePassword: string = 'Password123!'
) => {
  const users = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUserWithPassword(
      `${baseEmail}-${timestamp}-${i}@example.com`,
      basePassword,
      { name: `Test User ${i}` }
    );
    users.push(user);
  }
  
  return users;
};

/**
 * Clean up test users by email pattern
 * 
 * @param emailPattern - Email pattern to match (e.g., 'test-', 'mfa-e2e-')
 */
export const cleanupTestUsers = async (emailPattern: string) => {
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: emailPattern,
      },
    },
  });
};

// Jest requires at least one test in test files
// This file contains utility functions for tests, not actual tests
describe('Test User Utilities', () => {
  it('should export test user utility functions', () => {
    expect(createTestUserWithPassword).toBeDefined();
    expect(createTestAdminWithPassword).toBeDefined();
    expect(createMultipleTestUsers).toBeDefined();
    expect(cleanupTestUsers).toBeDefined();
  });
});
