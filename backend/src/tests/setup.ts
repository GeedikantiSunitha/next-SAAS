import { prisma } from '../config/database';

// Setup before all tests
beforeAll(async () => {
  // Ensure test database is connected
  await prisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Disconnect from database
    await prisma.$disconnect();
  } catch (error) {
    // Ignore errors if already disconnected or connection issues
    // This prevents Jest from hanging on cleanup errors
  }
  
  // Force close any remaining connections after a short delay
  // This ensures Jest exits even if disconnect doesn't complete immediately
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Selective global cleanup: Clean only data that shouldn't persist between tests
// This prevents foreign key violations without deleting all users (which was causing performance issues)
// Individual tests should still manage their own users (use unique emails to avoid unique constraint violations)
beforeEach(async () => {
  // Clean data that often causes foreign key violations when users are deleted or don't exist
  // NOTE: We don't delete users here - tests should manage their own user lifecycle
  // This selective cleanup prevents foreign key violations while maintaining performance
  // Order matters: Delete dependent records first to avoid constraint violations
  
  // High-frequency foreign key violations (based on Issue #25 analysis):
  await prisma.session.deleteMany(); // 165 violations - sessions_userId_fkey
  await prisma.mfaBackupCode.deleteMany(); // 42 violations - mfa_backup_codes_userId_fkey
  await prisma.payment.deleteMany(); // 28 violations - payments_userId_fkey
  await prisma.auditLog.deleteMany(); // 13 violations - audit_logs_userId_fkey
  await prisma.passwordReset.deleteMany(); // Password reset tokens
  
  // Low-frequency but still important:
  await prisma.newsletterSubscription.deleteMany(); // 2 violations - newsletter_subscriptions_userId_fkey
  
  // NOTE: We intentionally DON'T delete:
  // - Users (tests should manage their own users with unique emails)
  // - Feature flags (some tests rely on seed data)
  // - Newsletters (tests may create these and need them to persist within test)
  // - OAuth users (tests manage these)
});

// Helper to create test user
export const createTestUser = async (overrides?: any) => {
  const bcrypt = require('bcryptjs');
  
  const defaultUser = {
    email: 'test@example.com',
    password: await bcrypt.hash('Password123!', 12),
    name: 'Test User',
    role: 'USER' as any,
  };

  return prisma.user.create({
    data: { ...defaultUser, ...overrides },
  });
};

// Helper to create test admin
export const createTestAdmin = async (overrides?: any) => {
  return createTestUser({
    email: 'admin@example.com',
    role: 'ADMIN' as any,
    ...overrides,
  });
};

