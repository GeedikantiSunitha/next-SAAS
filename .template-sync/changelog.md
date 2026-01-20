# Template Changelog

Track all template changes here for easy syncing to products.

Format:
```
## [Date] - [Phase/Feature]
### Added
- File: path/to/file - Description
### Changed
- File: path/to/file - What changed
### Removed
- File: path/to/file - Why removed
```

---

## [2026-01-20] - Template Sync System Added

### Added
- `.template-sync/README.md` - Sync system documentation
- `.template-sync/sync-manifest.json` - Complete file inventory with sync strategies
- `.template-sync/merge-guide.md` - File-by-file merge instructions
- `.template-sync/sync.sh` - Automated sync script (Git-based)
- `.template-sync/changelog.md` - This file - track all changes

### Purpose
Enable easy syncing of compliance updates from template to live products.

### Impact on Products
**Action Required**: None yet (setup only)
**Breaking Changes**: None

---

## [2026-01-20] - World-Class Compliance Roadmap

### Added
- `docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md` - Complete 6-phase compliance implementation guide
  - 465+ actionable checkboxes
  - Phase 1: Legal Foundation (3 weeks)
  - Phase 2: Enhanced GDPR (4 weeks)
  - Phase 3: Security Hardening (6 weeks)
  - Phase 4: Enterprise Features (10 weeks)
  - Phase 5: International Compliance (8 weeks)
  - Phase 6: Accessibility (4 weeks)

### Impact on Products
**Action Required**: Reference for implementing compliance features
**Breaking Changes**: None (documentation only)

---

## [Existing - Phase 1-3 Complete] - Current Implementation

### Compliance Features Implemented

#### GDPR Core (Phase 1-2)
**Files**:
- `backend/src/services/gdprService.ts` - Data export, deletion, consent
- `backend/src/routes/gdpr.ts` - GDPR API endpoints
- `backend/prisma/schema.prisma` - Models: DataExportRequest, DataDeletionRequest, ConsentRecord
- `frontend/src/components/ConsentManagement.tsx` - Consent UI
- `frontend/src/components/DataDeletionRequest.tsx` - Deletion request UI
- `frontend/src/components/gdpr/DataExport.tsx` - Export request UI
- `frontend/src/pages/GdprSettings.tsx` - GDPR settings page
- `frontend/src/api/gdpr.ts` - GDPR API client

**Tests**:
- `backend/src/__tests__/gdprService.test.ts` - 22 tests
- `backend/src/__tests__/routes/gdpr.consent.e2e.test.ts`
- `backend/src/__tests__/routes/gdpr.deletion.e2e.test.ts`

**Database Tables**:
- `data_export_requests`
- `data_deletion_requests`
- `consent_records`

**Sync Strategy**: REPLACE services/routes, MERGE UI components

---

#### Audit Logging (Phase 1)
**Files**:
- `backend/src/services/auditService.ts` - Complete audit system
- `backend/src/routes/audit.ts` - Audit API endpoints
- `backend/prisma/schema.prisma` - Model: AuditLog

**Tests**:
- `backend/src/__tests__/auditService.test.ts` - 19 tests
- `backend/src/__tests__/routes/audit.ipCapture.test.ts`
- `backend/src/__tests__/routes/profile-audit.test.ts`

**Database Tables**:
- `audit_logs`

**Sync Strategy**: REPLACE (core compliance feature)

---

#### Authentication & Security (Phase 1)
**Files**:
- `backend/src/middleware/auth.ts` - JWT authentication
- `backend/src/middleware/security.ts` - Helmet, CORS, rate limiting
- `backend/src/services/authService.ts` - Auth logic
- `backend/src/services/mfaService.ts` - MFA (TOTP, Email OTP, Backup codes)
- `backend/src/services/oauthService.ts` - OAuth (Google, GitHub, Microsoft)

**Sync Strategy**: SKIP auth.ts (likely customized), REVIEW security.ts

---

#### Payment Compliance (Phase 3)
**Files**:
- `backend/src/services/paymentService.ts` - Multi-provider payments
- `backend/src/providers/StripeProvider.ts` - Stripe integration
- `backend/src/providers/RazorpayProvider.ts` - Razorpay integration
- `backend/src/providers/CashfreeProvider.ts` - Cashfree integration
- `backend/src/routes/payments.ts` - Payment API

**Tests**:
- `backend/src/__tests__/paymentService.test.ts` - 16 tests

**Database Tables**:
- `payments`
- `payment_refunds`
- `payment_webhook_logs`
- `subscriptions`

**Sync Strategy**: REPLACE (unless customized)

---

#### RBAC & Permissions (Phase 2)
**Files**:
- `backend/src/services/rbacService.ts` - Role-based access control
- `backend/src/routes/rbac.ts` - RBAC API

**Tests**:
- `backend/src/__tests__/rbacService.test.ts` - 34 tests

**Sync Strategy**: REVIEW (may be customized per product)

---

### Impact on Products
**Action Required**:
1. Sync GDPR features if not already present
2. Sync audit logging if not already present
3. Review and sync security middleware

**Breaking Changes**: None (additive features)

---

## [UPCOMING - Phase 1 Implementation] - Legal Foundation

### To Be Added (Week 1-3)

#### Cookie Consent (Week 2)
**New Files**:
- `frontend/src/components/CookieConsentBanner.tsx` - Cookie banner
- `frontend/src/components/CookiePreferenceCenter.tsx` - Preference modal
- `backend/src/routes/gdpr.ts` - Add cookie consent endpoint

**Database Changes**:
- None (uses existing ConsentRecord with type: COOKIES)

**Sync Strategy**: MERGE (high customization expected - styling, wording, brand)

**Impact on Products**:
- **Action Required**: High - Must customize for brand
- **Breaking Changes**: None
- **Testing Required**: Cookie blocking, consent flow, persistence

---

#### Legal Pages (Week 1-3)
**New Files**:
- `frontend/src/pages/legal/PrivacyPolicy.tsx`
- `frontend/src/pages/legal/TermsOfService.tsx`
- `frontend/src/pages/legal/CookiePolicy.tsx`
- `frontend/src/pages/legal/AcceptableUse.tsx`

**Database Changes**:
- `privacy_policies` - Version tracking
- `policy_acceptances` - User acceptance tracking

**Sync Strategy**: SKIP or TEMPLATE
- Each product needs custom content
- Can use template as starting point

**Impact on Products**:
- **Action Required**: Critical - Must write custom policies
- **Breaking Changes**: None
- **Legal Review Required**: Yes

---

#### ICO Registration (Week 3)
**New Files**:
- None (administrative process)

**Changes**:
- Add ICO registration number to footer
- Add to environment variables

**Sync Strategy**: MANUAL
- Register each product separately with ICO
- £40 annual fee per product

**Impact on Products**:
- **Action Required**: Critical - Must register each product
- **Breaking Changes**: None

---

## [UPCOMING - Phase 2 Implementation] - Enhanced GDPR

### To Be Added (Week 4-7)

#### Automated Data Retention (Week 4)
**New Files**:
- `backend/src/services/dataRetentionService.ts` - Retention policies
- `backend/src/config/dataRetention.ts` - Policy configuration
- `backend/src/jobs/retentionJob.ts` - Cron job
- `backend/src/routes/admin/dataRetention.ts` - Admin API
- `frontend/src/pages/admin/AdminDataRetention.tsx` - Admin UI

**Database Changes**:
```sql
-- Add to User model
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN anonymized_at TIMESTAMP;
ALTER TABLE users ADD COLUMN on_legal_hold BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN legal_hold_reason TEXT;
ALTER TABLE users ADD COLUMN legal_hold_at TIMESTAMP;
ALTER TABLE users ADD COLUMN legal_hold_released_at TIMESTAMP;
```

**Dependencies**:
- `node-cron` package

**Sync Strategy**: REVIEW THEN REPLACE
- Review retention periods (may differ per product)
- Replace code logic

**Impact on Products**:
- **Action Required**: High - Review retention periods
- **Breaking Changes**: None
- **Testing Required**: Dry-run retention job first

---

#### Breach Notification System (Week 5-6)
**New Files**:
- `backend/src/services/securityIncidentService.ts` - Incident management
- `backend/src/routes/admin/securityIncidents.ts` - Admin API
- `frontend/src/pages/admin/SecurityIncidents.tsx` - Admin dashboard
- Email templates: `breach-alert.html`, `breach-notification.html`, etc.

**Database Changes**:
```sql
-- New tables
CREATE TABLE security_incidents (...);
CREATE TABLE breach_notifications (...);

-- New enums
CREATE TYPE incident_type AS ENUM (...);
CREATE TYPE incident_severity AS ENUM (...);
CREATE TYPE incident_status AS ENUM (...);
```

**Sync Strategy**: REPLACE
- Core security feature, don't customize

**Impact on Products**:
- **Action Required**: Medium - Set DPO email
- **Breaking Changes**: None
- **Testing Required**: Test email notifications

---

#### Enhanced Privacy Center (Week 7)
**New Files**:
- `frontend/src/pages/PrivacyCenter.tsx` - Unified privacy dashboard

**Sync Strategy**: MERGE
- May integrate into existing settings differently

**Impact on Products**:
- **Action Required**: Medium - Integration needed
- **Breaking Changes**: None

---

## How to Use This Changelog

### When Template is Updated

1. **Read new entries** in this changelog
2. **Check "Impact on Products"** section
3. **Determine sync priority**:
   - Critical: Sync ASAP (security fixes, legal requirements)
   - High: Sync within 1 week
   - Medium: Sync when convenient
   - Low: Optional

4. **Follow sync strategy** from sync-manifest.json
5. **Use merge-guide.md** for file-specific instructions

### When Syncing to Product

1. Note template version: `git rev-parse nextsaas-template/main`
2. Note product version before sync: `git rev-parse HEAD`
3. After sync, update your product's changelog:
   ```
   ## [Date] - Synced from nextsaas template

   Template commit: abc123
   Files synced:
   - backend/src/services/gdprService.ts
   - ... etc

   Breaking changes: None
   Action required: Run migrations
   ```

---

## Versioning

Template versions follow semantic versioning:

- **Major**: Breaking changes (rare)
- **Minor**: New features (Phase implementations)
- **Patch**: Bug fixes, documentation

Current: **v1.0.0**

---

## Breaking Changes Policy

We avoid breaking changes whenever possible.

If breaking changes are necessary:
1. Announced 4 weeks in advance
2. Migration guide provided
3. Old version supported for 8 weeks

---

**Last Updated**: 2026-01-20
**Next Planned Update**: Phase 1 implementation complete
