# Remaining E2E Test Failures - Analysis & Fix Plan

**Date**: January 10, 2026, 23:51:22  
**Status**: 8 failures remaining (91.8% pass rate)

---

## 📊 Summary

**Current Status**: 89/97 tests passing (91.8%)  
**Target**: 97/97 tests passing (100%)  
**Remaining**: 8 failures

**Progress**: 
- ✅ Fixed Issue #1 (Session constraint) → +6 tests
- ✅ Fixed Issue #3 (Login redirect + locators) → +6 tests  
- **Total Improvement**: +12 tests (from 77 → 89)

---

## 🔴 Priority 1: Admin Dashboard Tests (5 failures)

### Problem
All 5 admin dashboard tests fail because they try to update a regular user's role to `ADMIN` via `/api/admin/users/:id`, but:
1. **Permission Issue**: Regular `USER` role cannot change roles (only `SUPER_ADMIN` can)
2. **Token Issue**: `registerData.data.token` is `undefined` (tokens are in HTTP-only cookies, not response body)
3. **Test Logic Error**: Should use `/api/test-helpers/users/admin` endpoint instead

### Test Pattern (Current - INCORRECT)
```typescript
// In full-stack-admin-dashboard.spec.ts (lines 25-52)
const registerResponse = await request.post('/api/auth/register', {
  data: { email: uniqueEmail, password: password, name: 'Admin User' },
});
const registerData = await registerResponse.json();
const userId = registerData.data.id;

// ❌ WRONG: Trying to update role as regular user
const updateResponse = await request.put(`/api/admin/users/${userId}`, {
  headers: { Cookie: `accessToken=${registerData.data.token || ''}` }, // ❌ token is undefined
  data: { role: 'ADMIN' }, // ❌ USER can't change roles
});
```

### Fix Pattern (Correct - Based on `full-stack-observability.spec.ts`)
```typescript
// ✅ CORRECT: Use test helper endpoint
const createAdminResponse = await request.post('http://localhost:3001/api/test-helpers/users/admin', {
  data: {
    email: uniqueEmail,
    password: password,
    name: 'Admin User',
    role: 'ADMIN', // Directly create as ADMIN
  },
});
expect(createAdminResponse.status()).toBe(201);

// Then login via frontend and use cookies
await page.goto('/login');
await page.fill('input[name="email"]', uniqueEmail);
await page.fill('input[name="password"]', password);
await page.click('button[type="submit"]');
await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

// Get cookies for subsequent API calls
const cookies = await page.context().cookies();
const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
```

### Affected Tests
1. `Admin can access dashboard and see statistics` (line 25)
2. `Dashboard shows correct user count` (line 99)  
3. `Dashboard shows active sessions` (line 158)
4. `Dashboard shows recent activity from audit logs` (line 233) - 30s timeout
5. `Dashboard shows system health information` (line 287)

### Fix Command
```bash
# Test after fix
npx playwright test tests/e2e/full-stack-admin-dashboard.spec.ts
```

### Estimated Time: 30 minutes

---

## 🟡 Priority 2: Form Validation Tests (2 failures)

### Test 1: Form Validation Works Before API Call

**Test**: `full-stack-auth.spec.ts:247`  
**Expected**: Submit form with `invalid-email` should show validation error before API call  
**Current**: Error element `[data-testid="email-error"]` not found

**Root Cause Analysis**:
- Input component creates test ID: `email-error` (from `name="email"` or `id="email"`)
- React Hook Form validation mode: `onSubmit` (validates when form is submitted)
- Error should appear after clicking submit button

**Possible Issues**:
1. **Timing**: Error might need more time to appear (React re-render)
2. **Validation Not Triggering**: Form might not be validating on submit
3. **Error Display**: Input component error might not be rendering

**Test Code**:
```typescript
// Test expects this locator:
const errorElement = page.locator('[data-testid="email-error"]');
await expect(errorElement).toBeVisible({ timeout: 5000 });
```

**Investigation Steps**:
1. Check if Input component is actually rendering error (add debug logs)
2. Verify React Hook Form validation is working (check form state)
3. Increase timeout or add explicit wait for validation
4. Check if validation schema is correct (`z.string().email('Invalid email address')`)

**Fix Command**:
```bash
# Debug this specific test
npx playwright test tests/e2e/full-stack-auth.spec.ts:247 --ui
```

### Test 2: Duplicate Email Registration Shows Error

**Test**: `full-stack-auth.spec.ts:176`  
**Expected**: Second registration with same email should show error message  
**Current**: Error message `[data-testid="error-message"]` not appearing or not matching

**Root Cause Analysis**:
- Register component has `data-testid="error-message"` (line 95 in Register.tsx) ✅
- Backend returns `409 Conflict` with `{ success: false, error: "Email already registered" }`
- Frontend should set error state and display it

**Possible Issues**:
1. **Error State Not Setting**: API error might not be caught correctly
2. **Timing**: Error might need more time to appear after API call
3. **Error Message Format**: Backend error message might not match expected pattern
4. **Test Expectation**: Regex pattern might be too strict

**Test Code**:
```typescript
// Test expects this locator:
const errorMessage = page.locator('[data-testid="error-message"]');
await expect(errorMessage).toBeVisible({ timeout: 10000 });

// And this text pattern:
const errorText = await errorMessage.textContent();
expect(errorText?.toLowerCase()).toMatch(/email.*already|already.*registered|registration.*failed/i);
```

**Investigation Steps**:
1. Check backend response format (verify 409 is returned)
2. Check Register component error handling (verify error state is set)
3. Verify error message appears in DOM (check network tab)
4. Update test to wait for API call completion before checking error

**Fix Command**:
```bash
# Debug this specific test
npx playwright test tests/e2e/full-stack-auth.spec.ts:176 --ui
```

### Estimated Time: 20 minutes each (40 minutes total)

---

## 🟡 Priority 3: Profile Duplicate Email (1 failure)

**Test**: `full-stack-profile.spec.ts:188`  
**Expected**: Update profile email to existing email should show error  
**Current**: Error toast notification not appearing or not matching pattern

**Root Cause Analysis**:
- Profile update uses toast notifications for errors (not inline errors)
- Test looks for toast with regex: `/email.*already|already.*registered|email.*exists|duplicate.*email/i`
- Backend should return `409 Conflict` or validation error

**Possible Issues**:
1. **Toast Not Appearing**: Toast notification might not be triggered
2. **Timing**: Toast might appear and disappear before test checks
3. **Error Message Format**: Backend error might not match expected pattern
4. **Test Locator**: Toast locator might be incorrect

**Test Code**:
```typescript
// Test expects this locator:
await expect(
  page.getByText(/email.*already|already.*registered|email.*exists|duplicate.*email/i).first()
).toBeVisible({ timeout: 15000 });
```

**Investigation Steps**:
1. Check Profile component error handling (verify toast is called)
2. Check backend response (verify duplicate email error format)
3. Verify toast appears in DOM (check network tab and React DevTools)
4. Update test to wait for toast to appear (might need longer timeout)

**Fix Command**:
```bash
# Debug this specific test
npx playwright test tests/e2e/full-stack-profile.spec.ts:188 --ui
```

### Estimated Time: 15 minutes

---

## 🎯 Recommended Fix Order

### Step 1: Fix Admin Dashboard Tests (5 failures) - ~30 min
**Impact**: +5 tests passing (94/97 = 96.9%)

**Commands**:
```bash
# 1. Update tests/e2e/full-stack-admin-dashboard.spec.ts
# 2. Test fix
npx playwright test tests/e2e/full-stack-admin-dashboard.spec.ts
```

### Step 2: Fix Form Validation Tests (2 failures) - ~40 min
**Impact**: +2 tests passing (96/97 = 98.9%)

**Commands**:
```bash
# 1. Debug form validation test
npx playwright test tests/e2e/full-stack-auth.spec.ts:247 --ui

# 2. Debug duplicate email test
npx playwright test tests/e2e/full-stack-auth.spec.ts:176 --ui

# 3. Test both fixes
npx playwright test tests/e2e/full-stack-auth.spec.ts
```

### Step 3: Fix Profile Duplicate Email (1 failure) - ~15 min
**Impact**: +1 test passing (97/97 = 100%) ✅

**Commands**:
```bash
# 1. Debug profile duplicate email test
npx playwright test tests/e2e/full-stack-profile.spec.ts:188 --ui

# 2. Test fix
npx playwright test tests/e2e/full-stack-profile.spec.ts:188
```

### Step 4: Final Verification - ~6 min
**Impact**: Verify all 97 tests pass

**Command**:
```bash
# Run full E2E suite
npm run test:e2e
```

---

## 📝 Quick Reference Commands

### Run Specific Test File
```bash
npx playwright test tests/e2e/full-stack-admin-dashboard.spec.ts
npx playwright test tests/e2e/full-stack-auth.spec.ts
npx playwright test tests/e2e/full-stack-profile.spec.ts
```

### Run Specific Test (by line number)
```bash
npx playwright test tests/e2e/full-stack-auth.spec.ts:247
npx playwright test tests/e2e/full-stack-auth.spec.ts:176
npx playwright test tests/e2e/full-stack-profile.spec.ts:188
```

### Run with UI Mode (Interactive Debugging)
```bash
npx playwright test tests/e2e/full-stack-admin-dashboard.spec.ts --ui
npx playwright test tests/e2e/full-stack-auth.spec.ts:247 --ui
```

### Run Full Suite
```bash
npm run test:e2e
```

### Save Output to File
```bash
npm run test:e2e 2>&1 | tee tests/e2e/test-run-output-$(date +%Y%m%d-%H%M%S).log
```

---

## 📈 Expected Progress After Fixes

| Step | Tests Passing | Pass Rate | Improvement |
|------|---------------|-----------|-------------|
| **Current** | 89/97 | 91.8% | Baseline |
| **After Admin Dashboard Fix** | 94/97 | 96.9% | +5 tests ✅ |
| **After Form Validation Fix** | 96/97 | 98.9% | +2 tests ✅ |
| **After Profile Duplicate Fix** | **97/97** | **100%** | +1 test ✅ |

**Total Time Estimate**: ~85 minutes (1.5 hours)

---

**Last Updated**: January 10, 2026, 23:51:22  
**Status**: ⏳ Ready to fix - Analysis complete  
**Next Action**: Start with Priority 1 (Admin Dashboard Tests)
