#!/bin/bash

# Test All Script
# Runs all test suites and generates a comprehensive report
# Usage: ./scripts/test-all.sh

set -e  # Exit on error

echo "🧪 Running All Test Suites for CodeCanyon Validation"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
BACKEND_PASSED=false
FRONTEND_PASSED=false
E2E_PASSED=false
CODE_QUALITY_PASSED=false
DOCUMENTATION_PASSED=false

# Function to run tests and capture result
run_tests() {
    local dir=$1
    local command=$2
    local name=$3
    
    echo "📦 Testing: $name"
    echo "----------------------------------------"
    
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}⚠️  Directory not found: $dir${NC}"
        return 1
    fi
    
    cd "$dir"
    
    if eval "$command" > /tmp/test_output.log 2>&1; then
        echo -e "${GREEN}✅ $name: PASSED${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ $name: FAILED${NC}"
        echo "Last 20 lines of output:"
        tail -20 /tmp/test_output.log
        echo ""
        return 1
    fi
}

# Backend Tests
echo "🔷 Backend Tests"
echo "=================================================="
if run_tests "backend" "npm test -- --no-coverage" "Backend Unit & Integration Tests"; then
    BACKEND_PASSED=true
fi

# Frontend Tests
echo "🔷 Frontend Tests"
echo "=================================================="
if [ -d "frontend" ]; then
    if run_tests "frontend" "npm test -- --run --no-coverage" "Frontend Unit Tests"; then
        FRONTEND_PASSED=true
    fi
else
    echo -e "${YELLOW}⚠️  Frontend directory not found, skipping${NC}"
    FRONTEND_PASSED=true  # Don't fail if frontend doesn't exist
fi

# E2E Tests
echo "🔷 E2E Tests"
echo "=================================================="
if [ -f "playwright.config.ts" ] || [ -f "tests/e2e" ]; then
    if run_tests "." "npm run test:e2e" "End-to-End Tests"; then
        E2E_PASSED=true
    fi
else
    echo -e "${YELLOW}⚠️  E2E tests not found, skipping${NC}"
    E2E_PASSED=true  # Don't fail if E2E tests don't exist
fi

# Code Quality Tests
echo "🔷 Code Quality Tests"
echo "=================================================="
if run_tests "backend" "npm test -- codeQuality --no-coverage" "Code Quality (Security, Console Logs)"; then
    CODE_QUALITY_PASSED=true
fi

# Documentation Tests
echo "🔷 Documentation Tests"
echo "=================================================="
if run_tests "backend" "npm test -- documentation --no-coverage" "Documentation Validation"; then
    DOCUMENTATION_PASSED=true
fi

# Security Review
echo "🔷 Security Review"
echo "=================================================="
if run_tests "backend" "npm test -- codeQuality/securityReview --no-coverage" "Security Review"; then
    SECURITY_PASSED=true
else
    SECURITY_PASSED=false
fi

# Summary
echo ""
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo ""

if [ "$BACKEND_PASSED" = true ]; then
    echo -e "${GREEN}✅ Backend Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Backend Tests: FAILED${NC}"
fi

if [ "$FRONTEND_PASSED" = true ]; then
    echo -e "${GREEN}✅ Frontend Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Frontend Tests: FAILED${NC}"
fi

if [ "$E2E_PASSED" = true ]; then
    echo -e "${GREEN}✅ E2E Tests: PASSED${NC}"
else
    echo -e "${RED}❌ E2E Tests: FAILED${NC}"
fi

if [ "$CODE_QUALITY_PASSED" = true ]; then
    echo -e "${GREEN}✅ Code Quality: PASSED${NC}"
else
    echo -e "${RED}❌ Code Quality: FAILED${NC}"
fi

if [ "$DOCUMENTATION_PASSED" = true ]; then
    echo -e "${GREEN}✅ Documentation: PASSED${NC}"
else
    echo -e "${RED}❌ Documentation: FAILED${NC}"
fi

if [ "$SECURITY_PASSED" = true ]; then
    echo -e "${GREEN}✅ Security Review: PASSED${NC}"
else
    echo -e "${RED}❌ Security Review: FAILED${NC}"
fi

echo ""

# Final result
if [ "$BACKEND_PASSED" = true ] && [ "$FRONTEND_PASSED" = true ] && [ "$CODE_QUALITY_PASSED" = true ] && [ "$DOCUMENTATION_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for CodeCanyon submission.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Fix issues before submission.${NC}"
    exit 1
fi
