/**
 * Swagger/OpenAPI Configuration
 * 
 * Generates API documentation from JSDoc comments
 */

import swaggerJsdoc from 'swagger-jsdoc';
import config from './index';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NextSaaS API',
      version: '1.0.0',
      description: 'Production-ready SaaS template API documentation',
      contact: {
        name: 'API Support',
        email: 'support@nextsaas.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.nextsaas.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'HTTP-only cookie containing JWT access token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            requestId: {
              type: 'string',
              example: 'uuid-request-id',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
              example: 'USER',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Profile',
        description: 'User profile management',
      },
      {
        name: 'Notifications',
        description: 'Notification management',
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints (requires ADMIN or SUPER_ADMIN role)',
      },
      {
        name: 'Payments',
        description: 'Payment processing',
      },
      {
        name: 'GDPR',
        description: 'GDPR compliance features',
      },
      {
        name: 'Newsletter',
        description: 'Newsletter management',
      },
      {
        name: 'Observability',
        description: 'System monitoring and metrics',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './src/app.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
