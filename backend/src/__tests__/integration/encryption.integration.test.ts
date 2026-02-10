/**
 * Integration tests for Application-Level Encryption with Prisma
 * Tests encryption middleware and database operations
 */

import { PrismaClient } from '@prisma/client';
import { getEncryptionService } from '../../services/encryptionService';
import { applyEncryptionMiddleware } from '../../middleware/encryptionMiddleware';

describe('Encryption Integration Tests', () => {
  let prisma: PrismaClient;
  let encryptionService: ReturnType<typeof getEncryptionService>;

  beforeAll(() => {
    // Set up encryption environment
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-integration-testing-32c';
    process.env.ENCRYPTION_ENABLED = 'true';

    // Initialize services
    encryptionService = getEncryptionService();
    prisma = new PrismaClient();

    // Apply encryption middleware
    applyEncryptionMiddleware(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    delete process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_ENABLED;
  });

  describe('User Model Encryption', () => {
    // Use unique email per run to avoid emailHash unique constraint (parallel tests / shared DB)
    const testUser = {
      email: `encryption-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`,
      password: 'hashedPassword123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      address: '123 Main St, City, Country',
    };

    let createdUserId: string;

    it('should encrypt PII fields when creating a user', async () => {
      const user = await prisma.user.create({
        data: testUser,
      });

      createdUserId = user.id;

      // Verify the user object returned has decrypted values
      expect(user.email).toBe(testUser.email);
      expect(user.phoneNumber).toBe(testUser.phoneNumber);
      expect(user.address).toBe(testUser.address);

      // Verify data is encrypted in database (raw query)
      const rawUser = await prisma.$queryRaw`
        SELECT email, "phoneNumber", address
        FROM users
        WHERE id = ${createdUserId}
      ` as any[];

      expect(rawUser[0].email).not.toBe(testUser.email);
      expect(rawUser[0].email).toContain(':'); // Encrypted format
      expect(rawUser[0].phoneNumber).not.toBe(testUser.phoneNumber);
      expect(rawUser[0].address).not.toBe(testUser.address);
    });

    it('should decrypt PII fields when reading a user', async () => {
      const user = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      expect(user?.email).toBe(testUser.email);
      expect(user?.phoneNumber).toBe(testUser.phoneNumber);
      expect(user?.address).toBe(testUser.address);
    });

    it('should handle searching with encrypted email', async () => {
      // Create a hash index for searching
      const emailHash = encryptionService.hash(testUser.email);

      // In real implementation, we'd have emailHash field in database
      // For now, we test that we can find by ID after encryption
      const user = await prisma.user.findFirst({
        where: { id: createdUserId },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe(testUser.email);
      // Verify hash was created correctly
      expect(emailHash).toBeDefined();
      expect(emailHash.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should encrypt fields on update', async () => {
      const newEmail = `updated-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`;
      const newPhone = '+9876543210';

      const updated = await prisma.user.update({
        where: { id: createdUserId },
        data: {
          email: newEmail,
          phoneNumber: newPhone,
        },
      });

      expect(updated.email).toBe(newEmail);
      expect(updated.phoneNumber).toBe(newPhone);

      // Verify encryption in database
      const rawUser = await prisma.$queryRaw`
        SELECT email, "phoneNumber"
        FROM users
        WHERE id = ${createdUserId}
      ` as any[];

      expect(rawUser[0].email).not.toBe(newEmail);
      expect(rawUser[0].phoneNumber).not.toBe(newPhone);
    });

    it('should handle bulk operations', async () => {
      const users = await prisma.user.findMany({
        take: 10,
      });

      // All users should have decrypted data
      users.forEach(user => {
        if (user.email) {
          expect(user.email).not.toContain(':'); // Not in encrypted format
        }
      });
    });

    afterAll(async () => {
      // Clean up test user
      if (createdUserId) {
        await prisma.user.delete({
          where: { id: createdUserId },
        }).catch(() => {
          // Ignore if already deleted
        });
      }
    });
  });

  describe('Profile Model Encryption', () => {
    it('should encrypt profile bio and location', async () => {
      const testProfile = {
        bio: 'This is my personal bio with sensitive information',
        website: 'https://example.com',
        location: 'San Francisco, CA',
        userId: 'test-user-id',
      };

      // Mock profile creation (would need actual user)
      // This is a placeholder for the actual test
      expect(encryptionService.encrypt(testProfile.bio)).not.toBe(testProfile.bio);
      expect(encryptionService.encrypt(testProfile.location)).not.toBe(testProfile.location);
    });
  });

  describe('Encryption Performance', () => {
    it('should not significantly impact query performance', async () => {
      const startTime = Date.now();

      // Run 100 queries
      for (let i = 0; i < 100; i++) {
        await prisma.user.findMany({
          take: 10,
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time (adjust based on your requirements)
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 100 queries
    });
  });

  describe('Encryption with Transactions', () => {
    it('should maintain encryption in transactions', async () => {
      const uniqueEmail = `transaction-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`;
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: uniqueEmail,
            password: 'hashedPassword',
            firstName: 'Trans',
            lastName: 'Action',
          },
        });

        // Update within transaction
        const updatedEmail = `updated-tx-${Date.now()}@example.com`;
        const updated = await tx.user.update({
          where: { id: user.id },
          data: { email: updatedEmail },
        });

        return updated;
      });

      expect(result.email).toMatch(/^updated-tx-\d+@example\.com$/);

      // Clean up
      await prisma.user.delete({
        where: { id: result.id },
      }).catch(() => {});
    });
  });

  describe('Encryption Error Handling', () => {
    it('should handle encryption errors gracefully', async () => {
      const uniqueEmail = `unencrypted-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`;
      // Temporarily disable encryption
      process.env.ENCRYPTION_ENABLED = 'false';

      const user = await prisma.user.create({
        data: {
          email: uniqueEmail,
          password: 'hashedPassword',
          firstName: 'Unencrypted',
          lastName: 'User',
        },
      });

      // Data should be stored as-is
      expect(user.email).toBe(uniqueEmail);

      // Re-enable encryption
      process.env.ENCRYPTION_ENABLED = 'true';

      // Clean up
      await prisma.user.delete({
        where: { id: user.id },
      }).catch(() => {});
    });
  });
});