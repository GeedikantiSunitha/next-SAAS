/**
 * Swagger Integration Tests
 * 
 * Tests for Swagger/OpenAPI documentation endpoints
 */

import request from 'supertest';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../../config/swagger';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';

const app = express();
app.use(express.json());
app.use(requestId);

// Serve OpenAPI spec as JSON (matching main app setup)
app.get('/api-docs/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorHandler);

describe('Swagger Integration Tests', () => {
  describe('GET /api-docs', () => {
    it('should serve Swagger UI HTML', async () => {
      // swagger-ui-express redirects /api-docs to /api-docs/ (with trailing slash)
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      expect(response.text).toContain('swagger-ui');
      expect(response.text).toContain('html');
    });

    it('should serve Swagger UI with correct content type', async () => {
      // swagger-ui-express redirects /api-docs to /api-docs/ (with trailing slash)
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should redirect /api-docs to /api-docs/', async () => {
      // swagger-ui-express automatically redirects
      const response = await request(app)
        .get('/api-docs')
        .expect(301);

      expect(response.headers.location).toContain('/api-docs/');
    });
  });

  describe('GET /api-docs/swagger.json', () => {
    it('should return OpenAPI specification as JSON', async () => {
      const response = await request(app)
        .get('/api-docs/swagger.json')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toBeDefined();
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info).toBeDefined();
      expect(response.body.info.title).toBe('NextSaaS API');
    });

    it('should have valid OpenAPI structure', async () => {
      const response = await request(app)
        .get('/api-docs/swagger.json')
        .expect(200);

      const spec = response.body;
      
      // Check required OpenAPI fields
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBeDefined();
      expect(spec.info.version).toBeDefined();
      expect(spec.servers).toBeDefined();
      expect(Array.isArray(spec.servers)).toBe(true);
    });

    it('should include security schemes', async () => {
      const response = await request(app)
        .get('/api-docs/swagger.json')
        .expect(200);

      const spec = response.body;
      // Components are defined in swagger config definition
      expect(spec.components).toBeDefined();
      expect(spec.components.securitySchemes).toBeDefined();
      expect(spec.components.securitySchemes.cookieAuth).toBeDefined();
    });

    it('should include common schemas', async () => {
      const response = await request(app)
        .get('/api-docs/swagger.json')
        .expect(200);

      const spec = response.body;
      // Components and schemas are defined in swagger config definition
      expect(spec.components).toBeDefined();
      expect(spec.components.schemas).toBeDefined();
      expect(spec.components.schemas.Error).toBeDefined();
      expect(spec.components.schemas.Success).toBeDefined();
      expect(spec.components.schemas.User).toBeDefined();
    });

    it('should include tags', async () => {
      const response = await request(app)
        .get('/api-docs/swagger.json')
        .expect(200);

      const spec = response.body;
      // Tags are defined in swagger config
      expect(spec.tags).toBeDefined();
      expect(Array.isArray(spec.tags)).toBe(true);
      expect(spec.tags.length).toBeGreaterThan(0);
    });
  });
});
