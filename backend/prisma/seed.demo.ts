/**
 * Demo Data Seed Script
 * 
 * Creates demo users and sample data for screenshots and demo environment.
 * Run this before taking screenshots to ensure clean, professional demo data.
 * 
 * Usage:
 *   npm run seed:demo
 *   or
 *   tsx prisma/seed.demo.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('AdminDemo123!', 12);
  const userPassword = await bcrypt.hash('UserDemo123!', 12);

  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      password: adminPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@demo.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created/updated:', admin.email);

  // Create or update regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {
      password: userPassword,
      name: 'Demo User',
      role: 'USER',
      isActive: true,
    },
    create: {
      email: 'user@demo.com',
      password: userPassword,
      name: 'Demo User',
      role: 'USER',
      isActive: true,
    },
  });

  console.log('✅ Regular user created/updated:', user.email);

  // Create sample notifications for user
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'INFO',
        channel: 'IN_APP',
        title: 'Welcome to NextSaaS!',
        message: 'Thank you for using NextSaaS. Explore all the features.',
        read: false,
      },
      {
        userId: user.id,
        type: 'SUCCESS',
        channel: 'IN_APP',
        title: 'Profile Updated',
        message: 'Your profile has been successfully updated.',
        read: false,
      },
      {
        userId: user.id,
        type: 'WARNING',
        channel: 'IN_APP',
        title: 'Payment Pending',
        message: 'You have a pending payment. Please complete it.',
        read: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Sample notifications created');

  // Create sample payments for user
  await prisma.payment.createMany({
    data: [
      {
        userId: user.id,
        provider: 'STRIPE',
        providerPaymentId: 'pi_demo_001',
        amount: 10000, // $100.00
        currency: 'USD',
        status: 'SUCCEEDED',
        description: 'Premium Subscription',
        paymentMethod: 'card',
      },
      {
        userId: user.id,
        provider: 'STRIPE',
        providerPaymentId: 'pi_demo_002',
        amount: 5000, // $50.00
        currency: 'USD',
        status: 'PENDING',
        description: 'Monthly Plan',
        paymentMethod: 'card',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Sample payments created');

  // Create audit logs for demo
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'USER_CREATED',
        resource: 'users',
        resourceId: user.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Demo Browser',
      },
      {
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'auth',
        resourceId: user.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Demo Browser',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Sample audit logs created');

  // Create default feature flags for demo
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

  console.log('\n🎉 Demo data seeding complete!');
  console.log('\n📝 Demo Credentials:');
  console.log('  Admin: admin@demo.com / AdminDemo123!');
  console.log('  User:  user@demo.com / UserDemo123!');
  console.log('\n⚠️  These are demo credentials only. Never use in production!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
