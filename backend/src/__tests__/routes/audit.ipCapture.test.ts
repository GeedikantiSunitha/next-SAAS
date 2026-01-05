/**
 * Audit Log IP Capture Integration Tests (TDD)
 * 
 * Tests that IP addresses are correctly captured in audit logs
 * across different scenarios (direct connection, proxy, headers).
 */

import request from 'supertest';
import { prisma } from '../../config/database';
import { createTestUserWithPassword } from '../utils/testUsers';
import app from '../../app';

// Helper to get auth cookie from login
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

describe('Audit Log IP Capture', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Profile Update IP Capture', () => {
    it('should capture IP from X-Forwarded-For header', async () => {
      const user = await createTestUserWithPassword(
        'ip-test-1@example.com',
        'Password123!'
      );

      const cookie = await getAuthCookie('ip-test-1@example.com', 'Password123!');

      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .set('X-Forwarded-For', '203.0.113.1')
        .send({ name: 'Updated Name' });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe('203.0.113.1');
    });

    it('should capture IP from X-Real-IP header when X-Forwarded-For not present', async () => {
      const user = await createTestUserWithPassword(
        'ip-test-2@example.com',
        'Password123!'
      );

      const cookie = await getAuthCookie('ip-test-2@example.com', 'Password123!');

      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .set('X-Real-IP', '198.51.100.1')
        .send({ name: 'Updated Name 2' });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe('198.51.100.1');
    });

    it('should prefer X-Forwarded-For over X-Real-IP', async () => {
      const user = await createTestUserWithPassword(
        'ip-test-3@example.com',
        'Password123!'
      );

      const cookie = await getAuthCookie('ip-test-3@example.com', 'Password123!');

      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .set('X-Forwarded-For', '203.0.113.2')
        .set('X-Real-IP', '198.51.100.2')
        .send({ name: 'Updated Name 3' });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe('203.0.113.2'); // Should prefer X-Forwarded-For
    });

    it('should extract first IP from X-Forwarded-For with multiple IPs', async () => {
      const user = await createTestUserWithPassword(
        'ip-test-4@example.com',
        'Password123!'
      );

      const cookie = await getAuthCookie('ip-test-4@example.com', 'Password123!');

      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .set('X-Forwarded-For', '203.0.113.3, 198.51.100.3, 172.16.0.1')
        .send({ name: 'Updated Name 4' });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe('203.0.113.3'); // Should take first IP
    });

    it('should handle IPv6 addresses', async () => {
      const user = await createTestUserWithPassword(
        'ip-test-5@example.com',
        'Password123!'
      );

      const cookie = await getAuthCookie('ip-test-5@example.com', 'Password123!');

      await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .set('X-Forwarded-For', '2001:0db8:85a3:0000:0000:8a2e:0370:7334')
        .send({ name: 'Updated Name 5' });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });
  });

  describe('Password Change IP Capture', () => {
    it('should capture IP from X-Forwarded-For header in password change', async () => {
      const user = await createTestUserWithPassword(
        'ip-test-6@example.com',
        'Password123!'
      );

      const cookie = await getAuthCookie('ip-test-6@example.com', 'Password123!');

      await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .set('X-Forwarded-For', '203.0.113.4')
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'PASSWORD_CHANGED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe('203.0.113.4');
    });
  });

  describe('Login IP Capture', () => {
    it('should capture IP from X-Forwarded-For header in login', async () => {
      const user = await createTestUserWithPassword(
        'ip-test-7@example.com',
        'Password123!'
      );

      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.5')
        .send({
          email: 'ip-test-7@example.com',
          password: 'Password123!',
        });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'USER_LOGIN',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe('203.0.113.5');
    });
  });

  describe('Registration IP Capture', () => {
    it('should capture IP from X-Forwarded-For header in registration', async () => {
      const email = `ip-test-reg-${Date.now()}@example.com`;

      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '203.0.113.6')
        .send({
          email,
          password: 'Password123!',
          name: 'Test User',
        });

      const user = await prisma.user.findUnique({
        where: { email },
      });

      expect(user).toBeDefined();

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'USER_REGISTERED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe('203.0.113.6');
    });
  });
});
