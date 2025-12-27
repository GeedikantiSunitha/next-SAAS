import { prisma } from '../../config/database';
import * as oauthService from '../../services/oauthService';
import { createTestUser } from '../../tests/setup';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';

describe('OAuth Service', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('createOrUpdateUserFromOAuth', () => {
    it('should create new user from Google OAuth profile', async () => {
      const profile = {
        id: 'google-user-123',
        emails: [{ value: 'google@example.com', verified: true }],
        displayName: 'Google User',
        provider: 'google',
      };

      const user = await oauthService.createOrUpdateUserFromOAuth('google', profile);

      expect(user.email).toBe('google@example.com');
      expect(user.oauthProvider).toBe('google');
      expect(user.oauthProviderId).toBe('google-user-123');
      expect(user.oauthEmail).toBe('google@example.com');
      expect(user.emailVerified).toBe(true);
      expect(user.name).toBe('Google User');
      // Password is not returned in select (security)
    });

    it('should create new user from GitHub OAuth profile', async () => {
      const profile = {
        id: 'github-user-456',
        emails: [{ value: 'github@example.com', verified: true }],
        username: 'githubuser',
        displayName: 'GitHub User',
        provider: 'github',
      };

      const user = await oauthService.createOrUpdateUserFromOAuth('github', profile);

      expect(user.email).toBe('github@example.com');
      expect(user.oauthProvider).toBe('github');
      expect(user.oauthProviderId).toBe('github-user-456');
      expect(user.oauthEmail).toBe('github@example.com');
      expect(user.emailVerified).toBe(true);
    });

    it('should update existing OAuth user if same provider and providerId', async () => {
      // Create existing OAuth user
      const existingUser = await prisma.user.create({
        data: {
          email: 'existing@example.com',
          oauthProvider: 'google',
          oauthProviderId: 'google-user-123',
          oauthEmail: 'existing@example.com',
          name: 'Old Name',
        },
      });

      const profile = {
        id: 'google-user-123',
        emails: [{ value: 'updated@example.com', verified: true }],
        displayName: 'Updated Name',
        provider: 'google',
      };

      const user = await oauthService.createOrUpdateUserFromOAuth('google', profile);

      expect(user.id).toBe(existingUser.id);
      expect(user.email).toBe('updated@example.com');
      expect(user.name).toBe('Updated Name');
      expect(user.oauthEmail).toBe('updated@example.com');
    });

    it('should throw ConflictError if email exists but with different OAuth provider', async () => {
      // Create user with Google OAuth
      await prisma.user.create({
        data: {
          email: 'conflict@example.com',
          oauthProvider: 'google',
          oauthProviderId: 'google-123',
          oauthEmail: 'conflict@example.com',
        },
      });

      // Try to create user with GitHub OAuth but same email
      const profile = {
        id: 'github-456',
        emails: [{ value: 'conflict@example.com', verified: true }],
        displayName: 'GitHub User',
        provider: 'github',
      };

      await expect(
        oauthService.createOrUpdateUserFromOAuth('github', profile)
      ).rejects.toThrow(ConflictError);
    });

    it('should handle profile without verified email', async () => {
      const profile = {
        id: 'google-unverified-123',
        emails: [{ value: 'unverified@example.com', verified: false }],
        displayName: 'Unverified User',
        provider: 'google',
      };

      const user = await oauthService.createOrUpdateUserFromOAuth('google', profile);

      expect(user.email).toBe('unverified@example.com');
      expect(user.emailVerified).toBe(false);
      expect(user.emailVerifiedAt).toBeNull();
    });

    it('should handle profile without displayName', async () => {
      const profile = {
        id: 'google-no-name-123',
        emails: [{ value: 'noname@example.com', verified: true }],
        provider: 'google',
      };

      const user = await oauthService.createOrUpdateUserFromOAuth('google', profile);

      expect(user.email).toBe('noname@example.com');
      expect(user.name).toBeNull();
    });
  });

  describe('linkOAuthToUser', () => {
    it('should link OAuth provider to existing user account', async () => {
      const user = await createTestUser({
        email: 'existing@example.com',
        name: 'Existing User',
      });

      const profile = {
        id: 'google-link-123',
        emails: [{ value: 'google@example.com', verified: true }],
        displayName: 'Google Name',
        provider: 'google',
      };

      const updatedUser = await oauthService.linkOAuthToUser(user.id, 'google', profile);

      expect(updatedUser.oauthProvider).toBe('google');
      expect(updatedUser.oauthProviderId).toBe('google-link-123');
      expect(updatedUser.oauthEmail).toBe('google@example.com');
      expect(updatedUser.email).toBe('existing@example.com'); // Original email preserved
    });

    it('should throw NotFoundError if user does not exist', async () => {
      const profile = {
        id: 'google-123',
        emails: [{ value: 'test@example.com', verified: true }],
        displayName: 'Test',
        provider: 'google',
      };

      await expect(
        oauthService.linkOAuthToUser('non-existent-id', 'google', profile)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if OAuth provider already linked to another user', async () => {
      // Create user with Google OAuth
      await prisma.user.create({
        data: {
          email: 'google@example.com',
          oauthProvider: 'google',
          oauthProviderId: 'google-123',
        },
      });

      // Create another user
      const user = await createTestUser({
        email: 'other@example.com',
      });

      const profile = {
        id: 'google-123', // Same providerId
        emails: [{ value: 'test@example.com', verified: true }],
        displayName: 'Test',
        provider: 'google',
      };

      await expect(
        oauthService.linkOAuthToUser(user.id, 'google', profile)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('unlinkOAuthFromUser', () => {
    it('should unlink OAuth provider from user account', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'oauth@example.com',
          oauthProvider: 'google',
          oauthProviderId: 'google-123',
          oauthEmail: 'oauth@example.com',
        },
      });

      const updatedUser = await oauthService.unlinkOAuthFromUser(user.id, 'google');

      expect(updatedUser.oauthProvider).toBeNull();
      expect(updatedUser.oauthProviderId).toBeNull();
      expect(updatedUser.oauthEmail).toBeNull();
    });

    it('should throw NotFoundError if user does not exist', async () => {
      await expect(
        oauthService.unlinkOAuthFromUser('non-existent-id', 'google')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if OAuth provider is not linked', async () => {
      const user = await createTestUser({
        email: 'no-oauth@example.com',
      });

      await expect(
        oauthService.unlinkOAuthFromUser(user.id, 'google')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getUserOAuthMethods', () => {
    it('should return linked OAuth methods for user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'multi-oauth@example.com',
          oauthProvider: 'google',
          oauthProviderId: 'google-123',
          oauthEmail: 'multi-oauth@example.com',
        },
      });

      const methods = await oauthService.getUserOAuthMethods(user.id);

      expect(methods).toContain('google');
      expect(methods.length).toBe(1);
    });

    it('should return empty array if no OAuth methods linked', async () => {
      const user = await createTestUser({
        email: 'no-oauth@example.com',
      });

      const methods = await oauthService.getUserOAuthMethods(user.id);

      expect(methods).toEqual([]);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      await expect(
        oauthService.getUserOAuthMethods('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });
});

