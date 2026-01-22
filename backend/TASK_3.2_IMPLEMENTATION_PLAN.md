# Task 3.2: Field-Level Encryption for PII Implementation Plan

## Date: January 22, 2025
## Current Tests Passing: 1001/1001

## Context
We've already implemented database encryption at rest (Task 3.1) using AES-256-GCM encryption for all PII fields through Prisma middleware. Task 3.2 requires **additional** field-level encryption for highly sensitive PII fields that need double encryption.

## What I'm Going to Build:
- [ ] Additional layer of field-level encryption for ultra-sensitive PII
- [ ] Separate encryption keys for different data sensitivity levels
- [ ] Key rotation mechanism for field-level encryption
- [ ] Transparent encryption/decryption for application code

## Fields to Add Extra Encryption (on top of existing database encryption):
Based on the roadmap, these fields need additional protection:
1. **Phone numbers** - Already in database, needs field-level encryption
2. **Physical addresses** - Already in database, needs field-level encryption
3. **SSN/Tax IDs** - In PersonalData model, needs field-level encryption
4. **Driver's License** - In PersonalData model, needs field-level encryption
5. **Bank Account Numbers** - In Payment model, needs field-level encryption
6. **Credit Card Numbers** - In Payment model (though handled by payment providers)

## Implementation Strategy:
Since we already have database-level encryption working perfectly, we'll add a second layer of encryption for these specific fields:
1. Create a new `fieldEncryptionService.ts` for field-specific encryption
2. Use different encryption keys from database encryption
3. Apply field encryption BEFORE database encryption (double encryption)
4. Maintain backward compatibility with existing data

## Files I Will Create/Modify:
1. `backend/src/services/fieldEncryptionService.ts` - New service for field-level encryption
2. `backend/src/__tests__/services/fieldEncryptionService.test.ts` - TDD tests
3. `backend/src/middleware/fieldEncryptionMiddleware.ts` - New middleware layer
4. `backend/src/config/encryption.ts` - Update to manage multiple encryption keys
5. `backend/.env` - Add FIELD_ENCRYPTION_KEY separate from DATABASE_ENCRYPTION_KEY
6. `backend/src/scripts/migrate-field-encryption.ts` - Migration script for existing data

## Tests I Will Write FIRST (TDD):
1. Test field encryption service can encrypt/decrypt strings
2. Test field encryption uses different key from database encryption
3. Test double encryption works (field + database)
4. Test backward compatibility with existing encrypted data
5. Test key rotation mechanism
6. Test specific PII field encryption (phone, address, SSN, etc.)
7. Test migration script handles existing data

## Potential Risks:
- **Risk 1:** Performance impact from double encryption
  - **Mitigation:** Benchmark and optimize, consider caching decrypted values in memory
- **Risk 2:** Breaking existing encrypted data
  - **Mitigation:** Maintain backward compatibility, test migration thoroughly
- **Risk 3:** Key management complexity
  - **Mitigation:** Clear key rotation strategy, separate keys for different layers

## Success Criteria:
- [ ] All 1001 existing tests still pass
- [ ] New tests for field-level encryption pass
- [ ] No performance degradation >20ms per operation
- [ ] Existing encrypted data still readable
- [ ] Migration script successfully encrypts existing PII
- [ ] Clean git diff (only intended changes)

## Learnings from Task 3.1 to Apply:
1. Always test with actual database operations, not mocks
2. emailHash approach works well for searchable encrypted fields
3. Middleware approach provides transparency to application code
4. Import configured Prisma instance, never create new PrismaClient()
5. Test each encryption operation thoroughly before moving to next
6. Document every issue encountered in ISSUES_LOG.md

## Development Order (Following CORRECT_DEVELOPMENT_ORDER.md):
1. Database Schema (if needed) - No changes needed, using existing fields
2. Backend Types/Interfaces - Define encryption levels
3. Backend Services - Field encryption service with tests
4. Backend Middleware - Apply field encryption layer
5. Migration Script - Encrypt existing data
6. Integration Tests - Verify full stack works
7. Documentation - Update security documentation

## Time Estimate:
- 2-3 hours for core implementation (following TDD)
- 1 hour for migration script and testing
- 30 minutes for documentation
- Total: ~4 hours if done carefully

## Next Steps:
1. Get user approval for this plan
2. Create feature branch: `feature/field-level-encryption`
3. Write TDD tests first
4. Implement incrementally with tests passing at each step
5. Document any issues in ISSUES_LOG.md