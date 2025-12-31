# Test Data
## NextSaaS - Test Data Management

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes test data management, including fixtures, seed data, and test database setup.

---

## Test Database

### Setup

**Database**: PostgreSQL (separate from development)

**Connection String**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/nextsaas_test
```

**Migrations**: Run before tests

**Cleanup**: After each test suite

---

## Test Fixtures

### User Fixtures

**Location**: `backend/src/__tests__/fixtures/users.ts`

```typescript
export const testUser = {
  email: 'test@example.com',
  password: 'TestPass123!',
  name: 'Test User',
  role: 'USER' as const,
};

export const testAdmin = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
  name: 'Admin User',
  role: 'ADMIN' as const,
};

export const testSuperAdmin = {
  email: 'superadmin@example.com',
  password: 'SuperAdminPass123!',
  name: 'Super Admin',
  role: 'SUPER_ADMIN' as const,
};
```

---

### Payment Fixtures

**Location**: `backend/src/__tests__/fixtures/payments.ts`

```typescript
export const testPayment = {
  amount: 100.00,
  currency: 'USD' as const,
  description: 'Test payment',
  paymentMethod: 'CARD' as const,
};

export const testPaymentIntent = {
  providerPaymentId: 'pi_test_123',
  clientSecret: 'pi_test_123_secret_xxx',
  status: 'PENDING' as const,
};
```

---

### Notification Fixtures

**Location**: `backend/src/__tests__/fixtures/notifications.ts`

```typescript
export const testNotification = {
  type: 'INFO' as const,
  channel: 'IN_APP' as const,
  title: 'Test Notification',
  message: 'This is a test notification',
};
```

---

## Seed Data

### Development Seeds

**Location**: `backend/prisma/seeds/`

**Purpose**: Populate development database

**Usage**:
```bash
npx prisma db seed
```

**Seed Script**: `backend/prisma/seed.ts`

---

### Test Seeds

**Location**: `backend/src/__tests__/seeds/`

**Purpose**: Populate test database

**Usage**: Called in test setup

---

## Test Data Patterns

### 1. Factory Pattern

**Purpose**: Generate test data dynamically

**Example**:
```typescript
export const createTestUser = (overrides = {}) => ({
  email: `test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Test User',
  ...overrides,
});
```

---

### 2. Builder Pattern

**Purpose**: Build complex test objects

**Example**:
```typescript
export class UserBuilder {
  private user: Partial<User> = {};

  withEmail(email: string) {
    this.user.email = email;
    return this;
  }

  withRole(role: Role) {
    this.user.role = role;
    return this;
  }

  build() {
    return {
      email: this.user.email || 'test@example.com',
      password: 'TestPass123!',
      name: 'Test User',
      role: this.user.role || 'USER',
    };
  }
}
```

---

### 3. Fixture Functions

**Purpose**: Reusable test data creation

**Example**:
```typescript
export const createUserInDb = async (userData = {}) => {
  const user = {
    ...testUser,
    ...userData,
  };
  return await prisma.user.create({
    data: {
      ...user,
      password: await hashPassword(user.password),
    },
  });
};
```

---

## Test Data Cleanup

### After Each Test

**Pattern**: Clean up test data

**Example**:
```typescript
afterEach(async () => {
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'test-',
      },
    },
  });
});
```

---

### After All Tests

**Pattern**: Reset test database

**Example**:
```typescript
afterAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
  await prisma.$disconnect();
});
```

---

## Mock Data

### API Mocks

**Tool**: MSW (Mock Service Worker)

**Location**: `frontend/tests/mocks/`

**Example**:
```typescript
export const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockUser,
      })
    );
  }),
];
```

---

### External Service Mocks

**Examples**:
- Email service (Resend)
- Payment providers (Stripe, Razorpay)
- OAuth providers (Google, GitHub)

**Location**: `backend/src/__tests__/mocks/`

---

## Test Data Best Practices

### 1. Use Unique Data

**Principle**: Avoid conflicts between tests

**Practice**: Use timestamps or UUIDs

```typescript
const email = `test-${Date.now()}@example.com`;
```

---

### 2. Clean Up After Tests

**Principle**: Don't leave test data in database

**Practice**: Delete test data after each test

---

### 3. Use Fixtures

**Principle**: Reusable test data

**Practice**: Create fixture files for common data

---

### 4. Isolate Test Data

**Principle**: Tests should not depend on each other

**Practice**: Each test creates its own data

---

### 5. Use Factories

**Principle**: Generate data dynamically

**Practice**: Use factory functions for flexibility

---

## Test Data Examples

### Creating Test User

```typescript
const user = await createUserInDb({
  email: 'test@example.com',
  role: 'ADMIN',
});
```

### Creating Test Payment

```typescript
const payment = await prisma.payment.create({
  data: {
    userId: user.id,
    amount: 100.00,
    currency: 'USD',
    status: 'PENDING',
  },
});
```

### Creating Test Notification

```typescript
const notification = await prisma.notification.create({
  data: {
    userId: user.id,
    type: 'INFO',
    channel: 'IN_APP',
    title: 'Test',
    message: 'Test message',
  },
});
```

---

## Test Data Management

### Environment Variables

**Test Environment**:
```env
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost:5432/nextsaas_test
```

---

### Database Reset

**Before Tests**:
```typescript
beforeAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
  // Reset other tables
});
```

---

## Test Data Security

### No Real Data

**Principle**: Never use real user data in tests

**Practice**: Use clearly fake test data

---

### No Secrets in Tests

**Principle**: Don't commit secrets in test data

**Practice**: Use environment variables or mocks

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
