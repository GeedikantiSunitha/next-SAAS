module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: ['<rootDir>/jest.setup.env.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
  // Exclude template files from test runs (they're examples, not actual tests)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.*\\.template\\.ts$' // Exclude template files like e2e.test.template.ts
  ],
  // Force Jest to exit after tests complete (prevents hanging on async operations)
  // This is a safety measure - ideally all async operations should be properly cleaned up
  forceExit: true,
  // Detect open handles to help identify what's keeping Jest alive
  detectOpenHandles: false // Set to true when debugging, false for normal runs (slower)
};

