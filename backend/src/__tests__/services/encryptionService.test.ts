/**
 * Tests for Application-Level Encryption Service
 * Uses AES-256-GCM encryption for sensitive data
 */

import { EncryptionService } from '../../services/encryptionService';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    // Set test encryption key
    process.env.ENCRYPTION_KEY = 'test-key-32-chars-long-for-aes256';
    process.env.ENCRYPTION_ENABLED = 'true';
    process.env.NODE_ENV = 'test'; // Ensure test environment
    encryptionService = new EncryptionService();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_ENABLED;
  });

  describe('Configuration', () => {
    it('should initialize with valid encryption key', () => {
      expect(encryptionService.isEnabled()).toBe(true);
    });

    it('should throw error if encryption key is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = 'production'; // Not test environment
      expect(() => new EncryptionService()).toThrow('Encryption key is required when encryption is enabled');
      process.env.NODE_ENV = 'test'; // Reset
    });

    it('should throw error if encryption key is too short', () => {
      process.env.ENCRYPTION_KEY = 'short-key';
      expect(() => new EncryptionService()).toThrow('Encryption key must be at least 32 characters');
    });

    it('should be disabled when ENCRYPTION_ENABLED is false', () => {
      process.env.ENCRYPTION_ENABLED = 'false';
      const service = new EncryptionService();
      expect(service.isEnabled()).toBe(false);
    });

    it('should handle encryption key from base64', () => {
      const base64Key = Buffer.from('a'.repeat(32)).toString('base64');
      process.env.ENCRYPTION_KEY = base64Key;
      process.env.ENCRYPTION_KEY_FORMAT = 'base64';
      const service = new EncryptionService();
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt plaintext string', () => {
      const plaintext = 'sensitive-data@example.com';
      const encrypted = encryptionService.encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(':'); // Should have IV separator
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should decrypt encrypted string', () => {
      const plaintext = 'sensitive-data@example.com';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should generate different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'sensitive-data@example.com';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = '测试中文 émojis 😀 special: !@#$%^&*()';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return original value when encryption is disabled', () => {
      process.env.ENCRYPTION_ENABLED = 'false';
      const service = new EncryptionService();
      const plaintext = 'sensitive-data@example.com';

      const encrypted = service.encrypt(plaintext);
      expect(encrypted).toBe(plaintext);

      const decrypted = service.decrypt(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error when decrypting invalid format', () => {
      expect(() => encryptionService.decrypt('invalid-format')).toThrow('Invalid encrypted data format');
    });

    it('should throw error when decrypting with wrong key', () => {
      const plaintext = 'sensitive-data@example.com';
      const encrypted = encryptionService.encrypt(plaintext);

      // Change the key
      process.env.ENCRYPTION_KEY = 'different-key-32-chars-long-here';
      const newService = new EncryptionService();

      expect(() => newService.decrypt(encrypted)).toThrow();
    });
  });

  describe('Batch Operations', () => {
    it('should encrypt multiple fields', () => {
      const data = {
        email: 'user@example.com',
        phone: '+1234567890',
        address: '123 Main St',
      };

      const encrypted = encryptionService.encryptFields(data, ['email', 'phone']);

      expect(encrypted.email).not.toBe(data.email);
      expect(encrypted.phone).not.toBe(data.phone);
      expect(encrypted.address).toBe(data.address); // Not in encryption list
    });

    it('should decrypt multiple fields', () => {
      const data = {
        email: 'user@example.com',
        phone: '+1234567890',
        address: '123 Main St',
      };

      const encrypted = encryptionService.encryptFields(data, ['email', 'phone']);
      const decrypted = encryptionService.decryptFields(encrypted, ['email', 'phone']);

      expect(decrypted).toEqual(data);
    });

    it('should handle null and undefined values', () => {
      const data = {
        email: null,
        phone: undefined,
        address: '123 Main St',
      };

      const encrypted = encryptionService.encryptFields(data as any, ['email', 'phone']);

      expect(encrypted.email).toBeNull();
      expect(encrypted.phone).toBeUndefined();
      expect(encrypted.address).toBe(data.address);
    });

    it('should handle nested objects', () => {
      const data = {
        profile: {
          email: 'user@example.com',
          phone: '+1234567890',
        },
        address: '123 Main St',
      };

      const encrypted = encryptionService.encryptFields(data, ['profile.email', 'profile.phone']);

      expect(encrypted.profile.email).not.toBe(data.profile.email);
      expect(encrypted.profile.phone).not.toBe(data.profile.phone);
      expect(encrypted.address).toBe(data.address);
    });
  });

  describe('Key Rotation', () => {
    it('should detect when key rotation is needed', () => {
      const encrypted = encryptionService.encrypt('test-data');
      const needsRotation = encryptionService.needsRotation(encrypted);

      expect(needsRotation).toBe(false);
    });

    it('should re-encrypt data with new key', () => {
      const plaintext = 'sensitive-data@example.com';
      const oldEncrypted = encryptionService.encrypt(plaintext);

      // Simulate key rotation
      process.env.ENCRYPTION_KEY = 'new-key-32-chars-long-for-aes256';
      process.env.OLD_ENCRYPTION_KEY = 'test-key-32-chars-long-for-aes256';
      const newService = new EncryptionService();

      const rotated = newService.rotateEncryption(oldEncrypted);
      const decrypted = newService.decrypt(rotated);

      expect(decrypted).toBe(plaintext);
      expect(rotated).not.toBe(oldEncrypted);
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt within acceptable time', () => {
      const plaintext = 'a'.repeat(1000); // 1KB of data
      const iterations = 100;

      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        const encrypted = encryptionService.encrypt(plaintext);
        encryptionService.decrypt(encrypted);
      }
      const endTime = Date.now();

      const avgTime = (endTime - startTime) / iterations;
      expect(avgTime).toBeLessThan(10); // Should be less than 10ms per operation
    });
  });

  describe('Hash Functions', () => {
    it('should create consistent hash for searching', () => {
      const value = 'user@example.com';
      const hash1 = encryptionService.hash(value);
      const hash2 = encryptionService.hash(value);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(value);
      expect(hash1.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should create different hashes for different values', () => {
      const hash1 = encryptionService.hash('value1');
      const hash2 = encryptionService.hash('value2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle search with encrypted fields', () => {
      const email = 'user@example.com';
      const hashedEmail = encryptionService.hash(email);

      // This would be used in database queries for searching
      expect(hashedEmail).toBeDefined();
      expect(typeof hashedEmail).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', () => {
      const service = new EncryptionService();
      // Mock internal error
      jest.spyOn(service as any, 'generateIV').mockImplementation(() => {
        throw new Error('Random generation failed');
      });

      expect(() => service.encrypt('test')).toThrow('Encryption failed');
    });

    it('should handle decryption errors gracefully', () => {
      const invalidData = 'invalid:base64:data';
      expect(() => encryptionService.decrypt(invalidData)).toThrow('Decryption failed');
    });
  });
});