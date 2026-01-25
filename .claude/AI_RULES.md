# 🚨 MANDATORY AI ASSISTANT RULES 🚨

## YOU MUST FOLLOW THESE RULES - NO EXCEPTIONS

### 🔴 RULE #1: ALWAYS ASK PERMISSION BEFORE GIT COMMITS
- **NEVER** commit to git without explicit user permission
- **ALWAYS** show the user what you're about to commit
- **WAIT** for user approval with phrases like "yes", "go ahead", "commit it"

### 🔴 RULE #2: READ MANDATORY DOCUMENTS BEFORE ANY CODE CHANGES

**BEFORE writing ANY code, you MUST read these 5 documents:**

1. **backend/MANDATORY_CHECKLIST.md** - Pre-flight checklist (READ FIRST!)
2. **.claude/TDD_WORKFLOW.md** - Test-Driven Development process (MANDATORY!)
3. **backend/CORRECT_DEVELOPMENT_ORDER.md** - Database → Backend → Frontend
4. **backend/SAFE_DEVELOPMENT_PROCESS.md** - How to implement safely
5. **backend/ISSUES_LOG.md** - Learn from past disasters

```bash
# Run this command BEFORE any coding session:
cat backend/MANDATORY_CHECKLIST.md
```

### 🔴 RULE #3: FOLLOW THE CORRECT DEVELOPMENT ORDER
1. **Database** (schema, migrations) - ALWAYS FIRST
2. **Backend** (types → services → routes)
3. **Frontend** (hooks → components → pages)
4. **Tests** (at each layer)
5. **Documentation** (as you go)

### 🔴 RULE #4: TEST-DRIVEN DEVELOPMENT (MANDATORY - READ TDD_WORKFLOW.md)
- Write test FIRST (Red phase)
- See it FAIL and verify failure
- Write MINIMAL code to PASS (Green phase)
- Run ALL tests
- ALL must PASS before proceeding
- Refactor if needed (Refactor phase)
- **FOLLOW .claude/TDD_WORKFLOW.md EXACTLY**

### 🔴 RULE #5: WORK ON FEATURE BRANCHES
```bash
# NEVER work on main directly
git checkout -b feature/[descriptive-name]
```

### 🔴 RULE #6: ATOMIC COMMITS
- One feature = One commit
- All tests MUST pass
- Commit every 30 minutes maximum
- NO "TODO: fix later" comments

### 🔴 RULE #7: NO SHORTCUTS OR CORNER CUTTING
These phrases are BANNED:
- ❌ "Let me just quickly..."
- ❌ "I'll fix the tests later..."
- ❌ "This should work..."
- ❌ "For now, let's just..."
- ❌ "We can skip this test..."

### 🔴 RULE #8: VERIFY BEFORE ACTION
Before ANY code change:
- Ask user: "Could you confirm all 880 tests are passing?"
- Run: `git status` # MUST be clean
- Wait for user confirmation before proceeding

### 🔴 RULE #9: BACKUP CRITICAL FILES
```bash
# ALWAYS backup schema before changes
cp prisma/schema.prisma prisma/schema.backup.prisma
```

### 🔴 RULE #10: PRISMA SCHEMA CHANGE PROTOCOL (CRITICAL)

**NEVER append directly to schema.prisma with >> or cat >>**
**76 tests failed when this was done incorrectly (Issue #12)**

When modifying Prisma schema:
1. ✅ **ALWAYS backup first**: `cp prisma/schema.prisma prisma/schema.prisma.backup_$(date +%Y%m%d_%H%M%S)`
2. ✅ **Create changes in separate file first**: Write new models to a temporary file
3. ✅ **Use proper Edit/Write tools**: Never use `cat >>` or `echo >>` for schema changes
4. ✅ **Ensure proper formatting**:
   - Blank line before each new model
   - Proper indentation (2 spaces)
   - All fields properly typed
5. ✅ **Regenerate Prisma client**: `npx prisma generate`
6. ✅ **Push to database**: `npx prisma db push`
7. ✅ **Test immediately**: Run specific tests for new models
8. ✅ **If tests fail**: Restore from backup immediately

**Emergency Recovery Procedure (if schema breaks):**
```bash
# 1. Stop and restore immediately
cp prisma/schema.prisma.backup_* prisma/schema.prisma

# 2. Clean Prisma cache
rm -rf node_modules/.prisma

# 3. Regenerate client
npx prisma generate

# 4. Sync database
npx prisma db push

# 5. Verify tests pass
npm test 2>&1 | tail -5
```

### 🔴 RULE #11: REPORT PROBLEMS IMMEDIATELY
If tests fail or something breaks:
- STOP immediately
- Tell the user
- Don't try to fix without permission
- **LOG ALL ISSUES in backend/ISSUES_LOG.md**

### 🔴 RULE #12: TEST EXECUTION PROTOCOL

**YOU CAN RUN (during TDD development):**
- ✅ Specific test files: `npm test src/__tests__/specific.test.ts`
- ✅ Single test suites during development
- ✅ Quick TypeScript checks: `npx tsc --noEmit`

**ASK USER TO RUN (prevents timeouts):**
- ❌ Full test suite: Ask "Could you please run the full test suite?"
- ❌ End-to-end tests: Ask "Could you run the e2e tests?"
- ❌ Coverage reports: Ask "Could you run test coverage?"

**How to ask user:**
```
"Could you please run the full test suite with:
npm test 2>&1 | tee test-run-$(date +%Y%m%d-%H%M%S).log

Then share the results or the log file."
```

**After user runs tests:**
- Thank them for running tests
- Analyze the log file they provide
- Document any failures in ISSUES_LOG.md

### 🔴 RULE #13: MANDATORY ISSUE LOGGING
- **EVERY issue encountered MUST be logged**
- **Location**: backend/ISSUES_LOG.md
- **Format**: Follow the template in TDD_WORKFLOW.md
- **Even small issues**: Log everything, even 2-minute fixes
- **Root cause required**: Always include root cause analysis
- **Prevention required**: Always include how to prevent in future

---

## ⚠️ REMEMBER YOUR PAST FAILURES

**January 20, 2025 - GDPR Phase 2 Disaster:**
- Wasted 6-7 hours due to incomplete implementation
- Started with services without database schema
- Field name mismatches (breachNotifications vs notifications)
- Forgot to register routes
- 129 tests failed at peak
- Had to force reset database

**January 21, 2025 - Consent Version Management Failure:**
- Attempted implementation WITHOUT TDD
- Wrote code before tests (violated TDD principle)
- Created database changes without tests
- Multiple TypeScript compilation errors
- Had to completely rollback and reset database
- **ROOT CAUSE: Did not follow TDD workflow**

**NEVER REPEAT THESE MISTAKES**

---

## 📋 MANDATORY PRE-CODING CHECKLIST

Before writing ANY code, you MUST:

1. ✅ Read `backend/MANDATORY_CHECKLIST.md`
2. ✅ Read `.claude/TDD_WORKFLOW.md`
3. ✅ ASK USER: "Please confirm all 880 tests are passing"
4. ✅ Check git status is clean (you can run this)
5. ✅ Create a feature branch
6. ✅ Write TDD tests FIRST (Red phase)
7. ✅ Show test plan to user before implementing
8. ✅ Backup schema if changing database
9. ✅ Follow Database → Backend → Frontend order
10. ✅ Get user permission before commits
11. ✅ Document all issues in ISSUES_LOG.md

---

## 🚫 FORBIDDEN ACTIONS (NEVER WITHOUT PERMISSION)

1. ❌ `git commit`
2. ❌ `git push`
3. ❌ `npx prisma db push --force-reset`
4. ❌ `rm -rf node_modules`
5. ❌ `git reset --hard`
6. ❌ Deleting any files
7. ❌ Commenting out failing tests
8. ❌ Using `any` TypeScript type
9. ❌ Skipping any development phase
10. ❌ Working for >30 minutes without committing

---

## 🎯 THE GOLDEN WORKFLOW

```bash
# 1. Start of session
cat backend/MANDATORY_CHECKLIST.md
npm test 2>&1 | tail -5  # Verify 880 passing

# 2. Plan the work
echo "Plan: [describe what you'll do]"
# GET USER APPROVAL

# 3. Create feature branch
git checkout -b feature/xyz

# 4. Implement (Database → Backend → Frontend)
# Write test → Fail → Pass → Continue

# 5. Before commit
npm test  # ALL must pass
git diff  # Review changes
# ASK USER: "May I commit these changes?"

# 6. Only after permission
git commit -m "feat: ..."
```

---

## 📝 SESSION START PROTOCOL

At the start of EVERY coding session, you MUST:

1. Say: "Let me check the mandatory documents first"
2. Run: `cat backend/MANDATORY_CHECKLIST.md`
3. Run: `cat .claude/TDD_WORKFLOW.md | head -50`
4. Ask user: "Could you please run `npm test` and confirm all 880 tests are passing?"
5. Wait for user confirmation
6. Say: "Thank you! Ready to proceed with TDD"
7. Ask: "What would you like to work on today?"

---

## 🔴 FINAL WARNING

**YOU HAVE A DOCUMENTED HISTORY OF:**
- Cutting corners
- Breaking working code
- Not following proper procedures
- Wasting hours fixing your own mistakes

**THESE RULES ARE NOT SUGGESTIONS - THEY ARE MANDATORY**

*Last updated: January 20, 2025*
*Reason: Wasted 6-7 hours on preventable issues*
*These rules will save time and prevent disasters*