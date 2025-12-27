/**
 * Profile Audit Logging Tests
 * 
 * Verify that profile changes are properly logged in audit system
 */

import request from 'supertest';
import app from '../../app';
import { createTestUser } from '../../tests/setup';
import { prisma } from '../../config/database';

// Helper to get auth token from login
const getAuthCookie = async (email: string, password: string): Promise<string> => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const setCookieHeader = loginResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
  
  if (!accessTokenCookie) {
    throw new Error('Failed to get access token cookie');
  }
  
  return `accessToken=${accessTokenCookie.split('=')[1].split(';')[0]}`;
};

describe('Profile Audit Logging', () => {
  describe('Profile Update Audit Logging', () => {
    it('should create audit log when profile name is updated', async () => {
      // Create user
      const user = await createTestUser({
        email: 'audit-name@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
        name: 'Original Name',
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('audit-name@example.com', 'Password123!');

      // Update profile name
      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          name: 'Updated Name',
        });

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('PROFILE_UPDATED');
      expect(auditLogs[0].resource).toBe('users');
      expect(auditLogs[0].resourceId).toBe(user.id);
      expect(auditLogs[0].details).toHaveProperty('changes');
      expect((auditLogs[0].details as any).changes).toContain('name: "Original Name" → "Updated Name"');
    });

    it('should create audit log when profile email is updated', async () => {
      // Create user
      const user = await createTestUser({
        email: 'audit-email@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('audit-email@example.com', 'Password123!');

      // Update profile email
      const newEmail = 'updated-email@example.com';
      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          email: newEmail,
        });

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('PROFILE_UPDATED');
      expect((auditLogs[0].details as any).changes).toContain(`email: "audit-email@example.com" → "${newEmail}"`);
      expect((auditLogs[0].details as any).previousEmail).toBe('audit-email@example.com');
      expect((auditLogs[0].details as any).newEmail).toBe(newEmail);
    });

    it('should create audit log with IP address and user agent', async () => {
      // Create user
      const user = await createTestUser({
        email: 'audit-ip@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('audit-ip@example.com', 'Password123!');

      // Update profile with custom headers
      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .set('X-Forwarded-For', '192.168.1.100')
        .set('User-Agent', 'Test User Agent')
        .send({
          name: 'Updated Name',
        });

      // Verify audit log has IP and user agent
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].ipAddress).toBeTruthy();
      expect(auditLogs[0].userAgent).toBeTruthy();
    });

    it('should NOT create audit log when profile is unchanged', async () => {
      // Create user
      const user = await createTestUser({
        email: 'audit-nochange@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
        name: 'Same Name',
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('audit-nochange@example.com', 'Password123!');

      // Count audit logs before update
      const beforeCount = await prisma.auditLog.count({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
      });

      // Update profile with same values (no change)
      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          name: 'Same Name',
          email: 'audit-nochange@example.com',
        });

      // Verify no new audit log was created
      const afterCount = await prisma.auditLog.count({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
      });

      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('Password Change Audit Logging', () => {
    it('should create audit log when password is changed', async () => {
      // Create user
      const user = await createTestUser({
        email: 'audit-password@example.com',
        password: await require('bcryptjs').hash('OldPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('audit-password@example.com', 'OldPassword123!');

      // Change password
      await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: user.id,
          action: 'PASSWORD_CHANGED',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('PASSWORD_CHANGED');
      expect(auditLogs[0].resource).toBe('users');
      expect(auditLogs[0].resourceId).toBe(user.id);
      expect(auditLogs[0].details).toHaveProperty('changedBy');
      expect((auditLogs[0].details as any).changedBy).toBe(user.id);
      expect(auditLogs[0].details).toHaveProperty('changedAt');
    });

    it('should NOT create audit log when password change fails (wrong current password)', async () => {
      // Create user
      const user = await createTestUser({
        email: 'audit-password-fail@example.com',
        password: await require('bcryptjs').hash('OldPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('audit-password-fail@example.com', 'OldPassword123!');

      // Count audit logs before failed change
      const beforeCount = await prisma.auditLog.count({
        where: {
          userId: user.id,
          action: 'PASSWORD_CHANGED',
        },
      });

      // Try to change password with wrong current password
      await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        });

      // Verify no audit log was created (password change failed)
      const afterCount = await prisma.auditLog.count({
        where: {
          userId: user.id,
          action: 'PASSWORD_CHANGED',
        },
      });

      expect(afterCount).toBe(beforeCount);
    });

    it('should create audit log with IP address and user agent for password change', async () => {
      // Create user
      const user = await createTestUser({
        email: 'audit-password-ip@example.com',
        password: await require('bcryptjs').hash('OldPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('audit-password-ip@example.com', 'OldPassword123!');

      // Change password with custom headers
      await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .set('X-Forwarded-For', '192.168.1.100')
        .set('User-Agent', 'Test User Agent')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      // Verify audit log has IP and user agent
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: user.id,
          action: 'PASSWORD_CHANGED',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].ipAddress).toBeTruthy();
      expect(auditLogs[0].userAgent).toBeTruthy();
    });
  });
});

