import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import jwt from 'jsonwebtoken';

describe('Accessibility Routes', () => {
  let authToken: string;

  beforeEach(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User'
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('GET /api/accessibility/preferences', () => {
    it('should return default preferences for new user', async () => {
      const response = await request(app)
        .get('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        highContrast: false,
        reduceMotion: false,
        fontSize: 'medium',
        keyboardShortcuts: true,
        screenReaderMode: false
      });
    });

    it('should return saved preferences for existing user', async () => {
      // First save preferences
      await request(app)
        .put('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          highContrast: true,
          reduceMotion: true,
          fontSize: 'large',
          keyboardShortcuts: false,
          screenReaderMode: false
        });

      // Then retrieve them
      const response = await request(app)
        .get('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        highContrast: true,
        reduceMotion: true,
        fontSize: 'large',
        keyboardShortcuts: false,
        screenReaderMode: false
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/accessibility/preferences');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/accessibility/preferences', () => {
    it('should update accessibility preferences', async () => {
      const preferences = {
        highContrast: true,
        reduceMotion: false,
        fontSize: 'large',
        keyboardShortcuts: true,
        screenReaderMode: false
      };

      const response = await request(app)
        .put('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Preferences updated successfully',
        preferences
      });
    });

    it('should validate fontSize values', async () => {
      const response = await request(app)
        .put('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fontSize: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors[0].msg).toContain('Invalid font size');
    });

    it('should validate boolean fields', async () => {
      const response = await request(app)
        .put('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          highContrast: 'not-a-boolean'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors[0].msg).toContain('must be boolean');
    });

    it('should allow partial updates', async () => {
      // Set initial preferences
      await request(app)
        .put('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
          keyboardShortcuts: true,
          screenReaderMode: false
        });

      // Update only one field
      const response = await request(app)
        .put('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          highContrast: true
        });

      expect(response.status).toBe(200);

      // Verify other fields unchanged
      const getResponse = await request(app)
        .get('/api/accessibility/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body).toEqual({
        highContrast: true,
        reduceMotion: false,
        fontSize: 'medium',
        keyboardShortcuts: true,
        screenReaderMode: false
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/accessibility/preferences')
        .send({ highContrast: true });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/accessibility/statement', () => {
    it('should return accessibility statement data', async () => {
      const response = await request(app)
        .get('/api/accessibility/statement');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conformanceLevel', 'WCAG 2.1 AA');
      expect(response.body).toHaveProperty('lastUpdated');
      expect(response.body).toHaveProperty('contactEmail', 'accessibility@nextsaas.com');
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/api/accessibility/statement');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/accessibility/report-issue', () => {
    it('should accept accessibility issue reports', async () => {
      const issueReport = {
        type: 'SCREEN_READER',
        description: 'Button not announced properly',
        url: '/dashboard',
        userAgent: 'Mozilla/5.0...'
      };

      const response = await request(app)
        .post('/api/accessibility/report-issue')
        .set('Authorization', `Bearer ${authToken}`)
        .send(issueReport);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Issue reported successfully');
      expect(response.body).toHaveProperty('issueId');
    });

    it('should work without authentication', async () => {
      const issueReport = {
        type: 'KEYBOARD_NAVIGATION',
        description: 'Cannot navigate with Tab key',
        url: '/login'
      };

      const response = await request(app)
        .post('/api/accessibility/report-issue')
        .send(issueReport);

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/accessibility/report-issue')
        .send({
          type: 'SCREEN_READER'
          // missing description
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors[0].msg).toContain('Description is required');
    });
  });
});