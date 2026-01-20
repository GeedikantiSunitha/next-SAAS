# TDD Workflow - Mandatory Process for All Changes

**CRITICAL: This workflow MUST be followed for EVERY code change, no exceptions.**

---

## 🔴 Red-Green-Refactor Cycle (Mandatory)

### Phase 1: RED - Write Failing Tests First
**Before writing ANY implementation code:**

1. **Create TDD test file(s)**
   - Frontend tests: `frontend/src/__tests__/[feature].test.tsx`
   - Backend tests: `backend/src/__tests__/[feature].test.ts`
   - Integration tests: `backend/src/__tests__/integration/[feature].test.ts`
   - E2E tests: `frontend/src/__tests__/e2e/[feature].test.tsx`

2. **Write test cases that WILL FAIL**
   - Test the desired behavior, not current behavior
   - Use clear, descriptive test names
   - Cover edge cases and error scenarios
   - Include assertions for expected results

3. **Run tests and VERIFY they FAIL**
   ```bash
   # Frontend
   cd frontend && npm test [test-file]

   # Backend
   cd backend && npm test [test-file]

   # Run all tests
   npm test
   ```

4. **Document test failure in ISSUES_LOG.md**
   - Log expected vs actual behavior
   - Note why test fails (implementation not done yet)

---

### Phase 2: GREEN - Implement Fix to Pass Tests

1. **Implement MINIMAL code to make tests pass**
   - Only write code needed for tests to pass
   - No extra features or "nice-to-haves"
   - Keep it simple

2. **Run tests continuously**
   - Run after each small change
   - Fix one test at a time
   - Document any issues in ISSUES_LOG.md

3. **Achieve 100% test passage**
   - All tests must pass
   - No skipped tests
   - No pending tests

4. **Log any implementation issues encountered**
   - Update ISSUES_LOG.md with each problem
   - Include root cause analysis
   - Document fix applied

---

### Phase 3: REFACTOR - Improve Code Quality (Optional)

1. **Refactor only if needed**
   - Keep tests passing throughout refactoring
   - Run tests after each refactor
   - Log any issues in ISSUES_LOG.md

2. **Verify no regression**
   - All existing tests still pass
   - No new bugs introduced
   - Performance not degraded

---

## 📋 Issue Logging Requirements

**EVERY issue encountered MUST be logged in:**
`docs/ISSUES_LOG.md`

### Log Entry Format
```markdown
### Issue #[AUTO_INCREMENT]: [Brief Description]
**Date:** YYYY-MM-DD HH:MM
**Feature:** [Feature/fix being implemented]
**Phase:** [Red/Green/Refactor]
**Encountered During:** [Specific step - e.g., "Running unit tests", "Implementing GDPR retention()"]

**Problem:**
[Detailed description of what went wrong]

**Root Cause:**
[Why it happened - be specific]

**Fix Applied:**
[How it was resolved - include code snippets if relevant]

**Prevention:**
[How to avoid this in future implementations]

**Related Files:**
- [List of files modified/affected]

**Test Impact:**
- Tests failed: [count]
- Tests fixed: [count]
- New tests added: [count]

---
```

---

## 🛡️ Database Safety Protocol

### Before ANY database changes:

1. **Backup Check**
   ```bash
   # Check database exists
   npx prisma db pull
   ```

2. **Test Migration (if possible)**
   ```bash
   # Create migration
   npx prisma migrate dev --name [migration-name]

   # Test migration
   npx prisma migrate deploy
   ```

3. **Migration Script Required**
   - Create migration using Prisma: `npx prisma migrate dev --name [description]`
   - Include rollback strategy
   - Test migration on development database first

4. **User Approval Required for:**
   - Schema changes (ALTER TABLE, DROP, etc.)
   - Data deletion (DELETE, TRUNCATE)
   - Index changes affecting performance
   - Constraint modifications

### Ask user before:
```
"I need to make the following database changes:
[List changes]

Migration file: [path]
Rollback strategy: [description]

May I proceed? (Yes/No)"
```

---

## ✅ Testing Requirements by Change Type

### Frontend Component Changes
**Required Tests:**
- [ ] Unit tests (component rendering)
- [ ] Integration tests (API interactions)
- [ ] User interaction tests (click, input, etc.)
- [ ] Error handling tests
- [ ] Loading state tests

### Backend API Changes
**Required Tests:**
- [ ] Unit tests (service/controller logic)
- [ ] Integration tests (API endpoint E2E)
- [ ] Database interaction tests
- [ ] Error handling tests
- [ ] Authentication/authorization tests
- [ ] Input validation tests

### Database Changes
**Required Tests:**
- [ ] Migration test (up/down)
- [ ] Data integrity tests
- [ ] Constraint validation tests
- [ ] Performance tests (for large tables)

**CRITICAL: Database Sync Verification (After Every Schema Change)**
```bash
# 1. Run migration
npx prisma migrate dev --name <migration_name>

# 2. Regenerate Prisma client
npx prisma generate

# 3. Force sync if drift detected (IMPORTANT!)
npx prisma db push --accept-data-loss

# 4. Recreate seed data
npx prisma db seed

# 5. Run tests sequentially to avoid race conditions
npm test -- --maxWorkers=1 --testTimeout=30000

# 6. Verify 100% test passage against TEST_STATUS.md baseline
```

**Why This Matters:**
- Prisma migrations can succeed but leave database in inconsistent state
- Database drift causes foreign key violations and missing column errors
- Parallel test execution creates race conditions with database state
- Reference: See ISSUES_LOG.md "Issue #XX+2: Database Schema Out of Sync"

### Calculation/Business Logic Changes
**Required Tests:**
- [ ] Unit tests (pure function logic)
- [ ] Integration tests (with real data)
- [ ] Edge case tests (zero, null, negative)
- [ ] Precision tests (decimal accuracy)
- [ ] Performance tests (large datasets)

---

## 🚫 Non-Negotiable Rules

### 1. No Implementation Without Tests
- NEVER write implementation code before tests
- NEVER skip writing tests "I'll add them later"
- NEVER commit untested code

### 2. All Tests Must Pass
- 100% test passage required before moving forward
- No "temporarily disabled" tests
- No "TODO: fix this test" comments

### 3. Log ALL Issues
- Every bug, every error, every unexpected behavior
- Even if you fix it in 2 minutes
- Even if it seems trivial
- ISSUES_LOG.md is append-only (never delete entries)

### 4. Database Changes Require Approval
- Always ask user before:
  - Schema modifications
  - Data deletion
  - Performance-impacting changes
- Provide rollback plan
- Test on development first

### 5. Existing Functionality Must Not Break
- Run ALL existing tests after changes
- Verify no regression
- Check dependent features
- Log any breaking changes in ISSUES_LOG.md

---

## 📊 Test Coverage Standards

### Minimum Coverage Requirements
- **Critical paths:** 100% (auth, payments, GDPR, data integrity)
- **Business logic:** 95% (services, controllers)
- **UI components:** 80% (pages, forms)
- **Utilities:** 90% (helpers, formatters)
- **Overall project:** 75% minimum

### Coverage Commands
```bash
# Frontend
cd frontend && npm run test:coverage

# Backend
cd backend && npm run test:coverage

# View coverage report
open frontend/coverage/index.html
open backend/coverage/index.html
```

---

## 🔄 Continuous Testing During Implementation

### Run Tests After EVERY Change
```bash
# Quick test (watch mode)
npm test -- --watch

# Full test suite
npm test

# Specific test file
npm test -- [test-file-path]
```

### Watch for:
- New test failures (regression)
- Console warnings/errors
- Performance degradation
- Memory leaks (long-running tests)

---

## 📝 Commit Message Format (When User Approves)

```
[type]: [Brief description]

TDD Phase: [Red/Green/Refactor]
Tests: [X passed, Y failed before fix]
Coverage: [XX%]

Changes:
- [List main changes]

Issues Logged:
- Issue #[N]: [Brief description]
- Issue #[M]: [Brief description]

Refs: #[issue-number] (if applicable)
```

---

## 🎯 Quick Checklist Before Requesting User Approval

- [ ] All TDD tests written and initially failing (Red phase)
- [ ] Implementation complete and all tests passing (Green phase)
- [ ] Code refactored for quality (if needed)
- [ ] ALL issues logged in ISSUES_LOG.md
- [ ] No existing tests broken
- [ ] Test coverage meets minimum standards
- [ ] Database changes have migration scripts
- [ ] Database changes have user approval
- [ ] No security vulnerabilities introduced (XSS, SQL injection, etc.)
- [ ] Performance impact assessed
- [ ] Documentation updated (if needed)

---

## ⚡ Quick Reference Commands

```bash
# Start TDD cycle
cd frontend && npm test -- --watch
cd backend && npm test -- --watch

# Run specific test
npm test -- [test-file-path]

# Check coverage
npm run test:coverage

# Database migration
cd backend && npx prisma migrate dev --name [description]

# Verify tests pass
npm test

# View issues log
cat docs/ISSUES_LOG.md
```

---

## 🆘 When Things Go Wrong

1. **Tests won't pass**
   - Log issue in ISSUES_LOG.md
   - Review test expectations vs implementation
   - Check for typos, logic errors
   - Ask user if requirements unclear

2. **Database changes break things**
   - ROLLBACK immediately (npx prisma migrate resolve --rolled-back [migration])
   - Log issue in ISSUES_LOG.md
   - Review migration script
   - Test on development database
   - Ask user before retrying

3. **Existing tests break**
   - DO NOT disable tests
   - Log as regression in ISSUES_LOG.md
   - Identify what changed
   - Fix implementation or update tests
   - Document decision in log

4. **Not sure how to test something**
   - Log question in ISSUES_LOG.md
   - Research testing patterns
   - Ask user for guidance
   - Look at similar existing tests

---

**Remember: TDD is not optional. It's a requirement. Every. Single. Time.**
