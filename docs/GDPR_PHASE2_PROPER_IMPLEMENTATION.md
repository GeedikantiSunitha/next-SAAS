# GDPR Phase 2 - Proper Implementation Plan (With TDD)

## Lessons Learned from Failed Attempt

### What Went Wrong:
1. **Schema-last approach**: Wrote services before updating schema, leading to reactive field additions
2. **Skipped TDD**: Jumped straight to implementation without tests
3. **Cut corners**: Removed features instead of implementing them (email attachments, DB logging)
4. **Poor error handling**: Used non-null assertions instead of proper validation

### What We're Doing Right This Time:
1. **Schema-first approach**: Design complete database schema before any code
2. **TDD strictly**: Write tests → See them fail → Implement → See them pass
3. **Complete features**: Implement everything properly, including attachments and logging
4. **Proper validation**: Use validation utilities, no shortcuts

---

## Implementation Order (Following TDD)

### Phase 1: Foundation (Week 1)

#### 1.1 Complete Database Schema Design
**Before writing ANY code:**
- [ ] Review all three features (Breach, Consent, Deletion)
- [ ] List ALL required fields for each model
- [ ] Design relationships and indexes
- [ ] Create one comprehensive migration

**Required Models:**
```prisma
// Data Breach Management
model DataBreach {
  id                    String
  title                 String
  description           String
  severity              BreachSeverity
  status                BreachStatus
  dataCategories        DataCategory[]
  affectedUsers         Int
  affectedUserIds       String[]
  detectedAt            DateTime
  reportedAt            DateTime?
  assessedAt            DateTime?
  icoNotifiedAt         DateTime?
  usersNotifiedAt       DateTime?
  icoReferenceNumber    String?
  breachSource          String?
  containmentMeasures   String?
  createdById           String
  createdAt             DateTime
  updatedAt             DateTime

  assessments           BreachAssessment[]
  notifications         BreachNotification[]
  securityIncident      SecurityIncident?
}

model BreachAssessment {
  id                    String
  breachId              String
  requiresICONotification Boolean
  requiresUserNotification Boolean
  riskLevel             String
  reasoning             String
  assessedById          String
  assessedAt            DateTime
}

model BreachNotification {
  id                    String
  breachId              String
  type                  NotificationType // ICO, USER, DPA
  recipientId           String?
  recipientEmail        String
  sentAt                DateTime
  content               String
  attachmentUrl         String? // For PDF certificates
}

// Enhanced Consent Management
model ConsentRecord {
  id                    String
  userId                String
  consentType           ConsentType
  granted               Boolean
  status                ConsentStatus
  source                ConsentSource
  version               String
  grantedAt             DateTime?
  revokedAt             DateTime?
  ipAddress             String?
  userAgent             String?
  createdAt             DateTime
  updatedAt             DateTime

  audits                ConsentAudit[]
}

model ConsentAudit {
  id                    String
  consentRecordId       String
  action                String
  previousStatus        String?
  newStatus             String
  reason                String?
  performedById         String
  ipAddress             String?
  userAgent             String?
  timestamp             DateTime
}

model ConsentVersion {
  id                    String
  consentType           ConsentType
  version               String
  title                 String
  description           String
  content               String
  legalBasis            String
  purposes              Json
  dataCategories        Json
  retention             String?
  thirdParties          Json?
  effectiveDate         DateTime
  isActive              Boolean
}

model ConsentWithdrawal {
  id                    String
  userId                String
  consentType           ConsentType
  reason                String?
  withdrawnAt           DateTime
  withdrawalMethod      String
  confirmedAt           DateTime
  processedAt           DateTime?
  certificateId         String
  certificateHash       String
  certificateUrl        String? // PDF storage
}

// Enhanced Deletion
model DataDeletionRequest {
  id                    String
  userId                String
  status                DeletionStatus
  reason                String?
  scheduledFor          DateTime?
  processedAt           DateTime?
  certificateId         String?
  certificateUrl        String? // PDF certificate
  deletionLog           Json?
  createdAt             DateTime
  updatedAt             DateTime
}
```

#### 1.2 Core Utilities (TDD)
**Test First, Then Implement:**

1. **Email Service with Attachments**:
   - [ ] Write tests for attachment support
   - [ ] Implement attachment interface
   - [ ] Test with actual email providers

2. **PDF Generation Service**:
   - [ ] Write tests for certificate generation
   - [ ] Implement PDF templates
   - [ ] Test certificate verification

3. **Database Logging**:
   - [ ] Write tests for Prisma logging
   - [ ] Implement proper Prisma middleware
   - [ ] Test audit trail creation

4. **Validation Utilities** (we have good ones):
   - [ ] Import from backup
   - [ ] Add any missing validators

---

### Phase 2: Data Breach Notification (Week 2)

#### 2.1 Write Tests First
```typescript
describe('Data Breach Service', () => {
  describe('reportDataBreach', () => {
    it('should create breach record with all required fields')
    it('should validate all inputs')
    it('should trigger assessment for critical breaches')
    it('should calculate 72-hour deadline correctly')
  })

  describe('assessBreach', () => {
    it('should determine ICO notification requirement')
    it('should determine user notification requirement')
    it('should create assessment record')
  })

  describe('notifyICO', () => {
    it('should send notification within 72 hours')
    it('should generate PDF report')
    it('should attach PDF to email')
    it('should track notification')
  })

  describe('notifyUsers', () => {
    it('should notify all affected users')
    it('should use proper template')
    it('should track notifications')
  })
})
```

#### 2.2 Implement Service
- [ ] Implement each method to pass tests
- [ ] No shortcuts, complete functionality

#### 2.3 API Routes (TDD)
- [ ] Write route tests
- [ ] Implement routes
- [ ] Test with Supertest

#### 2.4 Frontend (TDD)
- [ ] Write component tests
- [ ] Implement components
- [ ] Test user interactions

---

### Phase 3: Enhanced Consent Management (Week 3)

#### 3.1 Write Tests First
```typescript
describe('Consent Service', () => {
  describe('updateConsent', () => {
    it('should track consent changes')
    it('should create audit trail')
    it('should handle granular types')
  })

  describe('withdrawConsent', () => {
    it('should allow withdrawal')
    it('should generate certificate')
    it('should create PDF proof')
  })

  describe('getConsentHistory', () => {
    it('should return complete history')
    it('should include all versions')
  })
})
```

#### 3.2 Implement Service
- [ ] Granular consent types
- [ ] Version tracking
- [ ] Audit trail
- [ ] PDF certificates

---

### Phase 4: Right to Be Forgotten Enhancement (Week 4)

#### 4.1 Write Tests First
```typescript
describe('Deletion Service', () => {
  describe('requestDeletion', () => {
    it('should schedule deletion with grace period')
    it('should allow immediate deletion if requested')
  })

  describe('processDeletion', () => {
    it('should cascade delete all user data')
    it('should notify third parties')
    it('should generate certificate')
    it('should create PDF certificate')
  })

  describe('cancelDeletion', () => {
    it('should cancel scheduled deletion')
    it('should audit cancellation')
  })
})
```

#### 4.2 Implement Service
- [ ] Scheduled deletion
- [ ] Cascade deletion
- [ ] Third-party notification
- [ ] PDF certificates

---

## Success Criteria

### Must Have (No Compromises):
1. ✅ All tests pass (100% of them)
2. ✅ PDF certificates downloadable
3. ✅ Email attachments working
4. ✅ Database logging functional
5. ✅ Proper validation everywhere
6. ✅ 72-hour deadline tracking
7. ✅ Complete audit trails
8. ✅ No TypeScript errors
9. ✅ No non-null assertions
10. ✅ No commented-out functionality

### Quality Checks:
- [ ] Code review against GDPR requirements
- [ ] Security review
- [ ] Performance testing
- [ ] Documentation complete

---

## Daily Checklist

### Every Day:
1. **Morning**: Review plan, set daily goals
2. **Development**:
   - Write tests FIRST
   - See tests fail
   - Implement minimum to pass
   - Refactor if needed
3. **Testing**: Run full test suite
4. **Evening**: Document progress, update plan

### Never Do:
- ❌ Skip writing tests first
- ❌ Use non-null assertions (!)
- ❌ Comment out functionality
- ❌ Add fields reactively
- ❌ Rush to make tests pass

---

## Tools and Commands

### TDD Workflow:
```bash
# 1. Write test
npm test -- --watch path/to/test

# 2. See it fail (RED)
# 3. Write minimum code to pass
# 4. See it pass (GREEN)
# 5. Refactor if needed (REFACTOR)
# 6. Commit when green

# Run specific test file
npm test -- --testPathPattern="filename"

# Run with coverage
npm run test:coverage

# Type checking
npx tsc --noEmit
```

### Git Workflow:
```bash
# Create feature branch
git checkout -b feature/gdpr-phase-2-proper

# Commit after each test passes
git add -A
git commit -m "test: Add test for [feature]"
git commit -m "feat: Implement [feature] to pass test"

# Keep commits small and focused
```

---

## Remember:
**The goal is WORKING, COMPLIANT software, not just passing tests.**

Every shortcut taken now becomes technical debt later.