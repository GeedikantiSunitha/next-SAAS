# Frontend Test Logic Issues Checklist

**Date**: January 10, 2026  
**Test Run Summary After Infrastructure Fixes**:
- **Test Files**: 7 failed, 46 passed (53 total)
- **Tests**: 23 failed, 403 passed (426 total)
- **Errors**: 4 errors (down from 64! ✅)
- **Execution Time**: ~22.84s
- **Pass Rate**: 94.6% (target: 100%)

**Framework**: Test-Driven Development (TDD) with Issue Logging  
**Approach**: Fix one issue → Run tests → Verify progress → Document → Next issue  
**Goal**: 100% test passing, zero errors

---

## 📋 Test Logic Issues Checklist

### Category 1: Mock Setup Issues (React Query / Hooks)

- [ ] **Issue #4**: `useCreatePayment.mockReturnValue is not a function` in `Checkout.stripe.test.tsx`
- [ ] **Issue #5**: `subscribe.mutate is not a function` in `NewsletterSubscription.test.tsx`
- [ ] **Issue #6**: React Query hooks not properly mocked (multiple test files)

### Category 2: Missing Imports / Dependencies

- [ ] **Issue #7**: `useAuth is not defined` in `AdminUsers.tsx` (not a test file, but causing test failures)
- [ ] **Issue #8**: Missing imports in test files

### Category 3: Missing Test Wrappers / Providers

- [ ] **Issue #9**: Missing `QueryClientProvider` in tests using `useQuery` / `useMutation`
- [ ] **Issue #10**: `NotificationBell` component needs `QueryClientProvider` wrapper

### Category 4: Test Expectation Mismatches

- [ ] **Issue #11**: Toast variant mismatch - Expected `"destructive"`, got `"error"` in `ResetPassword.test.tsx`
- [ ] **Issue #12**: Validation error message not appearing in `Checkout.test.tsx`
- [ ] **Issue #13**: Form submission not calling mock functions (test setup issues)

### Category 5: Missing MSW Handlers

- [ ] **Issue #14**: Missing MSW handlers for `/api/notifications/*` (used by `NotificationBell`)
- [ ] **Issue #15**: Missing MSW handlers for `/api/payments/*` (used by `Checkout`)
- [ ] **Issue #16**: Missing MSW handlers for `/api/newsletter/*` (used by `NewsletterSubscription`)
- [ ] **Issue #17**: Missing MSW handlers for `/api/admin/*` (used by admin pages)
- [ ] **Issue #18**: Missing MSW handlers for `/api/profile/*` (used by `Header`)
- [ ] **Issue #19**: Missing MSW handlers for `/api/oauth/*` (used by `OAuthButtons`)
- [ ] **Issue #20**: Missing MSW handlers for password reset endpoints (used by `ResetPassword`)

### Category 6: Component-Specific Test Issues

- [ ] **Issue #21**: `Checkout.test.tsx` - Validation error not showing
- [ ] **Issue #22**: `Checkout.test.tsx` - Form submission not calling mock
- [ ] **Issue #23**: `Checkout.test.tsx` - Loading state not showing
- [ ] **Issue #24**: `Header.test.tsx` - 5 tests failing (need auth context / MSW handlers)
- [ ] **Issue #25**: `NewsletterSubscription.test.tsx` - 5 tests failing (React Query / MSW)
- [ ] **Issue #26**: `OAuthButtons.test.tsx` - Microsoft button not rendering (missing MSW handler)
- [ ] **Issue #27**: `ResetPassword.test.tsx` - 2 tests failing (toast variant / MSW handler)
- [ ] **Issue #28**: `AdminUsers.toggle.test.tsx` - 3 tests failing (useAuth not defined)

---

## 🔄 TDD Framework for Each Issue

**CRITICAL**: Follow this exact sequence for EACH issue. Never skip steps!

### Template Workflow

1. **PRE-STEP Checklist**:
   - [ ] Review Issue Log: Check `FRONTEND_ISSUES_LOG.md` for similar issues
   - [ ] Understand Context: Review related files and dependencies
   - [ ] Ready to Log: Have issue log file open

2. **STEP 1: Write TDD Test (Verify Current State)**
   - [ ] Run specific test file: `npm test -- [test-file-path]`
   - [ ] Document expected vs actual behavior
   - [ ] Verify test fails for the right reason

3. **STEP 2: Run Test (Verify RED Phase)**
   - [ ] Run test: `npm test -- [test-file-path]`
   - [ ] Verify test fails with expected error
   - [ ] Document actual error output

4. **STEP 3: Log Issue (IMMEDIATELY)** ⚠️ **CRITICAL**
   - [ ] **STOP** - Don't continue until logged
   - [ ] Open `frontend/docs/FRONTEND_ISSUES_LOG.md`
   - [ ] **APPEND** (never overwrite) new issue entry
   - [ ] Include: Severity, Category, Problem, Root Cause (TBD), Resolution (TBD), Prevention (TBD)
   - [ ] Update issue count

5. **STEP 4: Implement Fix**
   - [ ] Fix the issue (minimum code to pass)
   - [ ] Follow specific fix steps for each issue
   - [ ] Verify TypeScript compilation: `npx tsc --noEmit` (if applicable)

6. **STEP 5: Run Test (Verify GREEN Phase)**
   - [ ] Run specific test: `npm test -- [test-file-path]`
   - [ ] Verify test passes
   - [ ] Check for regressions: Run related tests

7. **POST-STEP Checklist**:
   - [ ] Run full test suite: `npm test` (track progress)
   - [ ] Update Issue Log: Mark as ✅ RESOLVED
   - [ ] Fill in Root Cause, Resolution, Prevention Strategy
   - [ ] Update statistics in this document
   - [ ] Verify no regressions

---

## 📊 Progress Tracking

### Initial Status (After Infrastructure Fixes)
- ✅ Issues Fixed: 2 (Import path, MSW configuration)
- ❌ Issues Remaining: 26 (test logic issues)
- 📈 Pass Rate: 94.6% (403/426 tests)
- ⚠️ Errors: 4 (down from 64)

### Current Status
- ✅ Issues Fixed: [TBD]
- ❌ Issues Remaining: [TBD]
- 📈 Pass Rate: [TBD]% ([TBD]/426 tests)
- ⚠️ Errors: [TBD]

### Target Status
- ✅ Issues Fixed: 28 (all issues)
- ❌ Issues Remaining: 0
- 📈 Pass Rate: 100% (426/426 tests)
- ⚠️ Errors: 0

---

## 🎯 Recommended Fix Order

### Priority 1: Critical Blocking Issues (Fix First)

1. **Issue #7**: Fix `useAuth is not defined` in `AdminUsers.tsx`
   - **Impact**: Blocks 3 admin tests
   - **Fix**: Add missing import
   - **Expected**: +3 tests passing

2. **Issue #9**: Add `QueryClientProvider` wrapper for tests
   - **Impact**: Blocks multiple tests using React Query
   - **Fix**: Create test helper wrapper
   - **Expected**: Multiple tests can run

### Priority 2: Mock Setup Issues (High Impact)

3. **Issue #4**: Fix `useCreatePayment` mock in `Checkout.stripe.test.tsx`
   - **Impact**: 3 tests failing
   - **Fix**: Properly mock React Query `useMutation`
   - **Expected**: +3 tests passing

4. **Issue #5**: Fix `subscribe.mutate` in `NewsletterSubscription.test.tsx`
   - **Impact**: 5 tests failing
   - **Fix**: Properly mock React Query `useMutation`
   - **Expected**: +5 tests passing

### Priority 3: MSW Handlers (Enable API Mocking)

5. **Issue #14**: Add notifications MSW handlers
   - **Impact**: Enables `NotificationBell` tests
   - **Fix**: Add handlers for `/api/notifications/*`
   - **Expected**: Removes unhandled request warnings

6. **Issue #15**: Add payments MSW handlers
   - **Impact**: Enables payment-related tests
   - **Fix**: Add handlers for `/api/payments/*`
   - **Expected**: +3-5 tests passing

7. **Issue #16**: Add newsletter MSW handlers
   - **Impact**: Enables newsletter tests
   - **Fix**: Add handlers for `/api/newsletter/*`
   - **Expected**: +5 tests passing

8. **Issue #17**: Add admin MSW handlers
   - **Impact**: Enables admin tests
   - **Fix**: Add handlers for `/api/admin/*`
   - **Expected**: +3-5 tests passing

9. **Issue #18**: Add profile MSW handlers
   - **Impact**: Enables `Header` tests
   - **Fix**: Add handlers for `/api/profile/*`
   - **Expected**: +5 tests passing

10. **Issue #19**: Add OAuth MSW handlers
    - **Impact**: Enables OAuth tests
    - **Fix**: Add handlers for `/api/oauth/*`
    - **Expected**: +1 test passing

11. **Issue #20**: Add password reset MSW handlers
    - **Impact**: Enables `ResetPassword` tests
    - **Fix**: Add handlers for `/api/auth/reset-password`
    - **Expected**: +2 tests passing

### Priority 4: Test Expectation Fixes

12. **Issue #11**: Fix toast variant expectations
    - **Impact**: 2 tests failing
    - **Fix**: Update test expectations to match implementation (`"error"` instead of `"destructive"`)
    - **Expected**: +2 tests passing

13. **Issue #12-13**: Fix validation/form submission tests
    - **Impact**: 3 tests failing
    - **Fix**: Fix test setup, wait for async updates
    - **Expected**: +3 tests passing

### Priority 5: Component-Specific Issues

14. **Issue #21-23**: Fix `Checkout.test.tsx` issues
15. **Issue #24**: Fix `Header.test.tsx` issues (after MSW handlers)
16. **Issue #25**: Fix `NewsletterSubscription.test.tsx` issues (after MSW handlers)
17. **Issue #26**: Fix `OAuthButtons.test.tsx` issues (after MSW handlers)
18. **Issue #27**: Fix `ResetPassword.test.tsx` issues (after MSW handlers)
19. **Issue #28**: Fix `AdminUsers.toggle.test.tsx` issues (after Issue #7)

---

## 🔧 Quick Test Commands

### Run Full Test Suite
```bash
cd /Users/user/Desktop/AI/projects/nextsaas/frontend
npm test > test-run-output.log 2>&1
```

### Check Test Summary
```bash
cd /Users/user/Desktop/AI/projects/nextsaas/frontend
tail -20 test-run-output.log | grep -E "Test Files|Tests:|PASS|FAIL|Errors"
```

### Run Specific Test File
```bash
cd /Users/user/Desktop/AI/projects/nextsaas/frontend
npm test -- src/__tests__/components/Checkout.test.tsx
```

### Run Tests for a Directory
```bash
cd /Users/user/Desktop/AI/projects/nextsaas/frontend
npm test -- src/__tests__/components/
```

### Check Progress After Each Fix
```bash
cd /Users/user/Desktop/AI/projects/nextsaas/frontend && npm test 2>&1 | tail -10 | grep -E "Test Files|Tests:|PASS|FAIL"
```

---

## 📝 Issue Details (Will be filled as we fix them)

### Issue #4: useCreatePayment Mock Setup

**Status**: ⏳ PENDING  
**Priority**: 🟠 HIGH  
**Category**: Mock Setup / React Query  
**File**: `src/__tests__/components/Checkout.stripe.test.tsx`

**Problem**:
```typescript
TypeError: useCreatePayment.mockReturnValue is not a function
```

**Root Cause** (TBD):
- React Query `useMutation` hook not properly mocked
- `useCreatePayment` returns a mutation object, not a function

**Fix** (TBD):
- Mock `useCreatePayment` to return proper React Query mutation object
- Mock should include `mutate`, `mutateAsync`, `isLoading`, `isError`, etc.

**Test Command**:
```bash
npm test -- src/__tests__/components/Checkout.stripe.test.tsx
```

---

### Issue #5: subscribe.mutate Mock Setup

**Status**: ⏳ PENDING  
**Priority**: 🟠 HIGH  
**Category**: Mock Setup / React Query  
**File**: `src/__tests__/components/NewsletterSubscription.test.tsx`

**Problem**:
```typescript
TypeError: subscribe.mutate is not a function
```

**Root Cause** (TBD):
- React Query `useMutation` hook not properly mocked
- `subscribe` should return mutation object with `mutate` method

**Fix** (TBD):
- Mock `useSubscribeToNewsletter` to return proper mutation object
- Similar to Issue #4

**Test Command**:
```bash
npm test -- src/__tests__/components/NewsletterSubscription.test.tsx
```

---

### Issue #7: useAuth Not Defined

**Status**: ⏳ PENDING  
**Priority**: 🔴 CRITICAL  
**Category**: Missing Import  
**File**: `src/pages/admin/AdminUsers.tsx` (source file, not test)

**Problem**:
```typescript
ReferenceError: useAuth is not defined
```

**Root Cause** (TBD):
- Missing import statement for `useAuth` hook
- Should import from `@/contexts/AuthContext` or similar

**Fix** (TBD):
- Add missing import: `import { useAuth } from '@/contexts/AuthContext';`

**Test Command**:
```bash
npm test -- src/__tests__/pages/admin/AdminUsers.toggle.test.tsx
```

---

### Issue #9: Missing QueryClientProvider

**Status**: ⏳ PENDING  
**Priority**: 🔴 CRITICAL  
**Category**: Missing Test Wrapper  
**Files**: Multiple test files

**Problem**:
```typescript
Error: No QueryClient set, use QueryClientProvider to set one
```

**Root Cause** (TBD):
- Tests using React Query hooks need `QueryClientProvider` wrapper
- `NotificationBell` component uses `useQuery` but tests don't provide provider

**Fix** (TBD):
- Create test helper function that wraps component with `QueryClientProvider`
- Use in all tests that use React Query hooks

**Test Command**:
```bash
npm test -- src/__tests__/pages/Login.test.tsx
```

---

### Issue #11: Toast Variant Mismatch

**Status**: ⏳ PENDING  
**Priority**: 🟡 MEDIUM  
**Category**: Test Expectation  
**File**: `src/__tests__/pages/ResetPassword.test.tsx`

**Problem**:
```typescript
Expected: variant: "destructive"
Received: variant: "error"
```

**Root Cause** (TBD):
- Component implementation changed toast variant from `"destructive"` to `"error"`
- Test expectations not updated

**Fix** (TBD):
- Update test expectations to match implementation
- Change `variant: "destructive"` to `variant: "error"`

**Test Command**:
```bash
npm test -- src/__tests__/pages/ResetPassword.test.tsx
```

---

### Issue #14: Missing Notifications MSW Handlers

**Status**: ⏳ PENDING  
**Priority**: 🟡 MEDIUM  
**Category**: Missing MSW Handler  
**File**: `tests/mocks/handlers.ts`

**Problem**:
```
[MSW] Warning: intercepted a request without a matching request handler:
  • GET http://localhost:3001/api/notifications/unread-count
  • GET http://localhost:3001/api/notifications?limit=5
```

**Root Cause** (TBD):
- MSW handlers file doesn't include notification endpoints
- `NotificationBell` component makes these API calls

**Fix** (TBD):
- Add handlers for `/api/notifications/unread-count`
- Add handlers for `/api/notifications`
- Return appropriate mock data

**Test Command**:
```bash
npm test -- src/__tests__/components/admin/AdminLayout.test.tsx
```

---

## 📊 Progress Summary Table

| Issue # | Category | Priority | Status | Tests Affected | Fix Time |
|---------|----------|----------|--------|----------------|----------|
| #4 | Mock Setup | HIGH | ⏳ PENDING | 3 | TBD |
| #5 | Mock Setup | HIGH | ⏳ PENDING | 5 | TBD |
| #6 | Mock Setup | MEDIUM | ⏳ PENDING | TBD | TBD |
| #7 | Missing Import | CRITICAL | ⏳ PENDING | 3 | TBD |
| #8 | Missing Import | MEDIUM | ⏳ PENDING | TBD | TBD |
| #9 | Missing Wrapper | CRITICAL | ⏳ PENDING | Multiple | TBD |
| #10 | Missing Wrapper | MEDIUM | ⏳ PENDING | TBD | TBD |
| #11 | Expectation | MEDIUM | ⏳ PENDING | 2 | TBD |
| #12 | Expectation | MEDIUM | ⏳ PENDING | 1 | TBD |
| #13 | Expectation | MEDIUM | ⏳ PENDING | 2 | TBD |
| #14-20 | MSW Handlers | MEDIUM | ⏳ PENDING | Multiple | TBD |
| #21-28 | Component Tests | MEDIUM | ⏳ PENDING | 23 | TBD |

---

**Last Updated**: 2026-01-10  
**Next Action**: Start fixing issues in priority order, following TDD framework
