-- Migration: Add Data Retention Fields
-- Created: 2026-01-20
-- Purpose: Add GDPR-compliant data retention fields to User and AuditLog models

-- Add data retention fields to users table
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "anonymizedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "onLegalHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "legalHoldReason" TEXT;
ALTER TABLE "users" ADD COLUMN "legalHoldAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "legalHoldReleasedAt" TIMESTAMP(3);

-- Add data retention fields to audit_logs table
ALTER TABLE "audit_logs" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "audit_logs" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Create indexes for efficient querying
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt");
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");
CREATE INDEX "users_onLegalHold_idx" ON "users"("onLegalHold");
CREATE INDEX "audit_logs_archived_idx" ON "audit_logs"("archived");
-- Note: audit_logs_createdAt_idx already exists, skipping

-- Add comments for documentation
COMMENT ON COLUMN "users"."lastLoginAt" IS 'Last login timestamp for inactive user detection';
COMMENT ON COLUMN "users"."deletedAt" IS 'Soft delete timestamp for GDPR right to erasure';
COMMENT ON COLUMN "users"."anonymizedAt" IS 'Timestamp when user data was anonymized';
COMMENT ON COLUMN "users"."onLegalHold" IS 'Prevents automatic deletion if true';
COMMENT ON COLUMN "users"."legalHoldReason" IS 'Reason for placing user on legal hold';
COMMENT ON COLUMN "users"."legalHoldAt" IS 'Timestamp when legal hold was placed';
COMMENT ON COLUMN "users"."legalHoldReleasedAt" IS 'Timestamp when legal hold was released';
COMMENT ON COLUMN "audit_logs"."archived" IS 'Marks log as archived after retention period';
COMMENT ON COLUMN "audit_logs"."archivedAt" IS 'Timestamp when log was archived';
