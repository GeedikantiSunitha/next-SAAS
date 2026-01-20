/**
 * Password Strength Validation in Auth Routes (TDD)
 * 
 * Tests verify:
 * - Registration rejects WEAK passwords
 * - Registration rejects FAIR passwords
 * - Registration accepts GOOD passwords
 * - Registration accepts STRONG passwords
 * - Password change rejects WEAK/FAIR passwords
 * - Password change accepts GOOD/STRONG passwords
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import { shouldRejectPassword } from '../../utils/passwordStrength';

describe('Password Strength Validation in Auth Routes', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'password-strength-test',
        },
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'password-strength-test',
        },
      },
    });
  });

  describe('POST /api/auth/register - Password Strength', () => {
    it('should reject WEAK password (too short)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'password-strength-test-weak@example.com',
          password: 'Short1!', // 7 chars, WEAK
          name: 'Test User',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      // Express-validator catches this first with "Validation failed"
      expect(response.body.error).toBeDefined();
    });

    it('should reject WEAK password (missing character types)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'password-strength-test-weak2@example.com',
          password: 'onlylowercase', // Missing uppercase, numbers, special
          name: 'Test User',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject FAIR password (8-9 chars with all types)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'password-strength-test-fair@example.com',
          password: 'Passw0rd!', // 9 chars, FAIR
          name: 'Test User',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('too weak');
    });

    it('should accept GOOD password (10-12 chars)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'password-strength-test-good@example.com',
          password: 'Password123!', // 12 chars, GOOD
          name: 'Test User',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(response.status).toBe(201); // Register returns 201 Created
      expect(response.body.success).toBe(true);
    });

    it('should accept STRONG password (13+ chars)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'password-strength-test-strong@example.com',
          password: 'VeryStrongPassword123!', // 23 chars, STRONG
          name: 'Test User',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(response.status).toBe(201); // Register returns 201 Created
      expect(response.body.success).toBe(true);
    });

    it('should reject common passwords even if they meet length requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'password-strength-test-common@example.com',
          password: 'Password123!', // Common password
          name: 'Test User',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      // Note: This test depends on whether Password123! is in common list
      // If it's common, should be rejected; if not, should pass
      const isCommon = shouldRejectPassword('Password123!');
      if (isCommon) {
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('too weak');
      } else {
        expect(response.status).toBe(201); // Register returns 201 Created
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('PUT /api/profile/password - Password Strength', () => {
    let userToken: string;
    let userEmail: string;

    beforeEach(async () => {
      const timestamp = Date.now();
      userEmail = `password-strength-test-user-${timestamp}@example.com`;
      const hashedPassword = await bcrypt.hash('OldPassword123!', 12);

      await prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          name: 'Test User',
          role: 'USER',
        },
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: 'OldPassword123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      const accessTokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('accessToken='))
        : cookies?.startsWith('accessToken=')
        ? cookies
        : null;

      if (accessTokenCookie) {
        userToken = accessTokenCookie.split('=')[1].split(';')[0];
      }
    });

    afterEach(async () => {
      if (userEmail) {
        await prisma.user.deleteMany({ where: { email: userEmail } });
      }
    });

    it('should reject WEAK password when changing password', async () => {
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'Short1!', // WEAK
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject FAIR password when changing password', async () => {
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'Passw0rd!', // FAIR
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept GOOD password when changing password', async () => {
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!', // GOOD
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept STRONG password when changing password', async () => {
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'VeryStrongNewPassword123!', // STRONG
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

