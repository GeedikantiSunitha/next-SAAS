/**
 * Demo script to create a user with encrypted PII data
 * This user will persist in the database to demonstrate encryption
 */

import prisma from '../config/database';
import bcrypt from 'bcryptjs';

async function createDemoUser() {
  console.log('\n=== Creating Demo User with Encrypted PII ===\n');

  try {
    const demoEmail = 'john.doe@encrypted-demo.com';

    // Check if demo user already exists
    const existing = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (existing) {
      console.log('Demo user already exists. Showing current data:\n');
      console.log('Through Prisma (decrypted):');
      console.log('  ID:', existing.id);
      console.log('  Email:', existing.email);
      console.log('  Name:', existing.firstName, existing.lastName);
      console.log('  Phone:', existing.phoneNumber);
      console.log('  Address:', existing.address);
      console.log();

      // Show raw encrypted data
      const rawData = await prisma.$queryRaw`
        SELECT email, "phoneNumber", address, "emailHash"
        FROM users
        WHERE id = ${existing.id}
      ` as any[];

      if (rawData.length > 0) {
        console.log('In Database (encrypted):');
        console.log('  Email (first 50 chars):', rawData[0].email?.substring(0, 50) + '...');
        console.log('  Phone (first 50 chars):', rawData[0].phoneNumber?.substring(0, 50) + '...');
        console.log('  Address (first 50 chars):', rawData[0].address?.substring(0, 50) + '...');
        console.log('  Email Hash (for searching):', rawData[0].emailHash?.substring(0, 30) + '...');
      }

      await prisma.$disconnect();
      return;
    }

    // Create new demo user
    const demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        password: await bcrypt.hash('SecurePassword123!', 12),
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1-555-0123',
        address: '789 Encrypted Lane, Privacy City, PC 54321',
        role: 'USER',
      },
    });

    console.log('✅ Demo user created successfully!');
    console.log();
    console.log('User Details (as seen through Prisma - decrypted):');
    console.log('  ID:', demoUser.id);
    console.log('  Email:', demoUser.email);
    console.log('  Name:', demoUser.firstName, demoUser.lastName);
    console.log('  Phone:', demoUser.phoneNumber);
    console.log('  Address:', demoUser.address);
    console.log();

    // Show what's actually stored in the database
    const rawData = await prisma.$queryRaw`
      SELECT email, "phoneNumber", address, "emailHash"
      FROM users
      WHERE id = ${demoUser.id}
    ` as any[];

    if (rawData.length > 0) {
      console.log('🔐 What\'s actually stored in the database (encrypted):');
      console.log('  Email (first 50 chars):', rawData[0].email?.substring(0, 50) + '...');
      console.log('  Phone (first 50 chars):', rawData[0].phoneNumber?.substring(0, 50) + '...');
      console.log('  Address (first 50 chars):', rawData[0].address?.substring(0, 50) + '...');
      console.log('  Email Hash (for searching):', rawData[0].emailHash?.substring(0, 30) + '...');
      console.log();
      console.log('✅ PII data is encrypted at rest in the database!');
      console.log();
      console.log('To verify encryption, you can run:');
      console.log('  psql -U user -d app_db -c "SELECT email, \\"phoneNumber\\", address FROM users WHERE email LIKE \'%encrypted-demo%\';"');
      console.log();
      console.log('You will see encrypted data in the format: IV:authTag:ciphertext');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo
createDemoUser().catch(console.error);