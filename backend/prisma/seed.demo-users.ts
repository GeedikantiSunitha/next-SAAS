/**
 * Demo Users Seed (idempotent)
 *
 * Ensures three demo accounts exist: User, Admin, Super Admin.
 * Does NOT delete any existing users. Safe to run on any database.
 *
 * Usage:
 *   npm run seed:demo-users
 *   or
 *   npx tsx prisma/seed.demo-users.ts
 */

import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load backend/.env so we use the same DATABASE_URL as the running server
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Must match encryption middleware: User lookups use emailHash (SHA-256 hex)
function emailHash(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export const DEMO_CREDENTIALS = {
  user: { email: 'demo@example.com', password: 'DemoUser123!', name: 'Demo User', role: Role.USER },
  admin: { email: 'demo-admin@example.com', password: 'DemoAdmin123!', name: 'Demo Admin', role: Role.ADMIN },
  superAdmin: {
    email: 'demo-superadmin@example.com',
    password: 'DemoSuperAdmin123!',
    name: 'Demo Super Admin',
    role: Role.SUPER_ADMIN,
  },
} as const;

async function main() {
  console.log('🌱 Ensuring demo users exist (User, Admin, Super Admin)...\n');

  const hashed = {
    user: await bcrypt.hash(DEMO_CREDENTIALS.user.password, 12),
    admin: await bcrypt.hash(DEMO_CREDENTIALS.admin.password, 12),
    superAdmin: await bcrypt.hash(DEMO_CREDENTIALS.superAdmin.password, 12),
  };

  // Seed runs without encryption middleware, so we find by plaintext email and set emailHash
  // so the server (which looks up by emailHash) can find these users.
  const userEmail = DEMO_CREDENTIALS.user.email;
  const userHash = emailHash(userEmail);
  await prisma.user.upsert({
    where: { email: userEmail },
    update: { password: hashed.user, name: DEMO_CREDENTIALS.user.name, role: Role.USER, isActive: true, emailHash: userHash },
    create: {
      email: userEmail,
      emailHash: userHash,
      password: hashed.user,
      name: DEMO_CREDENTIALS.user.name,
      role: Role.USER,
      isActive: true,
    },
  });
  console.log('✅ User:', userEmail);

  const adminEmail = DEMO_CREDENTIALS.admin.email;
  const adminHash = emailHash(adminEmail);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed.admin, name: DEMO_CREDENTIALS.admin.name, role: Role.ADMIN, isActive: true, emailHash: adminHash },
    create: {
      email: adminEmail,
      emailHash: adminHash,
      password: hashed.admin,
      name: DEMO_CREDENTIALS.admin.name,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin:', adminEmail);

  const superAdminEmail = DEMO_CREDENTIALS.superAdmin.email;
  const superAdminHash = emailHash(superAdminEmail);
  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { password: hashed.superAdmin, name: DEMO_CREDENTIALS.superAdmin.name, role: Role.SUPER_ADMIN, isActive: true, emailHash: superAdminHash },
    create: {
      email: superAdminEmail,
      emailHash: superAdminHash,
      password: hashed.superAdmin,
      name: DEMO_CREDENTIALS.superAdmin.name,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Super Admin:', superAdminEmail);

  const total = await prisma.user.count();
  const byRole = await prisma.user.groupBy({ by: ['role'], _count: true });
  console.log('\n📊 Users in system:', total);
  byRole.forEach((r) => console.log('   ', r.role, ':', r._count));

  console.log('\n📋 Demo credentials (for login screen):');
  console.log('   User:        ', DEMO_CREDENTIALS.user.email, '/', DEMO_CREDENTIALS.user.password);
  console.log('   Admin:       ', DEMO_CREDENTIALS.admin.email, '/', DEMO_CREDENTIALS.admin.password);
  console.log('   Super Admin: ', DEMO_CREDENTIALS.superAdmin.email, '/', DEMO_CREDENTIALS.superAdmin.password);
  console.log('\n⚠️  Demo only. Never use in production.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
