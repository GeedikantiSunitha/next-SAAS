# 🚨 MANDATORY PRE-FLIGHT CHECKLIST 🚨
## AI ASSISTANT: YOU MUST COMPLETE THIS BEFORE WRITING ANY CODE

### ⛔ STOP! READ THIS FIRST ⛔

**YOU (THE AI) HAVE A HISTORY OF:**
- ❌ Cutting corners
- ❌ Making incomplete implementations
- ❌ Not running tests before committing
- ❌ Breaking working code
- ❌ Wasting 6-7 hours fixing your own mistakes

**THIS CHECKLIST IS MANDATORY. NO EXCEPTIONS.**

---

## 📋 BEFORE WRITING ANY CODE - MANDATORY CHECKS

### 1️⃣ CURRENT STATE VERIFICATION (DO THIS FIRST!)
```bash
# Copy and run these commands EXACTLY:
echo "=== MANDATORY PRE-FLIGHT CHECK ==="
npm test 2>&1 | tail -5
echo "Expected: Test Suites: 79 passed, Tests: 880 passed"
git status
echo "Expected: working tree clean or only documentation files"
```

**✅ PROCEED ONLY IF:**
- All 880 tests are passing
- Git status is clean (or only has documentation changes)

**🛑 IF NOT ALL PASSING:**
- STOP IMMEDIATELY
- Do NOT attempt to fix
- Report the issue to the user first

---

## 📝 PLANNING PHASE (BEFORE CODING!)

### 2️⃣ DOCUMENT YOUR PLAN FIRST
Before writing ANY code, create a plan:

```bash
cat > CURRENT_TASK_PLAN.md << 'EOF'
# Task: [TASK NAME]
# Date: [TODAY'S DATE]
# Current Tests Passing: 880/880

## What I'm Going to Build:
- [ ] Specific feature 1
- [ ] Specific feature 2

## Files I Will Create/Modify:
1. path/to/file1.ts - [what changes]
2. path/to/file2.ts - [what changes]

## Tests I Will Write FIRST:
1. Test for feature 1
2. Test for feature 2

## Potential Risks:
- Risk 1: [description]
- Mitigation: [how to handle]

## Success Criteria:
- [ ] All 880 existing tests still pass
- [ ] New tests for new features pass
- [ ] No TypeScript errors
- [ ] Clean git diff (only intended changes)
EOF
```

**SHOW THIS PLAN TO THE USER BEFORE PROCEEDING**

---

## 🔧 IMPLEMENTATION PHASE

### 3️⃣ FEATURE BRANCH FIRST
```bash
# NEVER work on main branch
git checkout -b feature/[descriptive-name]
```

### 4️⃣ BACKUP CRITICAL FILES
```bash
# Backup schema ALWAYS
cp prisma/schema.prisma prisma/schema.prisma.backup

# Backup any file you're about to modify
cp [file-to-modify] [file-to-modify].backup
```

### 5️⃣ TEST-FIRST DEVELOPMENT
**ORDER IS CRITICAL:**
1. Write the test FIRST
2. Run the test - MUST FAIL
3. Write minimal code to pass
4. Run the test - MUST PASS
5. Run ALL tests - ALL MUST PASS

```bash
# After EVERY code change:
npm test 2>&1 | grep -E "Test Suites:|Tests:"
# MUST show: 79+ passed, 880+ passed
```

---

## ⚠️ RED FLAGS - STOP IF YOU CATCH YOURSELF:

### These are signs you're about to break something:

- 🚨 "Let me just quickly..."
- 🚨 "I'll fix the tests later..."
- 🚨 "This should work..."
- 🚨 "I'll commit everything at once..."
- 🚨 "Let me regenerate Prisma client..."
- 🚨 "I'll just use db push instead of migration..."
- 🚨 Changing more than 5 files at once
- 🚨 Working for more than 30 minutes without committing
- 🚨 Skipping tests "just this once"

**IF YOU THINK ANY OF THESE → STOP AND REASSESS**

---

## 🎯 COMMIT CHECKLIST

### 6️⃣ BEFORE EVERY COMMIT
```bash
# Run this EXACT sequence:
echo "=== PRE-COMMIT VERIFICATION ==="
npm test 2>&1 | tail -3
git diff --stat
git status
echo "=== Ready to commit? ==="
```

### 7️⃣ COMMIT RULES
- ✅ One feature per commit
- ✅ All tests passing
- ✅ Descriptive commit message
- ✅ NO commented-out code
- ✅ NO "TODO: fix later"

---

## 🚫 FORBIDDEN ACTIONS

**NEVER DO THESE WITHOUT USER APPROVAL:**

1. ❌ `npx prisma db push --force-reset`
2. ❌ `rm -rf node_modules`
3. ❌ `git reset --hard`
4. ❌ `git push --force`
5. ❌ Deleting test files
6. ❌ Skipping tests
7. ❌ Commenting out failing code
8. ❌ Using `any` type in TypeScript
9. ❌ Ignoring TypeScript errors
10. ❌ Merging directly to main

---

## 📊 PROGRESS TRACKING

### After Each Work Session:
```markdown
## Session Report [DATE TIME]
- Started with: X/880 tests passing
- Ended with: X/880 tests passing
- Features added: [list]
- Tests added: [count]
- Time spent: [actual time]
- Issues encountered: [list]
- Next steps: [list]
```

---

## 🆘 EMERGENCY PROTOCOL

### IF TESTS START FAILING:
```bash
# 1. STOP what you're doing
# 2. Check what changed
git diff

# 3. Revert last change
git checkout -- [changed-file]

# 4. Verify tests pass again
npm test 2>&1 | tail -3

# 5. Report to user before continuing
```

---

## 💭 REMEMBER YOUR FAILURES

**January 20, 2025: GDPR Phase 2 Disaster**
- Claimed completion without implementation
- Missing entire SecurityIncident model
- Field name mismatches
- 6-7 hours wasted fixing issues
- 129 tests failed at one point
- Had to force reset database

**DONT REPEAT THESE MISTAKES**

---

## ✅ FINAL REMINDER

**Before you write even ONE line of code, ask yourself:**

1. Have I run the pre-flight check?
2. Have I created a plan?
3. Am I on a feature branch?
4. Have I backed up critical files?
5. Will I write tests first?

**If ANY answer is NO → STOP**

---

**THIS DOCUMENT IS MANDATORY**
**NO EXCEPTIONS**
**NO SHORTCUTS**
**NO "JUST THIS ONCE"**

*Created because the AI assistant keeps cutting corners and breaking things*
*Last disaster: January 20, 2025 - 6-7 hours wasted*