/**
 * Application-Level Encryption Service
 * Provides AES-256-GCM encryption for sensitive data fields
 * Platform-agnostic solution that works with any PostgreSQL deployment
 */

import crypto from 'crypto';

interface EncryptionConfig {
  enabled: boolean;
  key: Buffer;
  algorithm: string;
  ivLength: number;
  tagLength: number;
  saltLength: number;
  oldKey?: Buffer;
}

export class EncryptionService {
  private config: EncryptionConfig;
  private readonly SEPARATOR = ':';
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16;
  private readonly TAG_LENGTH = 16;
  private readonly SALT_LENGTH = 32;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): EncryptionConfig {
    const enabled = process.env.ENCRYPTION_ENABLED !== 'false';

    if (!enabled) {
      return {
        enabled: false,
        key: Buffer.alloc(0),
        algorithm: this.ALGORITHM,
        ivLength: this.IV_LENGTH,
        tagLength: this.TAG_LENGTH,
        saltLength: this.SALT_LENGTH,
      };
    }

    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      // In test environment without key, disable encryption
      if (process.env.NODE_ENV === 'test') {
        return {
          enabled: false,
          key: Buffer.alloc(0),
          algorithm: this.ALGORITHM,
          ivLength: this.IV_LENGTH,
          tagLength: this.TAG_LENGTH,
          saltLength: this.SALT_LENGTH,
        };
      }
      throw new Error('Encryption key is required when encryption is enabled');
    }

    if (keyString.length < 32) {
      throw new Error('Encryption key must be at least 32 characters');
    }

    // Handle different key formats
    let key: Buffer;
    if (process.env.ENCRYPTION_KEY_FORMAT === 'base64') {
      key = Buffer.from(keyString, 'base64');
      // Ensure it's 32 bytes
      if (key.length < 32) {
        // Pad with zeros if too short
        const padded = Buffer.alloc(32);
        key.copy(padded);
        key = padded;
      } else if (key.length > 32) {
        key = key.slice(0, 32);
      }
    } else {
      // Create a 32-byte key from the string using SHA-256
      key = crypto.createHash('sha256').update(keyString).digest();
    }

    // Handle old key for rotation
    let oldKey: Buffer | undefined;
    if (process.env.OLD_ENCRYPTION_KEY) {
      if (process.env.ENCRYPTION_KEY_FORMAT === 'base64') {
        oldKey = Buffer.from(process.env.OLD_ENCRYPTION_KEY, 'base64');
        // Ensure it's 32 bytes
        if (oldKey.length < 32) {
          const padded = Buffer.alloc(32);
          oldKey.copy(padded);
          oldKey = padded;
        } else if (oldKey.length > 32) {
          oldKey = oldKey.slice(0, 32);
        }
      } else {
        // Create a 32-byte key from the string using SHA-256
        oldKey = crypto.createHash('sha256').update(process.env.OLD_ENCRYPTION_KEY).digest();
      }
    }

    return {
      enabled,
      key,
      algorithm: this.ALGORITHM,
      ivLength: this.IV_LENGTH,
      tagLength: this.TAG_LENGTH,
      saltLength: this.SALT_LENGTH,
      oldKey,
    };
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM
   * @param plaintext The string to encrypt
   * @returns Encrypted string in format: iv:authTag:ciphertext (all base64)
   */
  public encrypt(plaintext: string): string {
    if (!this.config.enabled) {
      return plaintext;
    }

    try {
      const iv = this.generateIV();
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.config.key, iv);

      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      // Combine iv, authTag, and ciphertext
      const combined = [
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted.toString('base64'),
      ].join(this.SEPARATOR);

      return combined;
    } catch (error) {
      throw new Error('Encryption failed: ' + (error as Error).message);
    }
  }

  /**
   * Decrypts an encrypted string
   * @param encrypted The encrypted string in format: iv:authTag:ciphertext
   * @returns Decrypted plaintext string
   */
  public decrypt(encrypted: string): string {
    if (!this.config.enabled) {
      return encrypted;
    }

    try {
      const parts = encrypted.split(this.SEPARATOR);
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, authTagBase64, ciphertextBase64] = parts;
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      const ciphertext = Buffer.from(ciphertextBase64, 'base64');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.config.key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      // Try with old key if available (for key rotation)
      if (this.config.oldKey) {
        try {
          return this.decryptWithOldKey(encrypted);
        } catch {
          // If old key also fails, throw original error
          throw new Error('Decryption failed: ' + (error as Error).message);
        }
      }
      throw new Error('Decryption failed: ' + (error as Error).message);
    }
  }

  private decryptWithOldKey(encrypted: string): string {
    if (!this.config.oldKey) {
      throw new Error('Old encryption key not available');
    }

    try {
      const parts = encrypted.split(this.SEPARATOR);
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, authTagBase64, ciphertextBase64] = parts;
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      const ciphertext = Buffer.from(ciphertextBase64, 'base64');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.config.oldKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Decryption with old key failed: ' + (error as Error).message);
    }
  }

  /**
   * Encrypts specific fields in an object
   * @param data The object containing fields to encrypt
   * @param fields Array of field paths to encrypt (supports nested: 'profile.email')
   * @returns Object with specified fields encrypted
   */
  public encryptFields<T extends Record<string, any>>(data: T, fields: string[]): T {
    // Deep clone the object to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));

    for (const field of fields) {
      const value = this.getNestedValue(result, field);
      if (value !== null && value !== undefined && typeof value === 'string') {
        this.setNestedValue(result, field, this.encrypt(value));
      }
    }

    return result;
  }

  /**
   * Decrypts specific fields in an object
   * @param data The object containing fields to decrypt
   * @param fields Array of field paths to decrypt
   * @returns Object with specified fields decrypted
   */
  public decryptFields<T extends Record<string, any>>(data: T, fields: string[]): T {
    // Deep clone the object to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));

    for (const field of fields) {
      const value = this.getNestedValue(result, field);
      if (value !== null && value !== undefined && typeof value === 'string') {
        // Check if the value looks like encrypted data (contains our separator)
        // If not, it's probably unencrypted legacy data, so leave it as is
        if (value.includes(this.SEPARATOR)) {
          try {
            this.setNestedValue(result, field, this.decrypt(value));
          } catch (error) {
            // If decryption fails, assume it's unencrypted data and leave as is
            console.warn(`Failed to decrypt field ${field}, assuming unencrypted data`);
          }
        }
        // If no separator found, it's unencrypted data - leave it as is
      }
    }

    return result;
  }

  /**
   * Creates a consistent hash for searching encrypted fields
   * @param value The value to hash
   * @returns SHA-256 hash of the value
   */
  public hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Checks if encrypted data needs rotation
   * @param encrypted The encrypted string
   * @returns Boolean indicating if rotation is needed
   */
  public needsRotation(encrypted: string): boolean {
    // In a real implementation, you might check the encryption version
    // or timestamp to determine if rotation is needed
    // For now, we just validate the format
    try {
      const parts = encrypted.split(this.SEPARATOR);
      return parts.length !== 3; // If format is wrong, it needs rotation
    } catch {
      return true; // If we can't parse it, it needs rotation
    }
  }

  /**
   * Re-encrypts data with the new key
   * @param encrypted The encrypted string with old key
   * @returns Re-encrypted string with new key
   */
  public rotateEncryption(encrypted: string): string {
    if (!this.config.oldKey) {
      throw new Error('Old key required for rotation');
    }

    // Decrypt with old key
    const plaintext = this.decryptWithOldKey(encrypted);

    // Re-encrypt with new key
    return this.encrypt(plaintext);
  }

  private generateIV(): Buffer {
    return crypto.randomBytes(this.IV_LENGTH);
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return current;
      }
      current = current[key];
    }

    return current;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }
}

// Singleton instance for the application
let encryptionServiceInstance: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService();
  }
  return encryptionServiceInstance;
}

// Export for use in Prisma middleware
export function encryptPII(data: any, fields: string[]): any {
  const service = getEncryptionService();
  return service.encryptFields(data, fields);
}

export function decryptPII(data: any, fields: string[]): any {
  const service = getEncryptionService();
  return service.decryptFields(data, fields);
}

// List of PII fields to encrypt
export const PII_FIELDS = {
  User: ['email', 'phoneNumber', 'address'],
  Profile: ['bio', 'website', 'location'],
  Payment: ['cardNumber', 'accountNumber'],
  PersonalData: ['ssn', 'taxId', 'driverLicense'],
};