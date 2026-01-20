# Template Merge Guide
## File-by-File Instructions for Syncing Compliance Updates

This guide provides detailed instructions for merging each type of file from the template into your product.

---

## 📋 Quick Reference: Merge Strategy by File Type

| File Type | Strategy | Risk | Notes |
|-----------|----------|------|-------|
| **Services** (gdprService, auditService) | REPLACE | Low | Core compliance - don't customize |
| **Routes** (gdpr.ts, audit.ts) | REPLACE | Low | Standard endpoints |
| **UI Components** (CookieConsent, etc) | MERGE | Medium | Match your design system |
| **Pages** (GdprSettings, etc) | MERGE | High | May have custom layout |
| **Middleware** (security.ts) | REVIEW | Medium | Check rate limits/CORS |
| **Schema** (schema.prisma) | MERGE | Very High | Has product models |
| **Migrations** | SELECTIVE | High | Only new compliance tables |
| **Tests** | REPLACE | Low | Keep in sync with code |
| **Legal Pages** | SKIP | Very High | Product-specific content |
| **Config** (.env, config.ts) | REVIEW | High | Product-specific values |

---

## 🔧 Core Compliance Services

### ✅ backend/src/services/gdprService.ts

**Strategy**: REPLACE (always use template version)

**Why**: This is core GDPR implementation. Should NOT be customized.

**Steps**:
```bash
# Copy from template
cp /path/to/nextsaas/backend/src/services/gdprService.ts ./backend/src/services/

# Or via Git
git checkout nextsaas-template/main -- backend/src/services/gdprService.ts
```

**After Merge**:
- [ ] Run tests: `npm test -- gdprService.test.ts`
- [ ] Check imports are correct
- [ ] Verify prisma models exist
- [ ] Check audit log integration works

**Conflicts**: Low risk - if you modified this file, review why and consider removing customizations.

---

### ✅ backend/src/services/auditService.ts

**Strategy**: REPLACE

**Why**: Core audit system for compliance. Should NOT be customized.

**Steps**:
```bash
cp /path/to/nextsaas/backend/src/services/auditService.ts ./backend/src/services/
```

**After Merge**:
- [ ] Run tests: `npm test -- auditService.test.ts`
- [ ] Verify logger integration
- [ ] Check prisma models exist

**Conflicts**: Low risk.

---

### ⚠️ backend/src/services/dataRetentionService.ts (Phase 2)

**Strategy**: REVIEW THEN REPLACE

**Why**: Contains retention periods that may differ per product.

**Steps**:
1. Copy template file
2. Review retention periods in `dataRetention.ts` config
3. Adjust if needed:
   - Inactive users: 3 years (UK GDPR default)
   - Audit logs: 7 years (UK legal requirement)
   - Payment records: 7 years (UK tax law)

```bash
# Copy
cp /path/to/nextsaas/backend/src/services/dataRetentionService.ts ./backend/src/services/
cp /path/to/nextsaas/backend/src/config/dataRetention.ts ./backend/src/config/

# Edit retention periods if needed
code backend/src/config/dataRetention.ts
```

**Customization Points**:
```typescript
// backend/src/config/dataRetention.ts
export const DATA_RETENTION_POLICIES = {
  INACTIVE_USER: {
    period: '3 years',  // ← Can adjust based on your policy
    action: 'ANONYMIZE',
  },
  // ... other policies
};
```

**After Merge**:
- [ ] Review all retention periods
- [ ] Update cron schedule if needed
- [ ] Test retention job: `npm test -- dataRetention`
- [ ] Run manual test: `POST /admin/retention/enforce`

---

### ✅ backend/src/services/securityIncidentService.ts (Phase 2)

**Strategy**: REPLACE

**Why**: Core security incident and breach notification. Should NOT be customized.

**Steps**:
```bash
cp /path/to/nextsaas/backend/src/services/securityIncidentService.ts ./backend/src/services/
```

**After Merge**:
- [ ] Set environment variables:
  - `DPO_EMAIL` or `ADMIN_EMAIL`
  - `COMPANY_NAME`
  - `ICO_REGISTRATION_NUMBER`
- [ ] Run tests
- [ ] Test email templates

---

## 🛣️ API Routes

### ✅ backend/src/routes/gdpr.ts

**Strategy**: REPLACE

**Why**: Standard GDPR endpoints. Should NOT be customized.

**Steps**:
```bash
cp /path/to/nextsaas/backend/src/routes/gdpr.ts ./backend/src/routes/
```

**After Merge**:
- [ ] Ensure route is registered in `backend/src/app.ts`:
  ```typescript
  import gdprRoutes from './routes/gdpr';
  app.use('/api/gdpr', gdprRoutes);
  ```
- [ ] Run E2E tests: `npm test -- gdpr.*.e2e.test.ts`
- [ ] Test in Postman/Thunder Client

**Conflicts**: None expected unless you added custom GDPR endpoints.

---

### ✅ backend/src/routes/audit.ts

**Strategy**: REPLACE

**Why**: Standard audit endpoints.

**Steps**:
```bash
cp /path/to/nextsaas/backend/src/routes/audit.ts ./backend/src/routes/
```

**After Merge**:
- [ ] Ensure route is registered in app.ts
- [ ] Run tests
- [ ] Verify RBAC middleware works

---

### ⚠️ backend/src/routes/admin/securityIncidents.ts (Phase 2)

**Strategy**: REPLACE

**Why**: Admin-only security incident routes.

**Steps**:
```bash
mkdir -p ./backend/src/routes/admin
cp /path/to/nextsaas/backend/src/routes/admin/securityIncidents.ts ./backend/src/routes/admin/
```

**After Merge**:
- [ ] Register in admin routes
- [ ] Test RBAC (only ADMIN/SUPER_ADMIN can access)
- [ ] Test incident reporting flow

---

## 🎨 Frontend Components

### ⚠️ frontend/src/components/ConsentManagement.tsx

**Strategy**: MERGE (may need styling customization)

**Why**: UI component that should match your design system.

**Conflict Resolution**:

**If NO customizations** (using template as-is):
```bash
# Just replace
cp /path/to/nextsaas/frontend/src/components/ConsentManagement.tsx ./frontend/src/components/
```

**If CUSTOMIZED** (e.g., different styling):

1. **Backup your version**:
```bash
cp ./frontend/src/components/ConsentManagement.tsx ./frontend/src/components/ConsentManagement.tsx.backup
```

2. **Copy template version**:
```bash
cp /path/to/nextsaas/frontend/src/components/ConsentManagement.tsx ./frontend/src/components/
```

3. **Restore your customizations**:
   - Styling classes
   - Layout structure
   - Brand colors
   - Icons

4. **Keep template logic**:
   - API calls
   - State management
   - Consent type handling
   - Error handling

**Example Merge**:
```tsx
// TEMPLATE (logic) - KEEP THIS
const handleGrantConsent = async (type: ConsentType) => {
  await api.post('/gdpr/consents', { consentType: type });
  await fetchConsents();
};

// YOUR STYLING - KEEP THIS
<div className="your-custom-card-class">  {/* Your styling */}
  <Switch
    className="your-custom-switch"  {/* Your styling */}
    checked={consent?.granted}
    onChange={() => handleGrantConsent(type)}  {/* Template logic */}
  />
</div>
```

**After Merge**:
- [ ] Test consent grant/revoke
- [ ] Verify styling matches your design
- [ ] Test responsive layout
- [ ] Run component tests

---

### ⚠️ frontend/src/components/CookieConsentBanner.tsx (Phase 1 - Coming)

**Strategy**: MERGE (high customization expected)

**Why**: Must match your brand, colors, positioning, wording.

**What to Keep from Template**:
- Consent storage logic (localStorage + backend)
- Cookie blocking logic
- Consent version tracking
- GDPR compliance structure

**What to Customize**:
- Colors, fonts, spacing
- Button styles
- Wording/copy
- Position (bottom, top, modal)
- Animation/transitions

**Steps**:
1. Copy template file
2. Update brand colors
3. Update copy/wording
4. Test consent flow thoroughly

---

### ⚠️ frontend/src/pages/GdprSettings.tsx

**Strategy**: MERGE or INTEGRATE

**Why**: Your product may have different settings page structure.

**Options**:

**Option A: Replace entirely** (if you don't have custom settings):
```bash
cp /path/to/nextsaas/frontend/src/pages/GdprSettings.tsx ./frontend/src/pages/
```

**Option B: Integrate into existing settings** (if you have custom settings):
```typescript
// YOUR: frontend/src/pages/Settings.tsx
import { ConsentManagement } from '../components/ConsentManagement';
import { DataDeletionRequest } from '../components/DataDeletionRequest';

export const Settings = () => {
  return (
    <YourSettingsLayout>
      {/* Your existing settings tabs */}
      <Tab label="Profile">...</Tab>
      <Tab label="Billing">...</Tab>

      {/* NEW: Add compliance tabs */}
      <Tab label="Privacy">
        <ConsentManagement />
        <DataDeletionRequest />
      </Tab>
    </YourSettingsLayout>
  );
};
```

**After Merge**:
- [ ] Test navigation
- [ ] Test all privacy controls
- [ ] Verify styling consistency

---

## 📄 Legal Pages

### ❌ frontend/src/pages/legal/PrivacyPolicy.tsx (Phase 1 - Coming)

**Strategy**: SKIP or USE AS TEMPLATE

**Why**: Each product needs its own privacy policy.

**Options**:

**Option 1: Use template as starting point**:
```bash
# Copy template
cp /path/to/nextsaas/frontend/src/pages/legal/PrivacyPolicy.tsx ./frontend/src/pages/legal/

# EDIT with your product details:
# - Company name
# - Data collected
# - Purposes
# - Third parties
# - Contact information
```

**Option 2: Skip entirely** (write your own or hire lawyer):
```bash
# Don't sync this file
# Create your own based on your requirements
```

**Critical Customizations**:
- [ ] Company/controller name and address
- [ ] DPO contact (if applicable)
- [ ] Specific data you collect
- [ ] Third-party services you use (Stripe, AWS, etc.)
- [ ] Your purposes for processing
- [ ] Your retention periods
- [ ] International transfers (if any)

---

## 🗄️ Database Schema

### ⚠️⚠️ backend/prisma/schema.prisma

**Strategy**: CAREFUL MANUAL MERGE

**Why**: Contains both template models AND your custom product models.

**Risk**: VERY HIGH - Can break your database if merged incorrectly.

**Steps**:

1. **Backup your schema**:
```bash
cp ./backend/prisma/schema.prisma ./backend/prisma/schema.prisma.backup
```

2. **Identify new template models**:
```bash
# View template schema
code /path/to/nextsaas/backend/prisma/schema.prisma

# Look for new models:
# - DataExportRequest
# - DataDeletionRequest
# - ConsentRecord
# - SecurityIncident (Phase 2)
# - BreachNotification (Phase 2)
```

3. **Copy ONLY new models**:
```prisma
// ADD to your schema.prisma:

// GDPR Models
model DataExportRequest {
  id            String             @id @default(uuid())
  userId        String
  status        DataExportStatus   @default(PENDING)
  requestedAt   DateTime           @default(now())
  completedAt   DateTime?
  downloadUrl   String?
  fileSize      Int?
  expiresAt     DateTime?
  errorMessage  String?

  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@map("data_export_requests")
}

// ... copy other new models
```

4. **Copy new enums**:
```prisma
enum DataExportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  EXPIRED
}
```

5. **Update User model** (if needed):
```prisma
model User {
  // ... your existing fields

  // ADD if not present:
  dataExportRequests   DataExportRequest[]
  dataDeletionRequests DataDeletionRequest[]
  consentRecords       ConsentRecord[]

  // Phase 2 additions:
  lastLoginAt          DateTime?
  anonymizedAt         DateTime?
  onLegalHold          Boolean   @default(false)
  legalHoldReason      String?
}
```

6. **Create migration**:
```bash
npx prisma migrate dev --name add_gdpr_compliance
```

7. **Verify migration**:
```bash
# Check migration SQL
cat backend/prisma/migrations/*_add_gdpr_compliance/migration.sql

# Should only create NEW tables, not modify existing ones
```

**After Merge**:
- [ ] Review migration SQL carefully
- [ ] Test on development database first
- [ ] Run `npx prisma generate`
- [ ] Run all tests
- [ ] Verify existing data unchanged

**Conflicts**:

**If User model conflicts**:
```prisma
// YOURS (keep your fields)
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  customField String   // Your custom field

  // MERGE: Add template fields
  lastLoginAt DateTime?
  anonymizedAt DateTime?
  onLegalHold Boolean @default(false)

  // MERGE: Add relations
  dataExportRequests DataExportRequest[]
}
```

---

## 🗃️ Database Migrations

### ⚠️ backend/prisma/migrations/

**Strategy**: SELECTIVE SYNC

**Why**: Only sync NEW compliance migrations, not your custom migrations.

**Steps**:

1. **List new migrations in template**:
```bash
ls -la /path/to/nextsaas/backend/prisma/migrations/ | grep gdpr
ls -la /path/to/nextsaas/backend/prisma/migrations/ | grep compliance
ls -la /path/to/nextsaas/backend/prisma/migrations/ | grep audit
```

2. **Copy only compliance migrations**:
```bash
# Example
cp -r /path/to/nextsaas/backend/prisma/migrations/*_gdpr_* ./backend/prisma/migrations/
```

3. **DON'T copy**:
- Your custom migrations
- Any migration that touches your custom tables

**After Merge**:
- [ ] Review migration SQL
- [ ] Apply migrations: `npx prisma migrate deploy`
- [ ] Verify tables created correctly
- [ ] Run all tests

---

## 🧪 Tests

### ✅ All test files (*.test.ts, *.test.tsx)

**Strategy**: REPLACE

**Why**: Tests should match the code they're testing.

**Steps**:
```bash
# Copy all compliance tests
cp /path/to/nextsaas/backend/src/__tests__/gdprService.test.ts ./backend/src/__tests__/
cp /path/to/nextsaas/backend/src/__tests__/auditService.test.ts ./backend/src/__tests__/
cp /path/to/nextsaas/backend/src/__tests__/routes/gdpr.*.test.ts ./backend/src/__tests__/routes/
```

**After Merge**:
- [ ] Run tests: `npm test`
- [ ] All tests should pass
- [ ] If tests fail, code may be out of sync

**Conflicts**: None - if tests fail, fix the code, not the tests.

---

## ⚙️ Configuration Files

### ⚠️ backend/src/middleware/security.ts

**Strategy**: REVIEW CAREFULLY

**Why**: Contains rate limits and CORS that may differ per product.

**Steps**:

1. **Backup your version**:
```bash
cp ./backend/src/middleware/security.ts ./backend/src/middleware/security.ts.backup
```

2. **Copy template**:
```bash
cp /path/to/nextsaas/backend/src/middleware/security.ts ./backend/src/middleware/
```

3. **Review and customize**:
```typescript
// Rate limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // ← REVIEW: Your API may need different limits
});

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL,  // ← REVIEW: Check your domains
  credentials: true,
};

// CSP
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],  // ← REVIEW: Your scripts
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", process.env.API_URL],  // ← REVIEW: Your APIs
  }
}
```

**After Merge**:
- [ ] Test rate limiting doesn't block normal usage
- [ ] Test CORS allows your frontend
- [ ] Test CSP doesn't break your app
- [ ] Check security headers in browser DevTools

---

### ❌ .env files

**Strategy**: NEVER SYNC

**Why**: Contains product-specific secrets and configuration.

**What to do**: Manually add new environment variables from template `.env.example`.

**Steps**:

1. **Check template .env.example**:
```bash
cat /path/to/nextsaas/backend/.env.example
```

2. **Add new variables to YOUR .env**:
```bash
# New Phase 2 variables (example):
DPO_EMAIL=privacy@yourcompany.com
COMPANY_NAME=Your Company Ltd
ICO_REGISTRATION_NUMBER=ZA123456
```

**Don't copy**:
- Database URLs
- API keys
- Secrets
- Domain names

---

## 📚 Documentation

### ✅ All documentation files

**Strategy**: REPLACE

**Why**: Documentation should always be latest version.

**Steps**:
```bash
cp /path/to/nextsaas/docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md ./docs/
cp /path/to/nextsaas/docs/compliance_view ./docs/
```

**After Merge**:
- [ ] Read new sections
- [ ] Update your progress tracking

**Conflicts**: None.

---

## 🚨 Special Cases

### 🔥 If You See This Error After Syncing

**Error**: `Cannot find module 'XYZ'`

**Fix**:
```bash
# Install new dependencies
npm install
```

**Error**: `Prisma schema validation failed`

**Fix**:
```bash
# Regenerate Prisma client
npx prisma generate
```

**Error**: Tests fail with `Table doesn't exist`

**Fix**:
```bash
# Run migrations
npx prisma migrate deploy

# Or reset database (DEVELOPMENT ONLY)
npx prisma migrate reset
```

**Error**: `Rate limit exceeded`

**Fix**: Adjust rate limits in `middleware/security.ts`

---

## ✅ Post-Merge Checklist

After syncing ANY files, always:

- [ ] Install dependencies: `npm install`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Run tests: `npm test`
- [ ] Run linter: `npm run lint`
- [ ] Build: `npm run build`
- [ ] Test manually in browser/Postman
- [ ] Review `git diff` to see all changes
- [ ] Test critical flows:
  - [ ] Authentication works
  - [ ] Your custom features work
  - [ ] GDPR endpoints work
  - [ ] UI renders correctly
  - [ ] No console errors

---

## 🎯 Phase-by-Phase Sync Guide

### Phase 1 Sync (Legal Foundation)

**New Files** (will be added after Phase 1 implementation):
```
frontend/src/components/CookieConsentBanner.tsx
frontend/src/components/CookiePreferenceCenter.tsx
frontend/src/pages/legal/PrivacyPolicy.tsx
frontend/src/pages/legal/TermsOfService.tsx
frontend/src/pages/legal/CookiePolicy.tsx
frontend/src/pages/legal/AcceptableUse.tsx
backend/src/routes/gdpr.ts (cookie consent endpoint)
```

**How to Sync**:
- CookieConsent components: MERGE (customize styling)
- Legal pages: SKIP (write your own)
- GDPR cookie endpoint: REPLACE

### Phase 2 Sync (Enhanced GDPR)

**New Files**:
```
backend/src/services/dataRetentionService.ts
backend/src/services/securityIncidentService.ts
backend/src/config/dataRetention.ts
backend/src/jobs/retentionJob.ts
backend/src/routes/admin/securityIncidents.ts
frontend/src/pages/admin/SecurityIncidents.tsx
frontend/src/pages/PrivacyCenter.tsx
```

**How to Sync**:
- Services: REPLACE (review retention periods)
- Admin pages: MERGE (match your admin UI)
- Cron job: REPLACE (adjust schedule if needed)

---

## 💡 Pro Tips

1. **Always test in staging first** - Never sync directly to production
2. **Create a sync branch** - `git checkout -b sync-compliance-$(date +%Y%m%d)`
3. **Review line by line** - `git diff` before committing
4. **Keep a rollback plan** - Tag before syncing: `git tag pre-sync-$(date +%Y%m%d)`
5. **Sync often** - Smaller, frequent syncs are easier than big ones
6. **Document your customizations** - Add comments: `// CUSTOM: Modified for Product A`

---

**Next**: See `sync.sh` for automated sync script or `sync-manifest.json` for complete file inventory.
