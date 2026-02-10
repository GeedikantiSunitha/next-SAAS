/**
 * Prisma Seed Script
 * 
 * Seeds the database with development/test data
 * 
 * Usage:
 *   npx tsx prisma/seed.ts
 *   or
 *   npm run seed (if configured in package.json)
 *
 * IMPORTANT: When ENCRYPTION_ENABLED=true, login looks up users by emailHash.
 * Every user create must set emailHash (same format as seed.demo-users and authService).
 */

import * as crypto from 'crypto';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Must match authService / encryptionMiddleware: login looks up by emailHash (SHA-256 of normalized email)
function emailHash(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleaned');

  // Create test users
  console.log('👤 Creating test users...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      emailHash: emailHash('admin@example.com'),
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Super admin user
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 12);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@example.com',
      emailHash: emailHash('superadmin@example.com'),
      password: superAdminPassword,
      name: 'Super Admin User',
      role: Role.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Created super admin user: ${superAdmin.email}`);

  // Regular users
  const regularUsers = [];
  for (let i = 1; i <= 5; i++) {
    const email = `user${i}@example.com`;
    const password = await bcrypt.hash(`User${i}123!`, 12);
    const user = await prisma.user.create({
      data: {
        email,
        emailHash: emailHash(email),
        password,
        name: `Test User ${i}`,
        role: Role.USER,
        isActive: true,
        emailVerified: i <= 3, // First 3 users verified
        emailVerifiedAt: i <= 3 ? new Date() : null,
      },
    });
    regularUsers.push(user);
    console.log(`✅ Created user: ${user.email}`);
  }

  // OAuth user (Google)
  const oauthUser = await prisma.user.create({
    data: {
      email: 'oauth.google@example.com',
      emailHash: emailHash('oauth.google@example.com'),
      password: null, // OAuth users don't have passwords
      name: 'OAuth Google User',
      role: Role.USER,
      isActive: true,
      oauthProvider: 'google',
      oauthProviderId: 'google-oauth-id-12345',
      oauthEmail: 'oauth.google@example.com',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Created OAuth user: ${oauthUser.email}`);

  // Create some sessions for active users
  console.log('🔐 Creating sessions...');
  const sessionExpiry = new Date();
  sessionExpiry.setDate(sessionExpiry.getDate() + 7); // 7 days from now

  await prisma.session.create({
    data: {
      userId: admin.id,
      token: 'test-admin-session-token',
      expiresAt: sessionExpiry,
      userAgent: 'Mozilla/5.0 (Test Browser)',
      ipAddress: '127.0.0.1',
    },
  });
  console.log('✅ Created admin session');

  await prisma.session.create({
    data: {
      userId: regularUsers[0].id,
      token: 'test-user-session-token',
      expiresAt: sessionExpiry,
      userAgent: 'Mozilla/5.0 (Test Browser)',
      ipAddress: '127.0.0.1',
    },
  });
  console.log('✅ Created user session');

  // Create audit logs
  console.log('📝 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'USER_LOGIN',
        resource: 'auth',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        details: { method: 'email' },
      },
      {
        userId: regularUsers[0].id,
        action: 'USER_REGISTERED',
        resource: 'users',
        resourceId: regularUsers[0].id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
      },
      {
        userId: regularUsers[1].id,
        action: 'PROFILE_UPDATED',
        resource: 'users',
        resourceId: regularUsers[1].id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        details: { field: 'name', oldValue: 'Test User 2', newValue: 'Updated User 2' },
      },
    ],
  });
  console.log('✅ Created audit logs');

  // Create default feature flags
  console.log('🚩 Creating default feature flags...');
  await prisma.featureFlag.createMany({
    data: [
      {
        key: 'registration',
        enabled: true,
        description: 'Enable user registration',
      },
      {
        key: 'oauth',
        enabled: true,
        description: 'Enable OAuth authentication',
      },
      {
        key: 'google_oauth',
        enabled: false,
        description: 'Enable Google OAuth login',
      },
      {
        key: 'github_oauth',
        enabled: false,
        description: 'Enable GitHub OAuth login',
      },
      {
        key: 'microsoft_oauth',
        enabled: false,
        description: 'Enable Microsoft OAuth login',
      },
      {
        key: 'password_reset',
        enabled: true,
        description: 'Enable password reset functionality',
      },
      {
        key: 'email_verification',
        enabled: false,
        description: 'Require email verification for new users',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created default feature flags');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@example.com');
  console.log('  Password: Admin123!');
  console.log('\nSuper Admin:');
  console.log('  Email: superadmin@example.com');
  console.log('  Password: SuperAdmin123!');
  console.log('\nRegular Users:');
  for (let i = 1; i <= 5; i++) {
    console.log(`  User ${i}:`);
    console.log(`    Email: user${i}@example.com`);
    console.log(`    Password: User${i}123!`);
  }
  console.log('\nOAuth User:');
  console.log('  Email: oauth.google@example.com');
  console.log('  Provider: Google');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
