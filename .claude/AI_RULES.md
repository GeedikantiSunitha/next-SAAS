# 🚨 MANDATORY AI ASSISTANT RULES 🚨

## YOU MUST FOLLOW THESE RULES - NO EXCEPTIONS

### 🔴 RULE #1: ALWAYS ASK PERMISSION BEFORE GIT COMMITS
- **NEVER** commit to git without explicit user permission
- **ALWAYS** show the user what you're about to commit
- **WAIT** for user approval with phrases like "yes", "go ahead", "commit it"

### 🔴 RULE #2: READ MANDATORY DOCUMENTS BEFORE ANY CODE CHANGES

**BEFORE writing ANY code, you MUST read these 4 documents:**

1. **backend/MANDATORY_CHECKLIST.md** - Pre-flight checklist (READ FIRST!)
2. **backend/CORRECT_DEVELOPMENT_ORDER.md** - Database → Backend → Frontend
3. **backend/SAFE_DEVELOPMENT_PROCESS.md** - How to implement safely
4. **backend/ISSUES_LOG.md** - Learn from past disasters

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

### 🔴 RULE #4: TEST-DRIVEN DEVELOPMENT
- Write test FIRST
- See it FAIL
- Write code to PASS
- Run ALL tests
- ALL must PASS before proceeding

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
```bash
npm test 2>&1 | tail -5  # MUST show 880 tests passing
git status                # MUST be clean
```

### 🔴 RULE #9: BACKUP CRITICAL FILES
```bash
# ALWAYS backup schema before changes
cp prisma/schema.prisma prisma/schema.backup.prisma
```

### 🔴 RULE #10: REPORT PROBLEMS IMMEDIATELY
If tests fail or something breaks:
- STOP immediately
- Tell the user
- Don't try to fix without permission

---

## ⚠️ REMEMBER YOUR PAST FAILURES

**January 20, 2025 - GDPR Phase 2 Disaster:**
- Wasted 6-7 hours due to incomplete implementation
- Started with services without database schema
- Field name mismatches (breachNotifications vs notifications)
- Forgot to register routes
- 129 tests failed at peak
- Had to force reset database

**NEVER REPEAT THESE MISTAKES**

---

## 📋 MANDATORY PRE-CODING CHECKLIST

Before writing ANY code, you MUST:

1. ✅ Read `backend/MANDATORY_CHECKLIST.md`
2. ✅ Verify all 880 tests are passing
3. ✅ Check git status is clean
4. ✅ Create a feature branch
5. ✅ Write a plan and show to user
6. ✅ Backup schema if changing database
7. ✅ Follow Database → Backend → Frontend order
8. ✅ Write tests first
9. ✅ Get user permission before commits
10. ✅ Document as you go

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
3. Run: `npm test 2>&1 | tail -5`
4. Say: "All X tests passing, ready to proceed"
5. Ask: "What would you like to work on today?"

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