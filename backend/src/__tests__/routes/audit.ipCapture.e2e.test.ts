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
          acceptedTerms: true,
          acceptedPrivacy: true,
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
          acceptedTerms: true,
          acceptedPrivacy: true,
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
          acceptedTerms: true,
          acceptedPrivacy: true,
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
          acceptedTerms: true,
          acceptedPrivacy: true,
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

    it('should not store localhost IPs (127.0.0.1, ::1) in production', async () => {
      // Note: getClientIp filters localhost IPs only in production mode
      // In test/development mode, localhost IPs are allowed for local testing
      const originalEnv = process.env.NODE_ENV;
      
      try {
        // Set to production to test filtering behavior
        process.env.NODE_ENV = 'production';
        
        const email = `ip-e2e-localhost-${Date.now()}@example.com`;

        // Register with localhost IP
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .set('X-Forwarded-For', '127.0.0.1')
          .send({
            email,
            password: 'Password123!',
            name: 'Localhost Test User',
            acceptedTerms: true,
            acceptedPrivacy: true,
          });

        expect(registerResponse.status).toBe(201);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Verify audit log does not have localhost IP (should be null in production)
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            userId: user!.id,
            action: 'USER_REGISTERED',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeDefined();
        // In production mode, localhost IPs should be filtered out (return null)
        expect(auditLog?.ipAddress).toBeNull();
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should allow localhost IPs in test/development mode', async () => {
      // Verify that localhost IPs are allowed in test mode (for local testing)
      const originalEnv = process.env.NODE_ENV;
      
      try {
        // Ensure test mode
        process.env.NODE_ENV = 'test';
        
        const email = `ip-e2e-localhost-test-${Date.now()}@example.com`;

        const registerResponse = await request(app)
          .post('/api/auth/register')
          .set('X-Forwarded-For', '127.0.0.1')
          .send({
            email,
            password: 'Password123!',
            name: 'Localhost Test User',
            acceptedTerms: true,
            acceptedPrivacy: true,
          });

        expect(registerResponse.status).toBe(201);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        const auditLog = await prisma.auditLog.findFirst({
          where: {
            userId: user!.id,
            action: 'USER_REGISTERED',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeDefined();
        // In test mode, localhost IPs are allowed
        expect(auditLog?.ipAddress).toBe('127.0.0.1');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Multiple Actions IP Tracking', () => {
    it('should track different IPs for different actions', async () => {
      const email = `ip-e2e-multi-${Date.now()}@example.com`;
      const registerIp = '203.0.113.40';
      const loginIp = '198.51.100.40';
      const profileIp = '172.16.0.40';

      // Register (creates USER_REGISTERED audit log)
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', registerIp)
        .send({
          email,
          password: 'Password123!',
          name: 'Multi IP User',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(registerResponse.status).toBe(201);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      expect(user).toBeDefined();

      // Clean up any existing sessions for this user before login
      // (Registration may create a session, and login will try to create another)
      await prisma.session.deleteMany({
        where: { userId: user!.id },
      });

      // Login (creates USER_LOGIN audit log)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', loginIp)
        .send({
          email,
          password: 'Password123!',
        });

      expect(loginResponse.status).toBe(200);

      const loginCookies = extractCookies(loginResponse.headers);

      // Update profile with actual change (creates PROFILE_UPDATED audit log)
      // Note: profileService.updateProfile only creates audit log if there are actual changes
      // Ensure the name is different from the registration name
      const profileUpdateResponse = await request(app)
        .put('/api/profile/me')
        .set('Cookie', loginCookies)
        .set('X-Forwarded-For', profileIp)
        .send({
          name: 'Updated Multi IP Name', // Different from 'Multi IP User'
        });

      expect(profileUpdateResponse.status).toBe(200);

      // Wait a bit for all audit logs to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify all audit logs have correct IPs
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: user!.id,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Should have at least 3 audit logs: USER_REGISTERED, USER_LOGIN, PROFILE_UPDATED
      expect(auditLogs.length).toBeGreaterThanOrEqual(3);

      const registerLog = auditLogs.find(log => log.action === 'USER_REGISTERED');
      const loginLog = auditLogs.find(log => log.action === 'USER_LOGIN');
      const profileLog = auditLogs.find(log => log.action === 'PROFILE_UPDATED');

      expect(registerLog).toBeDefined();
      expect(loginLog).toBeDefined();
      expect(profileLog).toBeDefined();

      expect(registerLog?.ipAddress).toBe(registerIp);
      expect(loginLog?.ipAddress).toBe(loginIp);
      expect(profileLog?.ipAddress).toBe(profileIp);
    });
  });
});
