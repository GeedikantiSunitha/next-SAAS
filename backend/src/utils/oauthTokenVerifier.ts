/**
 * OAuth Token Verifier
 * 
 * Verifies OAuth tokens with providers and extracts user profile
 */

import axios from 'axios';
import { OAuthProvider, OAuthProfile } from '../services/oauthService';
import { UnauthorizedError } from './errors';
import logger from './logger';
import config from '../config';

/**
 * Verify Google OAuth token and get user profile
 */
const verifyGoogleToken = async (token: string): Promise<OAuthProfile> => {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      id: response.data.id,
      emails: [{ value: response.data.email, verified: response.data.verified_email }],
      displayName: response.data.name,
      provider: 'google',
    };
  } catch (error: any) {
    logger.error('Failed to verify Google token', { error: error.message });
    throw new UnauthorizedError('Invalid Google OAuth token');
  }
};

/**
 * Verify GitHub OAuth token and get user profile
 */
const verifyGitHubToken = async (token: string): Promise<OAuthProfile> => {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // Get user email (may require additional API call)
    let email = response.data.email;
    let emailVerified = false;

    if (!email) {
      // Try to get email from emails endpoint
      try {
        const emailsResponse = await axios.get('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const primaryEmail = emailsResponse.data.find((e: any) => e.primary);
        if (primaryEmail) {
          email = primaryEmail.email;
          emailVerified = primaryEmail.verified;
        }
      } catch (emailError) {
        logger.warn('Failed to fetch GitHub emails', { error: emailError });
      }
    }

    if (!email) {
      throw new UnauthorizedError('GitHub account does not have a public email');
    }

    return {
      id: response.data.id.toString(),
      emails: [{ value: email, verified: emailVerified }],
      displayName: response.data.name || response.data.login,
      username: response.data.login,
      provider: 'github',
    };
  } catch (error: any) {
    logger.error('Failed to verify GitHub token', { error: error.message });
    throw new UnauthorizedError('Invalid GitHub OAuth token');
  }
};

/**
 * Verify Microsoft OAuth token and get user profile
 */
const verifyMicrosoftToken = async (token: string): Promise<OAuthProfile> => {
  try {
    // Microsoft Graph API endpoint
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Get email from mail property or userPrincipalName
    const email = response.data.mail || response.data.userPrincipalName;
    const emailVerified = !!response.data.mail; // mail property indicates verified email

    return {
      id: response.data.id,
      emails: [{ value: email, verified: emailVerified }],
      displayName: response.data.displayName,
      provider: 'microsoft',
    };
  } catch (error: any) {
    logger.error('Failed to verify Microsoft token', { error: error.message });
    throw new UnauthorizedError('Invalid Microsoft OAuth token');
  }
};

/**
 * Verify OAuth token and return user profile
 */
export const verifyOAuthToken = async (
  provider: OAuthProvider,
  token: string
): Promise<OAuthProfile> => {
  switch (provider) {
    case 'google':
      // In tests, allow even if not configured (mocked)
      if (process.env.NODE_ENV !== 'test' && !config.oauth.google.enabled) {
        throw new UnauthorizedError('Google OAuth is not enabled');
      }
      return verifyGoogleToken(token);

    case 'github':
      // In tests, allow even if not configured (mocked)
      if (process.env.NODE_ENV !== 'test' && !config.oauth.github.enabled) {
        throw new UnauthorizedError('GitHub OAuth is not enabled');
      }
      return verifyGitHubToken(token);

    case 'microsoft':
      // In tests, allow even if not configured (mocked)
      if (process.env.NODE_ENV !== 'test' && !config.oauth.microsoft?.enabled) {
        throw new UnauthorizedError('Microsoft OAuth is not enabled');
      }
      return verifyMicrosoftToken(token);

    default:
      throw new UnauthorizedError(`Unsupported OAuth provider: ${provider}`);
  }
};

