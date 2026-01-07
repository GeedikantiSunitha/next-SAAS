#!/bin/bash

# Clean Build Script
# Removes all build artifacts, dependencies, and temporary files
# Usage: ./scripts/clean-build.sh

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧹 Cleaning Build Artifacts${NC}"
echo "=================================================="
echo ""

# Remove node_modules
echo -e "${YELLOW}Removing node_modules...${NC}"
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules
echo "✅ node_modules removed"

# Remove build outputs
echo -e "${YELLOW}Removing build outputs...${NC}"
rm -rf backend/dist
rm -rf frontend/dist
rm -rf backend/build
rm -rf frontend/build
echo "✅ Build outputs removed"

# Remove logs
echo -e "${YELLOW}Removing logs...${NC}"
rm -rf backend/logs/*.log
rm -rf frontend/logs/*.log
rm -f *.log
echo "✅ Logs removed"

# Remove test results
echo -e "${YELLOW}Removing test results...${NC}"
rm -rf test-results
rm -rf playwright-report
rm -rf coverage
rm -rf backend/coverage
rm -rf frontend/coverage
rm -rf .nyc_output
echo "✅ Test results removed"

# Remove .env files (keep .env.example)
echo -e "${YELLOW}Removing .env files (keeping .env.example)...${NC}"
find . -name ".env" -not -name ".env.example" -type f -delete 2>/dev/null || true
echo "✅ .env files removed"

# Remove OS files
echo -e "${YELLOW}Removing OS files...${NC}"
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true
echo "✅ OS files removed"

# Remove cache
echo -e "${YELLOW}Removing cache...${NC}"
rm -rf .cache
rm -rf .parcel-cache
rm -rf backend/.cache
rm -rf frontend/.cache
echo "✅ Cache removed"

echo ""
echo -e "${GREEN}✅ Clean build complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npm run install:all"
echo "2. Run: npm run build (if needed)"
echo "3. Run: ./scripts/package-for-codecanyon.sh"
