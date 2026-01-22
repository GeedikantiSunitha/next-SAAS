/**
 * TDD Tests for Field-Level Encryption Service
 *
 * Phase 3.2: Additional field-level encryption for ultra-sensitive PII
 * This provides a second layer of encryption on top of database encryption
 *
 * Following TDD approach - these tests are written BEFORE implementation
 */

import { FieldEncryptionService } from '../../services/fieldEncryptionService';

describe('FieldEncryptionService', () => {
  let service: FieldEncryptionService;

  beforeEach(() => {
    // Set up test encryption key different from database key
    process.env.FIELD_ENCRYPTION_ENABLED = 'true';
    process.env.FIELD_ENCRYPTION_KEY = 'test-field-encryption-key-32-characters-long!!';
    process.env.ENCRYPTION_KEY = 'different-database-key-32-characters-minimum!';
    service = new FieldEncryptionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with field encryption key', () => {
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it('should use different key from database encryption', () => {
      const fieldKey = process.env.FIELD_ENCRYPTION_KEY;
      const dbKey = process.env.ENCRYPTION_KEY;
      expect(fieldKey).not.toEqual(dbKey);
    });

    it('should disable when FIELD_ENCRYPTION_ENABLED is false', () => {
      process.env.FIELD_ENCRYPTION_ENABLED = 'false';
      const disabledService = new FieldEncryptionService();
      expect(disabledService.isEnabled()).toBe(false);
    });
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt a string value', () => {
      const plaintext = '555-123-4567'; // phone number
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).not.toEqual(plaintext);
      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/); // Should be base64
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should decrypt an encrypted string', () => {
      const plaintext = '123 Main St, Anytown, USA';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toEqual(plaintext);
    });

    it('should generate different ciphertext for same plaintext (due to IV)', () => {
      const plaintext = '123-45-6789'; // SSN
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1).not.toEqual(encrypted2); // Different IVs
      expect(service.decrypt(encrypted1)).toEqual(plaintext);
      expect(service.decrypt(encrypted2)).toEqual(plaintext);
    });

    it('should handle null and undefined gracefully', () => {
      expect(service.encrypt(null as any)).toBeNull();
      expect(service.encrypt(undefined as any)).toBeUndefined();
      expect(service.decrypt(null as any)).toBeNull();
      expect(service.decrypt(undefined as any)).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const encrypted = service.encrypt('');
      expect(encrypted).toBe('');
      expect(service.decrypt('')).toBe('');
    });
  });

  describe('PII Field Encryption', () => {
    it('should identify PII fields that need field-level encryption', () => {
      const piiFields = service.getPIIFields();
      expect(piiFields).toContain('phoneNumber');
      expect(piiFields).toContain('address');
      expect(piiFields).toContain('ssn');
      expect(piiFields).toContain('taxId');
      expect(piiFields).toContain('driverLicense');
      expect(piiFields).toContain('accountNumber');
      // email is not included as it's already hashed for searching
      expect(piiFields).not.toContain('email');
    });

    it('should encrypt phone numbers', () => {
      const phoneNumber = '+1-555-123-4567';
      const encrypted = service.encryptPhone(phoneNumber);

      expect(encrypted).not.toEqual(phoneNumber);
      expect(service.decryptPhone(encrypted)).toEqual(phoneNumber);
    });

    it('should encrypt addresses', () => {
      const address = '123 Main St, Apt 4B, New York, NY 10001';
      const encrypted = service.encryptAddress(address);

      expect(encrypted).not.toEqual(address);
      expect(service.decryptAddress(encrypted)).toEqual(address);
    });

    it('should encrypt SSN', () => {
      const ssn = '123-45-6789';
      const encrypted = service.encryptSSN(ssn);

      expect(encrypted).not.toEqual(ssn);
      expect(service.decryptSSN(encrypted)).toEqual(ssn);
    });

    it('should encrypt tax IDs', () => {
      const taxId = '12-3456789';
      const encrypted = service.encryptTaxId(taxId);

      expect(encrypted).not.toEqual(taxId);
      expect(service.decryptTaxId(encrypted)).toEqual(taxId);
    });

    it('should encrypt driver license', () => {
      const license = 'D123-4567-8901';
      const encrypted = service.encryptDriverLicense(license);

      expect(encrypted).not.toEqual(license);
      expect(service.decryptDriverLicense(encrypted)).toEqual(license);
    });

    it('should encrypt account numbers', () => {
      const accountNumber = '1234567890123456';
      const encrypted = service.encryptAccountNumber(accountNumber);

      expect(encrypted).not.toEqual(accountNumber);
      expect(service.decryptAccountNumber(encrypted)).toEqual(accountNumber);
    });
  });

  describe('Bulk Operations', () => {
    it('should encrypt multiple fields in an object', () => {
      const data = {
        name: 'John Doe', // not encrypted
        email: 'john@example.com', // not field-encrypted (only hashed)
        phoneNumber: '555-123-4567', // field-encrypted
        address: '123 Main St', // field-encrypted
        bio: 'Software developer' // not field-encrypted
      };

      const encrypted = service.encryptFields(data);

      expect(encrypted.name).toEqual(data.name); // unchanged
      expect(encrypted.email).toEqual(data.email); // unchanged
      expect(encrypted.phoneNumber).not.toEqual(data.phoneNumber); // encrypted
      expect(encrypted.address).not.toEqual(data.address); // encrypted
      expect(encrypted.bio).toEqual(data.bio); // unchanged
    });

    it('should decrypt multiple fields in an object', () => {
      const data = {
        name: 'John Doe',
        phoneNumber: '555-123-4567',
        address: '123 Main St'
      };

      const encrypted = service.encryptFields(data);
      const decrypted = service.decryptFields(encrypted);

      expect(decrypted).toEqual(data);
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John Doe',
          phoneNumber: '555-123-4567'
        },
        personalData: {
          ssn: '123-45-6789',
          taxId: '12-3456789'
        }
      };

      const encrypted = service.encryptNestedFields(data);

      expect(encrypted.user.name).toEqual(data.user.name);
      expect(encrypted.user.phoneNumber).not.toEqual(data.user.phoneNumber);
      expect(encrypted.personalData.ssn).not.toEqual(data.personalData.ssn);
      expect(encrypted.personalData.taxId).not.toEqual(data.personalData.taxId);

      const decrypted = service.decryptNestedFields(encrypted);
      expect(decrypted).toEqual(data);
    });
  });

  describe('Key Rotation', () => {
    it('should support key rotation with old key', () => {
      const plaintext = '555-123-4567';
      const encrypted = service.encrypt(plaintext);

      // Simulate key rotation
      process.env.OLD_FIELD_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY;
      process.env.FIELD_ENCRYPTION_KEY = 'new-field-encryption-key-32-characters-min!!';
      const rotatedService = new FieldEncryptionService();

      // Should still decrypt with old key
      const decrypted = rotatedService.decrypt(encrypted);
      expect(decrypted).toEqual(plaintext);

      // New encryption should use new key
      const newEncrypted = rotatedService.encrypt(plaintext);
      expect(newEncrypted).not.toEqual(encrypted);
    });

    it('should re-encrypt data with new key', () => {
      const plaintext = '123-45-6789';
      const oldEncrypted = service.encrypt(plaintext);

      // Simulate key rotation
      process.env.OLD_FIELD_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY;
      process.env.FIELD_ENCRYPTION_KEY = 'new-field-encryption-key-32-characters-min!!';
      const rotatedService = new FieldEncryptionService();

      const reEncrypted = rotatedService.reEncrypt(oldEncrypted);
      expect(reEncrypted).not.toEqual(oldEncrypted);
      expect(rotatedService.decrypt(reEncrypted)).toEqual(plaintext);
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt within acceptable time limits', () => {
      const plaintext = '555-123-4567';
      const iterations = 1000;

      const startEncrypt = Date.now();
      for (let i = 0; i < iterations; i++) {
        service.encrypt(plaintext);
      }
      const encryptTime = Date.now() - startEncrypt;

      const encrypted = service.encrypt(plaintext);
      const startDecrypt = Date.now();
      for (let i = 0; i < iterations; i++) {
        service.decrypt(encrypted);
      }
      const decryptTime = Date.now() - startDecrypt;

      // Should average less than 1ms per operation
      expect(encryptTime / iterations).toBeLessThan(1);
      expect(decryptTime / iterations).toBeLessThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should return non-encrypted data as-is (for backward compatibility)', () => {
      // Invalid ciphertext that doesn't match our format returns as-is
      const result = service.decrypt('invalid-ciphertext');
      expect(result).toEqual('invalid-ciphertext');
    });

    it('should throw error for tampered ciphertext', () => {
      const encrypted = service.encrypt('test');
      // Tamper with the base64 to make it invalid but still look encrypted
      const tampered = 'RkxFXw' + encrypted.substring(6, encrypted.length - 1) + 'X';
      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('should handle decryption with wrong key gracefully', () => {
      const plaintext = 'test-data';
      const encrypted = service.encrypt(plaintext);

      // Verify it's actually encrypted
      expect(encrypted).not.toEqual(plaintext);
      expect(service.isFieldEncrypted(encrypted)).toBe(true);

      // Save original key and set wrong one
      const originalKey = process.env.FIELD_ENCRYPTION_KEY;
      process.env.FIELD_ENCRYPTION_KEY = 'wrong-key-32-characters-long-minimum-value!!!';
      process.env.FIELD_ENCRYPTION_ENABLED = 'true'; // Ensure it's enabled
      delete process.env.OLD_FIELD_ENCRYPTION_KEY; // Ensure no old key fallback

      const wrongKeyService = new FieldEncryptionService();

      // Verify the service is enabled and has a different key
      expect(wrongKeyService.isEnabled()).toBe(true);

      // The wrongKeyService should detect it's field-encrypted but fail to decrypt with wrong key
      // This should throw an error as it detects the FLE_ prefix but can't decrypt
      expect(() => wrongKeyService.decrypt(encrypted)).toThrow('Field decryption failed');

      // Restore original key for other tests
      process.env.FIELD_ENCRYPTION_KEY = originalKey;
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle already encrypted data (double encryption prevention)', () => {
      const plaintext = '555-123-4567';
      const encrypted = service.encrypt(plaintext);

      // Attempting to encrypt already encrypted data should return as-is
      const doubleEncrypted = service.encrypt(encrypted);
      expect(doubleEncrypted).toEqual(encrypted);

      // Should still decrypt correctly
      expect(service.decrypt(doubleEncrypted)).toEqual(plaintext);
    });

    it('should detect field-encrypted vs database-encrypted data', () => {
      const plaintext = '123-45-6789';
      const fieldEncrypted = service.encrypt(plaintext);

      expect(service.isFieldEncrypted(fieldEncrypted)).toBe(true);
      expect(service.isFieldEncrypted(plaintext)).toBe(false);
    });
  });

  describe('Integration with Database Encryption', () => {
    it('should work alongside database encryption', () => {
      // This simulates the full encryption pipeline:
      // 1. Field encryption (this service)
      // 2. Database encryption (existing encryptionService)

      const plaintext = '555-123-4567';

      // Field-level encryption first
      const fieldEncrypted = service.encrypt(plaintext);

      // Then database encryption would happen via middleware
      // (mocked here as we're testing in isolation)
      const dbEncrypted = Buffer.from(fieldEncrypted).toString('base64');

      // On retrieval, database decryption happens first
      const dbDecrypted = Buffer.from(dbEncrypted, 'base64').toString();

      // Then field-level decryption
      const fullyDecrypted = service.decrypt(dbDecrypted);

      expect(fullyDecrypted).toEqual(plaintext);
    });
  });
});