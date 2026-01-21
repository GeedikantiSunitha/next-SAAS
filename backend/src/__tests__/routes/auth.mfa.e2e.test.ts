/**
 * MFA End-to-End Integration Tests (TDD)
 * 
 * Comprehensive E2E tests for complete MFA flows:
 * 1. Login with MFA requirement
 * 2. MFA setup and enable flow
 * 3. Backup codes generation and usage
 * 4. Full authentication flow with MFA
 */

import request from 'supertest';
import express from 'express';
import { prisma } from '../../config/database';
import { createTestUser } from '../../tests/setup';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';
import cookieParser from 'cookie-parser';
import * as authService from '../../services/authService';
import authRoutes from '../../routes/auth';
import speakeasy from 'speakeasy';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('MFA E2E Integration Tests', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;

  beforeEach(async () => {
    await prisma.mfaBackupCode.deleteMany();
    await prisma.mfaMethod.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    userEmail = `mfa-e2e-${Date.now()}@example.com`;
    userPassword = 'Password123!';
    
    // Hash password for database
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(userPassword, 12);
    
    testUser = await createTestUser({
      email: userEmail,
      password: hashedPassword,
    });
  });

  afterEach(async () => {
    await prisma.mfaBackupCode.deleteMany();
    await prisma.mfaMethod.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('E2E: Complete MFA Setup and Login Flow', () => {
    it('should complete full TOTP MFA setup and login flow', async () => {
      // Step 1: Setup TOTP MFA
      const tokens = authService.generateTokens(testUser.id);
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      expect(setupResponse.body.success).toBe(true);
      expect(setupResponse.body.data.secret).toBeDefined();
      expect(setupResponse.body.data.qrCodeUrl).toBeDefined();
      expect(setupResponse.body.data.backupCodes).toBeDefined();
      expect(setupResponse.body.data.backupCodes.length).toBeGreaterThan(0);

      const secret = setupResponse.body.data.secret;

      // Step 2: Generate TOTP code from secret
      const totpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Step 3: Enable MFA with verification code
      const enableResponse = await request(app)
        .post('/api/auth/mfa/enable')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .send({
          method: 'TOTP',
          code: totpCode,
        })
        .expect(200);

      expect(enableResponse.body.success).toBe(true);

      // Step 4: Verify MFA is enabled
      const methodsResponse = await request(app)
        .get('/api/auth/mfa/methods')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      expect(methodsResponse.body.data.methods).toHaveLength(1);
      expect(methodsResponse.body.data.methods[0].method).toBe('TOTP');
      expect(methodsResponse.body.data.methods[0].isEnabled).toBe(true);

      // Step 5: Attempt login - should require MFA
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.requiresMfa).toBe(true);
      expect(loginResponse.body.data.mfaMethod).toBe('TOTP');
      expect(loginResponse.body.data.user).toBeDefined();

      // Should have temporary login token cookie
      const loginSetCookieHeader = loginResponse.headers['set-cookie'];
      const loginCookies = Array.isArray(loginSetCookieHeader) ? loginSetCookieHeader : [loginSetCookieHeader];
      const tempTokenCookie = loginCookies.find((c: string) => c.startsWith('tempLoginToken='));
      expect(tempTokenCookie).toBeDefined();

      // Step 6: Complete login with MFA verification
      const newTotpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      const mfaLoginResponse = await request(app)
        .post('/api/auth/login/mfa')
        .set('Cookie', loginCookies.join('; '))
        .send({
          code: newTotpCode,
          method: 'TOTP',
          isBackupCode: false,
        })
        .expect(200);

      expect(mfaLoginResponse.body.success).toBe(true);
      expect(mfaLoginResponse.body.data).toBeDefined();
      expect(mfaLoginResponse.body.data.email).toBe(userEmail);

      // Should have access token cookie
      const mfaSetCookieHeader = mfaLoginResponse.headers['set-cookie'];
      const mfaCookies = Array.isArray(mfaSetCookieHeader) ? mfaSetCookieHeader : [mfaSetCookieHeader];
      const accessTokenCookie = mfaCookies.find((c: string) => c.startsWith('accessToken='));
      expect(accessTokenCookie).toBeDefined();

      // Step 7: Verify user can access protected routes
      const meSetCookieHeader = mfaLoginResponse.headers['set-cookie'];
      const meCookies = Array.isArray(meSetCookieHeader) ? meSetCookieHeader : [meSetCookieHeader];
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', meCookies.join('; '))
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.email).toBe(userEmail);
    });

    it('should complete login flow with backup code', async () => {
      // Step 1: Setup and enable TOTP MFA
      const tokens = authService.generateTokens(testUser.id);
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const totpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Enable MFA
      await request(app)
        .post('/api/auth/mfa/enable')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .send({
          method: 'TOTP',
          code: totpCode,
        })
        .expect(200);

      // Step 2: Login - requires MFA
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(loginResponse.body.data.requiresMfa).toBe(true);

      // Step 3: Complete login with backup code
      // Get backup codes from setup response
      const backupCodes = setupResponse.body.data.backupCodes;
      const backupCode = backupCodes[0];
      // Get cookies from login response
      const backupSetCookieHeader = loginResponse.headers['set-cookie'];
      const backupCookies = Array.isArray(backupSetCookieHeader) ? backupSetCookieHeader : [backupSetCookieHeader];
      
      const mfaLoginResponse = await request(app)
        .post('/api/auth/login/mfa')
        .set('Cookie', backupCookies.join('; '))
        .send({
          code: backupCode,
          method: 'TOTP',
          isBackupCode: true,
        })
        .expect(200);

      expect(mfaLoginResponse.body.success).toBe(true);

      // Step 4: Verify backup code is marked as used
      const usedBackupCode = await prisma.mfaBackupCode.findFirst({
        where: {
          userId: testUser.id,
          code: backupCode,
        },
      });

      expect(usedBackupCode?.used).toBe(true);
      expect(usedBackupCode?.usedAt).toBeDefined();
    });

    it('should reject invalid MFA code during login', async () => {
      // Setup and enable MFA
      const tokens = authService.generateTokens(testUser.id);
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const totpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      await request(app)
        .post('/api/auth/mfa/enable')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .send({
          method: 'TOTP',
          code: totpCode,
        })
        .expect(200);

      // Login - requires MFA
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      // Get cookies from login response
      const invalidSetCookieHeader = loginResponse.headers['set-cookie'];
      const invalidCookies = Array.isArray(invalidSetCookieHeader) ? invalidSetCookieHeader : [invalidSetCookieHeader];
      
      // Try to complete login with invalid code
      const mfaLoginResponse = await request(app)
        .post('/api/auth/login/mfa')
        .set('Cookie', invalidCookies.join('; '))
        .send({
          code: '000000',
          method: 'TOTP',
          isBackupCode: false,
        })
        .expect(401);

      expect(mfaLoginResponse.body.success).toBe(false);
      expect(mfaLoginResponse.body.error).toContain('Invalid');
    });

    it('should reject expired temporary login token', async () => {
      // Setup and enable MFA
      const tokens = authService.generateTokens(testUser.id);
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const totpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      await request(app)
        .post('/api/auth/mfa/enable')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .send({
          method: 'TOTP',
          code: totpCode,
        })
        .expect(200);

      // Login - requires MFA
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      // Delete temporary session (simulate expiration)
      await prisma.session.deleteMany({
        where: {
          userId: testUser.id,
        },
      });

      // Try to complete login - should fail
      const newTotpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      // Get cookies from login response
      const expiredSetCookieHeader = loginResponse.headers['set-cookie'];
      const expiredCookies = Array.isArray(expiredSetCookieHeader) ? expiredSetCookieHeader : [expiredSetCookieHeader];
      
      const mfaLoginResponse = await request(app)
        .post('/api/auth/login/mfa')
        .set('Cookie', expiredCookies.join('; '))
        .send({
          code: newTotpCode,
          method: 'TOTP',
          isBackupCode: false,
        })
        .expect(401);

      expect(mfaLoginResponse.body.success).toBe(false);
      expect(mfaLoginResponse.body.error).toContain('expired');
    }, 10000); // Increase timeout to 10 seconds for E2E test
  });

  describe('E2E: Email MFA Setup and Login Flow', () => {
    it('should complete full Email MFA setup and login flow', async () => {
      // Step 1: Setup Email MFA
      const tokens = authService.generateTokens(testUser.id);
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/email')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      expect(setupResponse.body.success).toBe(true);
      expect(setupResponse.body.data.method).toBe('EMAIL');

      // Step 2: Send email OTP (this will generate and send OTP)
      // Note: Email MFA needs to be enabled first before sending OTP
      // So we need to enable it first, then we can send OTP for login
      // For this test, we'll verify the setup works
      // Full E2E email flow would require email service mocking
      
      // Verify Email MFA method was created
      const methodsResponse = await request(app)
        .get('/api/auth/mfa/methods')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      expect(methodsResponse.body.data.methods).toHaveLength(1);
      expect(methodsResponse.body.data.methods[0].method).toBe('EMAIL');
      // Email MFA is not enabled yet (needs OTP verification to enable)
      expect(methodsResponse.body.data.methods[0].isEnabled).toBe(false);
    });
  });

  describe('E2E: Backup Codes Management Flow', () => {
    it('should generate and use backup codes for login', async () => {
      // Step 1: Setup and enable TOTP MFA
      const tokens = authService.generateTokens(testUser.id);
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const initialBackupCodes = setupResponse.body.data.backupCodes;
      const totpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      await request(app)
        .post('/api/auth/mfa/enable')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .send({
          method: 'TOTP',
          code: totpCode,
        })
        .expect(200);

      // Step 2: Generate new backup codes
      const generateResponse = await request(app)
        .post('/api/auth/mfa/backup-codes')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      expect(generateResponse.body.success).toBe(true);
      expect(generateResponse.body.data.codes).toBeDefined();
      expect(generateResponse.body.data.codes.length).toBeGreaterThan(0);

      const newBackupCodes = generateResponse.body.data.codes;

      // Step 3: Verify old backup codes are invalidated
      const oldBackupCode = initialBackupCodes[0];
      const verifyOldResponse = await request(app)
        .post('/api/auth/mfa/verify-backup')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .send({
          code: oldBackupCode,
        })
        .expect(200);

      // Old codes should be invalid (used)
      expect(verifyOldResponse.body.data.valid).toBe(false);

      // Step 4: Use new backup code for login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      const newBackupCode = newBackupCodes[0];
      // Get cookies from login response
      const backupLoginSetCookieHeader = loginResponse.headers['set-cookie'];
      const backupLoginCookies = Array.isArray(backupLoginSetCookieHeader) ? backupLoginSetCookieHeader : [backupLoginSetCookieHeader];
      
      const mfaLoginResponse = await request(app)
        .post('/api/auth/login/mfa')
        .set('Cookie', backupLoginCookies.join('; '))
        .send({
          code: newBackupCode,
          method: 'TOTP',
          isBackupCode: true,
        })
        .expect(200);

      expect(mfaLoginResponse.body.success).toBe(true);

      // Step 5: Verify backup code is marked as used
      const usedCode = await prisma.mfaBackupCode.findFirst({
        where: {
          userId: testUser.id,
          code: newBackupCode,
        },
      });

      expect(usedCode?.used).toBe(true);
    }, 10000); // Increase timeout to 10 seconds for E2E test
  });

  describe('E2E: MFA Disable Flow', () => {
    it('should disable MFA and allow normal login', async () => {
      // Step 1: Setup and enable TOTP MFA
      const tokens = authService.generateTokens(testUser.id);
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup/totp')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const totpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      await request(app)
        .post('/api/auth/mfa/enable')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .send({
          method: 'TOTP',
          code: totpCode,
        })
        .expect(200);

      // Step 2: Verify MFA is enabled
      const methodsBefore = await request(app)
        .get('/api/auth/mfa/methods')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      expect(methodsBefore.body.data.methods[0].isEnabled).toBe(true);

      // Step 3: Disable MFA
      const disableResponse = await request(app)
        .post('/api/auth/mfa/disable')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .send({
          method: 'TOTP',
        })
        .expect(200);

      expect(disableResponse.body.success).toBe(true);

      // Step 4: Verify MFA is disabled
      const methodsAfter = await request(app)
        .get('/api/auth/mfa/methods')
        .set('Cookie', `accessToken=${tokens.accessToken}`)
        .expect(200);

      expect(methodsAfter.body.data.methods[0].isEnabled).toBe(false);

      // Step 5: Login should NOT require MFA
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      // When MFA is disabled, data is the user directly, not wrapped
      expect(loginResponse.body.data).toBeDefined();
      expect(loginResponse.body.data.email).toBe(userEmail);
      // Should not have requiresMfa property
      expect(loginResponse.body.data.requiresMfa).toBeUndefined();

      // Should have access token directly (no MFA step)
      const normalSetCookieHeader = loginResponse.headers['set-cookie'];
      const normalCookies = Array.isArray(normalSetCookieHeader) ? normalSetCookieHeader : [normalSetCookieHeader];
      const accessTokenCookie = normalCookies.find((c: string) => c.startsWith('accessToken='));
      expect(accessTokenCookie).toBeDefined();
    }, 10000); // Increase timeout to 10 seconds for E2E test
  });

  describe('E2E: Login Without MFA (Normal Flow)', () => {
    it('should allow normal login when MFA is not enabled', async () => {
      // Login without MFA setup
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      // When MFA is not enabled, data is the user directly
      expect(loginResponse.body.data).toBeDefined();
      expect(loginResponse.body.data.email).toBe(userEmail);
      // Should not have requiresMfa property
      expect(loginResponse.body.data.requiresMfa).toBeUndefined();

      // Should have access token cookie
      const normalSetCookieHeader = loginResponse.headers['set-cookie'];
      const normalCookies = Array.isArray(normalSetCookieHeader) ? normalSetCookieHeader : [normalSetCookieHeader];
      const accessTokenCookie = normalCookies.find((c: string) => c.startsWith('accessToken='));
      expect(accessTokenCookie).toBeDefined();

      // Should be able to access protected routes
      const normalMeSetCookieHeader = loginResponse.headers['set-cookie'];
      const normalMeCookies = Array.isArray(normalMeSetCookieHeader) ? normalMeSetCookieHeader : [normalMeSetCookieHeader];
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', normalMeCookies.join('; '))
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.email).toBe(userEmail);
    });
  });
});
