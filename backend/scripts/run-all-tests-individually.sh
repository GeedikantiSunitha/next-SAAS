#!/bin/bash

# Script to run all tests individually with 30-second timeout
# Identifies which tests are passing, failing, or timing out

cd "$(dirname "$0")/.." || exit 1

# Output file for results
RESULTS_FILE="test-results-individual.txt"
TIMEOUT_SECONDS=30

# Get all test files
echo "Getting list of all test files..."
TEST_FILES=$(npm test -- --listTests 2>&1 | grep -E "\.test\.ts$|\.spec\.ts$" | grep -v "template")

# Count total tests
TOTAL=$(echo "$TEST_FILES" | wc -l | tr -d ' ')
echo "Found $TOTAL test files to run"
echo ""

# Initialize counters
PASSED=0
FAILED=0
TIMEOUT=0
TOTAL_TESTS=0
TOTAL_PASSED_TESTS=0
TOTAL_FAILED_TESTS=0

# Clear results file
echo "Test Execution Results - Individual Tests" > "$RESULTS_FILE"
echo "Generated: $(date)" >> "$RESULTS_FILE"
echo "Timeout per test: ${TIMEOUT_SECONDS}s" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Function to run a single test with timeout
run_test() {
  local test_file=$1
  local start_time=$(date +%s)
  
  echo "[$(date +%H:%M:%S)] Testing: $test_file" | tee -a "$RESULTS_FILE"
  
  # Run test with timeout using gtimeout (macOS) or timeout (Linux)
  if command -v gtimeout &> /dev/null; then
    # macOS with GNU coreutils
    OUTPUT=$(gtimeout ${TIMEOUT_SECONDS} npm test "$test_file" 2>&1)
    EXIT_CODE=$?
  elif command -v timeout &> /dev/null; then
    # Linux
    OUTPUT=$(timeout ${TIMEOUT_SECONDS} npm test "$test_file" 2>&1)
    EXIT_CODE=$?
  else
    # Fallback: run without timeout but capture output
    OUTPUT=$(npm test "$test_file" 2>&1 &)
    TEST_PID=$!
    
    # Wait for timeout
    for i in $(seq 1 ${TIMEOUT_SECONDS}); do
      if ! kill -0 $TEST_PID 2>/dev/null; then
        wait $TEST_PID
        EXIT_CODE=$?
        break
      fi
      sleep 1
    done
    
    # If still running, kill it
    if kill -0 $TEST_PID 2>/dev/null; then
      kill -9 $TEST_PID 2>/dev/null
      EXIT_CODE=124 # Timeout exit code
    fi
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # Extract test results
  local test_suites=$(echo "$OUTPUT" | grep -E "Test Suites:" | tail -1)
  local test_count=$(echo "$OUTPUT" | grep -E "Tests:" | tail -1)
  
  # Check results
  if echo "$OUTPUT" | grep -q "Test Suites:.*passed"; then
    echo "✅ PASSED (${duration}s): $test_file" | tee -a "$RESULTS_FILE"
    echo "   $test_suites" | tee -a "$RESULTS_FILE"
    echo "   $test_count" | tee -a "$RESULTS_FILE"
    ((PASSED++))
    
    # Extract test counts
    if echo "$test_count" | grep -qE "Tests:.*passed"; then
      local passed_tests=$(echo "$test_count" | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+" | head -1)
      TOTAL_PASSED_TESTS=$((TOTAL_PASSED_TESTS + ${passed_tests:-0}))
    fi
  elif [ "$EXIT_CODE" -eq 124 ] || [ "$duration" -ge ${TIMEOUT_SECONDS} ]; then
    echo "⏱️  TIMEOUT (>${TIMEOUT_SECONDS}s): $test_file" | tee -a "$RESULTS_FILE"
    ((TIMEOUT++))
  elif echo "$OUTPUT" | grep -q "Test Suites:.*failed"; then
    echo "❌ FAILED (${duration}s): $test_file" | tee -a "$RESULTS_FILE"
    echo "   $test_suites" | tee -a "$RESULTS_FILE"
    echo "   $test_count" | tee -a "$RESULTS_FILE"
    
    # Extract failure details
    echo "$OUTPUT" | grep -E "FAIL|✕|●" | head -10 >> "$RESULTS_FILE"
    ((FAILED++))
    
    # Extract test counts
    if echo "$test_count" | grep -qE "Tests:.*failed"; then
      local failed_tests=$(echo "$test_count" | grep -oE "[0-9]+ failed" | grep -oE "[0-9]+" | head -1)
      TOTAL_FAILED_TESTS=$((TOTAL_FAILED_TESTS + ${failed_tests:-0}))
    fi
  else
    echo "⚠️  UNKNOWN (${duration}s): $test_file" | tee -a "$RESULTS_FILE"
    echo "   Last output: $(echo "$OUTPUT" | tail -2)" | tee -a "$RESULTS_FILE"
  fi
  
  echo "" | tee -a "$RESULTS_FILE"
  ((TOTAL_TESTS++))
  
  # Small delay between tests
  sleep 1
}

# Process each test file
echo "Starting individual test execution..."
echo ""

while IFS= read -r test_file; do
  if [ -n "$test_file" ]; then
    run_test "$test_file"
  fi
done <<< "$TEST_FILES"

# Summary
echo "" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"
echo "SUMMARY" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"
echo "Total Test Files: $TOTAL_TESTS" | tee -a "$RESULTS_FILE"
echo "✅ Passed: $PASSED" | tee -a "$RESULTS_FILE"
echo "❌ Failed: $FAILED" | tee -a "$RESULTS_FILE"
echo "⏱️  Timeout: $TIMEOUT" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"
echo "Total Individual Tests:" | tee -a "$RESULTS_FILE"
echo "  ✅ Passed: $TOTAL_PASSED_TESTS" | tee -a "$RESULTS_FILE"
echo "  ❌ Failed: $TOTAL_FAILED_TESTS" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"
echo "Results saved to: $RESULTS_FILE" | tee -a "$RESULTS_FILE"
