/**
 * E2E Test Template
 * 
 * This template provides a standard structure for E2E integration tests.
 * Copy this file and modify it for your specific E2E test needs.
 * 
 * Key Features:
 * - Proper cookie handling utilities
 * - Test user creation helpers
 * - Response type definitions
 * - Common test patterns
 * 
 * ⚠️ IMPORTANT: Before Writing Tests - Complete This Checklist:
 * 
 * [ ] Check Prisma schema for actual field names (run: npx prisma studio or check schema.prisma)
 * [ ] Verify all required routes are imported (auth routes for login, feature routes for endpoints)
 * [ ] Check actual error message formats (test endpoint manually first)
 * [ ] Verify API endpoint paths are correct (check routes/index.ts)
 * [ ] Check response structure (test endpoint manually to see actual response)
 * [ ] Remove unused imports after copying template (TypeScript will flag them)
 * [ ] Verify database model fields exist before using them in tests
 * 
 * Common Pitfalls to Avoid:
 * - Don't assume field names (check schema first)
 * - Don't forget to import auth routes if login is needed
 * - Don't be too specific with error message assertions (use regex)
 * - Don't copy all imports - only use what you need
 * - Don't assume route is public just because comment says so (check middleware)
 * - Don't import Prisma types unless explicitly needed (TypeScript infers them)
 * - Don't assume specific status codes (test endpoint manually first)
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../../config/database';
import { createTestUser } from '../../tests/setup';
import errorHandler from '../../middleware/errorHandler';
import requestId from '../../middleware/requestId';

/**
 * ROUTE IMPORTS - CHECKLIST:
 * 
 * Determine which routes your test needs:
 * 
 * For admin tests:
 * [ ] import authRoutes from '../../routes/auth'; (REQUIRED for login)
 * [ ] import adminRoutes from '../../routes/admin'; (for admin endpoints)
 * 
 * For auth tests:
 * [ ] import authRoutes from '../../routes/auth'; (for auth endpoints)
 * 
 * For feature-specific tests:
 * [ ] import authRoutes from '../../routes/auth'; (if login needed)
 * [ ] import featureRoutes from '../../routes/feature'; (for feature endpoints)
 * 
 * ⚠️ IMPORTANT: If your test needs login, you MUST import authRoutes!
 * 
 * ⚠️ LEARNINGS FROM GDPR IMPLEMENTATION:
 * - Check if route has `router.use(authenticate)` middleware - even if comment says "public"
 * - Don't import Prisma types (ConsentType, DeletionType, etc.) unless you need explicit type assertions
 * - TypeScript infers types from service calls automatically
 * - Always verify route middleware, not just comments
 */
// Import your routes here - REMOVE UNUSED IMPORTS AFTER COPYING
// import authRoutes from '../../routes/auth'; // Uncomment if login needed
// import yourRoutes from '../../routes/yourRoutes';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);

/**
 * ROUTE MOUNTING - CHECKLIST:
 * 
 * Mount routes in correct order:
 * 1. Auth routes first (if login needed)
 * 2. Feature routes
 * 3. Error handler last
 * 
 * ⚠️ IMPORTANT: Order matters! Auth routes must come before protected routes.
 */
// app.use('/api/auth', authRoutes); // Uncomment if login needed
// app.use('/api/your-route', yourRoutes);
app.use(errorHandler);

// ============================================================================
// Cookie Handling Utilities
// ============================================================================

/**
 * Extract cookies from response headers
 * Handles both string and array formats
 */
export const extractCookies = (headers: any): string => {
  const setCookieHeader = headers['set-cookie'];
  if (!setCookieHeader) return '';
  
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return cookies.filter(Boolean).join('; ');
};

/**
 * Find a specific cookie by name
 */
export const findCookie = (headers: any, name: string): string | undefined => {
  const setCookieHeader = headers['set-cookie'];
  if (!setCookieHeader) return undefined;
  
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const cookie = cookies.find((c: string) => c && c.startsWith(`${name}=`));
  
  if (!cookie) return undefined;
  
  // Extract cookie value (before first semicolon)
  return cookie.split('=')[1]?.split(';')[0];
};

/**
 * Check if a cookie exists in response headers
 */
export const hasCookie = (headers: any, name: string): boolean => {
  return findCookie(headers, name) !== undefined;
};

// ============================================================================
// Test User Creation Helpers
// ============================================================================

/**
 * Create a test user with a plain password (will be hashed)
 */
export const createTestUserWithPassword = async (
  email: string,
  plainPassword: string,
  overrides?: any
) => {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  
  return createTestUser({
    email,
    password: hashedPassword,
    ...overrides,
  });
};

/**
 * Get authentication token for a test user
 */
export const getAuthToken = async (email: string, password: string): Promise<string> => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (response.status !== 200) {
    throw new Error(`Failed to get auth token: ${response.body.error || 'Unknown error'}`);
  }

  const cookies = extractCookies(response.headers);
  const accessToken = findCookie(response.headers, 'accessToken');
  
  if (!accessToken) {
    throw new Error('Access token not found in response cookies');
  }

  return `accessToken=${accessToken}`;
};

// ============================================================================
// Response Type Definitions
// ============================================================================

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Login response - can be user directly or MFA required
 */
export interface LoginResponse {
  success: boolean;
  data: {
    // When MFA not required
    id: string;
    email: string;
    name: string;
    role: string;
  } | {
    // When MFA required
    requiresMfa: true;
    mfaMethod: 'TOTP' | 'EMAIL';
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
}

// ============================================================================
// Test Suite Template
// ============================================================================

describe('Your Feature E2E Tests', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;
  let authToken: string;

  beforeEach(async () => {
    // Clean up test data
    // await prisma.yourModel.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    userEmail = `test-${Date.now()}@example.com`;
    userPassword = 'Password123!';
    testUser = await createTestUserWithPassword(userEmail, userPassword);

    // Get auth token
    authToken = await getAuthToken(userEmail, userPassword);
  });

  afterEach(async () => {
    // Clean up test data
    // await prisma.yourModel.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Feature: Your Feature Name', () => {
    /**
     * SCHEMA VERIFICATION REMINDER:
     * 
     * Before using any database fields, verify they exist in Prisma schema:
     * - Check: backend/prisma/schema.prisma
     * - Or run: npx prisma studio
     * 
     * Example: If using PasswordReset model, check schema shows:
     *   - id, userId, token, expiresAt, used, createdAt
     *   - (NOT usedAt - that's only in MfaBackupCode model)
     */
    it('should complete full user flow', async () => {
      // Step 1: Initial action
      const step1Response = await request(app)
        .post('/api/your-endpoint')
        .set('Cookie', authToken)
        .send({
          // Your request data
        })
        .expect(200);

      expect(step1Response.body.success).toBe(true);
      expect(step1Response.body.data).toBeDefined();

      // Step 2: Verify in database
      const dbRecord = await prisma.yourModel.findFirst({
        where: { userId: testUser.id },
      });

      expect(dbRecord).toBeDefined();
      // Add more assertions

      // Step 3: Follow-up action
      const step2Response = await request(app)
        .get(`/api/your-endpoint/${step1Response.body.data.id}`)
        .set('Cookie', authToken)
        .expect(200);

      expect(step2Response.body.success).toBe(true);
      // Add more assertions
    });

    it('should handle error scenarios', async () => {
      /**
       * ERROR MESSAGE ASSERTIONS - GUIDANCE:
       * 
       * Don't be too specific - error messages may vary:
       * 
       * ✅ GOOD (flexible):
       * expect(errorResponse.body.error || errorResponse.body.message).toMatch(/error|invalid|failed/i);
       * 
       * ❌ BAD (too specific):
       * expect(errorResponse.body.error).toContain('specific error text');
       * 
       * Always check both 'error' and 'message' fields
       * Use case-insensitive regex for flexibility
       * Test endpoint manually first to see actual error format
       * 
       * ⚠️ LEARNINGS FROM GDPR IMPLEMENTATION:
       * - Error handler may convert NotFoundError to different status codes (400, 404, 500)
       * - Don't assume specific status code - test endpoint manually first
       * - Handle both authentication errors (401) and business logic errors (400/404/500)
       * - Use flexible status code matching when error type is uncertain
       */
      const errorResponse = await request(app)
        .post('/api/your-endpoint')
        .set('Cookie', authToken)
        .send({
          // Invalid data
        })
        .expect(400);

      expect(errorResponse.body.success).toBe(false);
      // Use flexible error matching
      expect(errorResponse.body.error || errorResponse.body.message).toBeDefined();
      // Or use regex for specific patterns:
      // expect(errorResponse.body.error || errorResponse.body.message).toMatch(/invalid|error|failed/i);
    });

    it('should require authentication', async () => {
      /**
       * AUTHENTICATION ERROR ASSERTIONS:
       * 
       * Error messages may vary - use flexible matching:
       * - "No token provided"
       * - "Authentication required"
       * - "Invalid token"
       * - "Unauthorized"
       * 
       * ✅ Use flexible matching:
       */
      const response = await request(app)
        .post('/api/your-endpoint')
        .send({
          // Request data
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      // Flexible error matching
      expect(response.body.error || response.body.message).toMatch(/token|auth|unauthorized|login/i);
    });
  });
});

/**
 * POST-TEMPLATE USAGE CHECKLIST:
 * 
 * After copying and modifying this template:
 * 
 * [ ] Removed all unused imports (TypeScript will flag them)
 * [ ] Verified all route imports are correct and mounted
 * [ ] Checked Prisma schema for actual field names
 * [ ] Tested error message assertions are flexible (not too specific)
 * [ ] Verified database model fields exist before using them
 * [ ] Tested endpoints manually to verify response structure
 * [ ] All tests pass: npm test -- your-test-file.e2e.test.ts
 * 
 * Common Issues to Watch For:
 * - Missing auth routes import (if login needed)
 * - Using non-existent schema fields
 * - Too specific error message assertions
 * - Unused imports causing TypeScript errors
 * - Wrong route paths (check routes/index.ts)
 * - Route middleware mismatch (comment says "public" but has authenticate middleware)
 * - Importing Prisma types unnecessarily (TypeScript infers them)
 * - Assuming specific status codes without testing manually
 * 
 * ⚠️ KEY LEARNINGS FROM GDPR IMPLEMENTATION:
 * 
 * 1. **Route Middleware Verification**:
 *    - Always check if route has `router.use(authenticate)` or similar middleware
 *    - Don't trust comments alone - verify actual implementation
 *    - Test both authenticated and unauthenticated scenarios
 * 
 * 2. **Type Imports**:
 *    - Don't import Prisma types (ConsentType, DeletionType, etc.) unless needed for explicit assertions
 *    - TypeScript infers types from service calls and Prisma queries automatically
 *    - Only import types if you need to use them in type assertions or type guards
 * 
 * 3. **Error Status Codes**:
 *    - Error handler may convert errors to different status codes
 *    - NotFoundError might become 400, 404, or 500 depending on error handler
 *    - Test endpoint manually first to see actual status codes
 *    - Use flexible status code matching: `expect([400, 404, 500]).toContain(response.status)`
 * 
 * 4. **Authentication in Tests**:
 *    - Even if route comment says "public endpoint", check if it's behind auth middleware
 *    - Always test authentication requirement separately
 *    - Handle both auth errors (401) and business logic errors in flexible way
 * 
 * 5. **OAuth Implementation Learnings**:
 *    - Different OAuth providers use different flows:
 *      * Google: Implicit flow (token in URL fragment)
 *      * GitHub: Authorization code flow (code exchange required)
 *      * Microsoft: Implicit flow (token in URL fragment)
 *    - Always verify OAuth state parameter for CSRF protection
 *    - Client secrets must never be exposed to frontend (use backend for code exchange)
 *    - Error assertions should be flexible - check `error`, `message`, and `errors` fields
 *    - Validation errors may return "Validation failed" with details in `errors` array
 */
