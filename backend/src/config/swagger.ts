/**
 * Swagger/OpenAPI Configuration
 * 
 * API documentation setup
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import config from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NextSaaS API',
      version: '1.0.0',
      description: 'NextSaaS - Production-ready full-stack SaaS application template API documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: config.frontendUrl || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Profile', description: 'User profile management' },
      { name: 'Admin', description: 'Admin panel endpoints' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'RBAC', description: 'Role-based access control' },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI
 */
export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NextSaaS API Documentation',
  }));

  // JSON endpoint for OpenAPI spec
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;


