/**
 * Integration Tests: Data Retention Service
 *
 * Tests the actual service implementation with real function calls
 * (Prisma client should be mocked at the module level)
 */

import { describe, it, expect } from '@jest/globals';
import * as dataRetentionService from '../../services/dataRetentionService';

describe('Data Retention Service - Integration Tests', () => {
  describe('Module Exports', () => {
    it('should export enforceRetentionPolicies function', () => {
      expect(dataRetentionService.enforceRetentionPolicies).toBeDefined();
      expect(typeof dataRetentionService.enforceRetentionPolicies).toBe('function');
    });

    it('should export purgeInactiveUsers function', () => {
      expect(dataRetentionService.purgeInactiveUsers).toBeDefined();
      expect(typeof dataRetentionService.purgeInactiveUsers).toBe('function');
    });

    it('should export purgeDeletedUsers function', () => {
      expect(dataRetentionService.purgeDeletedUsers).toBeDefined();
      expect(typeof dataRetentionService.purgeDeletedUsers).toBe('function');
    });

    it('should export purgeExpiredSessions function', () => {
      expect(dataRetentionService.purgeExpiredSessions).toBeDefined();
      expect(typeof dataRetentionService.purgeExpiredSessions).toBe('function');
    });

    it('should export purgeOldNotifications function', () => {
      expect(dataRetentionService.purgeOldNotifications).toBeDefined();
      expect(typeof dataRetentionService.purgeOldNotifications).toBe('function');
    });

    it('should export purgeOldExportRequests function', () => {
      expect(dataRetentionService.purgeOldExportRequests).toBeDefined();
      expect(typeof dataRetentionService.purgeOldExportRequests).toBe('function');
    });

    it('should export archiveOldAuditLogs function', () => {
      expect(dataRetentionService.archiveOldAuditLogs).toBeDefined();
      expect(typeof dataRetentionService.archiveOldAuditLogs).toBe('function');
    });

    it('should export placeOnLegalHold function', () => {
      expect(dataRetentionService.placeOnLegalHold).toBeDefined();
      expect(typeof dataRetentionService.placeOnLegalHold).toBe('function');
    });

    it('should export releaseLegalHold function', () => {
      expect(dataRetentionService.releaseLegalHold).toBeDefined();
      expect(typeof dataRetentionService.releaseLegalHold).toBe('function');
    });
  });

  describe('Function Signatures', () => {
    it('placeOnLegalHold should require a reason parameter', async () => {
      await expect(dataRetentionService.placeOnLegalHold('user123', '')).rejects.toThrow('Legal hold reason is required');
    });

    it('placeOnLegalHold should reject empty reason', async () => {
      await expect(dataRetentionService.placeOnLegalHold('user123', '   ')).rejects.toThrow('Legal hold reason is required');
    });
  });
});
