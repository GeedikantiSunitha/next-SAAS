# OAuth Setup Guide - Production Configuration

This comprehensive guide will walk you through setting up OAuth authentication for Google, GitHub, and Microsoft (Outlook) in your SaaS template.

## Table of Contents

1. [Overview](#overview)
2. [Google OAuth Setup](#google-oauth-setup)
3. [GitHub OAuth Setup](#github-oauth-setup)
4. [Microsoft OAuth Setup](#microsoft-oauth-setup)
5. [Backend Configuration](#backend-configuration)
6. [Frontend Implementation](#frontend-implementation)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The template supports three OAuth providers:
- **Google** - Using Google Identity Services (GSI)
- **GitHub** - Using GitHub OAuth Apps
- **Microsoft** - Using Microsoft Identity Platform (Azure AD)

All providers use a token-based flow where:
1. Frontend obtains OAuth token from provider
2. Frontend sends token to backend
3. Backend verifies token with provider's API
4. Backend creates/updates user and returns session

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name (e.g., "My SaaS App")
4. Click **"Create"**

### Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have Google Workspace)
3. Fill in required information:
   - **App name**: Your application name
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **"Save and Continue"**
5. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - Add: `email`, `profile`, `openid`
   - Click **"Update"** → **"Save and Continue"**
6. **Test users** (Step 3):
   - Add test users if in testing mode
   - Click **"Save and Continue"**
7. Review and click **"Back to Dashboard"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type**: Select **"Web application"**
4. **Name**: Enter a name (e.g., "Web Client")
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   https://yourdomain.com/auth/google/callback
   ```
7. Click **"Create"**
8. **Copy the Client ID and Client Secret** (you'll need these)

### Step 4: Enable Google+ API (if needed)

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click **"Enable"** (usually not required for basic OAuth)

---

## GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in the form:
   - **Application name**: Your application name
   - **Homepage URL**: `https://yourdomain.com` or `http://localhost:3000`
   - **Authorization callback URL**: 
     ```
     http://localhost:3000/auth/github/callback
     ```
     or
     ```
     https://yourdomain.com/auth/github/callback
     ```
4. Click **"Register application"**

### Step 2: Get Client Credentials

1. After creating the app, you'll see:
   - **Client ID** (public)
   - **Client Secret** (click "Generate a new client secret" if needed)
2. **Copy both values** (you'll need these)

### Step 3: Configure Scopes (Optional)

By default, GitHub OAuth requests `user:email` scope. If you need additional permissions:
- Edit your OAuth App
- Note: Scopes are requested during authorization, not in app settings

---

## Microsoft OAuth Setup

### Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **"Azure Active Directory"** → **"App registrations"**
3. Click **"+ New registration"**
4. Fill in the form:
   - **Name**: Your application name
   - **Supported account types**: 
     - Choose **"Accounts in any organizational directory and personal Microsoft accounts"** (for Outlook.com and Azure AD)
   - **Redirect URI**:
     - Platform: **"Single-page application (SPA)"**
     - URI: `http://localhost:3000/auth/microsoft/callback`
     - Add another for production: `https://yourdomain.com/auth/microsoft/callback`
5. Click **"Register"**

### Step 2: Get Application Credentials

1. After registration, you'll see the **Overview** page
2. **Copy the following values**:
   - **Application (client) ID** (this is your Client ID)
   - **Directory (tenant) ID** (optional, for multi-tenant apps)

### Step 3: Create Client Secret

1. Go to **"Certificates & secrets"** in the left menu
2. Click **"+ New client secret"**
3. **Description**: Enter a description (e.g., "Production Secret")
4. **Expires**: Choose expiration (recommend 24 months)
5. Click **"Add"**
6. **IMPORTANT**: Copy the **Value** immediately (it won't be shown again)
   - This is your **Client Secret**

### Step 4: Configure API Permissions

1. Go to **"API permissions"** in the left menu
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Add the following permissions:
   - `User.Read` (to read user profile)
   - `email` (to read user email)
   - `profile` (to read user profile)
   - `openid` (for OpenID Connect)
6. Click **"Add permissions"**
7. **Grant admin consent** (if you're an admin) by clicking **"Grant admin consent for [Your Organization]"**

### Step 5: Configure Authentication

1. Go to **"Authentication"** in the left menu
2. Under **"Implicit grant and hybrid flows"**, check:
   - ✅ **Access tokens** (for token-based flow)
   - ✅ **ID tokens** (for OpenID Connect)
3. Under **"Redirect URIs"**, ensure your URIs are listed:
   ```
   http://localhost:3000/auth/microsoft/callback
   https://yourdomain.com/auth/microsoft/callback
   ```
4. Click **"Save"**

---

## Backend Configuration

### Step 1: Add Environment Variables

Add the following to your `.env` file in the `backend` directory:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret-here
```

### Step 2: Verify Configuration

The backend automatically enables OAuth providers when both `CLIENT_ID` and `CLIENT_SECRET` are provided. You can verify this by checking the logs on startup.

### Step 3: Test Backend Endpoints

Test the OAuth endpoints (they require valid tokens):

```bash
# Test Google OAuth (requires valid token)
curl -X POST http://localhost:3001/api/auth/oauth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "valid-google-token"}'

# Test GitHub OAuth (requires valid token)
curl -X POST http://localhost:3001/api/auth/oauth/github \
  -H "Content-Type: application/json" \
  -d '{"token": "valid-github-token"}'

# Test Microsoft OAuth (requires valid token)
curl -X POST http://localhost:3001/api/auth/oauth/microsoft \
  -H "Content-Type: application/json" \
  -d '{"token": "valid-microsoft-token"}'
```

---

## Frontend Implementation

### Step 1: Install Required Dependencies

For Google OAuth, you'll need to add the Google Identity Services script. For GitHub and Microsoft, you can use standard OAuth 2.0 flows.

#### Option A: Using Google Identity Services (GSI) - Recommended for Google

Add to your `frontend/index.html`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

#### Option B: Using OAuth Libraries

You can also use libraries like:
- `@react-oauth/google` for Google
- `@azure/msal-browser` for Microsoft
- Standard OAuth 2.0 redirect flow for GitHub

### Step 2: Update OAuthButtons Component

Replace the placeholder implementation in `frontend/src/components/OAuthButtons.tsx`:

#### For Google (Using Google Identity Services):

```typescript
import { useEffect } from 'react';

// Declare Google types
declare global {
  interface Window {
    google?: any;
  }
}

const handleGoogleOAuth = async () => {
  return new Promise<string>((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.access_token);
        }
      },
    }).requestAccessToken();
  });
};
```

#### For GitHub (Using OAuth 2.0 Redirect):

```typescript
const handleGitHubOAuth = () => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/github/callback`;
  const scope = 'user:email';
  const state = crypto.randomUUID(); // Store in sessionStorage for CSRF protection
  
  sessionStorage.setItem('oauth_state', state);
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  
  window.location.href = authUrl;
};
```

#### For Microsoft (Using MSAL or OAuth 2.0):

```typescript
const handleMicrosoftOAuth = () => {
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
  const scope = 'User.Read email profile openid';
  const state = crypto.randomUUID();
  
  sessionStorage.setItem('oauth_state', state);
  
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=fragment&scope=${encodeURIComponent(scope)}&state=${state}`;
  
  window.location.href = authUrl;
};
```

### Step 3: Create OAuth Callback Pages

Create callback pages to handle OAuth redirects:

#### `frontend/src/pages/OAuthCallback.tsx`:

```typescript
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const provider = searchParams.get('provider') || window.location.pathname.split('/')[2]; // google, github, or microsoft

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL (method depends on provider)
        let token: string | null = null;

        if (provider === 'google') {
          // Google GSI returns token in callback, not URL
          // Handle accordingly
        } else if (provider === 'github') {
          const code = searchParams.get('code');
          if (code) {
            // Exchange code for token (you may need a backend endpoint for this)
            // Or use the code directly if your backend handles it
            token = code; // Simplified - implement proper token exchange
          }
        } else if (provider === 'microsoft') {
          // Microsoft returns token in URL fragment
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          token = params.get('access_token');
        }

        if (!token) {
          throw new Error('No token received');
        }

        // Send token to backend
        const response = await authApi.oauthLogin(provider as 'google' | 'github' | 'microsoft', token);
        setUser(response.data);
        navigate('/dashboard', { replace: true });
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    handleCallback();
  }, [provider, searchParams, navigate, setUser]);

  return <div>Completing authentication...</div>;
};
```

### Step 4: Add Routes

Update `frontend/src/App.tsx`:

```typescript
import { OAuthCallback } from './pages/OAuthCallback';

// Add routes
<Route path="/auth/google/callback" element={<OAuthCallback />} />
<Route path="/auth/github/callback" element={<OAuthCallback />} />
<Route path="/auth/microsoft/callback" element={<OAuthCallback />} />
```

### Step 5: Add Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GITHUB_CLIENT_ID=your-github-client-id-here
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
```

**Note**: Never expose client secrets in frontend code. Only client IDs should be in frontend environment variables.

### Step 6: Update OAuthButtons Implementation

Replace the `handleOAuth` function in `OAuthButtons.tsx`:

```typescript
const handleOAuth = async (provider: 'google' | 'github' | 'microsoft') => {
  try {
    setLoading(provider);

    let token: string;

    switch (provider) {
      case 'google':
        token = await handleGoogleOAuth();
        break;
      case 'github':
        handleGitHubOAuth(); // Redirects, so this won't return
        return;
      case 'microsoft':
        handleMicrosoftOAuth(); // Redirects, so this won't return
        return;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // For Google (token-based, no redirect)
    const response = await authApi.oauthLogin(provider, token);
    setUser(response.data);
    onSuccess?.();
  } catch (error: any) {
    toast({
      title: 'OAuth Error',
      description: error.message || `Failed to authenticate with ${provider}`,
      variant: 'destructive',
    });
  } finally {
    setLoading(null);
  }
};
```

---

## Testing

### Backend Tests

All OAuth backend functionality is tested. Run:

```bash
cd backend
npm test -- src/__tests__/routes/auth.oauth.test.ts
```

### Frontend Tests

```bash
cd frontend
npm test -- src/__tests__/components/OAuthButtons.test.tsx
```

### Manual Testing

1. **Start backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test OAuth Flow**:
   - Go to `http://localhost:3000/login`
   - Click on Google/GitHub/Microsoft button
   - Complete OAuth flow
   - Verify you're logged in and redirected to dashboard

---

## Troubleshooting

### Common Issues

#### 1. "OAuth is not enabled" Error

**Problem**: Backend returns "OAuth is not enabled"

**Solution**: 
- Check that both `CLIENT_ID` and `CLIENT_SECRET` are set in backend `.env`
- Restart backend server after adding environment variables

#### 2. "Invalid OAuth token" Error

**Problem**: Backend returns "Invalid OAuth token"

**Solutions**:
- Verify token is being sent correctly from frontend
- Check token hasn't expired (tokens typically expire in 1 hour)
- Ensure redirect URIs match exactly in provider settings
- For Google: Verify GSI script is loaded
- For GitHub: Ensure code exchange is working
- For Microsoft: Check token is extracted from URL fragment correctly

#### 3. Redirect URI Mismatch

**Problem**: Provider shows "redirect_uri_mismatch" error

**Solution**:
- Ensure redirect URIs in provider settings match exactly (including protocol, domain, port, and path)
- For localhost: `http://localhost:3000/auth/[provider]/callback`
- For production: `https://yourdomain.com/auth/[provider]/callback`
- No trailing slashes

#### 4. CORS Errors

**Problem**: CORS errors when calling backend

**Solution**:
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check backend CORS configuration in `backend/src/middleware/security.ts`

#### 5. Email Not Verified

**Problem**: User email shows as unverified

**Solution**:
- This is normal for some providers if email isn't verified in their system
- OAuth providers typically return verified status - backend handles this automatically

#### 6. Microsoft "AADSTS50011" Error

**Problem**: Microsoft returns "The redirect URI specified in the request does not match"

**Solution**:
- Verify redirect URI in Azure Portal matches exactly
- Check you're using the correct redirect URI format (SPA vs Web)
- Ensure no trailing slashes or extra parameters

### Debugging Tips

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Verify API calls are being made
3. **Check Backend Logs**: Look for OAuth-related errors
4. **Test with Postman**: Test backend endpoints directly with valid tokens
5. **Verify Environment Variables**: Use `console.log` (in dev only) to verify env vars are loaded

### Getting Help

If you encounter issues:

1. Check provider documentation:
   - [Google Identity Services](https://developers.google.com/identity/gsi/web)
   - [GitHub OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
   - [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)

2. Review error messages carefully - they often indicate the exact issue

3. Verify all steps in this guide were followed correctly

---

## Security Best Practices

1. **Never expose client secrets** in frontend code
2. **Use HTTPS** in production
3. **Validate state parameter** to prevent CSRF attacks
4. **Store tokens securely** - backend uses HTTP-only cookies
5. **Implement token refresh** for long-lived sessions
6. **Log OAuth events** for audit trails (already implemented)
7. **Rate limit OAuth endpoints** (already implemented)

---

## Production Checklist

Before going to production:

- [ ] All OAuth apps configured with production URLs
- [ ] Environment variables set in production environment
- [ ] HTTPS enabled for all OAuth redirect URIs
- [ ] CORS configured for production domain
- [ ] OAuth consent screens published (Google)
- [ ] Test users removed (if any)
- [ ] Client secrets rotated and stored securely
- [ ] Monitoring/alerting configured for OAuth failures
- [ ] Error handling tested for all failure scenarios
- [ ] Documentation updated with production URLs

---

## Additional Resources

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps)
- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)

---

**Last Updated**: December 2024  
**Template Version**: 1.0.0

