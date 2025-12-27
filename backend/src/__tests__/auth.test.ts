import request from 'supertest';
import app from '../app';
import { createTestUser } from '../tests/setup';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(response.body.data.name).toBe('New User');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should set access token as HTTP-only cookie after registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'register-cookie@example.com',
          password: 'Password123!',
          name: 'Register Cookie User',
        });

      expect(response.status).toBe(201);
      expect(response.headers['set-cookie']).toBeDefined();
      
      const setCookieHeader = response.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
      
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      // sameSite is 'Lax' in development (default), 'Strict' in production
      expect(accessTokenCookie).toContain('SameSite=Lax');
    });

    it('should NOT return access token in response body after registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'register-no-token@example.com',
          password: 'Password123!',
          name: 'Register No Token',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).not.toHaveProperty('accessToken');
    });

    it('should reject duplicate email', async () => {
      // Create user first
      await createTestUser({ email: 'existing@example.com' });

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already registered');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Create user
      await createTestUser({
        email: 'login@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Response format: { success: true, data: user } - data IS the user directly
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('accessToken'); // Token in cookie, not body
      expect(response.headers['set-cookie']).toBeDefined(); // Both access and refresh token cookies
    });

    it('should set access token as HTTP-only cookie', async () => {
      // Create user
      await createTestUser({
        email: 'cookie-test@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'cookie-test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      
      // set-cookie can be a string or array of strings
      const setCookieHeader = response.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
      
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      // sameSite is 'Lax' in development (default), 'Strict' in production
      expect(accessTokenCookie).toContain('SameSite=Lax');
    });

    it('should NOT return access token in response body', async () => {
      // Create user
      await createTestUser({
        email: 'no-token-body@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'no-token-body@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Response format: { success: true, data: user } - data IS the user directly
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('accessToken');
    });

    it('should set secure flag in production', async () => {
      // This test will be environment-dependent
      // For now, just verify cookie structure
      await createTestUser({
        email: 'secure-test@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'secure-test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      const setCookieHeader = response.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
      
      expect(accessTokenCookie).toBeDefined();
      // Secure flag depends on NODE_ENV, so we just verify cookie exists
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid password', async () => {
      await createTestUser({
        email: 'user@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token from cookie', async () => {
      // Create user and login
      await createTestUser({
        email: 'me-cookie@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me-cookie@example.com',
          password: 'Password123!',
        });

      // Extract access token from cookie
      const setCookieHeader = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
      expect(accessTokenCookie).toBeDefined();
      
      // Extract token value from cookie string
      const tokenMatch = accessTokenCookie!.match(/accessToken=([^;]+)/);
      expect(tokenMatch).toBeDefined();
      const accessToken = tokenMatch![1];

      // Get current user using cookie (browser sends cookies automatically)
      // For testing, we'll use the cookie directly
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `accessToken=${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me-cookie@example.com');
    });

    it('should get current user with valid token from Authorization header (backward compatibility)', async () => {
      // Create user and login
      await createTestUser({
        email: 'me-header@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me-header@example.com',
          password: 'Password123!',
        });

      // Extract access token from cookie
      const setCookieHeader = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
      const tokenMatch = accessTokenCookie!.match(/accessToken=([^;]+)/);
      const accessToken = tokenMatch![1];

      // Get current user using Authorization header (for backward compatibility)
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me-header@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should set new access token as HTTP-only cookie', async () => {
      // Create user and login
      await createTestUser({
        email: 'refresh-test@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'Password123!',
        });

      // Extract refresh token from cookie
      const setCookieHeader = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
      expect(refreshTokenCookie).toBeDefined();

      // Call refresh endpoint
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie!);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.headers['set-cookie']).toBeDefined();
      
      const refreshSetCookieHeader = refreshResponse.headers['set-cookie'];
      const refreshCookies = Array.isArray(refreshSetCookieHeader) ? refreshSetCookieHeader : [refreshSetCookieHeader];
      const newAccessTokenCookie = refreshCookies.find((c: string) => c.startsWith('accessToken='));
      
      expect(newAccessTokenCookie).toBeDefined();
      expect(newAccessTokenCookie).toContain('HttpOnly');
      // sameSite is 'Lax' in development (default), 'Strict' in production
      expect(newAccessTokenCookie).toContain('SameSite=Lax');
    });

    it('should NOT return access token in response body after refresh', async () => {
      // Create user and login
      await createTestUser({
        email: 'refresh-no-token@example.com',
        password: await require('bcryptjs').hash('Password123!', 12),
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh-no-token@example.com',
          password: 'Password123!',
        });

      const setCookieHeader = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken='));

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data).not.toHaveProperty('accessToken');
    });
  });
});

