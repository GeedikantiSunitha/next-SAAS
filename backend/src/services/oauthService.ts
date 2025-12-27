import { prisma } from '../config/database';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export type OAuthProvider = 'google' | 'github' | 'microsoft';

export interface OAuthProfile {
  id: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  displayName?: string;
  username?: string;
  provider: string;
  [key: string]: any;
}

/**
 * Create or update user from OAuth profile
 */
export const createOrUpdateUserFromOAuth = async (
  provider: OAuthProvider,
  profile: OAuthProfile
): Promise<any> => {
  const providerId = profile.id;
  const email = profile.emails?.[0]?.value;
  const emailVerified = profile.emails?.[0]?.verified ?? false;
  const name = profile.displayName || profile.username || null;

  if (!email) {
    throw new ValidationError('OAuth profile must include an email address');
  }

  // Check if user exists with same provider + providerId
  const existingOAuthUser = await prisma.user.findUnique({
    where: {
      oauthProvider_oauthProviderId: {
        oauthProvider: provider,
        oauthProviderId: providerId,
      },
    },
  });

  if (existingOAuthUser) {
    // Update existing OAuth user
    const updatedUser = await prisma.user.update({
      where: { id: existingOAuthUser.id },
      data: {
        email,
        oauthEmail: email,
        name: name || existingOAuthUser.name,
        emailVerified,
        emailVerifiedAt: emailVerified ? new Date() : existingOAuthUser.emailVerifiedAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        oauthProvider: true,
        oauthProviderId: true,
        oauthEmail: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    logger.info('OAuth user updated', {
      userId: updatedUser.id,
      provider,
      email: updatedUser.email,
    });

    return updatedUser;
  }

  // Check if email already exists with different OAuth provider or traditional account
  const existingEmailUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmailUser) {
    // Email exists but with different provider or traditional account
    throw new ConflictError(
      'An account with this email already exists. Please link this OAuth provider to your existing account instead.'
    );
  }

  // Create new OAuth user
  const newUser = await prisma.user.create({
    data: {
      email,
      oauthProvider: provider,
      oauthProviderId: providerId,
      oauthEmail: email,
      name,
      emailVerified,
      emailVerifiedAt: emailVerified ? new Date() : null,
      // OAuth users don't have passwords
      password: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      oauthProvider: true,
      oauthProviderId: true,
      oauthEmail: true,
      emailVerified: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  logger.info('OAuth user created', {
    userId: newUser.id,
    provider,
    email: newUser.email,
  });

  return newUser;
};

/**
 * Link OAuth provider to existing user account
 */
export const linkOAuthToUser = async (
  userId: string,
  provider: OAuthProvider,
  profile: OAuthProfile
): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const providerId = profile.id;
  const oauthEmail = profile.emails?.[0]?.value || null;

  // Check if this OAuth provider is already linked to another user
  const existingLink = await prisma.user.findUnique({
    where: {
      oauthProvider_oauthProviderId: {
        oauthProvider: provider,
        oauthProviderId: providerId,
      },
    },
  });

  if (existingLink && existingLink.id !== userId) {
    throw new ConflictError('This OAuth account is already linked to another user');
  }

  // Link OAuth provider to user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      oauthProvider: provider,
      oauthProviderId: providerId,
      oauthEmail,
      // If email is verified via OAuth, mark as verified
      emailVerified: profile.emails?.[0]?.verified ? true : user.emailVerified,
      emailVerifiedAt: profile.emails?.[0]?.verified ? new Date() : user.emailVerifiedAt,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      oauthProvider: true,
      oauthProviderId: true,
      oauthEmail: true,
      emailVerified: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  logger.info('OAuth provider linked to user', {
    userId,
    provider,
    email: updatedUser.email,
  });

  return updatedUser;
};

/**
 * Unlink OAuth provider from user account
 */
export const unlinkOAuthFromUser = async (
  userId: string,
  provider: OAuthProvider
): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.oauthProvider !== provider) {
    throw new ValidationError(`OAuth provider '${provider}' is not linked to this account`);
  }

  // Unlink OAuth provider
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      oauthProvider: null,
      oauthProviderId: null,
      oauthEmail: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      oauthProvider: true,
      oauthProviderId: true,
      oauthEmail: true,
      emailVerified: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  logger.info('OAuth provider unlinked from user', {
    userId,
    provider,
    email: updatedUser.email,
  });

  return updatedUser;
};

/**
 * Get user's linked OAuth methods
 */
export const getUserOAuthMethods = async (userId: string): Promise<OAuthProvider[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      oauthProvider: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user.oauthProvider ? [user.oauthProvider as OAuthProvider] : [];
};

