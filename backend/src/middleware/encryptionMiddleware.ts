/**
 * Prisma Middleware for Application-Level Encryption
 * Automatically encrypts and decrypts PII fields in database operations
 */

import { PrismaClient } from '@prisma/client';
import { getEncryptionService } from '../services/encryptionService';

// Define which fields to encrypt for each model
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  user: ['email', 'phoneNumber', 'address'],
  profile: ['bio', 'location'],
  payment: ['cardNumber', 'accountNumber'],
  personalData: ['ssn', 'taxId', 'driverLicense'],
};

// Fields that need hashing for search
const HASH_FIELDS: Record<string, string[]> = {
  user: ['email'],
};

/**
 * Apply encryption middleware to Prisma client
 * @param prisma The Prisma client instance
 */
export function applyEncryptionMiddleware(prisma: PrismaClient): void {
  // Skip middleware in test environment if encryption is not configured
  if (process.env.NODE_ENV === 'test' && !process.env.ENCRYPTION_KEY) {
    console.log('Test environment without encryption key, skipping middleware');
    return;
  }

  const encryptionService = getEncryptionService();

  if (!encryptionService.isEnabled()) {
    console.log('Encryption is disabled, skipping middleware registration');
    return;
  }

  // Middleware for encrypting data before write operations
  prisma.$use(async (params, next) => {
    const model = params.model?.toLowerCase();

    if (!model || !ENCRYPTED_FIELDS[model]) {
      return next(params);
    }

    const fieldsToEncrypt = ENCRYPTED_FIELDS[model];
    const fieldsToHash = HASH_FIELDS[model] || [];

    // Handle email lookups - convert to emailHash lookups for ALL query types
    if (model === 'user' && params.args?.where?.email) {
      const email = params.args.where.email;
      // For string email values (direct lookups)
      if (typeof email === 'string') {
        delete params.args.where.email;
        params.args.where.emailHash = encryptionService.hash(email);
      }
      // For object email values (e.g., { in: [...], contains: ..., etc })
      else if (typeof email === 'object') {
        // Handle different query operators
        if (email.equals) {
          delete params.args.where.email;
          params.args.where.emailHash = encryptionService.hash(email.equals);
        } else if (email.in && Array.isArray(email.in)) {
          delete params.args.where.email;
          params.args.where.emailHash = {
            in: email.in.map((e: string) => encryptionService.hash(e))
          };
        }
        // Note: operations like contains, startsWith, endsWith won't work with encrypted data
        // These would need different handling or should throw an error
      }
    }

    // Handle create operations
    if (params.action === 'create') {
      if (params.args.data) {
        // IMPORTANT: Add hash fields BEFORE encrypting (need original value)
        fieldsToHash.forEach(field => {
          const value = params.args.data[field];
          if (value && typeof value === 'string') {
            const hashField = field + 'Hash';
            params.args.data[hashField] = encryptionService.hash(value);
          }
        });

        // Then encrypt fields
        params.args.data = encryptionService.encryptFields(params.args.data, fieldsToEncrypt);
      }
    }

    // Handle createMany operations
    if (params.action === 'createMany') {
      if (params.args.data) {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => {
            // IMPORTANT: Add hash fields BEFORE encrypting (need original value)
            fieldsToHash.forEach(field => {
              const value = item[field];
              if (value && typeof value === 'string') {
                const hashField = field + 'Hash';
                item[hashField] = encryptionService.hash(value);
              }
            });

            // Then encrypt fields
            return encryptionService.encryptFields(item, fieldsToEncrypt);
          });
        }
      }
    }

    // Handle update operations
    if (params.action === 'update' || params.action === 'updateMany') {
      if (params.args.data) {
        // Encrypt fields being updated
        const updateData = { ...params.args.data };
        const fieldsToUpdate = fieldsToEncrypt.filter(field => field in updateData);

        if (fieldsToUpdate.length > 0) {
          params.args.data = encryptionService.encryptFields(updateData, fieldsToUpdate);

          // Update hash fields if necessary
          fieldsToHash.forEach(field => {
            if (field in params.args.data) {
              const value = updateData[field];
              if (value && typeof value === 'string') {
                const hashField = field + 'Hash';
                params.args.data[hashField] = encryptionService.hash(value);
              }
            }
          });
        }
      }
    }

    // Handle upsert operations
    if (params.action === 'upsert') {
      if (params.args.create) {
        // IMPORTANT: Add hash fields BEFORE encrypting (need original value)
        fieldsToHash.forEach(field => {
          const value = params.args.create[field];
          if (value && typeof value === 'string') {
            const hashField = field + 'Hash';
            params.args.create[hashField] = encryptionService.hash(value);
          }
        });

        // Then encrypt fields
        params.args.create = encryptionService.encryptFields(params.args.create, fieldsToEncrypt);
      }
      if (params.args.update) {
        const updateData = { ...params.args.update };
        const fieldsToUpdate = fieldsToEncrypt.filter(field => field in updateData);

        if (fieldsToUpdate.length > 0) {
          params.args.update = encryptionService.encryptFields(updateData, fieldsToUpdate);

          // Update hash fields
          fieldsToHash.forEach(field => {
            if (field in params.args.update) {
              const value = updateData[field];
              if (value && typeof value === 'string') {
                const hashField = field + 'Hash';
                params.args.update[hashField] = encryptionService.hash(value);
              }
            }
          });
        }
      }
    }

    // Execute the query
    const result = await next(params);

    // Decrypt data after read operations
    if (result) {
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        if (result) {
          return encryptionService.decryptFields(result, fieldsToEncrypt);
        }
      }

      if (params.action === 'findMany') {
        if (Array.isArray(result)) {
          return result.map((item: any) => encryptionService.decryptFields(item, fieldsToEncrypt));
        }
      }

      if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
        if (result) {
          return encryptionService.decryptFields(result, fieldsToEncrypt);
        }
      }

      if (params.action === 'createMany' || params.action === 'updateMany') {
        // These usually return counts, not data
        return result;
      }
    }

    return result;
  });
}

/**
 * Helper function to search for encrypted email
 * @param prisma Prisma client
 * @param email Email to search for
 * @returns User or null
 */
export async function findUserByEncryptedEmail(
  prisma: PrismaClient,
  email: string
): Promise<any> {
  const encryptionService = getEncryptionService();

  if (!encryptionService.isEnabled()) {
    return prisma.user.findUnique({ where: { email } });
  }

  // Use hash for searching
  const emailHash = encryptionService.hash(email);
  return prisma.user.findFirst({
    where: { emailHash },
  });
}

/**
 * Helper to decrypt raw database results
 * @param data Raw database result
 * @param model Model name
 * @returns Decrypted data
 */
export function decryptRawResult(data: any, model: string): any {
  const encryptionService = getEncryptionService();
  const fields = ENCRYPTED_FIELDS[model.toLowerCase()];

  if (!encryptionService.isEnabled() || !fields) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item: any) => encryptionService.decryptFields(item, fields));
  }

  return encryptionService.decryptFields(data, fields);
}