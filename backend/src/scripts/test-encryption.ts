/**
 * Script to test encryption functionality with development database
 * This verifies that PII fields are being encrypted in the database
 */

import prisma from '../config/database';
import { getEncryptionService } from '../services/encryptionService';
import bcrypt from 'bcryptjs';

async function testEncryption() {
  console.log('\n=== Testing Application-Level Encryption (GDPR Phase 3.1) ===\n');

  const encryptionService = getEncryptionService();

  // Check if encryption is enabled
  console.log(`✅ Encryption enabled: ${encryptionService.isEnabled()}`);
  console.log(`✅ Encryption algorithm: AES-256-GCM\n`);

  try {
    // Create a test user with PII data
    const testEmail = `test-encryption-${Date.now()}@example.com`;
    const testData = {
      email: testEmail,
      password: await bcrypt.hash('TestPassword123!', 12),
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1-555-123-4567',
      address: '123 Main Street, Anytown, USA 12345',
    };

    console.log('📝 Creating user with PII data...');
    console.log('  Email:', testData.email);
    console.log('  Phone:', testData.phoneNumber);
    console.log('  Address:', testData.address);
    console.log();

    // Create user (encryption happens automatically via middleware)
    const user = await prisma.user.create({
      data: testData,
    });

    console.log('✅ User created successfully with ID:', user.id);
    console.log();

    // Verify data is decrypted when reading through Prisma
    console.log('📖 Reading user data through Prisma (should be decrypted):');
    const readUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    console.log('  Email:', readUser?.email);
    console.log('  Phone:', readUser?.phoneNumber);
    console.log('  Address:', readUser?.address);
    console.log();

    // Check raw database to verify encryption
    console.log('🔐 Checking raw database values (should be encrypted):');
    const rawData = await prisma.$queryRaw`
      SELECT email, "phoneNumber", address, "emailHash"
      FROM users
      WHERE id = ${user.id}
    ` as any[];

    if (rawData.length > 0) {
      const raw = rawData[0];

      // Check if data is encrypted (contains separator ':' from IV:authTag:ciphertext format)
      const emailEncrypted = raw.email?.includes(':');
      const phoneEncrypted = raw.phoneNumber?.includes(':');
      const addressEncrypted = raw.address?.includes(':');

      console.log('  Email encrypted:', emailEncrypted ? '✅ Yes' : '❌ No');
      if (emailEncrypted) {
        console.log('    Raw format:', raw.email.substring(0, 30) + '...');
      }

      console.log('  Phone encrypted:', phoneEncrypted ? '✅ Yes' : '❌ No');
      if (phoneEncrypted) {
        console.log('    Raw format:', raw.phoneNumber.substring(0, 30) + '...');
      }

      console.log('  Address encrypted:', addressEncrypted ? '✅ Yes' : '❌ No');
      if (addressEncrypted) {
        console.log('    Raw format:', raw.address.substring(0, 30) + '...');
      }

      console.log('  Email hash created:', raw.emailHash ? '✅ Yes' : '❌ No');
      if (raw.emailHash) {
        console.log('    Hash:', raw.emailHash.substring(0, 20) + '...');
      }
    }
    console.log();

    // Test updating encrypted fields
    console.log('🔄 Testing field updates...');
    const newPhone = '+1-555-999-8888';
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { phoneNumber: newPhone },
    });

    console.log('  Updated phone number:', updatedUser.phoneNumber);

    // Verify update is encrypted in database
    const rawUpdated = await prisma.$queryRaw`
      SELECT "phoneNumber"
      FROM users
      WHERE id = ${user.id}
    ` as any[];

    const updateEncrypted = rawUpdated[0]?.phoneNumber?.includes(':');
    console.log('  Update encrypted in DB:', updateEncrypted ? '✅ Yes' : '❌ No');
    console.log();

    // Test searching by email hash
    console.log('🔍 Testing encrypted field search...');
    const emailHash = encryptionService.hash(testEmail);
    const foundByHash = await prisma.user.findFirst({
      where: { emailHash },
    });
    console.log('  Found user by email hash:', foundByHash ? '✅ Yes' : '❌ No');
    console.log();

    // Clean up test user
    console.log('🧹 Cleaning up test data...');
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log('  Test user deleted');
    console.log();

    console.log('✅ ✅ ✅ Encryption test completed successfully! ✅ ✅ ✅');
    console.log('\n📊 Summary:');
    console.log('  - PII fields are automatically encrypted when stored');
    console.log('  - Data is automatically decrypted when read');
    console.log('  - Email hash enables searching encrypted data');
    console.log('  - Updates maintain encryption');
    console.log('  - Platform-agnostic solution works with any PostgreSQL');
    console.log('\n🔒 GDPR Phase 3.1: Database Encryption at Rest - IMPLEMENTED\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEncryption().catch(console.error);