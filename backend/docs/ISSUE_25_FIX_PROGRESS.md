# Issue #25 Fix Progress - Section by Section

**Issue**: Mass Test Failures Due to Missing Global Cleanup  
**Status**: 🔄 IN PROGRESS  
**Date**: 2026-01-10

---

## Section 1: Selective Global Cleanup ✅ COMPLETED

### What We Fixed

**Implemented selective global `beforeEach` cleanup** in `backend/src/tests/setup.ts`:

- ✅ Clean sessions (fixes 165 `sessions_userId_fkey` violations)
- ✅ Clean MFA backup codes (fixes 42 `mfa_backup_codes_userId_fkey` violations)
- ✅ Clean payments (fixes 28 `payments_userId_fkey` violations)
- ✅ Clean audit logs (fixes 13 `audit_logs_userId_fkey` violations)
- ✅ Clean password reset tokens
- ✅ Clean newsletter subscriptions (fixes 2 `newsletter_subscriptions_userId_fkey` violations)

**What We DON'T Delete** (to maintain performance):
- ❌ Users (tests manage their own)
- ❌ Feature flags (some tests rely on seed data)
- ❌ Newsletters (tests may need these)
- ❌ OAuth users (tests manage these)

### Expected Results After Section 1

**Before Section 1**:
- 32 failed test suites
- 131 failed tests
- 250+ foreign key violations
- 15 unique constraint violations

**Expected After Section 1**:
- **Foreign key violations should be reduced by ~250** (from sessions, backup codes, payments, audit logs, subscriptions)
- **Unique constraint violations may remain** (these need unique emails - Section 2)
- **Test suites passing should increase** (exact count TBD after test run)

### Test Command

Run the full test suite to verify Section 1 improvements:

```bash
cd /Users/user/Desktop/AI/projects/nextsaas/backend
npm test > test-run-section1-output.log 2>&1
```

Then check results:
```bash
tail -20 test-run-section1-output.log | grep -E "Test Suites|Tests:|PASS|FAIL"
```

**Metrics to Check**:
1. **Foreign key violations**: `grep -c "Foreign key constraint" test-run-section1-output.log` (should be ~0)
2. **Failed test suites**: Check final summary (should be < 32)
3. **Failed tests**: Check final summary (should be < 131)
4. **Unique constraint violations**: `grep -c "Unique constraint failed" test-run-section1-output.log` (may still exist - need Section 2)

---

## Section 2: Fix Hardcoded Emails (NEXT)

**Status**: ⏳ PENDING (waiting for Section 1 test results)

**What We'll Fix**:
- Replace hardcoded emails (`test@example.com`, `user@example.com`, etc.) with unique timestamp-based emails
- Fix unique constraint violations (12 email duplicates expected)
- This affects: Service tests, route E2E tests, admin tests

**Files to Fix** (priority order):
1. `src/__tests__/services/mfaService.test.ts` - 18 errors
2. `src/__tests__/services/newsletterService.test.ts` - 2 errors
3. `src/__tests__/services/oauthService.test.ts` - Errors
4. Route E2E tests with hardcoded emails (17 files)

---

## Section 3: Fix Remaining Issues (AFTER Section 2)

**Status**: ⏳ PENDING

**What We'll Fix**:
- Code quality issues (unused variables) - `packageValidation.test.ts`, `securityReview.test.ts`
- Template file issues - `e2e.test.template.ts`
- Documentation issues - `screenshots.test.ts` (low priority)
- Any remaining test-specific cleanup issues

---

## Progress Tracking

| Section | Status | Expected Improvement | Actual (After Test) |
|---------|--------|---------------------|---------------------|
| **Section 1: Selective Cleanup** | ✅ COMPLETED | ~250 foreign key violations fixed | ✅ **99.2% reduction** (250+ → 2) |
| **Section 2: Code Quality Tests** | ⏳ PENDING | Fix securityReview + packageValidation (13 tests) | Ready to start |
| **Section 3: Template/Exclude Files** | ⏳ PENDING | Fix/exclude template + screenshots (7 tests) | Ready after Section 2 |
| **Section 4: Database Edge Cases** | ⏳ PENDING | Fix remaining FK + verify unique constraint tests | Ready after Section 3 |

### Section 1 Results Summary

✅ **Massive Success!**
- Test Suites: 32 failed → **4 failed** (87.5% reduction)
- Tests: 131 failed → **16 failed** (87.8% reduction)  
- Pass Rate: 83.1% → **98.0%** (14.9% improvement)
- Foreign Key Violations: 250+ → **2** (99.2% reduction)
- Execution Time: 306s → **255s** (17% faster)

---

**Next Action**: Run test suite and report results. Then proceed to Section 2.
