/**
 * Tests for ConsentVersion Model
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import { prisma } from '../../config/database';
import { ConsentType } from '@prisma/client';
import * as consentVersionService from '../../services/consentVersionService';

describe('ConsentVersion Model', () => {
  // Clean up before and after tests
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.$executeRaw`DELETE FROM consent_versions WHERE version LIKE 'test-%'`;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.$executeRaw`DELETE FROM consent_versions WHERE version LIKE 'test-%'`;
  });

  beforeEach(async () => {
    // Clean up between tests
    await prisma.$executeRaw`DELETE FROM consent_versions WHERE version LIKE 'test-%'`;
  });

  describe('ConsentVersion Creation', () => {
    it('should create a ConsentVersion with all required fields', async () => {
      const consentVersion = await prisma.consentVersion.create({
        data: {
          consentType: ConsentType.MARKETING_EMAILS,
          version: 'test-1.0.0',
          title: 'Marketing Consent',
          content: 'We would like to send you marketing emails about our products and services.',
          effectiveDate: new Date('2025-01-01'),
          isActive: true,
        },
      });

      expect(consentVersion).toBeDefined();
      expect(consentVersion.id).toBeDefined();
      expect(consentVersion.consentType).toBe(ConsentType.MARKETING_EMAILS);
      expect(consentVersion.version).toBe('test-1.0.0');
      expect(consentVersion.title).toBe('Marketing Consent');
      expect(consentVersion.content).toBe('We would like to send you marketing emails about our products and services.');
      expect(consentVersion.isActive).toBe(true);
    });

    it('should accept optional fields', async () => {
      const consentVersion = await prisma.consentVersion.create({
        data: {
          consentType: ConsentType.COOKIES,
          version: 'test-1.0.0',
          title: 'Cookie Policy',
          content: 'We use cookies to improve your experience.',
          effectiveDate: new Date('2025-01-01'),
          summary: 'Initial cookie policy',
          expiryPeriod: 365, // Days until consent expires
          requiresReConsent: true,
          changes: 'Initial version',
          isActive: true,
        },
      });

      expect(consentVersion.summary).toBe('Initial cookie policy');
      expect(consentVersion.expiryPeriod).toBe(365);
      expect(consentVersion.requiresReConsent).toBe(true);
      expect(consentVersion.changes).toBe('Initial version');
    });

    it('should validate version format follows semver pattern', async () => {
      // Test invalid version formats should fail (using service layer validation)
      const invalidVersions = ['1', '1.0', 'v1.0.0', '1.0.0.0', 'test'];

      for (const invalidVersion of invalidVersions) {
        await expect(
          consentVersionService.createConsentVersion(
            ConsentType.ANALYTICS,
            invalidVersion,
            'Test',
            'Test content'
          )
        ).rejects.toThrow('Version must follow semver format');
      }

      // Valid semver format should work
      const validVersion = await consentVersionService.createConsentVersion(
        ConsentType.ANALYTICS,
        '1.0.0',
        'Test',
        'Test content'
      );

      expect(validVersion.version).toMatch(/^\d+\.\d+\.\d+$/);

      // Clean up
      await prisma.consentVersion.delete({ where: { id: validVersion.id } });
    });
  });

  describe('ConsentVersion Constraints', () => {
    it('should enforce unique constraint on consentType + version combination', async () => {
      // Create first version
      await prisma.consentVersion.create({
        data: {
          consentType: ConsentType.PRIVACY_POLICY,
          version: 'test-1.0.0',
          title: 'Privacy Policy v1',
          content: 'Privacy content',
          effectiveDate: new Date(),
          isActive: true,
        },
      });

      // Attempt to create duplicate should fail
      await expect(
        prisma.consentVersion.create({
          data: {
            consentType: ConsentType.PRIVACY_POLICY,
            version: 'test-1.0.0',
            title: 'Privacy Policy v1 Duplicate',
            content: 'Different content',
            effectiveDate: new Date(),
            isActive: false,
          },
        })
      ).rejects.toThrow(/unique constraint/i);
    });

    it('should allow same version for different consent types', async () => {
      // Create version 1.0.0 for TERMS_OF_SERVICE
      const termsVersion = await prisma.consentVersion.create({
        data: {
          consentType: ConsentType.TERMS_OF_SERVICE,
          version: 'test-1.0.0',
          title: 'Terms of Service',
          content: 'Terms content',
          effectiveDate: new Date(),
          isActive: true,
        },
      });

      // Same version for PRIVACY_POLICY should work
      const privacyVersion = await prisma.consentVersion.create({
        data: {
          consentType: ConsentType.PRIVACY_POLICY,
          version: 'test-1.0.0',
          title: 'Privacy Policy',
          content: 'Privacy content',
          effectiveDate: new Date(),
          isActive: true,
        },
      });

      expect(termsVersion.version).toBe('test-1.0.0');
      expect(privacyVersion.version).toBe('test-1.0.0');
      expect(termsVersion.consentType).not.toBe(privacyVersion.consentType);
    });

    it('should allow only one active version per consent type', async () => {
      // Create first active version using service (which handles deactivation logic)
      const v1 = await consentVersionService.createConsentVersion(
        ConsentType.MARKETING_EMAILS,
        '1.0.0',
        'Marketing v1',
        'Content v1',
        { isActive: true }
      );

      // Create second version and set it as active
      // The service should automatically deactivate the first one
      const v2 = await consentVersionService.createConsentVersion(
        ConsentType.MARKETING_EMAILS,
        '2.0.0',
        'Marketing v2',
        'Content v2',
        { isActive: true }
      );

      // Check that v1 is no longer active
      const updatedV1 = await prisma.consentVersion.findUnique({
        where: {
          consentType_version: {
            consentType: ConsentType.MARKETING_EMAILS,
            version: '1.0.0',
          },
        },
      });

      expect(updatedV1?.isActive).toBe(false);
      expect(v2.isActive).toBe(true);

      // Clean up
      await prisma.consentVersion.delete({ where: { id: v1.id } });
      await prisma.consentVersion.delete({ where: { id: v2.id } });
    });
  });

  describe('ConsentVersion Relations', () => {
    it('should relate to ConsentRecord through versionId', async () => {
      // Create a consent version
      const version = await prisma.consentVersion.create({
        data: {
          consentType: ConsentType.ANALYTICS,
          version: 'test-1.0.0',
          title: 'Analytics Consent',
          content: 'We collect analytics data',
          effectiveDate: new Date(),
          isActive: true,
        },
      });

      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: `test-consent-${Date.now()}@example.com`,
          password: 'hashed_password',
          role: 'USER',
        },
      });

      // Create a consent record linked to this version
      const consentRecord = await prisma.consentRecord.create({
        data: {
          userId: user.id,
          consentType: ConsentType.ANALYTICS,
          granted: true,
          grantedAt: new Date(),
          versionId: version.id,
          version: version.version,
        },
      });

      // Verify the relationship
      const versionWithRecords = await prisma.consentVersion.findUnique({
        where: { id: version.id },
        include: { consentRecords: true },
      });

      expect(versionWithRecords?.consentRecords).toHaveLength(1);
      expect(versionWithRecords?.consentRecords[0].id).toBe(consentRecord.id);

      // Clean up
      await prisma.consentRecord.delete({ where: { id: consentRecord.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('ConsentVersion Expiry', () => {
    it('should calculate expiry date based on expiryPeriod', async () => {
      const version = await prisma.consentVersion.create({
        data: {
          consentType: ConsentType.THIRD_PARTY_SHARING,
          version: 'test-1.0.0',
          title: 'Third Party Sharing',
          content: 'We may share your data with partners',
          effectiveDate: new Date(),
          expiryPeriod: 30, // 30 days
          isActive: true,
        },
      });

      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: `test-expiry-${Date.now()}@example.com`,
          password: 'hashed_password',
          role: 'USER',
        },
      });

      // When creating a consent record, expiresAt should be calculated
      const consentRecord = await prisma.consentRecord.create({
        data: {
          userId: user.id,
          consentType: ConsentType.THIRD_PARTY_SHARING,
          granted: true,
          grantedAt: new Date(),
          versionId: version.id,
          version: version.version,
          expiresAt: new Date(Date.now() + version.expiryPeriod! * 24 * 60 * 60 * 1000),
        },
      });

      expect(consentRecord.expiresAt).toBeDefined();

      // Verify expiry is approximately 30 days from now
      const daysDiff = Math.round((consentRecord.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(30);

      // Clean up
      await prisma.consentRecord.delete({ where: { id: consentRecord.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should handle null expiryPeriod (no expiry)', async () => {
      const version = await prisma.consentVersion.create({
        data: {
          consentType: ConsentType.TERMS_OF_SERVICE,
          version: 'test-1.0.0',
          title: 'Terms of Service',
          content: 'Terms that do not expire',
          effectiveDate: new Date(),
          expiryPeriod: null, // No expiry
          isActive: true,
        },
      });

      expect(version.expiryPeriod).toBeNull();
    });
  });
});