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

## End-to-End Auth Flow (Implementation Reference)

This section describes **how** auth works in code so you can fix issues (e.g. "Invalid credentials", 401 on `/me`) without guessing.

### 1. Frontend → Backend (Cookies, No localStorage)

- **API base**: Frontend uses **Vite** env: `VITE_API_BASE_URL` (e.g. `http://localhost:3001`). See `frontend/src/api/client.ts` — `baseURL: import.meta.env.VITE_API_BASE_URL || ''`. If empty, requests go to same origin (Vite dev server); with Vite proxy `/api` → `http://localhost:3001`, that works. If set to `http://localhost:3001`, requests go directly to backend; cookies still work if CORS and cookie domain are correct. All auth requests use **credentials** (`withCredentials: true`) so cookies are sent.
- **Login**: `POST /api/auth/login` with `{ email, password }`. Backend sets **HTTP-only** cookies: `accessToken`, `refreshToken`. Response body has `{ success, data: user }` (no token in body).
- **Session check**: On app load, frontend calls `GET /api/auth/me`. Backend reads `accessToken` from cookie, validates JWT, loads user by `userId`, returns user or 401.
- **401 on `/me` when not logged in**: Normal. No cookie or invalid/expired token → 401. Frontend sets `user = null`. Not a bug.
- **Refresh**: When access token expires, frontend can call `POST /api/auth/refresh` (with `refreshToken` cookie). Backend issues new `accessToken` cookie.

**Key files**: `frontend/src/api/auth.ts`, `frontend/src/api/client.ts` (withCredentials), `frontend/src/contexts/AuthContext.tsx` (checkAuth on mount, login sets user).

### 2. Backend Auth Route → Auth Service

- **Login route**: `backend/src/routes/auth.ts` → `POST /login` normalizes email (`trim`, `toLowerCase`), then calls `authService.login(email, password, ipAddress, userAgent)`.
- **Auth service**: `backend/src/services/authService.ts`:
  - **Login**: Finds user by email, checks password with bcrypt, creates session, returns user. If user not found → `UnauthorizedError('Invalid credentials')` → 401.
  - **getUserById**: Used by `/me` and refresh; loads user by `id` from JWT. If not found → 401 "User not found".

### 3. User Lookup When Encryption Is On (Critical)

With **application-level encryption** (`ENCRYPTION_ENABLED=true` in `backend/.env`):

- **Email is encrypted at rest**. The DB stores encrypted `email` and a searchable **`emailHash`** (SHA-256 of normalized email).
- **Login must find user by `emailHash`**, not plain `email`. The auth service uses **`findUserByEncryptedEmail(prisma, email)`** from `backend/src/middleware/encryptionMiddleware.ts`:
  - If encryption disabled: `prisma.user.findUnique({ where: { email } })`.
  - If encryption enabled: `emailHash = encryptionService.hash(email)` then `prisma.user.findFirst({ where: { emailHash } })`.
- **Same helper** is used for: **login**, **register** (check existing email), **forgot-password** (find user by email). Do **not** replace these with raw `prisma.user.findUnique({ where: { email } })` when encryption is on, or login will return 401 even with correct password.

**Hash consistency**: `encryptionService.hash(value)` = `crypto.createHash('sha256').update(value).digest('hex')`. Demo seed uses the same for `emailHash`: normalize email (`trim`, `toLowerCase`) then same SHA-256 hex.

### 4. Demo Users and `emailHash`

- **Demo accounts** (Login page): `demo@example.com`, `demo-admin@example.com`, `demo-superadmin@example.com` — created by **`npm run seed:demo-users`** in `backend`.
- **Seed script**: `backend/prisma/seed.demo-users.ts`. It **must** set **`emailHash`** for each user (same hash as above). If encryption is on and `emailHash` is null or wrong, login returns "Invalid credentials".
- **When to re-run**: After DB reset, or after running another seed (e.g. `npm run seed` or `npm run seed:demo`) that creates/updates users **without** `emailHash`. Always run:

  ```bash
  cd backend && npm run seed:demo-users
  ```

  Then restart backend and try login again.

### 5. Cookie and JWT Flow (Backend)

- **Login**: `authService.login` → create session in DB → `generateTokens(userId)` → set cookies (`accessToken`, `refreshToken`) via `res.cookie(..., getCookieOptions(...))`.
- **/me**: Auth middleware reads cookie, verifies JWT, sets `req.user = { id: userId }`. Route calls `authService.getUserById(req.user.id)` → `prisma.user.findUnique({ where: { id } })` (no email lookup).
- **Refresh**: Reads `refreshToken` cookie, looks up session in DB, issues new access token, sets new `accessToken` cookie.
- **Logout**: Deletes session, clears cookies.

### 6. Quick Troubleshooting

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| **POST /api/auth/login → 401 "Invalid credentials"** | User not found by email (often encryption + missing/wrong `emailHash`). | 1) Run `cd backend && npm run seed:demo-users`. 2) Ensure auth service uses `findUserByEncryptedEmail` for login (see `authService.login`). 3) Restart backend. |
| **GET /api/auth/me → 401 when not logged in** | No cookie or expired/invalid token. | Expected. After successful login, `/me` should 200. |
| **GET /api/auth/me → 401 after login** | Token valid but `getUserById` returns null (e.g. user deleted, or wrong DB). | Check user exists by id; check backend uses same DB as seed. |
| **Login works then stops** | Another seed or migration recreated users without `emailHash`. | Re-run `npm run seed:demo-users` and restart backend. |
| **"Invalid credentials" with correct password** | Email lookup fails: encryption on but lookup by plain email, or `emailHash` not set. | Use `findUserByEncryptedEmail` for login path; ensure demo seed sets `emailHash`; re-run seed. |
| **Auth breaks after unrelated code changes** | **Root cause**: With encryption on, login looks up by `emailHash`. If any seed or app path created/updated users without setting `emailHash`, those users get 401. **Fix**: All user create/update paths now set `emailHash` (authService, adminUserService, oauthService, seed.ts, seed.demo.ts). If auth still fails, check cookie/CORS and `VITE_API_BASE_URL`. | See "Why auth breaks after unrelated changes" (§7). |

### 7. Why auth breaks after unrelated changes (root cause)

Auth often "breaks" after changes that **don’t touch** auth code (e.g. new GDPR route, new frontend page). The **root cause** is usually:

**Encryption + missing `emailHash`**

- With `ENCRYPTION_ENABLED=true`, login finds users by **`emailHash`** (SHA-256 of normalized email), not plain email.
- If any code path creates or updates a user **without** setting `emailHash`, that user cannot log in (401 "Invalid credentials").
- **What was going wrong**: Only `seed.demo-users.ts` set `emailHash`. The main seed (`seed.ts`), `seed.demo.ts`, `authService.register`, `adminUserService.createUser`, and `oauthService.createOrUpdateUserFromOAuth` did **not** set `emailHash`. So after running `npm run seed` or `npm run seed:demo`, or after registering a new user or creating a user via admin/OAuth, those users had `emailHash = null` and login failed.

**Permanent fix (implemented)**

- Every place that creates or updates a user with an email now sets `emailHash` using the same format: normalize email (`trim().toLowerCase()`), then SHA-256 hex (same as `findUserByEncryptedEmail`).
- **Updated files**: `authService.ts` (register), `adminUserService.ts` (create + update when email changes), `oauthService.ts` (create OAuth user), `prisma/seed.ts`, `prisma/seed.demo.ts`.
- You no longer need to re-run `seed:demo-users` after other changes; any seed or app path that creates/updates users sets `emailHash` correctly.

**Other possible causes (if auth still fails)**

1. **Cookie / CORS**: Wrong `COOKIE_DOMAIN` or `FRONTEND_URL` → fix env (e.g. `FRONTEND_URL=http://localhost:3000`, `COOKIE_SECURE=false` for HTTP).
2. **Frontend API base URL**: Wrong or missing `VITE_API_BASE_URL` → set in `frontend/.env` or use Vite proxy.
3. **Auth code unchanged**: If none of the auth files were changed, the bug is usually env or one of the above.

### 8. File Reference

| Purpose | File |
|--------|------|
| Login/register/me/refresh routes | `backend/src/routes/auth.ts` |
| Login logic, getUserById, find user by email | `backend/src/services/authService.ts` |
| Encrypted-email lookup (use for login when encryption on) | `backend/src/middleware/encryptionMiddleware.ts` → `findUserByEncryptedEmail` |
| Hash implementation | `backend/src/services/encryptionService.ts` → `hash(value)` |
| Demo users seed (sets emailHash) | `backend/prisma/seed.demo-users.ts` |
| Frontend auth API | `frontend/src/api/auth.ts` |
| Frontend auth state & checkAuth | `frontend/src/contexts/AuthContext.tsx` |
| API client (withCredentials) | `frontend/src/api/client.ts` |

---

**Last Updated**: February 2026  
**Version**: 2.1.0
