/**
 * Feature Flags Seed Script
 *
 * Creates default feature flags without touching users or other data.
 * Use after seed:demo-users so Admin → Feature Flags has data to toggle.
 *
 * Usage:
 *   npm run seed:feature-flags
 *   or
 *   tsx prisma/seed.featureFlags.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_FEATURE_FLAGS = [
  { key: 'registration', enabled: true, description: 'Enable user registration' },
  { key: 'oauth', enabled: true, description: 'Enable OAuth authentication' },
  { key: 'google_oauth', enabled: false, description: 'Enable Google OAuth login' },
  { key: 'github_oauth', enabled: false, description: 'Enable GitHub OAuth login' },
  { key: 'microsoft_oauth', enabled: false, description: 'Enable Microsoft OAuth login' },
  { key: 'password_reset', enabled: true, description: 'Enable password reset functionality' },
  { key: 'email_verification', enabled: false, description: 'Require email verification for new users' },
];

async function main() {
  console.log('🚩 Seeding feature flags...');

  const result = await prisma.featureFlag.createMany({
    data: DEFAULT_FEATURE_FLAGS,
    skipDuplicates: true,
  });

  console.log(`✅ Feature flags seeded. Created: ${result.count}. Existing flags were skipped.`);
  console.log('   Run "npm run seed:feature-flags" again to add any missing flags (safe to re-run).');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
