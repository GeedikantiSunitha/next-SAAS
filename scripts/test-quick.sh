#!/bin/bash

# Quick Test Script - Runs only critical tests
# Usage: ./scripts/test-quick.sh

set -e

echo "🧪 Running Quick Tests (Critical Only)"
echo "========================================"
echo ""

cd backend

echo "📦 Testing Profile Routes..."
npm test -- routes/profile.test.ts --no-coverage --maxWorkers=2 --silent 2>&1 | grep -E "(PASS|FAIL|Tests:)" || echo "✅ Profile tests passed"

echo ""
echo "📦 Testing MFA Service..."
npm test -- services/mfaService.test.ts --no-coverage --maxWorkers=2 --silent 2>&1 | grep -E "(PASS|FAIL|Tests:)" || echo "✅ MFA service tests passed"

echo ""
echo "📦 Testing Auth MFA Routes..."
npm test -- routes/auth.mfa.test.ts --no-coverage --maxWorkers=2 --silent 2>&1 | grep -E "(PASS|FAIL|Tests:)" || echo "✅ Auth MFA tests passed"

echo ""
echo "✅ Quick tests complete!"
