# Phase 2 TDD Implementation Plan

**Date**: December 22, 2025  
**Status**: Planning  
**Approach**: Test-Driven Development (TDD)  
**Focus**: Security Fix + Advanced Features with E2E Integration

---

## 🎯 Executive Summary

This plan implements **Phase 2 features using strict TDD methodology**, incorporating all lessons learned from Phase 1 and E2E integration testing with the backend.

### Priority Order

1. **🔴 CRITICAL**: Fix Token Storage Security Issue (HTTP-only cookies)
2. **🟡 HIGH**: User Profile Management
3. **🟡 HIGH**: Advanced UI Components (Modal, Toast, Loading states)
4. **🟢 MEDIUM**: React Query Integration
5. **🟢 MEDIUM**: Error Boundaries

---

## 📚 Lessons Learned from Phase 1 & ISSUES_LOG

### Critical Lessons Applied

1. **TDD Must Come First** (Issue #24)
   - ❌ Phase 1: Code-first approach created technical debt
   - ✅ Phase 2: Write tests FIRST, then implement

2. **E2E Integration Testing** (Issues #41-46)
   - Always test with real backend, not just mocks
   - API response formats must match exactly
   - Test authentication flows end-to-end
   - Handle async state updates properly

3. **React Hooks Order** (Issue #37)
   - All hooks must be called before any conditional returns
   - Use `useEffect` for async state-based redirects

4. **Test ID Uniqueness** (Issue #38)
   - Use unique test IDs based on context (e.g., `${fieldName}-error`)
   - Avoid duplicate test IDs in forms

5. **Mock Strategy** (Issue #40)
   - Mock at the closest layer (hooks vs API)
   - Direct hook mocking for unit tests
   - API mocking for integration tests

6. **Axios Interceptors** (Issue #42)
   - Exclude auth endpoints from token refresh logic
   - Prevent interceptor interference with error handling

7. **Security First** (ISSUES_LOG - Security Issue)
   - Never use localStorage for tokens
   - Always use HTTP-only cookies
   - Review security checklist before implementation

---

## 🔒 Feature 1: Token Storage Security Fix (CRITICAL)

### Overview

**Current Issue**: Access token stored in `localStorage` (vulnerable to XSS)  
**Target**: Move access token to HTTP-only cookie (secure)  
**Priority**: 🔴 CRITICAL - Security violation

### TDD Approach

#### Step 1: Write Backend Tests First (RED)

**Test File**: `backend/src/__tests__/routes/auth.test.ts`

```typescript
describe('POST /api/auth/login - Cookie-based tokens', () => {
  it('should set access token as HTTP-only cookie', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });
    
    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    
    const cookies = response.headers['set-cookie'];
    const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
    
    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie).toContain('HttpOnly');
    expect(accessTokenCookie).toContain('Secure');
    expect(accessTokenCookie).toContain('SameSite=Strict');
  });

  it('should set refresh token as HTTP-only cookie', async () => {
    // Similar test for refresh token
  });

  it('should NOT return access token in response body', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });
    
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('user');
  });
});

describe('POST /api/auth/register - Cookie-based tokens', () => {
  it('should set access token as HTTP-only cookie after registration', async () => {
    // Test register endpoint sets cookies
  });
});

describe('POST /api/auth/refresh - Cookie-based token refresh', () => {
  it('should set new access token as HTTP-only cookie', async () => {
    // Test refresh endpoint sets new cookie
  });
});
```

#### Step 2: Write Frontend Tests First (RED)

**Test File**: `frontend/src/__tests__/api/client.test.ts`

```typescript
describe('API Client - Cookie-based Authentication', () => {
  it('should NOT add Authorization header (cookies sent automatically)', async () => {
    const mockRequest = vi.fn();
    // Mock axios to capture request config
    // Verify no Authorization header is set
  });

  it('should NOT read access token from localStorage', async () => {
    // Verify localStorage.getItem('accessToken') is never called
  });

  it('should handle 401 errors without localStorage token', async () => {
    // Test token refresh flow without localStorage
  });
});
```

**Test File**: `frontend/src/__tests__/contexts/AuthContext.test.ts`

```typescript
describe('AuthContext - Cookie-based Authentication', () => {
  it('should NOT store access token in localStorage on login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('should check authentication via /api/auth/me on mount', async () => {
    // Test that checkAuth uses cookies automatically
  });

  it('should clear cookies on logout', async () => {
    // Test logout clears cookies (via API call)
  });
});
```

#### Step 3: Write E2E Tests First (RED)

**Test File**: `tests/e2e/full-stack-auth-cookies.spec.ts`

```typescript
test('Access token stored in HTTP-only cookie, not localStorage', async ({ page }) => {
  // Register user
  await page.goto('http://localhost:3000/register');
  await page.fill('[name="email"]', 'cookie-test@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard');
  
  // Check localStorage - should NOT have accessToken
  const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  expect(accessToken).toBeNull();
  
  // Check cookies - should have accessToken cookie
  const cookies = await page.context().cookies();
  const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
  expect(accessTokenCookie).toBeDefined();
  expect(accessTokenCookie?.httpOnly).toBe(true);
});

test('JavaScript cannot access access token cookie', async ({ page }) => {
  // Verify that document.cookie does not include accessToken
  const cookies = await page.evaluate(() => document.cookie);
  expect(cookies).not.toContain('accessToken');
});

test('Authentication works with cookie-based tokens', async ({ page }) => {
  // Full flow: Register → Login → Access Protected → Logout
  // All should work with cookies only
});
```

#### Step 4: Implement Backend (GREEN)

**File**: `backend/src/routes/auth.ts`

```typescript
// Update login endpoint
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);
  
  // Set access token as HTTP-only cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  // Set refresh token as HTTP-only cookie (already done, verify)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  // Return user only (no tokens in body)
  res.json({
    success: true,
    data: { user },
  });
}));
```

#### Step 5: Implement Frontend (GREEN)

**File**: `frontend/src/api/client.ts`

```typescript
// Remove Authorization header logic
// Cookies are sent automatically by browser

// Update request interceptor
apiClient.interceptors.request.use((config) => {
  // No need to add Authorization header
  // Cookies are sent automatically
  return config;
});
```

**File**: `frontend/src/contexts/AuthContext.tsx`

```typescript
// Remove all localStorage.setItem('accessToken', ...)
// Remove all localStorage.getItem('accessToken')
// Remove all localStorage.removeItem('accessToken')

// Update login function
const login = async (email: string, password: string) => {
  const response = await authApi.login({ email, password });
  // Cookies are set automatically by backend
  // No need to store in localStorage
  setUser(response.data.user);
};

// Update checkAuth
const checkAuth = async () => {
  try {
    const response = await authApi.getMe();
    setUser(response.data);
  } catch (error) {
    // Cookies invalid or expired
    setUser(null);
  }
};
```

#### Step 6: Refactor (REFACTOR)

- Extract cookie configuration to constants
- Add cookie utilities for testing
- Update error handling for cookie-based auth

#### Step 7: E2E Verification

- Run all E2E tests
- Verify cookies in browser DevTools
- Test cross-tab behavior
- Test logout clears cookies

---

## 👤 Feature 2: User Profile Management

### Overview

**Features**:
- View profile page
- Edit profile (name, email)
- Change password
- Profile picture upload (optional)

### TDD Approach

#### Step 1: Write Backend Tests First (RED)

**Test File**: `backend/src/__tests__/routes/profile.test.ts`

```typescript
describe('GET /api/profile/me', () => {
  it('should return current user profile', async () => {
    // Test authenticated user can get profile
  });

  it('should return 401 if not authenticated', async () => {
    // Test unauthenticated request
  });
});

describe('PUT /api/profile/me', () => {
  it('should update user profile', async () => {
    // Test updating name and email
  });

  it('should validate email format', async () => {
    // Test email validation
  });

  it('should prevent duplicate email', async () => {
    // Test email uniqueness
  });
});

describe('PUT /api/profile/password', () => {
  it('should change password with correct current password', async () => {
    // Test password change
  });

  it('should reject incorrect current password', async () => {
    // Test password validation
  });
});
```

#### Step 2: Write Frontend Tests First (RED)

**Test File**: `frontend/src/__tests__/pages/Profile.test.tsx`

```typescript
describe('Profile Page', () => {
  it('should display user profile information', async () => {
    // Test profile display
  });

  it('should allow editing profile', async () => {
    // Test edit form
  });

  it('should validate email format', async () => {
    // Test email validation
  });

  it('should show error on update failure', async () => {
    // Test error handling
  });
});
```

#### Step 3: Write E2E Tests First (RED)

**Test File**: `tests/e2e/full-stack-profile.spec.ts`

```typescript
test('User can view and edit profile', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'profile-test@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  // Navigate to profile
  await page.goto('http://localhost:3000/profile');
  
  // Verify profile displayed
  await expect(page.locator('text=profile-test@example.com')).toBeVisible();
  
  // Edit profile
  await page.click('button:has-text("Edit")');
  await page.fill('[name="name"]', 'Updated Name');
  await page.click('button:has-text("Save")');
  
  // Verify update
  await expect(page.locator('text=Updated Name')).toBeVisible();
});
```

#### Step 4: Implement (GREEN)

- Backend routes
- Frontend pages
- API integration

#### Step 5: Refactor (REFACTOR)

- Extract form validation
- Optimize API calls
- Improve error messages

---

## 🎨 Feature 3: Advanced UI Components

### Components to Build

1. **Modal/Dialog Component**
2. **Toast/Notification Component**
3. **Loading States**
4. **Skeleton Loaders**

### TDD Approach

#### Step 1: Write Component Tests First (RED)

**Test File**: `frontend/src/__tests__/components/ui/Modal.test.tsx`

```typescript
describe('Modal Component', () => {
  it('should render when open', () => {
    // Test modal visibility
  });

  it('should close when clicking overlay', async () => {
    // Test close on overlay click
  });

  it('should close when pressing Escape', async () => {
    // Test keyboard close
  });

  it('should trap focus inside modal', () => {
    // Test focus management
  });
});
```

#### Step 2: Write Integration Tests (RED)

**Test File**: `frontend/src/__tests__/components/ui/Toast.test.tsx`

```typescript
describe('Toast Component', () => {
  it('should display success message', async () => {
    // Test toast display
  });

  it('should auto-dismiss after timeout', async () => {
    // Test auto-dismiss
  });

  it('should support multiple toasts', () => {
    // Test toast queue
  });
});
```

#### Step 3: Write E2E Tests (RED)

**Test File**: `tests/e2e/full-stack-ui-components.spec.ts`

```typescript
test('Modal opens and closes correctly', async ({ page }) => {
  // Test modal in real browser
});

test('Toast notifications appear and dismiss', async ({ page }) => {
  // Test toast in real browser
});
```

#### Step 4: Implement (GREEN)

- Build components
- Integrate with shadcn/ui
- Add animations

#### Step 5: Refactor (REFACTOR)

- Extract common patterns
- Optimize performance
- Improve accessibility

---

## 🔄 Feature 4: React Query Integration

### Overview

Replace manual API state management with React Query for:
- Automatic caching
- Background refetching
- Optimistic updates
- Error retry logic

### TDD Approach

#### Step 1: Write Tests First (RED)

**Test File**: `frontend/src/__tests__/hooks/useProfile.test.ts`

```typescript
describe('useProfile hook', () => {
  it('should fetch profile data', async () => {
    // Test React Query hook
  });

  it('should cache profile data', async () => {
    // Test caching
  });

  it('should refetch on window focus', async () => {
    // Test refetch behavior
  });
});
```

#### Step 2: Write E2E Tests (RED)

**Test File**: `tests/e2e/full-stack-react-query.spec.ts`

```typescript
test('Profile data is cached and refetched', async ({ page }) => {
  // Test caching behavior in browser
});
```

#### Step 3: Implement (GREEN)

- Set up React Query
- Migrate API calls
- Add query hooks

#### Step 4: Refactor (REFACTOR)

- Optimize query keys
- Add query invalidation
- Implement optimistic updates

---

## 🛡️ Feature 5: Error Boundaries

### Overview

Add global and route-level error boundaries for graceful error handling.

### TDD Approach

#### Step 1: Write Tests First (RED)

**Test File**: `frontend/src/__tests__/components/ErrorBoundary.test.tsx`

```typescript
describe('ErrorBoundary', () => {
  it('should catch errors in children', () => {
    // Test error catching
  });

  it('should display error UI', () => {
    // Test error display
  });

  it('should allow error recovery', async () => {
    // Test reset functionality
  });
});
```

#### Step 2: Write E2E Tests (RED)

**Test File**: `tests/e2e/full-stack-error-boundaries.spec.ts`

```typescript
test('Error boundary displays on component error', async ({ page }) => {
  // Test error boundary in browser
});
```

#### Step 3: Implement (GREEN)

- Create ErrorBoundary component
- Add to App.tsx
- Add route-level boundaries

#### Step 4: Refactor (REFACTOR)

- Improve error messages
- Add error reporting
- Add recovery options

---

## 📋 Implementation Checklist

### For Each Feature

- [ ] **RED**: Write failing tests first
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
- [ ] **GREEN**: Implement minimal code to pass tests
- [ ] **REFACTOR**: Improve code while keeping tests green
- [ ] **VERIFY**: Run full test suite
- [ ] **DOCUMENT**: Update documentation
- [ ] **SECURITY**: Review security checklist
- [ ] **E2E**: Verify with real backend

### Security Checklist (Per Feature)

- [ ] Input validation (all inputs)
- [ ] Authentication required (protected endpoints)
- [ ] Authorization checked (user can access resource)
- [ ] SQL injection prevention (backend)
- [ ] XSS prevention (frontend)
- [ ] Error handling doesn't leak information
- [ ] Rate limiting (backend)
- [ ] Secrets not in code
- [ ] Security headers configured

### Code Quality Checklist (Per Feature)

- [ ] TypeScript strict mode passes
- [ ] Linter passes
- [ ] All tests pass
- [ ] Code is readable and well-organized
- [ ] Functions are small and focused
- [ ] Meaningful names used
- [ ] No memory leaks
- [ ] Error handling implemented
- [ ] Logging added for important operations

---

## 🧪 Testing Strategy

### Test Pyramid

1. **Unit Tests (70%)**
   - Component tests
   - Hook tests
   - Utility function tests
   - Fast, isolated, many tests

2. **Integration Tests (20%)**
   - API integration tests
   - Component interaction tests
   - Medium speed, some tests

3. **E2E Tests (10%)**
   - Full user journeys
   - Real backend integration
   - Slow, comprehensive, few tests

### E2E Test Requirements

- **Always test with real backend**
- **Test complete user flows**
- **Verify cookies in browser**
- **Test error scenarios**
- **Test authentication flows**
- **Test protected routes**

### Test Naming Convention

```typescript
// Unit tests
describe('ComponentName', () => {
  it('should do something when condition', () => {
    // Test
  });
});

// E2E tests
test('User can complete full workflow', async ({ page }) => {
  // Test
});
```

---

## 📅 Timeline Estimate

### Feature 1: Token Storage Security Fix
- **Time**: 4-6 hours
- **Priority**: 🔴 CRITICAL
- **Dependencies**: None

### Feature 2: User Profile Management
- **Time**: 8-12 hours
- **Priority**: 🟡 HIGH
- **Dependencies**: Feature 1 (security fix)

### Feature 3: Advanced UI Components
- **Time**: 6-8 hours
- **Priority**: 🟡 HIGH
- **Dependencies**: None

### Feature 4: React Query Integration
- **Time**: 6-8 hours
- **Priority**: 🟢 MEDIUM
- **Dependencies**: Feature 2 (profile management)

### Feature 5: Error Boundaries
- **Time**: 4-6 hours
- **Priority**: 🟢 MEDIUM
- **Dependencies**: None

**Total Estimate**: 28-40 hours (1-2 weeks)

---

## 🚀 Getting Started

### Step 1: Set Up Feature Branch

```bash
git checkout -b phase2/security-token-storage
```

### Step 2: Start with Feature 1 (Security Fix)

1. Write backend tests (RED)
2. Run tests (should fail)
3. Implement backend (GREEN)
4. Write frontend tests (RED)
5. Implement frontend (GREEN)
6. Write E2E tests (RED)
7. Verify E2E (GREEN)
8. Refactor (REFACTOR)
9. Run full test suite
10. Update documentation

### Step 3: Continue with Next Feature

Repeat TDD cycle for each feature.

---

## 📝 Documentation Updates

After each feature:

- [ ] Update `FRONTEND_STATUS.md`
- [ ] Update `ISSUES_LOG.md` (if issues encountered)
- [ ] Update API documentation
- [ ] Update component documentation
- [ ] Update E2E test documentation

---

## ✅ Success Criteria

### Feature 1 (Security Fix)
- [ ] All tokens in HTTP-only cookies
- [ ] No localStorage usage for tokens
- [ ] All tests passing (unit + E2E)
- [ ] Security checklist verified
- [ ] E2E tests verify cookies in browser

### Feature 2 (Profile Management)
- [ ] Profile page functional
- [ ] Edit profile works
- [ ] Change password works
- [ ] All tests passing
- [ ] E2E tests verify full flow

### Feature 3 (UI Components)
- [ ] Modal component works
- [ ] Toast component works
- [ ] Loading states work
- [ ] All tests passing
- [ ] Accessible (ARIA labels)

### Feature 4 (React Query)
- [ ] API calls use React Query
- [ ] Caching works correctly
- [ ] Refetching works
- [ ] All tests passing
- [ ] Performance improved

### Feature 5 (Error Boundaries)
- [ ] Global error boundary works
- [ ] Route-level boundaries work
- [ ] Error recovery works
- [ ] All tests passing
- [ ] User-friendly error messages

---

## 🎯 Key Principles

1. **TDD First**: Always write tests before code
2. **E2E Integration**: Always test with real backend
3. **Security First**: Review security checklist for every feature
4. **Lessons Learned**: Apply all lessons from Phase 1
5. **Documentation**: Update docs after each feature
6. **Refactor**: Improve code while keeping tests green

---

**Last Updated**: December 22, 2025  
**Status**: Ready to Begin Implementation  
**Next Step**: Start Feature 1 (Token Storage Security Fix)

