/**
 * Auth Service MFA Login Tests (TDD)
 * 
 * Tests for MFA requirement during login
 */

import { prisma } from '../../config/database';
import * as authService from '../../services/authService';
import * as mfaService from '../../services/mfaService';

// Mock MFA service
jest.mock('../../services/mfaService');

describe('Auth Service - MFA Login', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.mfaMethod.deleteMany();
    jest.clearAllMocks();
  });

  it('should return requiresMfa when user has enabled MFA', async () => {
    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '$2b$10$hashedpassword', // Mock hashed password
        name: 'Test User',
        role: 'USER',
      },
    });

    // Create enabled MFA method
    await prisma.mfaMethod.create({
      data: {
        userId: user.id,
        method: 'TOTP',
        secret: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        isPrimary: true,
      },
    });

    // Mock password verification
    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    // Mock getMfaMethods to return enabled method
    (mfaService.getMfaMethods as jest.Mock).mockResolvedValue([
      {
        id: '1',
        method: 'TOTP' as const,
        isEnabled: true,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Attempt login
    const result = await authService.login('test@example.com', 'password123');

    // Should return requiresMfa flag
    expect(result.requiresMfa).toBe(true);
    expect(result.mfaMethod).toBe('TOTP');
  });

  it('should not return requiresMfa when user has no MFA enabled', async () => {
    // Create user without MFA
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '$2b$10$hashedpassword',
        name: 'Test User',
        role: 'USER',
      },
    });

    // Mock password verification
    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    // Mock getMfaMethods to return empty array
    (mfaService.getMfaMethods as jest.Mock).mockResolvedValue([]);

    // Attempt login
    const result = await authService.login('test@example.com', 'password123');

    // Should not require MFA
    expect(result.requiresMfa).toBe(false);
    expect(result.mfaMethod).toBeUndefined();
  });

  it('should return primary MFA method when multiple methods enabled', async () => {
    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '$2b$10$hashedpassword',
        name: 'Test User',
        role: 'USER',
      },
    });

    // Create multiple MFA methods
    await prisma.mfaMethod.create({
      data: {
        userId: user.id,
        method: 'TOTP',
        secret: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        isPrimary: false,
      },
    });

    await prisma.mfaMethod.create({
      data: {
        userId: user.id,
        method: 'EMAIL',
        isEnabled: true,
        isPrimary: true,
      },
    });

    // Mock password verification
    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    // Mock getMfaMethods
    (mfaService.getMfaMethods as jest.Mock).mockResolvedValue([
      {
        id: '1',
        method: 'TOTP' as const,
        isEnabled: true,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        method: 'EMAIL' as const,
        isEnabled: true,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Attempt login
    const result = await authService.login('test@example.com', 'password123');

    // Should return primary method
    expect(result.requiresMfa).toBe(true);
    expect(result.mfaMethod).toBe('EMAIL');
  });
});
