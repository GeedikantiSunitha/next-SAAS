# Coding Standards
## NextSaaS - Code Style and Quality Standards

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document defines coding standards for NextSaaS, including style guidelines, naming conventions, and code organization principles.

---

## General Principles

### 1. Readability First

**Principle**: Code is read far more than it's written

**Practice**:
- Use clear, descriptive names
- Keep functions small and focused
- Add comments for complex logic
- Follow consistent formatting

---

### 2. DRY (Don't Repeat Yourself)

**Principle**: Avoid code duplication

**Practice**:
- Extract repeated code into functions
- Use shared utilities
- Create reusable components

---

### 3. Single Responsibility

**Principle**: Each function/class should do one thing

**Practice**:
- Functions should have one clear purpose
- Classes should represent one concept
- Modules should have one responsibility

---

## TypeScript Standards

### Type Safety

**Requirement**: Strict TypeScript configuration

**Configuration**: `tsconfig.json`
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

### Type Definitions

**Practice**: Define types for all data structures

**Example**:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
```

---

### Avoid `any`

**Rule**: Never use `any` type

**Exception**: Only when absolutely necessary (with comment explaining why)

**Alternative**: Use `unknown` and type guards

---

## Naming Conventions

### Variables and Functions

**Style**: camelCase

**Examples**:
```typescript
const userName = 'John';
const getUserById = (id: string) => { ... };
```

---

### Constants

**Style**: UPPER_SNAKE_CASE

**Examples**:
```typescript
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
```

---

### Classes and Interfaces

**Style**: PascalCase

**Examples**:
```typescript
class UserService { ... }
interface PaymentProvider { ... }
```

---

### Files and Directories

**Style**: kebab-case

**Examples**:
```
auth-service.ts
payment-provider.ts
user-management/
```

---

## Code Organization

### File Structure

**Pattern**: One main export per file

**Example**:
```typescript
// authService.ts
export const login = async (...) => { ... };
export const register = async (...) => { ... };
```

---

### Import Organization

**Order**:
1. External dependencies
2. Internal modules
3. Types
4. Relative imports

**Example**:
```typescript
import express from 'express';
import { Router } from 'express';

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

import { User, Role } from '../types';

import { hashPassword } from './passwordUtils';
```

---

### Function Length

**Rule**: Functions should be < 50 lines

**Exception**: Complex algorithms (with comments)

**Practice**: Extract logic into smaller functions

---

### File Length

**Rule**: Files should be < 300 lines

**Exception**: Configuration files

**Practice**: Split large files into modules

---

## Error Handling

### Error Types

**Use Custom Error Classes**:
```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

class ValidationError extends AppError { ... }
class NotFoundError extends AppError { ... }
```

---

### Error Throwing

**Pattern**: Throw errors, don't return error objects

**Bad**:
```typescript
const result = getUser(id);
if (result.error) {
  return result.error;
}
```

**Good**:
```typescript
const user = await getUser(id);
if (!user) {
  throw new NotFoundError('User not found');
}
```

---

## Async/Await

### Prefer Async/Await

**Rule**: Use async/await over Promises

**Example**:
```typescript
// Good
const user = await getUser(id);
const profile = await getProfile(user.id);

// Avoid
getUser(id).then(user => {
  getProfile(user.id).then(profile => {
    // ...
  });
});
```

---

### Error Handling

**Pattern**: Use try-catch for async operations

**Example**:
```typescript
try {
  const user = await getUser(id);
  return user;
} catch (error) {
  logger.error('Failed to get user', { error, id });
  throw new AppError('Failed to get user', 500);
}
```

---

## Comments

### When to Comment

**Do Comment**:
- Complex algorithms
- Business logic explanations
- API documentation
- TODO items

**Don't Comment**:
- Obvious code
- Self-documenting code
- Implementation details (use code)

---

### Comment Style

**JSDoc for Functions**:
```typescript
/**
 * Register a new user
 * @param email - User email address
 * @param password - User password (will be hashed)
 * @returns Created user object (without password)
 * @throws ConflictError if email already exists
 */
export const register = async (email: string, password: string) => {
  // ...
};
```

---

## Code Formatting

### Prettier Configuration

**File**: `.prettierrc`

**Settings**:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

### ESLint Configuration

**File**: `.eslintrc`

**Rules**: Enforce code quality

**Auto-fix**: Run `npm run lint:fix`

---

## Database Standards

### Query Patterns

**Use Prisma**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

**Avoid Raw SQL**: Use Prisma ORM

**Exception**: Complex queries (with comments)

---

### Transaction Management

**Pattern**: Use transactions for atomic operations

**Example**:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.create({ data: userData });
  await tx.auditLog.create({ data: auditData });
});
```

---

## API Standards

### Response Format

**Standard Format**:
```typescript
{
  success: true,
  data: { ... }
}
```

**Error Format**:
```typescript
{
  success: false,
  error: "Error message",
  requestId: "req_123"
}
```

---

### Status Codes

**Use Appropriate Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Validation Error
- `500`: Server Error

---

## Testing Standards

### Test Naming

**Pattern**: `should [expected behavior] when [condition]`

**Example**:
```typescript
it('should return user when email exists', async () => {
  // test
});
```

---

### Test Structure

**Pattern**: Arrange-Act-Assert

**Example**:
```typescript
it('should hash password', async () => {
  // Arrange
  const password = 'SecurePass123!';
  
  // Act
  const hash = await hashPassword(password);
  
  // Assert
  expect(hash).not.toBe(password);
});
```

---

## Security Standards

### Input Validation

**Rule**: Validate all user inputs

**Pattern**: Validate at route level

**Example**:
```typescript
router.post('/register',
  validate([validators.email, validators.password]),
  asyncHandler(async (req, res) => {
    // Handler
  })
);
```

---

### Password Handling

**Rule**: Never log or return passwords

**Practice**:
- Hash passwords (bcrypt, 12 rounds)
- Exclude password from responses
- Don't log password in any form

---

## Logging Standards

### Structured Logging

**Use Winston**:
```typescript
logger.info('User registered', {
  userId: user.id,
  email: user.email,
  requestId: req.id,
});
```

---

### Log Levels

**Usage**:
- `error`: Errors that need attention
- `warn`: Warnings that should be reviewed
- `info`: Informational messages
- `debug`: Debug information (development only)

---

### PII Masking

**Rule**: Mask PII in logs

**Example**:
```typescript
logger.info('Login attempt', {
  email: maskEmail(email), // user@example.com -> us***@example.com
  ipAddress: req.ip,
});
```

---

## Documentation Standards

### Code Documentation

**JSDoc for Public APIs**:
```typescript
/**
 * Creates a new payment
 * @param params - Payment parameters
 * @returns Payment intent with client secret
 */
export const createPayment = async (params: CreatePaymentParams) => {
  // ...
};
```

---

### README Files

**Required Sections**:
- Project description
- Setup instructions
- Environment variables
- Running locally
- Testing
- Deployment

---

## Code Review Checklist

### Before Submitting

- [ ] Code follows naming conventions
- [ ] Functions are small and focused
- [ ] Error handling implemented
- [ ] Input validation present
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Linter passes
- [ ] No console.log statements
- [ ] No hardcoded secrets
- [ ] PII masked in logs

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
