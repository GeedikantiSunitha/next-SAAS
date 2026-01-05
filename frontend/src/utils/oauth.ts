/**
 * OAuth Utility Functions
 * 
 * Handles OAuth token retrieval from different providers
 * Uses redirect-based OAuth flows for all providers
 */

export type OAuthProvider = 'google' | 'github' | 'microsoft';

export interface OAuthTokenResult {
  token: string;
  provider: OAuthProvider;
}

/**
 * Initiate Google OAuth flow
 * 
 * Redirects to Google OAuth authorization page
 */
export const initiateGoogleOAuth = (): void => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/oauth/google/callback`;

  if (!clientId) {
    throw new Error('Google Client ID not configured');
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('google_oauth_state', state);

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'openid email profile',
    state,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Get Google OAuth token from callback URL
 * 
 * Extracts token from URL fragment after Google redirect
 */
export const getGoogleTokenFromCallback = (): OAuthTokenResult | null => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    throw new Error(`Google OAuth error: ${error}`);
  }

  // Verify state
  const storedState = sessionStorage.getItem('google_oauth_state');
  if (state !== storedState) {
    throw new Error('Invalid OAuth state');
  }

  if (!accessToken) {
    return null;
  }

  // Clean up
  sessionStorage.removeItem('google_oauth_state');

  return {
    token: accessToken,
    provider: 'google',
  };
};

/**
 * Initiate GitHub OAuth flow
 * 
 * Redirects to GitHub OAuth authorization page
 */
export const initiateGitHubOAuth = (): void => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = `${window.location.origin}/oauth/github/callback`;

  if (!clientId) {
    throw new Error('GitHub Client ID not configured');
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('github_oauth_state', state);

  // Build GitHub OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:email',
    state,
  });

  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/**
 * Get GitHub authorization code from callback URL
 * 
 * GitHub uses authorization code flow, so we get a code that needs to be exchanged for a token
 */
export const getGitHubCodeFromCallback = (): { code: string; state: string } | null => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    throw new Error(`GitHub OAuth error: ${error}`);
  }

  // Verify state
  const storedState = sessionStorage.getItem('github_oauth_state');
  if (state !== storedState) {
    throw new Error('Invalid OAuth state');
  }

  if (!code) {
    return null;
  }

  // Clean up
  sessionStorage.removeItem('github_oauth_state');

  return {
    code,
    state: state!,
  };
};

/**
 * Exchange GitHub authorization code for access token
 * 
 * Calls backend endpoint to exchange code for token
 * This is imported from authApi to use the same API client
 */

/**
 * Initiate Microsoft OAuth flow
 * 
 * Redirects to Microsoft OAuth authorization page
 */
export const initiateMicrosoftOAuth = (): void => {
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
  const redirectUri = `${window.location.origin}/oauth/microsoft/callback`;
  const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common';

  if (!clientId) {
    throw new Error('Microsoft Client ID not configured');
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('microsoft_oauth_state', state);

  // Build Microsoft OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    response_mode: 'fragment',
    scope: 'openid profile email',
    state,
  });

  window.location.href = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
};

/**
 * Get Microsoft OAuth token from callback URL
 * 
 * Extracts token from URL fragment after Microsoft redirect
 */
export const getMicrosoftTokenFromCallback = (): OAuthTokenResult | null => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    throw new Error(`Microsoft OAuth error: ${error}`);
  }

  // Verify state
  const storedState = sessionStorage.getItem('microsoft_oauth_state');
  if (state !== storedState) {
    throw new Error('Invalid OAuth state');
  }

  if (!accessToken) {
    return null;
  }

  // Clean up
  sessionStorage.removeItem('microsoft_oauth_state');

  return {
    token: accessToken,
    provider: 'microsoft',
  };
};

/**
 * Initiate OAuth flow for a specific provider
 */
export const initiateOAuth = (provider: OAuthProvider): void => {
  switch (provider) {
    case 'google':
      initiateGoogleOAuth();
      break;
    case 'github':
      initiateGitHubOAuth();
      break;
    case 'microsoft':
      initiateMicrosoftOAuth();
      break;
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
};
