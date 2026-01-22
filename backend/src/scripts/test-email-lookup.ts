/**
 * Test script to verify email lookup with encryption
 */

import prisma from '../config/database';
import bcrypt from 'bcryptjs';

async function testEmailLookup() {
  console.log('\n=== Testing Email Lookup with Encryption ===\n');

  try {
    const testEmail = `test-lookup-${Date.now()}@example.com`;
    const testPassword = await bcrypt.hash('TestPassword123!', 12);

    // Step 1: Create a user
    console.log('1. Creating user with email:', testEmail);
    const createdUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });
    console.log('   ✅ User created with ID:', createdUser.id);
    console.log('   Email in response:', createdUser.email);

    // Step 2: Check what's actually in the database
    console.log('\n2. Checking raw database values:');
    const rawData = await prisma.$queryRaw`
      SELECT id, email, "emailHash"
      FROM users
      WHERE id = ${createdUser.id}
    ` as any[];

    if (rawData.length > 0) {
      console.log('   Email (encrypted):', rawData[0].email?.substring(0, 30) + '...');
      console.log('   EmailHash:', rawData[0].emailHash?.substring(0, 30) + '...');
    }

    // Step 3: Try to find user by email
    console.log('\n3. Finding user by email using findUnique:');
    const foundUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (foundUser) {
      console.log('   ✅ User found!');
      console.log('   ID matches:', foundUser.id === createdUser.id);
      console.log('   Email matches:', foundUser.email === testEmail);
    } else {
      console.log('   ❌ User NOT found - This is the problem!');
    }

    // Step 4: Try direct emailHash lookup
    console.log('\n4. Finding user by emailHash directly:');
    const { getEncryptionService } = require('../services/encryptionService');
    const encryptionService = getEncryptionService();
    const emailHash = encryptionService.hash(testEmail);

    const foundByHash = await prisma.user.findFirst({
      where: { emailHash },
    });

    if (foundByHash) {
      console.log('   ✅ User found by hash!');
      console.log('   ID matches:', foundByHash.id === createdUser.id);
    } else {
      console.log('   ❌ User NOT found by hash');
    }

    // Step 5: Test authentication (like login would do)
    console.log('\n5. Testing authentication flow:');
    const authUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (authUser && authUser.password) {
      const passwordValid = await bcrypt.compare('TestPassword123!', authUser.password);
      console.log('   ✅ Auth lookup successful');
      console.log('   Password valid:', passwordValid);
    } else {
      console.log('   ❌ Auth lookup failed - User not found');
    }

    // Cleanup
    console.log('\n6. Cleaning up test user...');
    await prisma.user.delete({
      where: { id: createdUser.id },
    });
    console.log('   ✅ Test user deleted');

    console.log('\n=== Test Complete ===\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEmailLookup().catch(console.error);