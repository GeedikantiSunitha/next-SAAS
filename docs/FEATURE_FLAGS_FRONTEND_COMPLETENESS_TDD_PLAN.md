# Feature Flags Frontend Completeness - TDD Implementation Plan

**Date**: February 2026  
**Status**: Implemented (Phases 1–4)  
**Approach**: Test-Driven Development (TDD)  
**Goal**: All admin-togglable feature flags must control frontend visibility and behavior for application completeness.

---

## Executive Summary

Currently only `password_reset` is enforced in the frontend. Flags `registration`, `google_oauth`, `github_oauth`, `microsoft_oauth`, and `email_verification` exist in the admin panel but do not affect UI visibility. This plan closes that gap with comprehensive TDD.

---

## Current State vs Target State

| Flag | Backend Enforced | Frontend Enforced | Locations Updated |
|------|------------------|-------------------|-------------------|
| `password_reset` | ✅ | ✅ | Done |
| `registration` | ✅ | ✅ | Header, Login, ForgotPassword, Register |
| `google_oauth` | ✅ | ✅ | OAuthButtons, ConnectedAccounts, oauthTokenVerifier |
| `github_oauth` | ✅ | ✅ | OAuthButtons, ConnectedAccounts, oauthTokenVerifier |
| `microsoft_oauth` | ✅ | ✅ | Backend oauthTokenVerifier (OAuthButtons when UI added) |
| `email_verification` | Config only | ❌ | Optional Phase 4 |

---

## Phase 1: Backend - OAuth Runtime Enforcement

**Purpose**: Wire OAuth provider flags from DB so backend rejects OAuth when provider is disabled.

### 1.1 RED - Write Failing Tests

**File**: `backend/src/__tests__/services/featureFlagRuntimeService.test.ts`

Add tests:
```typescript
it('should return false when google_oauth is disabled in database', ...)
it('should return true when google_oauth is enabled in database', ...)
it('should return false when github_oauth is disabled in database', ...)
it('should return false when microsoft_oauth is disabled in database', ...)
```

**File**: `backend/src/__tests__/routes/auth.oauth.e2e.test.ts` (or create)

Add tests:
- POST /api/auth/oauth/google returns 403 when google_oauth flag disabled in DB
- POST /api/auth/oauth/github returns 403 when github_oauth flag disabled in DB
- POST /api/auth/oauth/microsoft returns 403 when microsoft_oauth flag disabled in DB

### 1.2 GREEN - Implement

1. **featureFlagRuntimeService.ts**
   - Add to CONFIG_FALLBACK: `google_oauth`, `github_oauth`, `microsoft_oauth` (map to config.oauth.*.enabled)

2. **OAuth routes / oauthTokenVerifier** (or wherever provider is checked)
   - Replace `config.oauth.google.enabled` with `await isFeatureEnabled('google_oauth')`
   - Same for github, microsoft

3. **featureFlags routes**
   - Add `google_oauth`, `github_oauth`, `microsoft_oauth` to RUNTIME_FLAGS
   - Add to PUBLIC_FLAGS (Login page needs these without auth)

### 1.3 REFACTOR
- Extract shared OAuth check helper if duplicated

---

## Phase 2: Frontend - Registration Flag

**Purpose**: Hide Register link and page when `registration` is disabled.

### 2.1 RED - Write Failing Tests

**File**: `frontend/src/__tests__/components/Header.test.tsx`

Add:
- `it('should not display Register link when registration flag is disabled', ...)`
- `it('should display Register link when registration flag is enabled', ...)`

**File**: `frontend/src/__tests__/pages/Login.test.tsx`

Add:
- `it('should not display Register link when registration flag is disabled', ...)`

**File**: `frontend/src/__tests__/pages/ForgotPassword.test.tsx`

Add:
- `it('should not display Register link when registration flag is disabled', ...)`

**File**: `frontend/src/__tests__/pages/Register.test.tsx` (create if not exists)

Add:
- `it('should show disabled message when registration flag is disabled', ...)`
- `it('should render registration form when registration flag is enabled', ...)`

**File**: `frontend/src/__tests__/App.test.tsx` or routing tests

Add:
- When registration disabled, navigating to /register shows disabled message or redirects

### 2.2 GREEN - Implement

1. **Header.tsx** - Add `usePublicFeatureFlag('registration')`, conditionally render Register link
2. **Login.tsx** - Add `usePublicFeatureFlag('registration')`, conditionally render Register link
3. **ForgotPassword.tsx** - Add `usePublicFeatureFlag('registration')`, conditionally render Register link
4. **Register.tsx** - Add `usePublicFeatureFlag('registration')`, when disabled show "Registration is currently disabled" and link to login
5. **Backend** - Ensure `registration` is in PUBLIC_FLAGS (already in RUNTIME_FLAGS)

### 2.3 REFACTOR
- Consider `usePublicFeatureFlags(['registration','password_reset'])` batch hook to reduce API calls

---

## Phase 3: Frontend - OAuth Provider Flags

**Purpose**: Hide OAuth buttons when respective provider is disabled.

### 3.1 RED - Write Failing Tests

**File**: `frontend/src/__tests__/components/OAuthButtons.test.tsx`

Add:
- `it('should not render Google button when google_oauth flag is disabled', ...)`
- `it('should not render GitHub button when github_oauth flag is disabled', ...)`
- `it('should render both buttons when both flags enabled', ...)`
- `it('should render only Google when GitHub disabled', ...)`
- `it('should not render OAuth section at all when both Google and GitHub disabled', ...)`

**File**: `frontend/src/__tests__/components/ConnectedAccounts.test.tsx` (if exists)

Add:
- `it('should not show Google link option when google_oauth disabled', ...)`
- `it('should not show GitHub link option when github_oauth disabled', ...)`

### 3.2 GREEN - Implement

1. **OAuthButtons.tsx**
   - Add `usePublicFeatureFlag('google_oauth')`, `usePublicFeatureFlag('github_oauth')`
   - Conditionally render each button
   - Hide entire "Or continue with" section when no OAuth providers enabled

2. **ConnectedAccounts.tsx** (Profile)
   - Add `useFeatureFlag('google_oauth')`, `useFeatureFlag('github_oauth')`
   - Conditionally show link options per provider

3. **API**
   - Ensure `getPublicFeatureFlag` / backend PUBLIC_FLAGS includes `google_oauth`, `github_oauth`, `microsoft_oauth`

### 3.3 REFACTOR
- Create `useOAuthFlags()` hook that returns `{ google: boolean, github: boolean, microsoft: boolean }` to reduce hook calls

---

## Phase 4: Frontend - Email Verification Flag

**Purpose**: When `email_verification` is enabled, show appropriate messaging in registration flow.

### 4.1 Scope Analysis

Check backend usage of `email_verification`:
- If it affects post-registration flow (e.g. "verify your email" messaging), frontend should reflect
- If it's backend-only (e.g. blocking login until verified), minimal frontend impact

### 4.2 RED - Write Failing Tests (if applicable)

- Register page: when email_verification enabled, show "Check your email to verify" messaging
- When disabled, show standard "Account created" messaging

### 4.3 GREEN - Implement
- Update Register.tsx success state based on `usePublicFeatureFlag('email_verification')`
- Add to PUBLIC_FLAGS if needed

---

## Phase 5: Public API and Batch Fetching

**Purpose**: Reduce API calls when multiple flags needed on same page.

### 5.1 Backend

**File**: `backend/src/routes/featureFlags.ts`

Add:
```
GET /api/feature-flags/public
```
Returns `{ registration, password_reset, google_oauth, github_oauth, microsoft_oauth }` in one response. No auth.

### 5.2 Frontend

**File**: `frontend/src/hooks/useFeatureFlag.ts`

Add:
```typescript
export const usePublicFeatureFlags = (flagNames: string[]) => {
  // Single query that fetches all public flags
  // Returns { [key]: boolean }
};
```

Use in Login (registration + password_reset + oauth flags), Register, etc.

---

## Test Count Summary

| Phase | New Tests (Est.) |
|-------|------------------|
| Phase 1 Backend OAuth | 6–8 |
| Phase 2 Registration | 6–8 |
| Phase 3 OAuth Buttons | 5–7 |
| Phase 4 Email Verification | 2–3 (if applicable) |
| Phase 5 Batch API | 2–3 |
| **Total** | **~25–30** |

---

## Implementation Order

1. **Phase 1** – Backend OAuth runtime (unblocks Phase 3 backend behavior)
2. **Phase 2** – Registration frontend (simplest, one flag)
3. **Phase 3** – OAuth buttons frontend
4. **Phase 4** – Email verification (if needed)
5. **Phase 5** – Batch API optimization (optional, can defer)

---

## Files to Create/Modify

### Backend
- `backend/src/services/featureFlagRuntimeService.ts` – add OAuth fallbacks
- `backend/src/routes/featureFlags.ts` – add OAuth to RUNTIME_FLAGS, PUBLIC_FLAGS
- `backend/src/routes/auth.ts` or oauth handlers – use runtime service
- `backend/src/__tests__/services/featureFlagRuntimeService.test.ts`
- `backend/src/__tests__/routes/auth.oauth*.test.ts`

### Frontend
- `frontend/src/components/Header.tsx`
- `frontend/src/components/OAuthButtons.tsx`
- `frontend/src/components/ConnectedAccounts.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/ForgotPassword.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/hooks/useFeatureFlag.ts` (optional batch hook)
- `frontend/src/api/featureFlags.ts` (optional batch endpoint)
- `frontend/src/__tests__/**` – corresponding test files

---

## Acceptance Criteria

- [x] Admin disables `registration` → Register link hidden everywhere, /register shows disabled message
- [x] Admin disables `google_oauth` → Google button hidden on Login/Register, backend returns 4xx for Google OAuth
- [x] Admin disables `github_oauth` → GitHub button hidden, backend returns 4xx for GitHub OAuth
- [x] Admin disables `microsoft_oauth` → Microsoft button hidden (when UI supports it), backend returns 4xx
- [x] ConnectedAccounts (Profile): Google/GitHub rows hidden when respective flags disabled
- [x] All new behavior covered by unit/integration tests
- [x] Existing tests pass; no regressions
