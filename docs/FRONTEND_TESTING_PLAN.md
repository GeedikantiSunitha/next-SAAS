# Frontend Template - Testing Implementation Plan

**Date**: December 10, 2025  
**Status**: ⏳ **To Be Implemented** - After Integration Testing

---

## 🎯 Objective

Retrofit comprehensive test coverage for Frontend Template Phase 1 to match backend template's TDD approach.

---

## 📋 Test Coverage Plan

### 1. Unit Tests (70% of test suite)

#### API Client Tests (`src/api/client.test.ts`)

```typescript
describe('API Client', () => {
  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', () => {
      // Test token is added to requests
    });
    
    it('should not add Authorization header when no token', () => {
      // Test no token = no header
    });
  });
  
  describe('Response Interceptor', () => {
    it('should refresh token on 401 error', () => {
      // Test automatic token refresh
    });
    
    it('should retry original request after refresh', () => {
      // Test retry mechanism
    });
    
    it('should logout user on refresh failure', () => {
      // Test logout on refresh error
    });
    
    it('should handle non-401 errors normally', () => {
      // Test other errors pass through
    });
  });
});
```

#### AuthContext Tests (`src/contexts/AuthContext.test.tsx`)

```typescript
describe('AuthContext', () => {
  it('should initialize with null user', () => {
    // Test initial state
  });
  
  it('should load user from token on mount', () => {
    // Test token validation
  });
  
  it('should login user and store token', async () => {
    // Test login flow
  });
  
  it('should register user and store token', async () => {
    // Test register flow
  });
  
  it('should logout user and clear token', async () => {
    // Test logout flow
  });
  
  it('should handle login errors', async () => {
    // Test error handling
  });
});
```

#### Component Tests

**Login Page** (`src/pages/Login.test.tsx`):
- Form validation (email, password)
- Error message display
- Submit button disabled during submission
- Navigation on success

**Register Page** (`src/pages/Register.test.tsx`):
- Form validation (email, password strength, name)
- Error message display
- Submit button disabled during submission
- Navigation on success

**ProtectedRoute** (`src/components/auth/ProtectedRoute.test.tsx`):
- Redirects unauthenticated users
- Shows loading state
- Allows authenticated users through

**UI Components**:
- Button variants and sizes
- Input error states
- Card components rendering

---

### 2. Integration Tests (20% of test suite)

#### API Integration Tests (`src/api/auth.integration.test.ts`)

```typescript
describe('Auth API Integration', () => {
  it('should register user successfully', async () => {
    // Test with real backend (or mocked)
  });
  
  it('should login user successfully', async () => {
    // Test login with real backend
  });
  
  it('should get current user', async () => {
    // Test /me endpoint
  });
  
  it('should handle API errors', async () => {
    // Test error responses
  });
});
```

#### Auth Flow Integration (`src/contexts/AuthFlow.integration.test.tsx`)

```typescript
describe('Authentication Flow', () => {
  it('should complete full login flow', async () => {
    // Login → Token stored → User loaded → Dashboard access
  });
  
  it('should complete full register flow', async () => {
    // Register → Token stored → User loaded → Dashboard access
  });
  
  it('should handle token expiration', async () => {
    // Expired token → Refresh → Continue
  });
});
```

---

### 3. E2E Tests (10% of test suite)

#### Playwright E2E Tests (`tests/e2e/auth.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('user can register and access dashboard', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
  
  test('user can login and access dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
  
  test('user can logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    // ... login steps
    
    // Then logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');
  });
});
```

---

## 🛠️ Test Setup

### Dependencies to Add

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@playwright/test": "^1.40.1",
    "msw": "^2.0.0",  // Mock Service Worker for API mocking
    "vitest": "^1.0.4",
    "jsdom": "^23.0.1"
  }
}
```

### Test Configuration

**Vitest Config** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.*'],
    },
  },
});
```

**Playwright Config** (`playwright.config.ts`):
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📊 Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| **Components** | 80%+ |
| **API Client** | 90%+ |
| **Auth Context** | 90%+ |
| **Utils/Lib** | 80%+ |
| **Overall** | 80%+ |

---

## ✅ Implementation Checklist

### Phase 1: Unit Tests
- [ ] API client tests (interceptors, error handling)
- [ ] AuthContext tests (login, register, logout)
- [ ] Login page tests (form validation, submission)
- [ ] Register page tests (form validation, submission)
- [ ] ProtectedRoute tests (redirects, loading)
- [ ] UI component tests (Button, Input, Card)

### Phase 2: Integration Tests
- [ ] Auth API integration tests
- [ ] Token refresh integration tests
- [ ] Error handling integration tests

### Phase 3: E2E Tests
- [ ] Complete login flow
- [ ] Complete register flow
- [ ] Protected route access
- [ ] Logout flow
- [ ] Error scenarios

### Phase 4: CI/CD Integration
- [ ] Add test scripts to package.json
- [ ] Configure GitHub Actions for tests
- [ ] Add coverage reporting
- [ ] Set up pre-commit hooks

---

## 🚀 Implementation Order

1. **Start with API Client** (most critical)
   - Tests for interceptors
   - Tests for token refresh
   - Tests for error handling

2. **Then AuthContext** (core functionality)
   - Tests for login/register/logout
   - Tests for state management

3. **Then Components** (user-facing)
   - Form validation tests
   - UI interaction tests

4. **Finally E2E** (complete flows)
   - Full user journeys
   - Integration with backend

---

## 📝 Test Patterns

### Component Testing Pattern

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';

describe('Login Page', () => {
  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

### API Mocking Pattern

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: { user: {...}, accessToken: 'token' } }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 🎯 Success Criteria

Tests are complete when:

- ✅ All unit tests pass (80%+ coverage)
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Tests run in CI/CD pipeline
- ✅ Pre-commit hooks enforce test passing
- ✅ Coverage reports generated

---

## 📚 Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [MSW Docs](https://mswjs.io) - API Mocking

---

**Status**: ⏳ Planned - To be implemented after integration testing

