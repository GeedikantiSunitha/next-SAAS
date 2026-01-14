# Unit Test Commands

Commands to run frontend and backend unit tests with progress display and log saving.

## Quick Commands

### Run Frontend Tests (Basic)
```bash
cd frontend && npm test -- --reporter=verbose 2>&1 | tee ../tests/frontend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

### Run Backend Tests
```bash
cd backend && npm test -- --verbose 2>&1 | tee ../tests/backend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

### Run Both Tests Sequentially
```bash
cd frontend && npm test -- --reporter=verbose 2>&1 | tee ../tests/frontend-unit-test-$(date +%Y%m%d-%H%M%S).log && cd ../backend && npm test -- --verbose 2>&1 | tee ../tests/backend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

### Run Frontend Tests with Coverage
```bash
cd frontend && npm run test:coverage -- --reporter=verbose 2>&1 | tee ../tests/frontend-coverage-$(date +%Y%m%d-%H%M%S).log
```

### Run Backend Tests with Coverage
```bash
cd backend && npm run test:coverage -- --verbose 2>&1 | tee ../tests/backend-coverage-$(date +%Y%m%d-%H%M%S).log
```

---

## Detailed Commands

### Frontend Tests (Vitest)

**Basic with progress:**
```bash
cd frontend && npm test -- --reporter=verbose
```

**With log file:**
```bash
cd frontend && npm test -- --reporter=verbose 2>&1 | tee ../tests/frontend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

**With coverage and log:**
```bash
cd frontend && npm run test:coverage -- --reporter=verbose 2>&1 | tee ../tests/frontend-coverage-$(date +%Y%m%d-%H%M%S).log
```

**Note**: Coverage requires `@vitest/coverage-v8` package. If missing, install with:
```bash
cd frontend && npm install --save-dev '@vitest/coverage-v8@^1.0.0' --legacy-peer-deps
```

**Watch mode (for development):**
```bash
cd frontend && npm run test:watch
```

---

### Backend Tests (Jest)

**Basic with progress:**
```bash
cd backend && npm test -- --verbose
```

**With log file:**
```bash
cd backend && npm test -- --verbose 2>&1 | tee ../tests/backend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

**With coverage and log:**
```bash
cd backend && npm run test:coverage -- --verbose 2>&1 | tee ../tests/backend-coverage-$(date +%Y%m%d-%H%M%S).log
```

**Watch mode (for development):**
```bash
cd backend && npm run test:watch
```

---

## One-Line Commands (From Project Root)

### Frontend Only
```bash
cd frontend && npm test -- --reporter=verbose 2>&1 | tee ../tests/frontend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

### Backend Only
```bash
cd backend && npm test -- --verbose 2>&1 | tee ../tests/backend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

### Both (Sequential)
```bash
echo "=== Running Frontend Tests ===" && cd frontend && npm test -- --reporter=verbose 2>&1 | tee ../tests/frontend-unit-test-$(date +%Y%m%d-%H%M%S).log && echo "=== Running Backend Tests ===" && cd ../backend && npm test -- --verbose 2>&1 | tee ../tests/backend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

---

## Advanced Options

### Frontend - More Verbose Output
```bash
cd frontend && npm test -- --reporter=verbose --reporter=json --outputFile=../tests/frontend-test-results.json 2>&1 | tee ../tests/frontend-unit-test-$(date +%Y%m%d-%H%M%S).log
```

### Frontend - Coverage with HTML Report
```bash
cd frontend && npm run test:coverage -- --reporter=verbose --coverage.reporter=html --coverage.reporter=text 2>&1 | tee ../tests/frontend-coverage-$(date +%Y%m%d-%H%M%S).log
```

### Backend - With Test Name Pattern
```bash
cd backend && npm test -- --verbose --testNamePattern="auth" 2>&1 | tee ../tests/backend-unit-test-auth-$(date +%Y%m%d-%H%M%S).log
```

### Backend - Run Specific Test File
```bash
cd backend && npm test -- --verbose src/__tests__/routes/auth.test.ts 2>&1 | tee ../tests/backend-unit-test-auth-$(date +%Y%m%d-%H%M%S).log
```

---

## Log File Locations

All logs are saved to:
- `tests/frontend-unit-test-YYYYMMDD-HHMMSS.log`
- `tests/backend-unit-test-YYYYMMDD-HHMMSS.log`

The timestamp format ensures unique filenames for each test run.

---

## Recommended Workflow

1. **Run tests individually first:**
   ```bash
   # Frontend
   cd frontend && npm test -- --reporter=verbose
   
   # Backend
   cd backend && npm test -- --verbose
   ```

2. **Then run with logs for documentation:**
   ```bash
   # Frontend
   cd frontend && npm test -- --reporter=verbose 2>&1 | tee ../tests/frontend-unit-test-$(date +%Y%m%d-%H%M%S).log
   
   # Backend
   cd backend && npm test -- --verbose 2>&1 | tee ../tests/backend-unit-test-$(date +%Y%m%d-%H%M%S).log
   ```

3. **For CI/CD or automated runs:**
   ```bash
   # Both with exit codes preserved
   cd frontend && npm test -- --reporter=verbose 2>&1 | tee ../tests/frontend-unit-test-$(date +%Y%m%d-%H%M%S).log && FRONTEND_EXIT=${PIPESTATUS[0]} && cd ../backend && npm test -- --verbose 2>&1 | tee ../tests/backend-unit-test-$(date +%Y%m%d-%H%M%S).log && BACKEND_EXIT=${PIPESTATUS[0]} && exit $((FRONTEND_EXIT + BACKEND_EXIT))
   ```

---

## Troubleshooting

### If tests hang or timeout:
- Check database connection
- Verify environment variables are set
- Check if ports are available

### If log files are empty:
- Check file permissions
- Verify `tests/` directory exists
- Try running without `tee` first to see output

### To see only failures:
```bash
# Frontend
cd frontend && npm test -- --reporter=verbose 2>&1 | grep -E "(FAIL|Error|✖)" | tee ../tests/frontend-failures-$(date +%Y%m%d-%H%M%S).log

# Backend
cd backend && npm test -- --verbose 2>&1 | grep -E "(FAIL|Error|✖)" | tee ../tests/backend-failures-$(date +%Y%m%d-%H%M%S).log
```
