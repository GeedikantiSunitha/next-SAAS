# Task 3.4: Frontend Security Components Plan
# Date: 2026-01-23
# Current Status: Backend 100% complete, Frontend tests exist but failing

## Current Situation Analysis

### Tests Already Exist (TDD RED Phase):
- **SecurityEventTimeline**: 17 tests - ALL PASSING ✅
- **ThreatIndicators**: 18 tests - 13 FAILING ❌
- **AdminSecurityDashboard**: Tests exist with React act() warnings ⚠️

### What I'm Going to Build (GREEN Phase - Make Tests Pass):

#### Phase 1: Fix Existing Components (Priority: HIGH)
1. **ThreatIndicators Component** (`frontend/src/components/ThreatIndicators.tsx`)
   - Fix loading state rendering
   - Implement proper data fetching from API
   - Display threat level indicators
   - Show progress bars
   - Handle error states

2. **AdminSecurityDashboard Component** (`frontend/src/pages/admin/AdminSecurityDashboard.tsx`)
   - Fix React act() warnings
   - Proper async state updates
   - Integrate with security metrics API

#### Phase 2: Create New Components (Priority: MEDIUM)
3. **VulnerabilityScanner Component** (`frontend/src/components/VulnerabilityScanner.tsx`)
   - Start scan interface
   - Scan type selection
   - Target URL input
   - Progress tracking

4. **ScanProgressMonitor Component** (`frontend/src/components/ScanProgressMonitor.tsx`)
   - Real-time progress display
   - WebSocket or polling for updates
   - Visual progress indicators

5. **VulnerabilityReport Component** (`frontend/src/components/VulnerabilityReport.tsx`)
   - Display scan results
   - Severity breakdown
   - OWASP compliance score
   - Export to CSV button

## Files I Will Create/Modify:

### Modify Existing:
1. `frontend/src/components/ThreatIndicators.tsx` - Fix to pass 13 failing tests
2. `frontend/src/pages/admin/AdminSecurityDashboard.tsx` - Fix act() warnings
3. `frontend/src/lib/api.ts` - Add security API endpoints

### Create New:
4. `frontend/src/components/VulnerabilityScanner.tsx` - New scanner UI
5. `frontend/src/components/ScanProgressMonitor.tsx` - Progress tracking
6. `frontend/src/components/VulnerabilityReport.tsx` - Results display
7. `frontend/src/__tests__/components/VulnerabilityScanner.test.tsx` - Tests first!
8. `frontend/src/__tests__/components/ScanProgressMonitor.test.tsx` - Tests first!
9. `frontend/src/__tests__/components/VulnerabilityReport.test.tsx` - Tests first!

## Tests I Will Write/Fix:

### Fix Existing Tests:
1. Make 13 ThreatIndicators tests pass
2. Fix AdminSecurityDashboard act() warnings

### Write New Tests FIRST (TDD):
3. VulnerabilityScanner component tests
4. ScanProgressMonitor component tests
5. VulnerabilityReport component tests

## API Integration Points:

```typescript
// Security API endpoints to integrate
POST   /api/security/scans/start
GET    /api/security/scans/progress/:scanId
GET    /api/security/scans/report/:scanId
GET    /api/security/scans/active
GET    /api/security/scans/recent
POST   /api/security/vulnerabilities/:id/resolve
GET    /api/security/scans/export/:scanId
GET    /api/security/metrics
GET    /api/security/events
POST   /api/security/test/owasp
POST   /api/security/test/penetration
```

## Potential Risks:

- **Risk 1**: Breaking existing passing tests
  - Mitigation: Run tests continuously, don't modify SecurityEventTimeline

- **Risk 2**: State management complexity with real-time updates
  - Mitigation: Use React Query for API state, implement proper error boundaries

- **Risk 3**: WebSocket connection for real-time progress
  - Mitigation: Fallback to polling if WebSocket fails

## Success Criteria:

- [ ] All existing 917 backend tests still pass
- [ ] SecurityEventTimeline 17 tests still pass
- [ ] ThreatIndicators 18 tests ALL pass (fix 13 failing)
- [ ] AdminSecurityDashboard tests pass without warnings
- [ ] New component tests written and passing
- [ ] No TypeScript errors
- [ ] Clean git diff (only intended changes)
- [ ] Full integration with backend security API

## Execution Order (Following TDD):

1. **Fix ThreatIndicators** (tests exist, failing)
   - Review test requirements
   - Implement minimal code to pass
   - Verify all 18 tests pass

2. **Fix AdminSecurityDashboard warnings**
   - Wrap state updates in act()
   - Verify no console warnings

3. **Create VulnerabilityScanner**
   - Write tests first
   - Implement to pass tests
   - Integrate with API

4. **Create ScanProgressMonitor**
   - Write tests first
   - Implement to pass tests
   - Add real-time updates

5. **Create VulnerabilityReport**
   - Write tests first
   - Implement to pass tests
   - Add export functionality

## Questions for User:

1. Should we use WebSockets or polling for real-time scan progress updates?
2. Do you want a separate route for the security dashboard or integrate into existing admin panel?
3. Should vulnerability reports be downloadable in formats other than CSV (PDF, JSON)?

---

**Ready to proceed with TDD implementation following this plan?**