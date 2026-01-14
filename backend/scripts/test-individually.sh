#!/bin/bash

# Script to run tests individually to identify hanging/failing tests

cd "$(dirname "$0")/.." || exit 1

TEST_FILES=(
  "src/__tests__/infrastructure/jestExit.test.ts"
  "src/__tests__/routes/auth.mfa.e2e.test.ts"
  "src/__tests__/routes/newsletter.e2e.test.ts"
  "src/__tests__/routes/profile.test.ts"
  "src/__tests__/routes/adminFeatureFlags.test.ts"
  "src/__tests__/routes/admin.users.test.ts"
  "src/__tests__/routes/audit.ipCapture.e2e.test.ts"
)

echo "Running tests individually..."
echo "================================"
echo ""

PASSED=0
FAILED=0
TIMEOUT=0

for test_file in "${TEST_FILES[@]}"; do
  echo "Testing: $test_file"
  echo "---"
  
  # Run with 30 second timeout (adjust as needed)
  if npm test "$test_file" 2>&1 | grep -q "Test Suites:.*passed"; then
    echo "✅ PASSED: $test_file"
    ((PASSED++))
  elif npm test "$test_file" 2>&1 | grep -q "Test Suites:.*failed"; then
    echo "❌ FAILED: $test_file"
    ((FAILED++))
  else
    echo "⏱️  TIMEOUT/HANG: $test_file"
    ((TIMEOUT++))
  fi
  
  echo ""
  sleep 1
done

echo "================================"
echo "Summary:"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "  Timeout/Hang: $TIMEOUT"
echo "================================"
