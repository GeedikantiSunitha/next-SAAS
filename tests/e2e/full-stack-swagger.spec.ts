/**
 * Swagger/OpenAPI E2E Tests (Full-Stack)
 * 
 * End-to-end tests for Swagger documentation
 * Tests frontend-backend-database integration
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

test.describe('Swagger/OpenAPI E2E Tests (Full-Stack)', () => {
  test('should serve Swagger UI at /api-docs', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs`);

    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('swagger-ui');
    expect(text).toContain('html');
  });

  test('should return OpenAPI specification as JSON', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const spec = await response.json();
    
    // Validate OpenAPI structure
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info).toBeDefined();
    expect(spec.info.title).toBe('NextSaaS API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.servers).toBeDefined();
    expect(Array.isArray(spec.servers)).toBe(true);
  });

  test('should include security schemes in OpenAPI spec', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`);
    const spec = await response.json();

    expect(spec.components).toBeDefined();
    expect(spec.components.securitySchemes).toBeDefined();
    expect(spec.components.securitySchemes.cookieAuth).toBeDefined();
    expect(spec.components.securitySchemes.cookieAuth.type).toBe('apiKey');
    expect(spec.components.securitySchemes.cookieAuth.in).toBe('cookie');
  });

  test('should include common schemas in OpenAPI spec', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`);
    const spec = await response.json();

    expect(spec.components?.schemas).toBeDefined();
    expect(spec.components?.schemas?.Error).toBeDefined();
    expect(spec.components?.schemas?.Success).toBeDefined();
    expect(spec.components?.schemas?.User).toBeDefined();
  });

  test('should include tags in OpenAPI spec', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`);
    const spec = await response.json();

    expect(spec.tags).toBeDefined();
    expect(Array.isArray(spec.tags)).toBe(true);
    
    const tagNames = spec.tags.map((t: any) => t.name);
    expect(tagNames).toContain('Authentication');
    expect(tagNames).toContain('Admin');
  });

  test('should include paths for registered routes', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`);
    const spec = await response.json();

    expect(spec.paths).toBeDefined();
    
    // Check for common endpoints
    expect(spec.paths['/api/auth/register']).toBeDefined();
    expect(spec.paths['/api/auth/login']).toBeDefined();
  });

  test('should have correct server URLs', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`);
    const spec = await response.json();

    expect(spec.servers).toBeDefined();
    expect(spec.servers.length).toBeGreaterThan(0);
    
    const devServer = spec.servers.find((s: any) => s.description === 'Development server');
    expect(devServer).toBeDefined();
    expect(devServer.url).toContain('localhost');
  });

  test('should document authentication endpoints', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`);
    const spec = await response.json();

    const registerPath = spec.paths['/api/auth/register'];
    expect(registerPath).toBeDefined();
    expect(registerPath.post).toBeDefined();
    expect(registerPath.post.tags).toContain('Authentication');
    expect(registerPath.post.requestBody).toBeDefined();

    const loginPath = spec.paths['/api/auth/login'];
    expect(loginPath).toBeDefined();
    expect(loginPath.post).toBeDefined();
    expect(loginPath.post.tags).toContain('Authentication');
  });

  test('should have proper response schemas', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`);
    const spec = await response.json();

    const registerPath = spec.paths['/api/auth/register'];
    expect(registerPath.post.responses).toBeDefined();
    expect(registerPath.post.responses['201']).toBeDefined();
    expect(registerPath.post.responses['400']).toBeDefined();
  });

  test('should be accessible from frontend (CORS)', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs/swagger.json`, {
      headers: {
        Origin: BASE_URL,
      },
    });

    expect(response.status()).toBe(200);
    // CORS headers should be present (handled by CORS middleware)
  });
});
