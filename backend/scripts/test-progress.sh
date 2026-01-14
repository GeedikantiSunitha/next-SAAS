#!/bin/bash

# Simple script to run tests in small batches and show progress

cd "$(dirname "$0")/.." || exit 1

RESULTS_FILE="test-results-progress.txt"
BATCH_SIZE=3

echo "Test Progress Report" > "$RESULTS_FILE"
echo "Generated: $(date)" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Get test files (first 20 for quick check)
TEST_FILES=$(npm test -- --listTests 2>&1 | grep "\.test\.ts$" | head -20)

TOTAL=$(echo "$TEST_FILES" | wc -l | tr -d ' ')
echo "Testing first $TOTAL test files in batches of $BATCH_SIZE..."
echo ""

PASSED=0
FAILED=0
COUNT=0

while IFS= read -r test_file; do
  if [ -z "$test_file" ]; then
    continue
  fi
  
  COUNT=$((COUNT + 1))
  BATCH_NUM=$(( (COUNT - 1) / BATCH_SIZE + 1 ))
  
  if [ $((COUNT % BATCH_SIZE)) -eq 1 ]; then
    echo "--- Batch $BATCH_NUM ---"
    echo "--- Batch $BATCH_NUM ---" >> "$RESULTS_FILE"
  fi
  
  echo "[$COUNT/$TOTAL] $test_file"
  echo "[$COUNT/$TOTAL] $test_file" >> "$RESULTS_FILE"
  
  # Run test with 30s timeout using background process
  (npm test "$test_file" --testTimeout=30000 2>&1 | grep -E "Test Suites|Tests:" | head -2) &
  TEST_PID=$!
  
  # Wait max 35 seconds
  for i in {1..35}; do
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
    echo "  ⏱️  TIMEOUT" | tee -a "$RESULTS_FILE"
    FAILED=$((FAILED + 1))
  else
    # Check result from output
    if [ $EXIT_CODE -eq 0 ]; then
      echo "  ✅ PASSED" | tee -a "$RESULTS_FILE"
      PASSED=$((PASSED + 1))
    else
      echo "  ❌ FAILED" | tee -a "$RESULTS_FILE"
      FAILED=$((FAILED + 1))
    fi
  fi
  
  if [ $((COUNT % BATCH_SIZE)) -eq 0 ] || [ $COUNT -eq $TOTAL ]; then
    echo ""
    echo "" >> "$RESULTS_FILE"
  fi
  
  sleep 1
  
done <<< "$TEST_FILES"

echo "========================================" | tee -a "$RESULTS_FILE"
echo "SUMMARY" | tee -a "$RESULTS_FILE"
echo "  Passed: $PASSED" | tee -a "$RESULTS_FILE"
echo "  Failed/Timeout: $FAILED" | tee -a "$RESULTS_FILE"
echo "  Total: $COUNT" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"
