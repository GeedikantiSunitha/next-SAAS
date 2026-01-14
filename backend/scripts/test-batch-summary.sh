#!/bin/bash

# Quick test batch summary - run tests in small batches and summarize

cd "$(dirname "$0")/.." || exit 1

echo "Running test batches..."
echo "======================"
echo ""

# Batch 1: Infrastructure tests
echo "Batch 1: Infrastructure tests"
npm test -- src/__tests__/infrastructure/ 2>&1 | grep -E "Test Suites|Tests:" | tail -2
echo ""

# Batch 2: Service tests (non-E2E)
echo "Batch 2: Service tests (non-E2E)"
npm test -- src/__tests__/services/ 2>&1 | grep -E "Test Suites|Tests:" | tail -2
echo ""

# Batch 3: Route tests (non-E2E)
echo "Batch 3: Route tests (non-E2E)"
npm test -- src/__tests__/routes/ --testPathIgnorePatterns="e2e.test" 2>&1 | grep -E "Test Suites|Tests:" | tail -2
echo ""

# Batch 4: E2E tests (these are slower)
echo "Batch 4: E2E tests (may take longer)"
npm test -- src/__tests__/routes/ --testPathPattern="e2e.test" 2>&1 | grep -E "Test Suites|Tests:" | tail -2
echo ""

echo "======================"
echo "Done!"
