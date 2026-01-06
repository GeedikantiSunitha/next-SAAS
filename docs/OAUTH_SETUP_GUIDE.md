# OAuth Setup Guide - Production Configuration

This comprehensive guide will walk you through setting up OAuth authentication for Google and GitHub in your SaaS template.

> **Note**: Microsoft (Outlook) OAuth support will be added in a future update. The code structure is in place but currently commented out.

## Table of Contents

1. [Overview](#overview)
2. [Google OAuth Setup](#google-oauth-setup)
3. [GitHub OAuth Setup](#github-oauth-setup)
4. [Microsoft OAuth Setup](#microsoft-oauth-setup) *(Coming Soon)*
5. [Backend Configuration](#backend-configuration)
6. [Frontend Implementation](#frontend-implementation)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The template currently supports two OAuth providers:
- **Google** - Using Google Identity Services (GSI) ✅
- **GitHub** - Using GitHub OAuth Apps ✅
- **Microsoft** - Using Microsoft Identity Platform (Azure AD) ⏳ *Coming Soon*

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
   - **App name**: Enter your application's display name (e.g., "NextSaaS", "My SaaS App", "YourCompany Name")
     - This is what users will see when they sign in with Google
   - **User support email**: Enter your email address (e.g., `support@yourdomain.com` or `your-email@gmail.com`)
     - This email will be shown to users if they need help
   - **Developer contact information**: Enter the same email or your developer email
     - This is used by Google to contact you about your app
   - **App logo** (optional): Upload a logo (120x120px recommended)
   - **App domain** (optional): Your website domain (e.g., `yourdomain.com`)
   - **Application home page** (optional): Your website URL (e.g., `https://yourdomain.com`)
   - **Privacy policy link** (optional): Link to your privacy policy
   - **Terms of service link** (optional): Link to your terms of service
4. Click **"Save and Continue"**
5. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - In the filter/search box, type and add these scopes:
     - `email` - See your primary Google Account email address
     - `profile` - See your personal info, including any personal info you've made publicly available
     - `openid` - Associate you with your personal info on Google
   - Click **"Update"** → **"Save and Continue"**
6. **Test users** (Step 3):
   - If your app is in "Testing" mode, add email addresses of users who can test the app
   - Add your own email address and any test accounts
   - Click **"Save and Continue"**
7. Review and click **"Back to Dashboard"**

**Note**: If you're just testing, you can use minimal information. The minimum required fields are:
- App name (e.g., "My Test App")
- User support email (your email)
- Developer contact information (your email)

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
   http://localhost:3000/oauth/google/callback
   https://yourdomain.com/oauth/google/callback
   ```
7. Click **"Create"**
8. **Copy the Client ID and Client Secret** (you'll need these)

### Step 4: Enable Google+ API (if needed)

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click **"Enable"** (usually not required for basic OAuth)

---

## GitHub OAuth Setup

### Quick Start: Get Your GitHub OAuth Keys

**Time Required**: ~5 minutes

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"OAuth Apps"** in the left sidebar
3. Click **"New OAuth App"** button
4. Fill in the form:
   - **Application name**: Your application name (e.g., "My SaaS App")
   - **Homepage URL**: 
     - For development: `http://localhost:3000`
     - For production: `https://yourdomain.com`
   - **Authorization callback URL**: 
     ```
     http://localhost:3000/oauth/github/callback
     ```
     (Add production URL later: `https://yourdomain.com/oauth/github/callback`)
5. Click **"Register application"**

### Step 2: Get Client Credentials

1. After creating the app, you'll see the app details page
2. **Client ID**: This is shown immediately (copy it)
3. **Client Secret**: 
   - Click **"Generate a new client secret"** button
   - Enter a note (e.g., "Production Secret")
   - Click **"Generate client secret"**
   - ⚠️ **Copy the secret immediately** - you can only see it once!
4. **Copy both values**:
   - ✅ **GITHUB_CLIENT_ID**: The Client ID
   - ✅ **GITHUB_CLIENT_SECRET**: The Client Secret you just generated

### Step 3: Configure Scopes (Already Handled)

The implementation automatically requests `user:email` scope, which is sufficient for basic OAuth login. No additional configuration needed.

---

## Microsoft OAuth Setup

### Quick Start: Get Your Microsoft OAuth Keys

**Time Required**: ~10-15 minutes

### Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign in with your Microsoft account
3. Navigate to **"Azure Active Directory"** → **"App registrations"**
4. Click **"+ New registration"**
5. Fill in the form:
   - **Name**: Your application name (e.g., "My SaaS App")
   - **Supported account types**: 
     - Choose **"Accounts in any organizational directory and personal Microsoft accounts"** 
     - (This allows both Outlook.com and Azure AD accounts)
   - **Redirect URI**:
     - Platform: **"Single-page application (SPA)"**
     - URI: `http://localhost:3000/oauth/microsoft/callback`
     - (You can add production URL later)
6. Click **"Register"**

### Step 2: Get Application Credentials

1. After registration, you'll see the **Overview** page
2. **Copy the following values**:
   - ✅ **MICROSOFT_CLIENT_ID**: The **Application (client) ID** (shown on Overview page)
   - ✅ **MICROSOFT_TENANT_ID** (optional): The **Directory (tenant) ID** (only needed for single-tenant apps)

### Step 3: Create Client Secret

1. Go to **"Certificates & secrets"** in the left menu
2. Click **"+ New client secret"**
3. **Description**: Enter a description (e.g., "Production Secret")
4. **Expires**: Choose expiration (recommend 24 months)
5. Click **"Add"**
6. **IMPORTANT**: Copy the **Value** immediately (it won't be shown again!)
   - ✅ **MICROSOFT_CLIENT_SECRET**: This is the secret value

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
   http://localhost:3000/oauth/microsoft/callback
   https://yourdomain.com/oauth/microsoft/callback
   ```
   (Add production URL when ready)
4. Click **"Save"**

---

## Configuration: Add Keys to Your Project

### Step 1: Add Backend Environment Variables

Add the following to your `backend/.env` file:

```env
# Google OAuth (from Step 3 above)
GOOGLE_CLIENT_ID=paste-your-google-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-google-client-secret-here

# GitHub OAuth (from Step 2 above)
GITHUB_CLIENT_ID=paste-your-github-client-id-here
GITHUB_CLIENT_SECRET=paste-your-github-client-secret-here

# Microsoft OAuth (Coming Soon - currently commented out)
# MICROSOFT_CLIENT_ID=paste-your-microsoft-client-id-here
# MICROSOFT_CLIENT_SECRET=paste-your-microsoft-client-secret-here
```

**Replace the placeholder values** with the actual keys you copied from each provider.

### Step 2: Add Frontend Environment Variables

Add the following to your `frontend/.env` file:

```env
# Google OAuth (Client ID only - never put secrets in frontend!)
VITE_GOOGLE_CLIENT_ID=paste-your-google-client-id-here

# GitHub OAuth (Client ID only)
VITE_GITHUB_CLIENT_ID=paste-your-github-client-id-here

# Microsoft OAuth (Coming Soon - currently commented out)
# VITE_MICROSOFT_CLIENT_ID=paste-your-microsoft-client-id-here
# VITE_MICROSOFT_TENANT_ID=common
```

**Important Notes**:
- ✅ Only **Client IDs** go in the frontend `.env` file
- ❌ **Never put Client Secrets in frontend code** - they must stay in backend `.env` only
- The `VITE_` prefix is required for Vite to expose these variables to the frontend

### Step 3: Restart Your Servers

After adding the environment variables:

1. **Restart backend**:
   ```bash
   cd backend
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

2. **Restart frontend**:
   ```bash
   cd frontend
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

### Step 4: Verify Configuration

The backend automatically enables OAuth providers when both `CLIENT_ID` and `CLIENT_SECRET` are provided. Check the backend logs on startup - you should see OAuth providers being enabled.

---

## Testing Your OAuth Setup

### Test Backend Endpoints

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

## Testing Your OAuth Setup

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
- For localhost: `http://localhost:3000/oauth/[provider]/callback`
- For production: `https://yourdomain.com/oauth/[provider]/callback`
- No trailing slashes
- **Important**: The path is `/oauth/` not `/auth/`

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

