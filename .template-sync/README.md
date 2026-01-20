# Template Sync System

This directory contains everything needed to sync compliance updates from this template to your live SaaS products.

## 📁 Files in this Directory

- **`sync-manifest.json`** - Complete list of all syncable files with metadata
- **`merge-guide.md`** - Step-by-step guide for merging each file type
- **`sync-config.json`** - Configuration for sync behavior
- **`sync.sh`** - Automated sync script (Git-based)
- **`copy-sync.sh`** - Manual copy script (fallback)
- **`verify-sync.sh`** - Verify sync integrity
- **`changelog.md`** - Track all template changes for easy syncing

## 🚀 Quick Start

### First Time Setup (in each product)

```bash
# In your product directory (e.g., product-a)
cd ~/projects/product-a

# Add nextsaas template as a remote
git remote add nextsaas-template /Users/user/Desktop/AI/projects/nextsaas

# Fetch template
git fetch nextsaas-template

# View available updates
git log --oneline main..nextsaas-template/main --grep="compliance\|gdpr\|security\|audit"
```

### Syncing Updates

```bash
# Option 1: Full sync (recommended)
cd ~/projects/product-a
bash <(curl -s /Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh) ~/projects/product-a

# Option 2: Selective sync (cherry-pick specific commits)
cd ~/projects/product-a
git fetch nextsaas-template
git cherry-pick <commit-hash>

# Option 3: Manual file copy (if Git conflicts are too complex)
cd /Users/user/Desktop/AI/projects/nextsaas
./.template-sync/copy-sync.sh ~/projects/product-a
```

### Verify Sync

```bash
cd ~/projects/product-a
bash /Users/user/Desktop/AI/projects/nextsaas/.template-sync/verify-sync.sh
```

## 📋 Sync Workflow

1. **Review Updates**: Check changelog to see what changed
2. **Create Branch**: `git checkout -b sync-compliance-$(date +%Y%m%d)`
3. **Run Sync**: Use one of the sync methods above
4. **Resolve Conflicts**: Follow merge-guide.md for each file
5. **Test**: Run full test suite
6. **Review**: `git diff` to see all changes
7. **Commit**: `git commit -m "sync: merge compliance updates from template"`
8. **Test Again**: Ensure nothing broke
9. **Merge**: Create PR and merge to main

## 🎯 What Gets Synced

### Always Sync (Safe)
- New compliance features (GDPR, cookie consent, audit)
- Security fixes
- Legal document templates
- Compliance UI components (if not customized)
- New database migrations (additive only)
- Documentation updates

### Review Before Sync (May Need Customization)
- Authentication changes (if you customized auth)
- Shared services (merge manually)
- Prisma schema changes (merge models)
- Config files (merge environment variables)
- Middleware updates

### Never Sync (Product-Specific)
- Business logic
- Product features
- Custom UI styling
- Product-specific routes
- Custom database models
- Environment values (.env)

## 🛡️ Safety Features

- **Dry-run mode**: Preview changes before applying
- **Backup creation**: Automatic backup before sync
- **Conflict detection**: Warns about potential conflicts
- **Rollback support**: Can undo sync if needed
- **Verification**: Checks integrity after sync

## 📖 Documentation

See `merge-guide.md` for detailed file-by-file merge instructions.

## 🔄 Update Frequency

- **Critical Security**: Sync immediately
- **Compliance Updates**: Sync within 1 week
- **Feature Enhancements**: Sync when convenient
- **Documentation**: Optional

## 🆘 Support

If you encounter issues:
1. Check `merge-guide.md` for conflict resolution
2. Review `changelog.md` for recent changes
3. Use dry-run mode first
4. Test in staging before production

---

**Last Updated**: 2026-01-20
**Template Version**: 1.0.0
