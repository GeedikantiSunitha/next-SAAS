#!/bin/bash

# Frontend Test Progress Tracking Script
# Run this script after each fix to track progress

cd "$(dirname "$0")/.." || exit 1

echo "=== Frontend Test Suite Progress Check ==="
echo "Date: $(date)"
echo ""

# Run tests and save output
npm test > test-run-output.log 2>&1

# Extract summary
echo "=== TEST SUMMARY ==="
tail -30 test-run-output.log | grep -E "Test Files|Tests:|PASS|FAIL|Errors" | tail -5

echo ""
echo "=== FAILING TEST FILES ==="
grep "^ FAIL " test-run-output.log | cut -d' ' -f2 | sort | uniq | head -10

echo ""
echo "=== ERROR COUNT ==="
error_count=$(grep -c "Error:" test-run-output.log 2>/dev/null || echo 0)
echo "Total Errors: $error_count"

echo ""
echo "=== FAILING TESTS COUNT ==="
failed_tests=$(grep -oE "[0-9]+ failed" test-run-output.log | grep -oE "[0-9]+" | head -1 || echo "0")
passed_tests=$(grep -oE "[0-9]+ passed" test-run-output.log | grep -oE "[0-9]+" | head -1 || echo "0")
total_tests=$((failed_tests + passed_tests))
pass_rate=$((passed_tests * 100 / total_tests))

echo "Failed: $failed_tests"
echo "Passed: $passed_tests"
echo "Total: $total_tests"
echo "Pass Rate: ${pass_rate}%"

echo ""
echo "=== KEY ISSUES TO FIX ==="
echo "1. Mock setup issues: $(grep -c "mockReturnValue\|\.mutate is not" test-run-output.log 2>/dev/null || echo 0)"
echo "2. Missing imports: $(grep -c "is not defined\|Cannot find module" test-run-output.log 2>/dev/null || echo 0)"
echo "3. Missing providers: $(grep -c "No QueryClient set\|QueryClientProvider" test-run-output.log 2>/dev/null || echo 0)"
echo "4. MSW warnings: $(grep -c "intercepted a request without a matching" test-run-output.log 2>/dev/null || echo 0)"

echo ""
echo "=== Full output saved to: test-run-output.log ==="
