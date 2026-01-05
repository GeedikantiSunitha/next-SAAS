# Testing Guide

## Overview

This document provides comprehensive guidelines for writing and maintaining tests in the NextSaaS project. It covers unit tests, integration tests, and E2E (end-to-end) tests.

---

## Test Structure

### Directory Organization

```
backend/src/__tests__/
├── routes/              # Route integration tests
├── services/            # Service unit tests
├── middleware/          # Middleware tests
├── utils/               # Test utilities
│   ├── cookies.ts       # Cookie handling helpers
│   └── testUsers.ts    # User creation helpers
├── templates/           # Test templates
│   └── e2e.test.template.ts
└── integration/         # E2E integration tests

frontend/src/__tests__/
├── components/          # Component tests
├── pages/              # Page tests
├── hooks/              # Hook tests
├── api/                # API service tests
└── utils/              # Test utilities
```

---

## E2E Test Patterns

### Template Usage

Always start with the E2E test template:

```typescript
import { extractCookies, findCookie } from '../utils/cookies';
import { createTestUserWithPassword } from '../utils/testUsers';
import { LoginResponse } from '../../types/api-responses';

// Copy from: backend/src/__tests__/templates/e2e.test.template.ts
```

### ⚠️ Critical: Before Using Template - Complete This Checklist

**ALWAYS complete this checklist before writing tests** (saves ~45 minutes):

- [ ] **Check Prisma Schema**: Verify actual field names exist before using them
  - Run: `npx prisma studio` or check `backend/prisma/schema.prisma`
  - Example: PasswordReset has `used` (boolean), NOT `usedAt` (that's only in MfaBackupCode)
  
- [ ] **Verify Route Imports**: Determine which routes your test needs
  - Admin tests: Need `authRoutes` (for login) + `adminRoutes`
  - Auth tests: Need `authRoutes`
  - Feature tests: Need `authRoutes` (if login) + feature routes
  - ⚠️ **Common mistake**: Forgetting to import `authRoutes` when login is needed

- [ ] **Check Error Message Formats**: Test endpoint manually first
  - Error messages may vary: "Insufficient permissions" vs "role"
  - Use flexible matching: `.toMatch(/role|permission|access/i)`
  - Check both `error` and `message` fields

- [ ] **Verify API Endpoint Paths**: Check `routes/index.ts` for actual paths
  - Don't assume paths - verify they exist
  - Check route mounting order matters

- [ ] **Remove Unused Imports**: After copying template
  - TypeScript will flag unused imports
  - Use ESLint auto-fix if available
  - Only import what you actually use

### Cookie Handling

**Always use cookie utilities** - never access headers directly:

```typescript
// ✅ CORRECT
import { extractCookies, findCookie } from '../utils/cookies';

const cookies = extractCookies(response.headers);
const accessToken = findCookie(response.headers, 'accessToken');

// ❌ WRONG
const cookies = response.headers['set-cookie']?.join('; '); // May fail if string
```

### Test User Creation

**Always use test user helpers** - ensures password is hashed:

```typescript
// ✅ CORRECT
import { createTestUserWithPassword } from '../utils/testUsers';

const user = await createTestUserWithPassword(
  'test@example.com',
  'Password123!'
);

// ❌ WRONG
const user = await createTestUser({
  email: 'test@example.com',
  password: 'Password123!', // Plain password won't work!
});
```

### Response Type Safety

**Use response type definitions** for type safety:

```typescript
// ✅ CORRECT
import { LoginResponse } from '../../types/api-responses';

const response = await request(app)
  .post('/api/auth/login')
  .send({ email, password });

const loginData = response.body as LoginResponse;

if ('requiresMfa' in loginData.data) {
  // MFA required
  expect(loginData.data.requiresMfa).toBe(true);
} else {
  // Direct login
  expect(loginData.data.email).toBe(email);
}

// ❌ WRONG
const email = response.body.data.email; // May not exist if MFA required
```

### Complete E2E Flow Example

```typescript
describe('Feature E2E Tests', () => {
  let testUser: any;
  let userEmail: string;
  let userPassword: string;
  let authToken: string;

  beforeEach(async () => {
    // Clean up
    await prisma.user.deleteMany();

    // Create test user
    userEmail = `test-${Date.now()}@example.com`;
    userPassword = 'Password123!';
    testUser = await createTestUserWithPassword(userEmail, userPassword);

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPassword })
      .expect(200);

    authToken = extractCookies(loginResponse.headers);
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should complete full user flow', async () => {
    // Step 1: Initial action
    const step1Response = await request(app)
      .post('/api/your-endpoint')
      .set('Cookie', authToken)
      .send({ /* data */ })
      .expect(200);

    expect(step1Response.body.success).toBe(true);

    // Step 2: Verify in database
    const dbRecord = await prisma.yourModel.findFirst({
      where: { userId: testUser.id },
    });
    expect(dbRecord).toBeDefined();

    // Step 3: Follow-up action
    const step2Response = await request(app)
      .get(`/api/your-endpoint/${step1Response.body.data.id}`)
      .set('Cookie', authToken)
      .expect(200);

    expect(step2Response.body.success).toBe(true);
  });
});
```

---

## Component Test Patterns

### Mock Setup

**Always mock all hooks** used by the component:

```typescript
// ✅ CORRECT
import { mockUseMutation, mockUseQuery } from '../utils/mockHooks';

vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue(
  mockUseQuery({ methods: [] })
);

vi.mocked(useMfaHooks.useDisableMfa).mockReturnValue(
  mockUseMutation()
);

// ❌ WRONG
vi.mocked(useMfaHooks.useMfaMethods).mockReturnValue({
  data: { methods: [] }
}); // Missing isLoading, error, etc.
```

### Semantic Queries

**Always use semantic queries** - avoid generic text matching:

```typescript
// ✅ CORRECT
const button = screen.getByRole('button', { name: /save/i });
const label = screen.getByLabelText(/email address/i);
const heading = screen.getByRole('heading', { name: /profile/i });

// ❌ WRONG
const button = screen.getByText(/save/i); // May match multiple elements
```

### Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import YourComponent from '../YourComponent';
import * as hooks from '../hooks/useYourHooks';
import { mockUseMutation, mockUseQuery } from '../utils/mockHooks';

vi.mock('../hooks/useYourHooks');

describe('YourComponent', () => {
  beforeEach(() => {
    // Mock all hooks
    vi.mocked(hooks.useYourQuery).mockReturnValue(
      mockUseQuery({ data: 'test' })
    );
    vi.mocked(hooks.useYourMutation).mockReturnValue(
      mockUseMutation()
    );
  });

  it('should render', () => {
    render(<YourComponent />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
```

---

## Integration Test Patterns

### Route Testing

```typescript
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import yourRoutes from '../../routes/yourRoutes';
import errorHandler from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/your-route', yourRoutes);
app.use(errorHandler);

describe('Your Routes', () => {
  it('should handle request', async () => {
    const response = await request(app)
      .post('/api/your-route/endpoint')
      .set('Cookie', 'accessToken=token')
      .send({ data: 'test' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

---

## Test Checklist

### Before Writing Tests

- [ ] Review existing tests for similar functionality
- [ ] Check if test template exists
- [ ] Identify all dependencies to mock
- [ ] Plan test scenarios (happy path, error cases, edge cases)

### E2E Test Checklist

- [ ] Use E2E test template
- [ ] Use cookie utilities for cookie handling
- [ ] Use test user helpers for user creation
- [ ] Use response type definitions
- [ ] Test complete user flow (not just API calls)
- [ ] Verify database state after actions
- [ ] Test error scenarios
- [ ] Test authentication requirements
- [ ] Clean up test data in afterEach

### Component Test Checklist

- [ ] Mock all hooks used by component
- [ ] Use semantic queries (getByRole, getByLabelText)
- [ ] Test all user interactions
- [ ] Test loading states
- [ ] Test error states
- [ ] Test edge cases (empty data, null values)

### Before Committing

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Test coverage maintained or improved
- [ ] Follows patterns in this guide

---

## Common Pitfalls

### 1. Cookie Handling

**Problem**: `set-cookie` header can be string or array

**Solution**: Always use `extractCookies()` utility

### 2. Password Hashing

**Problem**: Plain passwords don't work in tests

**Solution**: Always use `createTestUserWithPassword()`

### 3. Response Structure Variations

**Problem**: Login returns different structures based on MFA

**Solution**: Use type guards and response type definitions

### 4. Missing Route Imports (E2E Tests)

**Problem**: Test fails with 404 - endpoint not found

**Root Cause**: Forgot to import required routes (especially `authRoutes` for login)

**Solution**: 
- Always check which routes your test needs
- Admin tests MUST import `authRoutes` for login
- Verify routes are mounted in correct order

**Example**:
```typescript
// ✅ CORRECT
import authRoutes from '../../routes/auth';
import adminRoutes from '../../routes/admin';

app.use('/api/auth', authRoutes); // Must come first
app.use('/api/admin', adminRoutes);

// ❌ WRONG
import adminRoutes from '../../routes/admin';
// Missing authRoutes - login will fail with 404
```

### 5. Schema Field Mismatches (E2E Tests)

**Problem**: TypeScript error - field doesn't exist on model

**Root Cause**: Assumed field exists without checking schema

**Solution**: 
- Always check Prisma schema before using fields
- Run `npx prisma studio` to see actual fields
- Don't assume fields from similar models

**Example**:
```typescript
// ❌ WRONG - assumed usedAt exists
await prisma.passwordReset.create({
  data: { usedAt: new Date() } // Field doesn't exist!
});

// ✅ CORRECT - checked schema first
// PasswordReset has: id, userId, token, expiresAt, used, createdAt
await prisma.passwordReset.create({
  data: { used: true } // Correct field
});
```

### 6. Error Message Assertion Too Specific (E2E Tests)

**Problem**: Test fails because error message doesn't match exactly

**Root Cause**: Error messages may vary: "Insufficient permissions" vs "role required"

**Solution**: Use flexible matching with regex

**Example**:
```typescript
// ❌ WRONG - too specific
expect(response.body.error).toContain('role');

// ✅ CORRECT - flexible
expect(response.body.error || response.body.message).toMatch(/role|permission|access/i);
```

### 5. Generic Text Queries

**Problem**: Tests fail when multiple elements match

**Solution**: Use semantic queries (getByRole, getByLabelText)

### 6. Unused Imports After Copying Template

**Problem**: TypeScript errors for unused imports

**Root Cause**: Template includes example imports, copied all without removing unused ones

**Solution**: 
- Remove unused imports immediately after copying template
- Use ESLint auto-fix
- Only import what you actually use

---

## Test Utilities Reference

### Cookie Utilities

```typescript
import { extractCookies, findCookie, hasCookie } from '../utils/cookies';

// Extract all cookies as string
const cookies = extractCookies(response.headers);

// Find specific cookie
const token = findCookie(response.headers, 'accessToken');

// Check if cookie exists
if (hasCookie(response.headers, 'accessToken')) {
  // Cookie exists
}
```

### Test User Utilities

```typescript
import { 
  createTestUserWithPassword,
  createTestAdminWithPassword,
  cleanupTestUsers
} from '../utils/testUsers';

// Create user
const user = await createTestUserWithPassword(
  'test@example.com',
  'Password123!'
);

// Create admin
const admin = await createTestAdminWithPassword(
  'admin@example.com',
  'Password123!'
);

// Cleanup
await cleanupTestUsers('test-');
```

### Response Types

```typescript
import { 
  LoginResponse,
  ApiResponse,
  PaginatedResponse
} from '../../types/api-responses';

const response = await request(app).post('/api/auth/login').send(data);
const loginData = response.body as LoginResponse;
```

---

## Running Tests

### Backend Tests

```bash
# All tests
npm test

# Specific test file
npm test -- auth.mfa.e2e.test.ts

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Frontend Tests

```bash
# All tests
npm test

# Specific test file
npm test -- MfaSettings.test.tsx

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## Best Practices

1. **Write tests first (TDD)** - Write tests before implementation
2. **Test behavior, not implementation** - Test what the code does, not how
3. **Use descriptive test names** - "should do X when Y" format
4. **One assertion per test** - Or group related assertions
5. **Clean up after tests** - Always clean up test data
6. **Use test utilities** - Don't repeat code, use helpers
7. **Mock external dependencies** - Don't make real API calls in tests
8. **Test edge cases** - Empty data, null values, error scenarios
9. **Maintain test coverage** - Aim for 80%+ coverage
10. **Review test patterns** - Follow established patterns in codebase

---

## Resources

- [E2E Test Template](../backend/src/__tests__/templates/e2e.test.template.ts)
- [Cookie Utilities](../backend/src/__tests__/utils/cookies.ts)
- [Test User Utilities](../backend/src/__tests__/utils/testUsers.ts)
- [API Response Types](../backend/src/types/api-responses.ts)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
