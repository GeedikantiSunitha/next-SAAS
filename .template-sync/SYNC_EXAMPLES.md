# Template Sync Examples

Real-world examples of syncing updates from template to products.

---

## Example 1: First-Time Setup

**Scenario**: Setting up sync system for the first time in Product A.

### Steps:

```bash
# 1. Navigate to your product
cd ~/projects/product-a

# 2. Add template as remote
git remote add nextsaas-template /Users/user/Desktop/AI/projects/nextsaas

# 3. Fetch template
git fetch nextsaas-template

# 4. View available updates
git log --oneline main..nextsaas-template/main | head -20

# 5. View what changed
git diff main..nextsaas-template/main --stat

# 6. See compliance files only
git diff main..nextsaas-template/main --stat | grep -E "gdpr|audit|compliance"
```

**Result**: You now see all updates available from template.

---

## Example 2: Sync GDPR Features (Safe Replace)

**Scenario**: Template updated gdprService.ts with bug fix. You haven't customized this file.

### Steps:

```bash
# 1. Create sync branch
git checkout -b sync-gdpr-fix-2026-01-20

# 2. Cherry-pick the specific commit (if you know it)
git cherry-pick abc123def456

# OR copy the file directly
git checkout nextsaas-template/main -- backend/src/services/gdprService.ts

# 3. Review changes
git diff HEAD

# 4. Test
npm test -- gdprService.test.ts

# 5. Commit
git commit -m "fix: sync GDPR service bug fix from template"

# 6. Push and create PR
git push origin sync-gdpr-fix-2026-01-20
```

**Result**: GDPR service updated, tests pass, ready to merge.

---

## Example 3: Merge UI Component (Custom Styling)

**Scenario**: Template updated ConsentManagement.tsx with new consent type. You've customized styling.

### Challenge: Need new logic but keep your styling.

### Steps:

```bash
# 1. Create sync branch
git checkout -b sync-consent-update

# 2. Backup your version
cp frontend/src/components/ConsentManagement.tsx frontend/src/components/ConsentManagement.tsx.backup

# 3. Get template version
git checkout nextsaas-template/main -- frontend/src/components/ConsentManagement.tsx

# 4. Open both files side by side
# YOUR BACKUP: ConsentManagement.tsx.backup
# TEMPLATE:    ConsentManagement.tsx

# 5. Manual merge:
#    - Keep template's logic (API calls, state management)
#    - Restore your styling (className, Tailwind classes)
#    - Add new consent types from template

# Example merge:
# TEMPLATE LOGIC (keep):
const handleGrantConsent = async (type: ConsentType) => {
  await api.post('/gdpr/consents', { consentType: type });
  await fetchConsents();
};

# YOUR STYLING (restore):
<div className="my-custom-card bg-gray-50 p-6 rounded-lg">  {/* Your styles */}
  <Switch
    className="my-custom-switch"  {/* Your styles */}
    checked={consent?.granted}
    onChange={() => handleGrantConsent(type)}  {/* Template logic */}
  />
</div>

# 6. Test component
npm test -- ConsentManagement.test.tsx
npm run dev  # Test visually in browser

# 7. Commit
git commit -m "merge: update consent management with new types, preserve custom styling"
```

**Result**: New functionality + your styling preserved.

---

## Example 4: Prisma Schema Merge (High Risk)

**Scenario**: Template added new GDPR models. You have custom product models.

### Challenge: Merge schemas without breaking your models.

### Steps:

```bash
# 1. CRITICAL: Backup schema
cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup-$(date +%Y%m%d)

# 2. View template schema
code /Users/user/Desktop/AI/projects/nextsaas/backend/prisma/schema.prisma

# 3. Identify NEW models only:
#    - DataExportRequest
#    - DataDeletionRequest
#    - ConsentRecord

# 4. Copy ONLY new models to your schema
code backend/prisma/schema.prisma

# Add at the end:
model DataExportRequest {
  id            String             @id @default(uuid())
  userId        String
  status        DataExportStatus   @default(PENDING)
  // ... copy entire model from template

  user          User               @relation(fields: [userId], references: [id])

  @@map("data_export_requests")
}

# 5. Add new enums
enum DataExportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  EXPIRED
}

# 6. Update User model (add relations)
model User {
  // ... your existing fields ...

  // ADD these lines:
  dataExportRequests   DataExportRequest[]
  dataDeletionRequests DataDeletionRequest[]
  consentRecords       ConsentRecord[]
}

# 7. Validate schema
npx prisma validate

# 8. Create migration (review SQL carefully!)
npx prisma migrate dev --name add_gdpr_models --create-only

# 9. Review migration SQL
cat backend/prisma/migrations/*_add_gdpr_models/migration.sql

# Should ONLY see:
# - CREATE TABLE data_export_requests
# - CREATE TABLE data_deletion_requests
# - CREATE TABLE consent_records
# - CREATE TYPE enums

# Should NOT see:
# - DROP TABLE your_custom_table
# - ALTER TABLE in destructive ways

# 10. If SQL looks good, apply migration
npx prisma migrate dev

# 11. Generate Prisma client
npx prisma generate

# 12. Test
npm test
```

**Result**: New GDPR models added, your models untouched.

---

## Example 5: Selective Migration Sync

**Scenario**: Template has 10 new migrations. You only want GDPR-related ones.

### Steps:

```bash
# 1. List all template migrations
ls -la /Users/user/Desktop/AI/projects/nextsaas/backend/prisma/migrations/

# Output:
# 20260115_init
# 20260118_add_gdpr_models         ← Want this
# 20260119_add_product_features    ← Skip (template-specific)
# 20260120_add_security_incidents  ← Want this

# 2. Copy only compliance migrations
cp -r /Users/user/Desktop/AI/projects/nextsaas/backend/prisma/migrations/20260118_add_gdpr_models \
      backend/prisma/migrations/

cp -r /Users/user/Desktop/AI/projects/nextsaas/backend/prisma/migrations/20260120_add_security_incidents \
      backend/prisma/migrations/

# 3. Apply migrations
npx prisma migrate deploy

# 4. Test
npm test
```

**Result**: Only compliance migrations applied.

---

## Example 6: Full Automated Sync (Using Script)

**Scenario**: Template has multiple updates. Use automated sync script.

### Steps:

```bash
# 1. Dry run first (see what would be synced)
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh \
  ~/projects/product-a \
  --dry-run

# Output shows:
# - Files that would be replaced
# - Files that need manual merge
# - Migrations available

# 2. Run actual sync
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh \
  ~/projects/product-a

# Script will:
# - Create backup (.sync-backup-*)
# - Create sync branch (sync-compliance-*)
# - Replace safe files (services, routes)
# - Warn about files needing manual merge
# - List next steps

# 3. Follow script output for manual merges
# See: .template-sync/merge-guide.md

# 4. Review all changes
cd ~/projects/product-a
git diff

# 5. Test
npm install
cd backend && npx prisma generate
npm test

# 6. Commit
git commit -m "sync: merge compliance updates from template v1.1.0"

# 7. Create PR
git push origin sync-compliance-*
```

**Result**: Most files synced automatically, clear guidance for manual steps.

---

## Example 7: Manual Copy Sync (Fallback)

**Scenario**: Git conflicts too complex. Use file copy instead.

### Steps:

```bash
# 1. Dry run
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/copy-sync.sh \
  ~/projects/product-a \
  --dry-run

# 2. Copy specific category only
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/copy-sync.sh \
  ~/projects/product-a \
  --category gdpr

# 3. Review copied files
cd ~/projects/product-a
git status

# 4. Original files backed up as .backup-*
ls -la backend/src/services/gdprService.ts.backup-*

# 5. Commit
git add .
git commit -m "sync: copy GDPR services from template"
```

**Result**: Files copied directly, no Git conflicts.

---

## Example 8: Handling Conflicts

**Scenario**: Merge conflict in gdprService.ts.

### Conflict:

```typescript
<<<<<<< HEAD (Your product)
export const requestDataExport = async (userId: string) => {
  // Your custom: send email notification
  await sendCustomEmail(userId, 'export-requested');

  const request = await prisma.dataExportRequest.create({
    data: { userId, status: 'PENDING' }
  });

  return request;
}
=======
export const requestDataExport = async (userId: string) => {
  // Template: added audit logging
  const request = await prisma.dataExportRequest.create({
    data: { userId, status: 'PENDING' }
  });

  await createAuditLog({
    userId,
    action: 'DATA_EXPORT_REQUESTED',
    resource: 'data_export_requests',
    resourceId: request.id
  });

  return request;
}
>>>>>>> template/main
```

### Resolution (Keep BOTH):

```typescript
export const requestDataExport = async (userId: string) => {
  const request = await prisma.dataExportRequest.create({
    data: { userId, status: 'PENDING' }
  });

  // Template addition: audit logging (KEEP)
  await createAuditLog({
    userId,
    action: 'DATA_EXPORT_REQUESTED',
    resource: 'data_export_requests',
    resourceId: request.id
  });

  // Your custom: email notification (KEEP)
  await sendCustomEmail(userId, 'export-requested');

  return request;
}
```

**Result**: Both changes integrated.

---

## Example 9: Rollback After Bad Sync

**Scenario**: Synced files, broke tests, need to rollback.

### Steps:

```bash
# 1. Check current branch
git branch
# * sync-compliance-20260120

# 2. Checkout main
git checkout main

# 3. Delete sync branch
git branch -D sync-compliance-20260120

# 4. Restore from backup (if needed)
ls -la .sync-backup-*
cp -r .sync-backup-20260120-143022/* .

# 5. Verify everything works
npm test

# 6. Clean up backup
rm -rf .sync-backup-*
```

**Result**: Back to pre-sync state.

---

## Example 10: Sync Multiple Products

**Scenario**: You have 3 products, all need Phase 1 cookie banner.

### Steps:

```bash
# Sync to Product A
cd ~/projects/product-a
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh .
# Test, commit, merge

# Sync to Product B
cd ~/projects/product-b
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh .
# Test, commit, merge

# Sync to Product C
cd ~/projects/product-c
/Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh .
# Test, commit, merge

# OR automate with loop:
for product in product-a product-b product-c; do
  echo "Syncing $product..."
  cd ~/projects/$product
  /Users/user/Desktop/AI/projects/nextsaas/.template-sync/sync.sh . --dry-run
  # Review, then run without --dry-run
done
```

**Result**: All products synced with same compliance updates.

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Forgetting to run migrations

**Error**: `Table 'data_export_requests' doesn't exist`

**Solution**:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

### ❌ Pitfall 2: Syncing legal pages as-is

**Error**: Privacy Policy says "YourCompany Ltd" instead of your company name.

**Solution**: Always customize legal pages:
```bash
# DON'T sync legal pages directly
# Use as template and customize
```

---

### ❌ Pitfall 3: Overwriting custom rate limits

**Error**: API rate limiting too aggressive after sync.

**Solution**: Review security.ts before syncing:
```bash
# Check your current rate limits
grep -A 5 "rateLimit" backend/src/middleware/security.ts

# After sync, restore your limits
```

---

### ❌ Pitfall 4: Not testing after sync

**Error**: Sync broke authentication, didn't notice until production.

**Solution**: Always run full test suite:
```bash
npm test
npm run test:e2e
npm run build
# Manual testing of critical flows
```

---

## Quick Reference: Which Sync Method?

| Situation | Method | Command |
|-----------|--------|---------|
| First time syncing | Automated script | `./sync.sh --dry-run` then `./sync.sh` |
| Single file update | Git cherry-pick | `git cherry-pick abc123` |
| Bug fix in service | Replace file | `git checkout template/main -- path/to/file` |
| UI component update | Manual merge | See merge-guide.md |
| Schema changes | Manual merge | CAREFULLY merge models |
| Too many conflicts | Manual copy | `./copy-sync.sh` |
| Multiple products | Loop script | Automate with for loop |

---

## Next Steps

1. **Read**: merge-guide.md for file-specific instructions
2. **Check**: sync-manifest.json for complete file inventory
3. **Try**: Dry run first: `./sync.sh --dry-run`
4. **Test**: Always test thoroughly after sync

---

**Questions?** See README.md in .template-sync/ directory.
