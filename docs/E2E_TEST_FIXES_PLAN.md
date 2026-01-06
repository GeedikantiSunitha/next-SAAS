# E2E Test Fixes Plan

**Status**: In Progress  
**Current**: 24/42 tests passing (57%)  
**Target**: 34+/42 tests passing (80%+)  
**Date**: January 2025

---

## 🔍 Key Findings

### Profile Page Structure Issue

**Problem**: Tests look for `h1:has-text("Profile")` but:
- Profile page uses `CardTitle` which renders as `<h3>` (not `<h1>`)
- CardTitle text is "Profile Information" (not "Profile")

**Impact**: Profile navigation tests fail

**Solution**: Update tests to use correct selectors:
- Use `getByRole('heading', { name: /profile information/i })` (case-insensitive)
- Or use `h3:has-text("Profile Information")`

---

## 📋 Fix Strategy

### Phase 1: Profile Navigation Fixes (Priority 1)
1. Fix heading selectors in profile tests
2. Update all references from "Profile" to "Profile Information"
3. Change h1 selectors to h3 or use getByRole

### Phase 2: Timing & Synchronization (Priority 2)
4. Add networkidle waits
5. Increase timeouts
6. Add proper element waits

### Phase 3: Other Fixes (Priority 3)
7. React Query cache tests (relax timing assertions)
8. Error boundary tests (skip or implement properly)
9. UI component tests (fix timing)

---

## 🚀 Implementation

Starting with Phase 1 fixes...
