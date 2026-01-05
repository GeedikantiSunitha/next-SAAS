/**
 * Audit Log IP Capture E2E Tests (TDD)
 * 
 * End-to-end tests for IP address capture in audit logs.
 * Tests full request flow from HTTP request to database storage.
 * 
 * Prerequisites Checklist:
 * [x] 1. All necessary routes are imported and mounted in the test `app` instance
 * [x] 2. Prisma schema verified for AuditLog model (ipAddress field exists)
 * [x] 3. API response structures match expected types
 * [x] 4. Full user flow understood (register, login, profile update, password change)
 * [x] 5. Cookies involved: accessToken, refreshToken
 * [x] 6. Expected error messages identified for negative test cases
 */

import request from 'supertest';
import { prisma } from '../../config/database';
import { extractCookies } from '../utils/cookies';
import app from '../../app';

describe('Audit Log IP Capture E2E', () => {
  beforeEach(async () => {
    // Clean up test data in correct order (respect foreign key constraints)
    await prisma.auditLog.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data in correct order
    await prisma.auditLog.deleteMany({});
    await prisma.mfaBackupCode.deleteMany({});
    await prisma.mfaMethod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Full User Flow IP Capture', () => {
    it('should capture correct IP throughout user registration and login flow', async () => {
      const testIp = '203.0.113.10';
      const email = `ip-e2e-${Date.now()}@example.com`;

      // Step 1: Register with X-Forwarded-For header
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', testIp)
        .send({
          email,
          password: 'Password123!',
          name: 'E2E Test User',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      expect(user).toBeDefined();

      // Verify registration audit log has correct IP
      const registerAuditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'USER_REGISTERED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(registerAuditLog).toBeDefined();
      expect(registerAuditLog?.ipAddress).toBe(testIp);

      // Step 2: Login with different IP
      // First, ensure no existing sessions for this user (cleanup)
      await prisma.session.deleteMany({
        where: { userId: user!.id },
      });

      const loginIp = '198.51.100.10';
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', loginIp)
        .send({
          email,
          password: 'Password123!',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);

      // Verify login audit log has correct IP
      const loginAuditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'USER_LOGIN',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(loginAuditLog).toBeDefined();
      expect(loginAuditLog?.ipAddress).toBe(loginIp);

      // Step 3: Update profile with another IP
      const profileIp = '172.16.0.10';
      const loginCookies = extractCookies(loginResponse.headers);

      const profileResponse = await request(app)
        .put('/api/profile/me')
        .set('Cookie', loginCookies)
        .set('X-Forwarded-For', profileIp)
        .send({
          name: 'Updated E2E Name',
        });

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);

      // Verify profile update audit log has correct IP
      const profileAuditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'PROFILE_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(profileAuditLog).toBeDefined();
      expect(profileAuditLog?.ipAddress).toBe(profileIp);

      // Step 4: Change password with yet another IP
      const passwordIp = '10.0.0.10';
      const passwordResponse = await request(app)
        .put('/api/profile/password')
        .set('Cookie', loginCookies)
        .set('X-Forwarded-For', passwordIp)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        });

      expect(passwordResponse.status).toBe(200);
      expect(passwordResponse.body.success).toBe(true);

      // Verify password change audit log has correct IP
      const passwordAuditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'PASSWORD_CHANGED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(passwordAuditLog).toBeDefined();
      expect(passwordAuditLog?.ipAddress).toBe(passwordIp);
    });

    it('should handle proxy chain (multiple IPs in X-Forwarded-For)', async () => {
      const email = `ip-e2e-proxy-${Date.now()}@example.com`;
      const clientIp = '203.0.113.20';
      const proxyChain = `${clientIp}, 198.51.100.20, 172.16.0.20`;

      // Register with proxy chain
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', proxyChain)
        .send({
          email,
          password: 'Password123!',
          name: 'Proxy Test User',
        });

      expect(registerResponse.status).toBe(201);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Verify audit log has first IP (client IP), not proxy IPs
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'USER_REGISTERED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe(clientIp); // Should extract first IP
      expect(auditLog?.ipAddress).not.toContain('198.51.100.20'); // Should not contain proxy IPs
    });

    it('should fallback to X-Real-IP when X-Forwarded-For not present', async () => {
      const email = `ip-e2e-realip-${Date.now()}@example.com`;
      const realIp = '198.51.100.30';

      // Register with only X-Real-IP header
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('X-Real-IP', realIp)
        .send({
          email,
          password: 'Password123!',
          name: 'Real IP Test User',
        });

      expect(registerResponse.status).toBe(201);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Verify audit log has X-Real-IP
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'USER_REGISTERED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe(realIp);
    });

    it('should handle IPv6 addresses correctly', async () => {
      const email = `ip-e2e-ipv6-${Date.now()}@example.com`;
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      // Register with IPv6 address
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', ipv6)
        .send({
          email,
          password: 'Password123!',
          name: 'IPv6 Test User',
        });

      expect(registerResponse.status).toBe(201);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Verify audit log has IPv6 address
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'USER_REGISTERED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBe(ipv6);
    });

    it('should not store localhost IPs (127.0.0.1, ::1)', async () => {
      const email = `ip-e2e-localhost-${Date.now()}@example.com`;

      // Register with localhost IP
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          email,
          password: 'Password123!',
          name: 'Localhost Test User',
        });

      expect(registerResponse.status).toBe(201);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Verify audit log does not have localhost IP
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: user!.id,
          action: 'USER_REGISTERED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      // Should be null or a different IP (fallback), not localhost
      // Note: In test environment, if no valid IP is found, it may be null
      if (auditLog?.ipAddress) {
        expect(auditLog.ipAddress).not.toBe('127.0.0.1');
        expect(auditLog.ipAddress).not.toBe('::1');
        expect(auditLog.ipAddress).not.toBe('::ffff:127.0.0.1');
      }
    });
  });

  describe('Multiple Actions IP Tracking', () => {
    it('should track different IPs for different actions', async () => {
      const email = `ip-e2e-multi-${Date.now()}@example.com`;
      const registerIp = '203.0.113.40';
      const loginIp = '198.51.100.40';
      const profileIp = '172.16.0.40';

      // Register
      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', registerIp)
        .send({
          email,
          password: 'Password123!',
          name: 'Multi IP User',
        });

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', loginIp)
        .send({
          email,
          password: 'Password123!',
        });

      const loginCookies = extractCookies(loginResponse.headers);

      // Update profile
      await request(app)
        .put('/api/profile/me')
        .set('Cookie', loginCookies)
        .set('X-Forwarded-For', profileIp)
        .send({
          name: 'Updated Name',
        });

      // Verify all audit logs have correct IPs
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: user!.id,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(3);

      const registerLog = auditLogs.find(log => log.action === 'USER_REGISTERED');
      const loginLog = auditLogs.find(log => log.action === 'USER_LOGIN');
      const profileLog = auditLogs.find(log => log.action === 'PROFILE_UPDATED');

      expect(registerLog?.ipAddress).toBe(registerIp);
      expect(loginLog?.ipAddress).toBe(loginIp);
      expect(profileLog?.ipAddress).toBe(profileIp);
    });
  });
});
