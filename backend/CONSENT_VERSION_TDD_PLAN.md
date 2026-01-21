# TDD Plan: Task 2.3 - Consent Version Management
**Date:** January 21, 2025
**Current Tests Passing:** 880/880 (pending user confirmation)

## Objective
Implement consent version tracking and management system with re-consent workflow following strict TDD principles.

## Test-Driven Development Approach (Red-Green-Refactor)

### Phase 1: RED - Write Failing Tests

#### 1. Database Model Tests (`src/__tests__/models/consentVersion.test.ts`)
**Tests to write FIRST:**
- [ ] Test ConsentVersion model can be created with required fields
- [ ] Test version string must follow semver format (e.g., "1.0.0")
- [ ] Test unique constraint on consentType + version
- [ ] Test that only one version can be active per consentType
- [ ] Test expiryPeriod calculates correct expiration date
- [ ] Test relation between ConsentVersion and ConsentRecord

#### 2. Service Tests (`src/__tests__/services/consentVersionService.test.ts`)
**Tests to write FIRST:**
- [ ] `createConsentVersion()` - Creates new version and deactivates old if needed
- [ ] `getActiveConsentVersion()` - Returns current active version for a type
- [ ] `needsReConsent()` - Checks if user needs to re-consent
  - [ ] Returns true if no consent exists
  - [ ] Returns true if consent expired
  - [ ] Returns true if version outdated and requiresReConsent is true
- [ ] `updateConsentVersion()` - Updates user consent to new version
- [ ] `getConsentHistory()` - Returns user's consent history
- [ ] `handleExpiredConsents()` - Revokes expired consents
- [ ] `compareVersions()` - Compares two consent versions

#### 3. API Endpoint Tests (`src/__tests__/routes/consentVersions.test.ts`)
**Tests to write FIRST:**

**Admin Routes:**
- [ ] POST `/api/admin/consent-versions` - Create new version (admin only)
- [ ] GET `/api/admin/consent-versions/:type` - List all versions
- [ ] GET `/api/admin/consent-versions/:type/active` - Get active version
- [ ] GET `/api/admin/consent-versions/:type/users-needing-reconsent` - List users
- [ ] POST `/api/admin/consent-versions/compare` - Compare two versions

**User Routes:**
- [ ] GET `/api/gdpr/consents/:type/needs-reconsent` - Check if re-consent needed
- [ ] GET `/api/gdpr/consents/history` - Get consent history
- [ ] POST `/api/gdpr/consents/update-version` - Re-consent with new version

### Phase 2: GREEN - Implement to Pass Tests

#### Order of Implementation (Database → Backend → Frontend):

1. **Database Schema**
   - Add ConsentVersion model to Prisma schema
   - Add versionId and expiresAt to ConsentRecord
   - Create and run migration

2. **Backend Services**
   - Implement consentVersionService.ts with all functions
   - Update existing gdprService.ts to use versions

3. **API Routes**
   - Create admin routes for version management
   - Add user routes for re-consent flow

4. **Frontend Components** (if time permits)
   - Re-consent banner component
   - Consent history view
   - Admin version management UI

### Phase 3: REFACTOR - Improve Code Quality
- Clean up any duplication
- Improve error handling
- Add proper logging
- Optimize database queries

## Key Features to Test

### 1. Version Management
- Semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Only one active version per consent type
- Version comparison and change tracking

### 2. Re-consent Logic
- Detect when user needs to re-consent
- Track reason (expired, outdated, no consent)
- Proper consent update with new version

### 3. Expiry Handling
- Consent expires after configured period
- Automatic revocation of expired consents
- Proper tracking of expiry dates

### 4. Audit Trail
- Full history of consent changes
- Version tracking in audit logs
- Compliance reporting

## Success Criteria
- [ ] All new tests pass (100% coverage for new code)
- [ ] All existing 880 tests still pass
- [ ] No TypeScript errors
- [ ] Database migrations work correctly
- [ ] Re-consent flow works end-to-end
- [ ] Proper error handling for edge cases
- [ ] All issues documented in ISSUES_LOG.md

## Risk Mitigation
- Backup schema before changes
- Test migrations on development first
- Verify no breaking changes to existing consent flow
- Document all API changes

## Files to Create/Modify

**New Files:**
- `src/__tests__/models/consentVersion.test.ts`
- `src/__tests__/services/consentVersionService.test.ts`
- `src/__tests__/routes/consentVersions.test.ts`
- `src/services/consentVersionService.ts`
- `src/routes/admin/consentVersions.ts`

**Modified Files:**
- `prisma/schema.prisma` (add ConsentVersion model)
- `src/services/gdprService.ts` (integrate with versions)
- `src/routes/gdpr.ts` (add version endpoints)
- `src/routes/admin.ts` (register version routes)

## Commands for TDD Cycle

```bash
# 1. Run specific test file (RED phase)
npm test src/__tests__/services/consentVersionService.test.ts

# 2. Implement minimum code (GREEN phase)
# ... write implementation ...

# 3. Run test again to verify pass
npm test src/__tests__/services/consentVersionService.test.ts

# 4. Ask user to run full suite for verification
# "Could you please run the full test suite?"
```

## Notes
- MUST follow TDD - tests first, then implementation
- MUST see tests fail before implementing
- MUST implement minimal code to pass
- MUST document all issues in ISSUES_LOG.md
- MUST maintain all 880 existing tests passing