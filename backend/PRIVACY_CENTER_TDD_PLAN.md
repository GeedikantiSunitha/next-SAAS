# Task 2.4: Enhanced Privacy Center - TDD Implementation Plan
# Date: January 21, 2026
# Current Tests Passing: 927/928

## Overview
Create a unified privacy dashboard that consolidates all privacy-related features into one centralized location for users to manage their data, consents, and privacy preferences.

## Architecture Decision
Since this is primarily a **frontend feature** that aggregates existing backend endpoints, we will:
1. Create a new backend endpoint that aggregates privacy data
2. Build the frontend Privacy Center page
3. Follow Frontend → Backend order since UI drives requirements

## Implementation Order (TDD)

### Phase 1: Backend API - Privacy Center Aggregation
**Purpose**: Single endpoint to fetch all privacy-related data for the dashboard

#### RED Phase - Write Failing Tests
1. `backend/src/__tests__/routes/privacyCenter.test.ts`
   - Test GET /api/privacy-center/overview endpoint
   - Test data aggregation from multiple services
   - Test authorization (user must be authenticated)
   - Test response structure

#### GREEN Phase - Implement API
1. Create `backend/src/routes/privacyCenter.ts`
   - GET /api/privacy-center/overview endpoint
   - Aggregate data from:
     - User profile data
     - Consent records
     - Data export requests
     - Data deletion requests
     - Cookie preferences
     - Connected OAuth accounts
     - Recent data access logs

2. Create `backend/src/services/privacyCenterService.ts`
   - `getPrivacyOverview(userId)` - Main aggregation function
   - `getDataCategories(userId)` - What data we have
   - `getDataAccessLog(userId)` - Who accessed user data
   - `getPrivacyMetrics(userId)` - Summary statistics

### Phase 2: Frontend Privacy Center
**Purpose**: User interface for privacy management

#### RED Phase - Write Failing Tests
1. `frontend/src/__tests__/pages/PrivacyCenter.test.tsx`
   - Test page renders all sections
   - Test data loading from API
   - Test consent management UI
   - Test export/deletion buttons
   - Test cookie preferences
   - Test responsive design

2. `frontend/src/__tests__/components/privacy/*.test.tsx`
   - Test individual privacy components
   - Test user interactions
   - Test state management

#### GREEN Phase - Implement Frontend
1. Create `frontend/src/pages/PrivacyCenter.tsx`
   - Main privacy dashboard page
   - Sections:
     - Data Overview (what data we collect)
     - Consent Management (current consents with toggle)
     - Data Export (request/download exports)
     - Data Deletion (request deletion)
     - Cookie Preferences (granular cookie control)
     - Connected Accounts (OAuth connections)
     - Access Log (who accessed your data)

2. Create privacy components:
   - `frontend/src/components/privacy/DataOverview.tsx`
   - `frontend/src/components/privacy/ConsentManager.tsx`
   - `frontend/src/components/privacy/DataExport.tsx`
   - `frontend/src/components/privacy/DataDeletion.tsx`
   - `frontend/src/components/privacy/CookiePreferences.tsx`
   - `frontend/src/components/privacy/ConnectedAccounts.tsx`
   - `frontend/src/components/privacy/AccessLog.tsx`

3. Create privacy hooks:
   - `frontend/src/hooks/usePrivacyCenter.ts`
   - `frontend/src/hooks/useConsentManagement.ts`

### Phase 3: Navigation Integration
1. Update `frontend/src/components/layout/UserMenu.tsx`
   - Add "Privacy Center" link
2. Update `frontend/src/components/layout/Footer.tsx`
   - Add privacy center link
3. Update routing in `frontend/src/App.tsx`

## API Response Structure
```typescript
interface PrivacyCenterOverview {
  user: {
    id: string;
    email: string;
    createdAt: Date;
    dataRetentionDays: number;
  };
  dataCategories: {
    category: string;
    description: string;
    count: number;
    lastUpdated: Date;
  }[];
  consents: {
    type: ConsentType;
    granted: boolean;
    version: string;
    grantedAt?: Date;
    expiresAt?: Date;
  }[];
  dataRequests: {
    exports: DataExportRequest[];
    deletions: DataDeletionRequest[];
  };
  cookiePreferences: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
  connectedAccounts: {
    provider: string;
    connectedAt: Date;
  }[];
  recentAccess: {
    accessedBy: string;
    action: string;
    timestamp: Date;
  }[];
  metrics: {
    totalDataPoints: number;
    activeConsents: number;
    pendingRequests: number;
    daysUntilDeletion?: number;
  };
}
```

## Success Criteria
- [ ] All existing 927+ tests still pass
- [ ] New backend API tests pass
- [ ] New frontend component tests pass
- [ ] Privacy Center accessible from user menu
- [ ] All privacy features work correctly
- [ ] Mobile responsive design
- [ ] Accessibility compliant

## Risks & Mitigation
1. **Risk**: Aggregating data might be slow
   - **Mitigation**: Use parallel queries, add caching if needed

2. **Risk**: Complex state management in frontend
   - **Mitigation**: Use React Query for server state

3. **Risk**: Breaking existing GDPR endpoints
   - **Mitigation**: Only aggregate, don't modify existing services

## Files to Create/Modify

### Backend (4 new files)
1. `backend/src/routes/privacyCenter.ts` - NEW
2. `backend/src/services/privacyCenterService.ts` - NEW
3. `backend/src/__tests__/routes/privacyCenter.test.ts` - NEW
4. `backend/src/__tests__/services/privacyCenterService.test.ts` - NEW
5. `backend/src/routes/index.ts` - MODIFY (add route)

### Frontend (12+ new files)
1. `frontend/src/pages/PrivacyCenter.tsx` - NEW
2. `frontend/src/components/privacy/DataOverview.tsx` - NEW
3. `frontend/src/components/privacy/ConsentManager.tsx` - NEW
4. `frontend/src/components/privacy/DataExport.tsx` - NEW
5. `frontend/src/components/privacy/DataDeletion.tsx` - NEW
6. `frontend/src/components/privacy/CookiePreferences.tsx` - NEW
7. `frontend/src/components/privacy/ConnectedAccounts.tsx` - NEW
8. `frontend/src/components/privacy/AccessLog.tsx` - NEW
9. `frontend/src/hooks/usePrivacyCenter.ts` - NEW
10. `frontend/src/__tests__/pages/PrivacyCenter.test.tsx` - NEW
11. `frontend/src/__tests__/components/privacy/*.test.tsx` - NEW (multiple)
12. `frontend/src/components/layout/UserMenu.tsx` - MODIFY
13. `frontend/src/components/layout/Footer.tsx` - MODIFY
14. `frontend/src/App.tsx` - MODIFY (routing)

## Timeline
- Backend API: 2-3 hours
- Frontend Components: 4-5 hours
- Integration & Testing: 2 hours
- Total: ~1 day

## Next Steps
1. Start with backend API tests (RED phase)
2. Implement minimal backend to pass tests (GREEN phase)
3. Move to frontend tests and implementation
4. Integrate navigation
5. Full testing