/**
 * Field-Level Encryption Service
 *
 * GDPR Phase 3, Task 3.2: Additional field-level encryption for ultra-sensitive PII
 * This provides a second layer of encryption on top of database encryption
 *
 * Features:
 * - Separate encryption keys from database encryption
 * - AES-256-GCM encryption for field-level data
 * - Support for key rotation
 * - Double encryption prevention
 * - Transparent encryption/decryption
 */

import * as crypto from 'crypto';

export class FieldEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly prefix = 'FLE_'; // Field-Level Encryption prefix

  private key: Buffer | null = null;
  private oldKey: Buffer | null = null;
  private enabled: boolean = true;

  // PII fields that need field-level encryption
  private readonly piiFields = [
    'phoneNumber',
    'address',
    'ssn',
    'taxId',
    'driverLicense',
    'accountNumber',
    'cardNumber'
    // Note: email is not included as it's already hashed for searching
  ];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const keyString = process.env.FIELD_ENCRYPTION_KEY;
    const oldKeyString = process.env.OLD_FIELD_ENCRYPTION_KEY;
    const enabledStr = process.env.FIELD_ENCRYPTION_ENABLED;

    // Check if explicitly disabled
    if (enabledStr === 'false') {
      this.enabled = false;
      return;
    }

    if (!keyString || keyString.length < 32) {
      console.warn('Field encryption key not configured or too short. Field encryption disabled.');
      this.enabled = false;
      return;
    }

    // Ensure field encryption key is different from database encryption key
    if (keyString === process.env.ENCRYPTION_KEY) {
      console.warn('Field encryption key should be different from database encryption key.');
    }

    // Create key from string (pad/truncate to 32 bytes)
    this.key = this.deriveKey(keyString);

    // Set up old key for rotation support
    if (oldKeyString && oldKeyString.length >= 32) {
      this.oldKey = this.deriveKey(oldKeyString);
    }
  }

  private deriveKey(keyString: string): Buffer {
    // Use SHA-256 to derive a consistent 32-byte key
    return crypto.createHash('sha256').update(keyString).digest();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getPIIFields(): string[] {
    return [...this.piiFields];
  }

  /**
   * Encrypt a string value with field-level encryption
   */
  public encrypt(value: string): string {
    if (!this.enabled || !this.key) return value;
    if (value === null || value === undefined) return value as any;
    if (value === '') return value;

    // Check if already field-encrypted (prevent double encryption)
    if (this.isFieldEncrypted(value)) {
      return value;
    }

    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      const encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final()
      ]);

      const tag = cipher.getAuthTag();

      // Combine: prefix + iv + tag + encrypted data
      const combined = Buffer.concat([
        Buffer.from(this.prefix),
        iv,
        tag,
        encrypted
      ]);

      // Return base64 encoded
      return combined.toString('base64');
    } catch (error) {
      console.error('Field encryption failed:', error);
      throw new Error('Field encryption failed');
    }
  }

  /**
   * Decrypt a field-encrypted string
   */
  public decrypt(value: string): string {
    if (!this.enabled) return value;
    if (value === null || value === undefined) return value as any;
    if (value === '') return value;

    // Check if this is field-encrypted data
    if (!this.isFieldEncrypted(value)) {
      return value;
    }

    try {
      return this.decryptWithKey(value, this.key!);
    } catch (error) {
      // Try with old key if available (for key rotation)
      if (this.oldKey) {
        try {
          return this.decryptWithKey(value, this.oldKey);
        } catch {
          // Fall through to original error
        }
      }
      throw new Error('Field decryption failed');
    }
  }

  private decryptWithKey(value: string, key: Buffer): string {
    try {
      const combined = Buffer.from(value, 'base64');

      // Extract components
      const prefixLength = this.prefix.length;
      const minLength = prefixLength + this.ivLength + this.tagLength + 1;

      if (combined.length < minLength) {
        throw new Error('Field decryption failed: invalid or tampered payload length');
      }

      const prefix = combined.slice(0, prefixLength).toString();

      if (prefix !== this.prefix) {
        throw new Error('Invalid field encryption prefix');
      }

      const iv = combined.slice(prefixLength, prefixLength + this.ivLength);
      const tag = combined.slice(prefixLength + this.ivLength, prefixLength + this.ivLength + this.tagLength);
      const encrypted = combined.slice(prefixLength + this.ivLength + this.tagLength);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Field decryption failed: ${error}`);
    }
  }

  /**
   * Check if a value is field-encrypted
   */
  public isFieldEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    try {
      const decoded = Buffer.from(value, 'base64');
      const prefix = decoded.slice(0, this.prefix.length).toString();
      return prefix === this.prefix;
    } catch {
      return false;
    }
  }

  /**
   * Re-encrypt data with new key (for key rotation)
   */
  public reEncrypt(value: string): string {
    if (!this.enabled || !this.key) return value;

    const decrypted = this.decrypt(value);
    return this.encrypt(decrypted);
  }

  // Specific PII field encryption methods
  public encryptPhone(phone: string): string {
    return this.encrypt(phone);
  }

  public decryptPhone(encryptedPhone: string): string {
    return this.decrypt(encryptedPhone);
  }

  public encryptAddress(address: string): string {
    return this.encrypt(address);
  }

  public decryptAddress(encryptedAddress: string): string {
    return this.decrypt(encryptedAddress);
  }

  public encryptSSN(ssn: string): string {
    return this.encrypt(ssn);
  }

  public decryptSSN(encryptedSSN: string): string {
    return this.decrypt(encryptedSSN);
  }

  public encryptTaxId(taxId: string): string {
    return this.encrypt(taxId);
  }

  public decryptTaxId(encryptedTaxId: string): string {
    return this.decrypt(encryptedTaxId);
  }

  public encryptDriverLicense(license: string): string {
    return this.encrypt(license);
  }

  public decryptDriverLicense(encryptedLicense: string): string {
    return this.decrypt(encryptedLicense);
  }

  public encryptAccountNumber(accountNumber: string): string {
    return this.encrypt(accountNumber);
  }

  public decryptAccountNumber(encryptedAccountNumber: string): string {
    return this.decrypt(encryptedAccountNumber);
  }

  /**
   * Encrypt PII fields in an object
   */
  public encryptFields(data: any): any {
    if (!this.enabled || !data) return data;

    const result = { ...data };

    for (const field of this.piiFields) {
      if (field in result && result[field] !== null && result[field] !== undefined) {
        result[field] = this.encrypt(String(result[field]));
      }
    }

    return result;
  }

  /**
   * Decrypt PII fields in an object
   */
  public decryptFields(data: any): any {
    if (!this.enabled || !data) return data;

    const result = { ...data };

    for (const field of this.piiFields) {
      if (field in result && result[field] !== null && result[field] !== undefined) {
        result[field] = this.decrypt(String(result[field]));
      }
    }

    return result;
  }

  /**
   * Encrypt PII fields in nested objects
   */
  public encryptNestedFields(data: any): any {
    if (!this.enabled || !data) return data;

    const result = JSON.parse(JSON.stringify(data)); // Deep clone

    const encryptRecursive = (obj: any): void => {
      for (const key in obj) {
        if (this.piiFields.includes(key) && typeof obj[key] === 'string') {
          obj[key] = this.encrypt(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          encryptRecursive(obj[key]);
        }
      }
    };

    encryptRecursive(result);
    return result;
  }

  /**
   * Decrypt PII fields in nested objects
   */
  public decryptNestedFields(data: any): any {
    if (!this.enabled || !data) return data;

    const result = JSON.parse(JSON.stringify(data)); // Deep clone

    const decryptRecursive = (obj: any): void => {
      for (const key in obj) {
        if (this.piiFields.includes(key) && typeof obj[key] === 'string') {
          obj[key] = this.decrypt(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          decryptRecursive(obj[key]);
        }
      }
    };

    decryptRecursive(result);
    return result;
  }
}

// Export singleton instance
export const fieldEncryptionService = new FieldEncryptionService();