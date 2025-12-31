# Authentication API
## NextSaaS - Authentication Endpoints

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes all authentication-related API endpoints, including registration, login, logout, password reset, and OAuth.

---

## Authentication Flow

### 1. Registration/Login
```
User → POST /api/auth/register or /api/auth/login
     → Backend validates credentials
     → Backend generates JWT tokens
     → Tokens stored in HTTP-only cookies
     → User is authenticated
```

### 2. Token Refresh
```
Access token expires
     → Frontend detects 401
     → POST /api/auth/refresh (with refreshToken cookie)
     → Backend generates new access token
     → New token stored in cookie
```

### 3. Logout
```
User → POST /api/auth/logout
     → Backend invalidates refresh token
     → Cookies cleared
     → User logged out
```

---

## Endpoints

### POST /api/auth/register

**Description**: Register a new user account

**Authentication**: Not required

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Validation**:
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number, special character
- `name`: Optional, string

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2025-12-23T10:00:00Z"
  }
}
```

**Cookies Set**:
- `accessToken`: JWT access token (15 minutes)
- `refreshToken`: JWT refresh token (30 days)

**Errors**:
- `400`: Invalid input
- `409`: Email already registered
- `422`: Password too weak
- `429`: Rate limit exceeded

---

### POST /api/auth/login

**Description**: Login with email and password

**Authentication**: Not required

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation**:
- `email`: Required, valid email format
- `password`: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

**Cookies Set**:
- `accessToken`: JWT access token (15 minutes)
- `refreshToken`: JWT refresh token (30 days)

**Errors**:
- `400`: Invalid input
- `401`: Invalid credentials
- `429`: Rate limit exceeded

---

### POST /api/auth/logout

**Description**: Logout user and invalidate session

**Authentication**: Required

**Request Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookies Cleared**:
- `accessToken`
- `refreshToken`

**Errors**:
- `401`: Not authenticated

---

### POST /api/auth/refresh

**Description**: Refresh access token using refresh token

**Authentication**: Not required (uses refreshToken cookie)

**Request Body**: None

**Cookies Required**:
- `refreshToken`: Valid refresh token

**Response** (200 OK):
```json
{
  "success": true,
  "data": {}
}
```

**Cookies Set**:
- `accessToken`: New JWT access token (15 minutes)

**Errors**:
- `401`: No refresh token or invalid token

---

### GET /api/auth/me

**Description**: Get current authenticated user

**Authentication**: Required

**Request Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2025-12-23T10:00:00Z",
    "updatedAt": "2025-12-23T10:00:00Z"
  }
}
```

**Errors**:
- `401`: Not authenticated

---

### POST /api/auth/forgot-password

**Description**: Request password reset email

**Authentication**: Not required

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Validation**:
- `email`: Required, valid email format

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent if account exists"
}
```

**Note**: Always returns success (security: don't reveal if email exists)

**Errors**:
- `400`: Invalid email
- `429`: Rate limit exceeded

---

### POST /api/auth/reset-password/:token

**Description**: Reset password using reset token

**Authentication**: Not required

**Rate Limit**: 5 requests per 15 minutes

**URL Parameters**:
- `token`: Password reset token

**Request Body**:
```json
{
  "password": "NewSecurePass123!"
}
```

**Validation**:
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number, special character

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Errors**:
- `400`: Invalid token or expired
- `422`: Password too weak
- `429`: Rate limit exceeded

---

## OAuth Endpoints

### GET /api/auth/oauth/:provider

**Description**: Initiate OAuth login

**Authentication**: Not required

**URL Parameters**:
- `provider`: `google`, `github`, or `microsoft`

**Response**: Redirects to OAuth provider

**Example**:
```
GET /api/auth/oauth/google
→ Redirects to Google OAuth consent screen
```

---

### GET /api/auth/oauth/:provider/callback

**Description**: OAuth callback handler

**Authentication**: Not required

**URL Parameters**:
- `provider`: `google`, `github`, or `microsoft`

**Query Parameters**:
- `code`: OAuth authorization code
- `state`: OAuth state parameter

**Response**: Redirects to frontend with tokens

**Note**: This endpoint is handled by Passport.js middleware

---

### POST /api/auth/oauth/link

**Description**: Link OAuth provider to existing account

**Authentication**: Required

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "provider": "google",
  "token": "oauth-access-token"
}
```

**Validation**:
- `provider`: Required, must be `google`, `github`, or `microsoft`
- `token`: Required, OAuth access token

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "oauthProvider": "google",
    "oauthProviderId": "google-user-id"
  }
}
```

**Errors**:
- `400`: Invalid provider or token
- `401`: Not authenticated
- `409`: OAuth account already linked
- `429`: Rate limit exceeded

---

### POST /api/auth/oauth/unlink

**Description**: Unlink OAuth provider from account

**Authentication**: Required

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "provider": "google"
}
```

**Validation**:
- `provider`: Required, must be `google`, `github`, or `microsoft`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "oauthProvider": null
  }
}
```

**Errors**:
- `400`: Invalid provider
- `401`: Not authenticated
- `404`: OAuth provider not linked
- `429`: Rate limit exceeded

---

## JWT Token Structure

### Access Token Payload

```json
{
  "userId": "user-uuid",
  "iat": 1638360000,
  "exp": 1638360900
}
```

**Expiry**: 15 minutes

**Usage**: Included in `Authorization` header or cookie

---

### Refresh Token Payload

```json
{
  "userId": "user-uuid",
  "iat": 1638360000,
  "exp": 1640952000
}
```

**Expiry**: 30 days

**Storage**: HTTP-only cookie + database session

---

## Cookie Configuration

### Cookie Options

```typescript
{
  httpOnly: true,        // Not accessible via JavaScript
  secure: true,          // HTTPS only (production)
  sameSite: 'strict',    // CSRF protection
  maxAge: 2592000000,    // 30 days (refresh token)
  path: '/',             // Available on all paths
  domain: undefined      // Current domain (or configured)
}
```

### Development vs Production

**Development**:
- `secure: false` (HTTP allowed)
- `domain: undefined` (localhost)

**Production**:
- `secure: true` (HTTPS only)
- `domain: '.yourdomain.com'` (if configured)

---

## Security Features

### 1. Password Strength

**Requirements**:
- Minimum 8 characters
- Uppercase letter
- Lowercase letter
- Number
- Special character

**Rejection**: WEAK and FAIR passwords are rejected

**Acceptance**: GOOD and STRONG passwords are accepted

---

### 2. Rate Limiting

**Authentication Endpoints**: 5 requests per 15 minutes per IP

**Purpose**: Prevent brute force attacks

**Headers**:
```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1638360000
```

---

### 3. Token Security

**HTTP-only Cookies**: Tokens not accessible via JavaScript

**Secure Cookies**: HTTPS only in production

**SameSite**: CSRF protection

**Short Expiry**: Access tokens expire in 15 minutes

---

### 4. Password Reset Security

**Token Expiry**: 1 hour

**One-time Use**: Tokens invalidated after use

**Email Verification**: Reset link sent to registered email

**No Email Disclosure**: Always returns success (security)

---

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Invalid credentials",
  "requestId": "req_123456"
}
```

### 409 Conflict

```json
{
  "success": false,
  "error": "Email already registered",
  "requestId": "req_123456"
}
```

### 422 Unprocessable Entity

```json
{
  "success": false,
  "error": "Password is too weak. Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.",
  "requestId": "req_123456"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "requestId": "req_123456"
}
```

---

## Best Practices

### 1. Token Refresh

**Automatic Refresh**: Implement automatic token refresh on 401 errors

**Example**:
```javascript
if (response.status === 401) {
  await refreshToken();
  // Retry original request
}
```

### 2. Secure Storage

**Never Store in localStorage**: Use HTTP-only cookies only

**Never Send in URL**: Tokens should not be in query parameters

### 3. Error Handling

**Handle 401**: Redirect to login

**Handle 429**: Implement exponential backoff

**Handle 409**: Show user-friendly error message

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
