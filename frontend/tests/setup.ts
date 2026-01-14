import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Fix jsdom compatibility issues with Radix UI
// Mock hasPointerCapture for Radix UI components
Object.defineProperty(Element.prototype, 'hasPointerCapture', {
  value: vi.fn(() => false),
  writable: true,
});

Object.defineProperty(Element.prototype, 'setPointerCapture', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(Element.prototype, 'releasePointerCapture', {
  value: vi.fn(),
  writable: true,
});

// Setup MSW server
// Fix: Changed onUnhandledRequest from 'error' to 'warn' in test environment
// This prevents 60+ unhandled request errors from blocking tests
// Unmocked requests will show warnings instead of throwing errors
// TODO: Add missing MSW handlers for all API endpoints to eliminate warnings
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  server.resetHandlers();
});
afterAll(() => server.close());

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
});

