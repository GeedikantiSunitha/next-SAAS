# TDD Quick Reference Card

**🔴🟢🔵 Red-Green-Refactor - Every Single Change**

---

## 📋 The 3-Step Process

```
🔴 RED: Write failing tests FIRST
↓
🟢 GREEN: Implement to pass tests
↓
🔵 REFACTOR: Improve code quality (optional)
```

---

## 🎯 Manual Workflow Steps

### Step 1: 🔴 RED - Write Tests First
```bash
# 1. Create test file
touch frontend/src/__tests__/[feature].test.tsx
# OR
touch backend/src/__tests__/[feature].test.ts

# 2. Write failing tests
# - Test desired behavior
# - Tests WILL fail (no implementation yet)

# 3. Run tests
npm test -- [test-file]

# 4. Verify they FAIL ❌
# 5. Log in ISSUES_LOG.md
```

**Ask user:** "Tests failing as expected. Ready to implement? (Yes/No)"

---

### Step 2: 🟢 GREEN - Implement Fix
```bash
# 1. Write MINIMAL code to pass tests
# 2. Run tests after each change
npm test -- --watch

# 3. Log EVERY issue in ISSUES_LOG.md
# 4. Achieve 100% test passage ✅
```

**Ask user:** "All tests passing. Ready for verification? (Yes/No)"

---

### Step 3: ✅ VERIFY - No Regressions
```bash
# 1. Run FULL test suite
npm test

# 2. Check coverage
npm run test:coverage

# 3. Verify no existing tests broken ✅
```

**Ask user:** "Verification complete. Ready to commit? (Yes/No)"

---

## 📝 Issue Logging Template

```markdown
### Issue #[N]: [Brief Description]
**Date:** 2026-01-20 HH:MM
**Feature:** [What you're working on]
**Phase:** [Red/Green/Refactor]
**Encountered During:** [Specific step]

**Problem:**
[What went wrong]

**Root Cause:**
[Why it happened]

**Fix Applied:**
[How you resolved it]

**Prevention:**
[How to avoid in future]

**Related Files:**
- [List files modified]

**Test Impact:**
- Tests failed: 2
- Tests fixed: 2
- New tests added: 3

---
```

---

## 🛡️ Database Safety Checklist

Before ANY database change:

- [ ] Created Prisma migration
- [ ] Included rollback strategy
- [ ] Tested on development DB
- [ ] Asked user for approval
- [ ] Verified schema integrity

**Always ask user before:**
- Schema changes (ALTER TABLE, DROP, etc.)
- Data deletion (DELETE, TRUNCATE)
- Index changes
- Constraint modifications

---

## ✅ Pre-Commit Checklist

- [ ] All TDD tests passing (100%)
- [ ] No existing tests broken
- [ ] Test coverage meets minimum (75%)
- [ ] ALL issues logged in ISSUES_LOG.md
- [ ] Database changes approved by user
- [ ] No security vulnerabilities (XSS, SQL injection, etc.)
- [ ] Code reviewed
- [ ] User approval obtained

---

## 🚫 Never Do This

❌ Write implementation before tests
❌ Skip writing tests ("I'll add them later")
❌ Commit untested code
❌ Skip logging issues
❌ Disable failing tests
❌ Make database changes without approval
❌ Break existing tests

---

## ✅ Always Do This

✅ Write tests FIRST (Red phase)
✅ Run tests after EVERY change
✅ Log EVERY issue (even 2-minute fixes)
✅ Ask user approval for database changes
✅ Verify no regressions
✅ Meet test coverage minimums
✅ Get user approval before commits

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.claude/TDD_WORKFLOW.md` | Complete TDD process |
| `docs/ISSUES_LOG.md` | All issues (append-only) |
| `docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md` | Compliance roadmap |
| `backend/prisma/schema.prisma` | Database schema |

---

## 🎯 Test Coverage Standards

| Code Type | Minimum | Target |
|-----------|---------|--------|
| Critical paths | 100% | 100% |
| Business logic | 95% | 98% |
| UI components | 80% | 90% |
| Utilities | 90% | 95% |
| Overall | 75% | 85% |

---

## ⚡ Quick Commands

```bash
# Run tests in watch mode
npm test -- --watch

# Run specific test
npm test -- [test-file-path]

# Check coverage
npm run test:coverage

# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Database migration
cd backend && npx prisma migrate dev --name [description]

# View issues log
cat docs/ISSUES_LOG.md
```

---

## 🆘 Common Issues

### "Tests won't pass"
1. Review test expectations
2. Check implementation logic
3. Log issue in ISSUES_LOG.md
4. Ask user if requirements unclear

### "Existing tests broke"
1. DO NOT disable tests
2. Log as regression in ISSUES_LOG.md
3. Fix implementation or update tests
4. Document decision

### "Not sure how to test this"
1. Log question in ISSUES_LOG.md
2. Look at similar existing tests
3. Ask user for guidance

### "Database change failed"
1. ROLLBACK immediately
2. Log in ISSUES_LOG.md
3. Review migration script
4. Test on development first
5. Ask user before retrying

---

## 💡 Pro Tips

1. **Start small:** Write one test, make it pass, then next
2. **Test first:** Always. No exceptions.
3. **Log everything:** Even trivial issues teach lessons
4. **Ask early:** Database changes, unclear requirements
5. **Run often:** Tests after every small change
6. **Coverage matters:** Aim above minimums
7. **No shortcuts:** TDD saves time long-term

---

## 📚 Learn More

- **Complete workflow:** `.claude/TDD_WORKFLOW.md`
- **Compliance roadmap:** `docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md`
- **Issues log:** `docs/ISSUES_LOG.md`

---

## 🎓 Remember

**The TDD workflow is:**
- ✅ Mandatory (no exceptions)
- ✅ Proven (saves time, prevents bugs)
- ✅ Safe (protects database, existing code)
- ✅ Professional (industry best practice)

**You just need to:**
- Write tests first
- Implement to pass tests
- Verify no regressions
- Log all issues

---

**Print this and keep it handy! 📌**

**Last Updated:** 2026-01-20
