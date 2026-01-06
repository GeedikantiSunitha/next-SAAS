/**
 * Swagger Configuration Tests
 * 
 * Tests for Swagger/OpenAPI documentation setup
 */

import { swaggerSpec } from '../../config/swagger';

// Type assertion for OpenAPI spec
type OpenAPISpec = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  components?: {
    securitySchemes?: {
      cookieAuth?: {
        type: string;
        in: string;
        name: string;
      };
    };
    schemas?: {
      Error?: any;
      Success?: any;
      User?: {
        properties?: {
          id?: any;
          email?: any;
          name?: any;
          role?: {
            enum?: string[];
          };
        };
      };
    };
  };
  tags?: Array<{ name: string; description?: string }>;
};

const spec = swaggerSpec as unknown as OpenAPISpec;

describe('Swagger Configuration', () => {
  describe('swaggerSpec', () => {
    it('should generate valid OpenAPI 3.0 specification', () => {
      expect(spec).toBeDefined();
      expect(spec.openapi).toBe('3.0.0');
    });

    it('should have correct API info', () => {
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('NextSaaS API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.info.description).toContain('SaaS template');
    });

    it('should have servers configured', () => {
      expect(spec.servers).toBeDefined();
      expect(Array.isArray(spec.servers)).toBe(true);
      expect(spec.servers.length).toBeGreaterThan(0);
      
      const devServer = spec.servers.find(s => s.description === 'Development server');
      expect(devServer).toBeDefined();
      expect(devServer?.url).toContain('localhost');
    });

    it('should have security schemes defined', () => {
      expect(spec.components).toBeDefined();
      expect(spec.components?.securitySchemes).toBeDefined();
      expect(spec.components?.securitySchemes?.cookieAuth).toBeDefined();
      
      const cookieAuth = spec.components?.securitySchemes?.cookieAuth;
      expect(cookieAuth?.type).toBe('apiKey');
      expect(cookieAuth?.in).toBe('cookie');
      expect(cookieAuth?.name).toBe('accessToken');
    });

    it('should have common schemas defined', () => {
      expect(spec.components?.schemas).toBeDefined();
      expect(spec.components?.schemas?.Error).toBeDefined();
      expect(spec.components?.schemas?.Success).toBeDefined();
      expect(spec.components?.schemas?.User).toBeDefined();
    });

    it('should have User schema with correct properties', () => {
      const userSchema = spec.components?.schemas?.User;
      expect(userSchema).toBeDefined();
      expect(userSchema?.properties?.id).toBeDefined();
      expect(userSchema?.properties?.email).toBeDefined();
      expect(userSchema?.properties?.name).toBeDefined();
      expect(userSchema?.properties?.role).toBeDefined();
      expect(userSchema?.properties?.role?.enum).toEqual(['USER', 'ADMIN', 'SUPER_ADMIN']);
    });

    it('should have tags defined', () => {
      expect(spec.tags).toBeDefined();
      expect(Array.isArray(spec.tags)).toBe(true);
      
      const tagNames = spec.tags?.map((t: { name: string }) => t.name) || [];
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Admin');
      expect(tagNames).toContain('Profile');
    });
  });
});
