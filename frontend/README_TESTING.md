# Frontend Template - Testing Guide

## Test Suite Overview

The frontend template includes comprehensive test coverage:

- ✅ **Unit Tests**: Components, API client, AuthContext
- ✅ **Integration Tests**: Auth flow, API interactions
- ✅ **E2E Tests**: Complete user journeys with Playwright

---

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm test -- --coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e -- --ui

# Run specific test file
npm run test:e2e tests/e2e/auth.spec.ts
```

---

## Test Structure

```
frontend/
├── src/
│   └── __tests__/
│       ├── api/              # API client tests
│       ├── contexts/         # AuthContext tests
│       ├── components/       # Component tests
│       └── pages/            # Page tests
├── tests/
│   ├── setup.ts              # Test setup
│   ├── mocks/                 # MSW handlers
│   └── e2e/                   # E2E tests
```

---

## Test Coverage

Current test coverage includes:

### Unit Tests
- ✅ API client (interceptors, configuration)
- ✅ Auth API service (all methods)
- ✅ AuthContext (login, register, logout, state)
- ✅ Login page (validation, submission, errors)
- ✅ Register page (validation, submission, errors)
- ✅ ProtectedRoute (redirects, loading)
- ✅ UI components (Button, Input)

### Integration Tests
- ✅ Auth flow (login → dashboard)
- ✅ Token refresh mechanism
- ✅ Error handling

### E2E Tests
- ✅ Complete registration flow
- ✅ Complete login flow
- ✅ Protected route access
- ✅ Logout flow
- ✅ Form validation

---

## Writing New Tests

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### API Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myApi } from '../api/myApi';
import apiClient from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('MyAPI', () => {
  it('should call correct endpoint', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: {} });
    await myApi.getData();
    expect(apiClient.get).toHaveBeenCalledWith('/api/data');
  });
});
```

---

## Test Coverage Goals

- **Overall Coverage**: 80%+
- **Components**: 80%+
- **API Client**: 90%+
- **Auth Flow**: 90%+

---

## Notes

- Tests use MSW (Mock Service Worker) for API mocking
- E2E tests require backend to be running
- All tests should pass before committing

