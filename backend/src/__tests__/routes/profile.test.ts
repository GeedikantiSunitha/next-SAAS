/**
 * Profile API Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 */

import request from 'supertest';
import app from '../../app';
import { createTestUser } from '../../tests/setup';

// Helper to get auth token from login
const getAuthCookie = async (email: string, password: string): Promise<string> => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  // Check if login was successful
  if (loginResponse.status !== 200) {
    throw new Error(`Login failed with status ${loginResponse.status}: ${JSON.stringify(loginResponse.body)}`);
  }

  const setCookieHeader = loginResponse.headers['set-cookie'];
  
  // Handle undefined set-cookie header (cookie parsing fix)
  if (!setCookieHeader) {
    throw new Error('Login succeeded but no cookies were set. Check login endpoint implementation.');
  }
  
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const accessTokenCookie = cookies.find((c: string) => c && c.startsWith('accessToken='));
  
  if (!accessTokenCookie) {
    throw new Error('Failed to get access token cookie. Available cookies: ' + cookies.join(', '));
  }
  
  return `accessToken=${accessTokenCookie.split('=')[1].split(';')[0]}`;
};

describe('Profile API', () => {
  // Clean up users created by these tests
  afterEach(async () => {
    const { prisma } = require('../../config/database');
    // Delete users created by this test suite (profile-* emails)
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'profile-',
        },
      },
    });
  });

  describe('GET /api/profile/me', () => {
    it('should return current user profile when authenticated', async () => {
      // Create user with unique email
      const uniqueEmail = `profile-get-${Date.now()}@example.com`;
      await createTestUser({
        email: uniqueEmail,
        password: await require('bcryptjs').hash('Password123!', 12),
        name: 'Profile User',
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie(uniqueEmail, 'Password123!');

      // Get profile
      const response = await request(app)
        .get('/api/profile/me')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(uniqueEmail);
      expect(response.body.data.name).toBe('Profile User');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/profile/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile/me')
        .set('Cookie', 'accessToken=invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/profile/me', () => {
    it('should update user profile with valid data', async () => {
      // Create user
      await createTestUser({
        email: 'profile-update@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
        name: 'Original Name',
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-update@example.com', 'Password123!');

      // Update profile
      const response = await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.email).toBe('updated@example.com');
    });

    it('should update only name if email not provided', async () => {
      // Create user
      await createTestUser({
        email: 'profile-name-only@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
        name: 'Original Name',
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-name-only@example.com', 'Password123!');

      // Update profile - name only
      const response = await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          name: 'Updated Name Only',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name Only');
      expect(response.body.data.email).toBe('profile-name-only@example.com'); // Email unchanged
    });

    it('should update only email if name not provided', async () => {
      // Create user
      await createTestUser({
        email: 'profile-email-only@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
        name: 'Original Name',
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-email-only@example.com', 'Password123!');

      // Update profile - email only
      const response = await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          email: 'newemail@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newemail@example.com');
      expect(response.body.data.name).toBe('Original Name'); // Name unchanged
    });

    it('should validate email format', async () => {
      // Create user
      await createTestUser({
        email: 'profile-email-valid@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-email-valid@example.com', 'Password123!');

      // Try to update with invalid email
      const response = await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          email: 'invalid-email-format',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should prevent duplicate email', async () => {
      // Create two users
      await createTestUser({
        email: 'profile-dup1@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      await createTestUser({
        email: 'profile-dup2@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      // Login as first user
      const cookie = await getAuthCookie('profile-dup1@example.com', 'Password123!');

      // Try to update first user's email to second user's email
      const response = await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          email: 'profile-dup2@example.com',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.toLowerCase()).toContain('email');
    });

    it('should allow updating to same email (no change)', async () => {
      // Create user
      await createTestUser({
        email: 'profile-same-email@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
        name: 'Original Name',
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-same-email@example.com', 'Password123!');

      // Update profile with same email
      const response = await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          email: 'profile-same-email@example.com',
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profile-same-email@example.com');
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should validate name length (max 100 characters)', async () => {
      // Create user
      await createTestUser({
        email: 'profile-name-length@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-name-length@example.com', 'Password123!');

      // Try to update with name too long
      const response = await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie)
        .send({
          name: 'a'.repeat(101), // 101 characters
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/profile/me')
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should not allow users to update other users profiles', async () => {
      // Create two users
      await createTestUser({
        email: 'profile-user1@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      await createTestUser({
        email: 'profile-user2@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      // Login as user1
      const cookie1 = await getAuthCookie('profile-user1@example.com', 'Password123!');

      // Try to update user2's profile (should only update user1's own profile)
      // The endpoint uses req.user.id from the token, so this should only update user1
      const response = await request(app)
        .put('/api/profile/me')
        .set('Cookie', cookie1)
        .send({
          name: 'User1 Name',
        });

      // Should succeed but only update user1's profile
      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('profile-user1@example.com');

      // Verify user2's profile unchanged
      const cookie2 = await getAuthCookie('profile-user2@example.com', 'Password123!');
      const getUser2Response = await request(app)
        .get('/api/profile/me')
        .set('Cookie', cookie2);

      expect(getUser2Response.body.data.email).toBe('profile-user2@example.com');
    });
  });

  describe('PUT /api/profile/password', () => {
    it('should change password with correct current password', async () => {
      // Create user with unique email
      const uniqueEmail = `profile-password-change-${Date.now()}@example.com`;
      await createTestUser({
        email: uniqueEmail,
        password: await require('bcryptjs').hash('OldPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie(uniqueEmail, 'OldPassword123!');

      // Change password
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');

      // Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'NewPassword123!',
        });

      expect(newLoginResponse.status).toBe(200);
      expect(newLoginResponse.body.success).toBe(true);

      // Verify old password doesn't work
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'OldPassword123!',
        });

      expect(oldLoginResponse.status).toBe(401);
    });

    it('should reject password change with incorrect current password', async () => {
      // Create user
      await createTestUser({
        email: 'profile-password-wrong@example.com',
        password: await require('bcryptjs').hash('CorrectPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-password-wrong@example.com', 'CorrectPassword123!');

      // Try to change password with wrong current password
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('password');
    });

    it('should validate new password strength', async () => {
      // Create user
      await createTestUser({
        email: 'profile-password-weak@example.com',
        password: await require('bcryptjs').hash('OldPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-password-weak@example.com', 'OldPassword123!');

      // Try to change password with weak new password
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'weak', // Too weak
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should require currentPassword field', async () => {
      // Create user with unique email
      const uniqueEmail = `profile-password-missing-${Date.now()}@example.com`;
      await createTestUser({
        email: uniqueEmail,
        password: await require('bcryptjs').hash('OldPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie(uniqueEmail, 'OldPassword123!');

      // Try to change password without currentPassword
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .send({
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require newPassword field', async () => {
      // Create user
      await createTestUser({
        email: 'profile-password-missing-new@example.com',
        password: await require('bcryptjs').hash('OldPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-password-missing-new@example.com', 'OldPassword123!');

      // Try to change password without newPassword
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'OldPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/profile/password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should prevent reusing current password as new password', async () => {
      // Create user
      await createTestUser({
        email: 'profile-password-reuse@example.com',
        password: await require('bcryptjs').hash('CurrentPassword123!', 12),
      });

      // Login to get auth cookie
      const cookie = await getAuthCookie('profile-password-reuse@example.com', 'CurrentPassword123!');

      // Try to change password to the same password
      const response = await request(app)
        .put('/api/profile/password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'CurrentPassword123!',
          newPassword: 'CurrentPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.toLowerCase()).toContain('different');
    });
  });
});

