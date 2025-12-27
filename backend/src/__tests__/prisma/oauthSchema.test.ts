/**
 * Tests for OAuth schema changes
 * 
 * These tests verify that the User model supports OAuth fields
 * and that unique constraints work correctly.
 */

import { prisma } from '../../config/database';

describe('OAuth Schema', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should create user with OAuth provider fields', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'oauth@example.com',
        password: 'hashed-password',
        oauthProvider: 'google',
        oauthProviderId: 'google-user-123',
        oauthEmail: 'oauth@example.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    expect(user.oauthProvider).toBe('google');
    expect(user.oauthProviderId).toBe('google-user-123');
    expect(user.oauthEmail).toBe('oauth@example.com');
    expect(user.emailVerified).toBe(true);
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('should allow user without OAuth fields (traditional email/password)', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'traditional@example.com',
        password: 'hashed-password',
      },
    });

    expect(user.oauthProvider).toBeNull();
    expect(user.oauthProviderId).toBeNull();
    expect(user.oauthEmail).toBeNull();
    expect(user.emailVerified).toBe(false);
    expect(user.emailVerifiedAt).toBeNull();
  });

  it('should enforce unique constraint on oauthProvider + oauthProviderId', async () => {
    // Create first user with Google OAuth
    await prisma.user.create({
      data: {
        email: 'user1@example.com',
        password: 'hashed-password',
        oauthProvider: 'google',
        oauthProviderId: 'google-user-123',
      },
    });

    // Try to create another user with same provider + providerId (should fail)
    await expect(
      prisma.user.create({
        data: {
          email: 'user2@example.com',
          password: 'hashed-password',
          oauthProvider: 'google',
          oauthProviderId: 'google-user-123',
        },
      })
    ).rejects.toThrow();
  });

  it('should allow same oauthProviderId for different providers', async () => {
    // Create user with Google OAuth
    await prisma.user.create({
      data: {
        email: 'google@example.com',
        password: 'hashed-password',
        oauthProvider: 'google',
        oauthProviderId: 'user-123',
      },
    });

    // Create user with GitHub OAuth (same providerId, different provider - should work)
    const githubUser = await prisma.user.create({
      data: {
        email: 'github@example.com',
        password: 'hashed-password',
        oauthProvider: 'github',
        oauthProviderId: 'user-123',
      },
    });

    expect(githubUser.oauthProvider).toBe('github');
    expect(githubUser.oauthProviderId).toBe('user-123');
  });

  it('should allow multiple users with null oauthProvider', async () => {
    // Create multiple traditional users (no OAuth)
    const user1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        password: 'hashed-password',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        password: 'hashed-password',
      },
    });

    expect(user1.oauthProvider).toBeNull();
    expect(user2.oauthProvider).toBeNull();
  });

  it('should support emailVerified field for OAuth users', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'verified@example.com',
        password: 'hashed-password',
        oauthProvider: 'google',
        oauthProviderId: 'google-verified-123',
        emailVerified: true,
        emailVerifiedAt: new Date('2024-01-01'),
      },
    });

    expect(user.emailVerified).toBe(true);
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });
});

