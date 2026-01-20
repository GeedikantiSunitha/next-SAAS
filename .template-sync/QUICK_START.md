# 🚀 Quick Start: Template Sync System

**Ready to sync compliance updates to your products? Start here!**

---

## ⚡ 5-Minute Setup

### Step 1: In Your Product

```bash
cd ~/projects/your-product

# Add template as remote (one-time setup)
git remote add nextsaas-template /Users/user/Desktop/AI/projects/nextsaas

# Fetch template
git fetch nextsaas-template
```

### Step 2: See What's Available

```bash
# View all updates
git log --oneline main..nextsaas-template/main

# See compliance files only
git diff main..nextsaas-template/main --stat | grep -E "gdpr|audit|compliance"
```

### Step 3: Sync (Choose Your Method)

**Method A: Automated (Recommended)**
```bash
# Dry run first
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh . --dry-run

# Actual sync
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh .
```

**Method B: Manual Copy (If conflicts are complex)**
```bash
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/copy-sync.sh . --category gdpr
```

**Method C: Selective (Cherry-pick specific commits)**
```bash
git cherry-pick <commit-hash>
```

### Step 4: Test & Commit

```bash
npm install
cd backend && npx prisma generate && cd ..
npm test
git commit -m "sync: merge compliance updates from template"
```

Done! 🎉

---

## 📚 Full Documentation

| File | Purpose | When to Read |
|------|---------|--------------|
| **README.md** | Overview & workflows | First time setup |
| **sync-manifest.json** | Complete file inventory | Planning what to sync |
| **merge-guide.md** | File-by-file instructions | Resolving conflicts |
| **SYNC_EXAMPLES.md** | Real-world examples | Learning by example |
| **changelog.md** | Track all changes | See what's new |
| **sync.sh** | Automated sync script | Regular syncing |
| **copy-sync.sh** | Manual copy fallback | Complex conflicts |

---

## 🎯 What to Sync First

### Priority 1: GDPR Core (Safe to sync)
```bash
./copy-sync.sh . --category gdpr
```

**Files**:
- `backend/src/services/gdprService.ts`
- `backend/src/routes/gdpr.ts`
- `frontend/src/components/ConsentManagement.tsx`

**Risk**: Low
**Customization**: Minimal (UI styling only)

### Priority 2: Audit Logging (Safe to sync)
```bash
./copy-sync.sh . --category audit
```

**Files**:
- `backend/src/services/auditService.ts`
- `backend/src/routes/audit.ts`

**Risk**: Low
**Customization**: None

### Priority 3: Documentation
```bash
./copy-sync.sh . --category docs
```

**Files**:
- `docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md`
- `docs/compliance_view`

**Risk**: None
**Customization**: None

---

## ⚠️ What NOT to Sync Directly

### ❌ Legal Pages
- Privacy Policy
- Terms of Service
- Cookie Policy

**Why**: Each product needs custom content
**Instead**: Use as template, then customize

### ❌ Auth Middleware
- `backend/src/middleware/auth.ts`

**Why**: Likely customized per product
**Instead**: Manually review and merge changes

### ❌ Environment Files
- `.env`

**Why**: Product-specific secrets
**Instead**: Manually add new variables

---

## 🔍 Common Scenarios

### "I just want GDPR features"
```bash
./copy-sync.sh . --category gdpr
```

### "I want everything safe to sync"
```bash
./sync.sh .
# Follow prompts for manual merges
```

### "I messed up, need to rollback"
```bash
git checkout main
git branch -D sync-*
# Restore from .sync-backup-* if needed
```

### "I have 3 products to sync"
```bash
for product in product-a product-b product-c; do
  cd ~/projects/$product
  /path/to/nextsaas/.template-sync/sync.sh . --dry-run
done
```

---

## 🛡️ Safety Checklist

Before syncing:
- [ ] Commit all your changes (`git status` should be clean)
- [ ] Run dry-run first
- [ ] Read changelog to see what changed
- [ ] Check if any files need manual merge

After syncing:
- [ ] Run `npm install` (new dependencies)
- [ ] Run `npx prisma generate` (schema changes)
- [ ] Run `npm test` (verify nothing broke)
- [ ] Test manually in browser
- [ ] Review `git diff` (understand all changes)

---

## 💡 Pro Tips

1. **Sync often** - Smaller, frequent syncs are easier than big ones
2. **Test in staging first** - Never sync directly to production
3. **Create sync branch** - `git checkout -b sync-compliance-$(date +%Y%m%d)`
4. **Tag before sync** - `git tag pre-sync-$(date +%Y%m%d)`
5. **Document your customizations** - Add comments: `// CUSTOM: Modified for Product A`

---

## 🆘 Get Help

**Conflicts?** → See `merge-guide.md` for step-by-step resolution

**Breaking?** → Rollback and try manual copy: `./copy-sync.sh`

**Confused?** → See `SYNC_EXAMPLES.md` for real examples

---

## 🎓 Next Steps

1. ✅ Complete 5-minute setup above
2. 📖 Read `sync-manifest.json` to see what files exist
3. 🧪 Try dry-run: `./sync.sh --dry-run`
4. 🚀 Do actual sync when ready

---

**Questions?** All documentation is in `.template-sync/` directory.

**Good luck!** 🎉
