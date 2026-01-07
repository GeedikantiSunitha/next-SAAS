#!/bin/bash

# Package Script for CodeCanyon
# Creates a clean distribution package ready for submission
# Usage: ./scripts/package-for-codecanyon.sh [version]

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get version from argument or use default
VERSION=${1:-"1.0.0"}
PACKAGE_NAME="nextsaas-v${VERSION}"
DIST_DIR="dist"
PACKAGE_DIR="${DIST_DIR}/${PACKAGE_NAME}"

echo -e "${GREEN}📦 Creating CodeCanyon Package: ${PACKAGE_NAME}${NC}"
echo "=================================================="
echo ""

# Step 1: Clean previous builds
echo -e "${YELLOW}Step 1: Cleaning previous builds...${NC}"
rm -rf "${DIST_DIR}"
rm -rf "${PACKAGE_DIR}"
mkdir -p "${PACKAGE_DIR}"
echo "✅ Cleaned"

# Step 2: Copy backend
echo -e "${YELLOW}Step 2: Copying backend...${NC}"
mkdir -p "${PACKAGE_DIR}/backend"
rsync -av --exclude-from='.codecanyonignore' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='test-results' \
  backend/ "${PACKAGE_DIR}/backend/"
echo "✅ Backend copied"

# Step 3: Copy frontend
echo -e "${YELLOW}Step 3: Copying frontend...${NC}"
mkdir -p "${PACKAGE_DIR}/frontend"
rsync -av --exclude-from='.codecanyonignore' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='test-results' \
  frontend/ "${PACKAGE_DIR}/frontend/"
echo "✅ Frontend copied"

# Step 4: Copy root documentation
echo -e "${YELLOW}Step 4: Copying documentation...${NC}"
cp LICENSE "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  LICENSE not found"
cp README.md "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  README.md not found"
cp INSTALLATION.md "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  INSTALLATION.md not found"
cp CHANGELOG.md "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  CHANGELOG.md not found"
cp USER_GUIDE.md "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  USER_GUIDE.md not found"
cp FAQ.md "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  FAQ.md not found"
cp DEMO_CREDENTIALS.md "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  DEMO_CREDENTIALS.md not found"
cp SCREENSHOTS.md "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  SCREENSHOTS.md not found"
echo "✅ Documentation copied"

# Step 5: Copy screenshots (if exists)
echo -e "${YELLOW}Step 5: Copying screenshots...${NC}"
if [ -d "screenshots" ]; then
  cp -r screenshots "${PACKAGE_DIR}/" 2>/dev/null || echo "⚠️  Screenshots directory not found"
  echo "✅ Screenshots copied"
else
  echo "⚠️  Screenshots directory not found (add screenshots before final package)"
fi

# Step 6: Copy preview image (if exists)
echo -e "${YELLOW}Step 6: Copying preview image...${NC}"
if [ -f "preview-image.png" ]; then
  cp preview-image.png "${PACKAGE_DIR}/" 2>/dev/null
  echo "✅ Preview image copied"
else
  echo "⚠️  preview-image.png not found (create before final package)"
fi

# Step 7: Copy docs directory (selective)
echo -e "${YELLOW}Step 7: Copying docs directory...${NC}"
if [ -d "docs" ]; then
  mkdir -p "${PACKAGE_DIR}/docs"
  # Copy important docs, exclude internal ones
  rsync -av --exclude='PHASE*.md' \
    --exclude='*_COMPLETE.md' \
    --exclude='CODECANYON_*.md' \
    --exclude='MASTER_*.md' \
    --exclude='CRITICAL_*.md' \
    --exclude='ARCHITECTURAL_*.md' \
    --exclude='*_SUMMARY.md' \
    --exclude='*_REPORT.md' \
    docs/ "${PACKAGE_DIR}/docs/"
  echo "✅ Docs copied"
else
  echo "⚠️  Docs directory not found"
fi

# Step 8: Create ZIP file
echo -e "${YELLOW}Step 8: Creating ZIP file...${NC}"
cd "${DIST_DIR}"
zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}/" -q
cd ..
ZIP_SIZE=$(du -h "${DIST_DIR}/${PACKAGE_NAME}.zip" | cut -f1)
echo "✅ ZIP created: ${DIST_DIR}/${PACKAGE_NAME}.zip (${ZIP_SIZE})"

# Step 9: Verify package
echo ""
echo -e "${GREEN}📋 Package Verification${NC}"
echo "=================================================="

# Check required files
echo "Checking required files..."
MISSING_FILES=()

[ ! -f "${PACKAGE_DIR}/LICENSE" ] && MISSING_FILES+=("LICENSE")
[ ! -f "${PACKAGE_DIR}/README.md" ] && MISSING_FILES+=("README.md")
[ ! -f "${PACKAGE_DIR}/INSTALLATION.md" ] && MISSING_FILES+=("INSTALLATION.md")
[ ! -f "${PACKAGE_DIR}/backend/.env.example" ] && MISSING_FILES+=("backend/.env.example")
[ ! -f "${PACKAGE_DIR}/frontend/.env.example" ] && MISSING_FILES+=("frontend/.env.example")

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo -e "${RED}❌ Missing required files:${NC}"
  printf '  - %s\n' "${MISSING_FILES[@]}"
else
  echo -e "${GREEN}✅ All required files present${NC}"
fi

# Check for excluded files
echo ""
echo "Checking for excluded files..."
EXCLUDED_FOUND=()

[ -d "${PACKAGE_DIR}/backend/node_modules" ] && EXCLUDED_FOUND+=("backend/node_modules")
[ -d "${PACKAGE_DIR}/frontend/node_modules" ] && EXCLUDED_FOUND+=("frontend/node_modules")
[ -f "${PACKAGE_DIR}/backend/.env" ] && EXCLUDED_FOUND+=("backend/.env")
[ -f "${PACKAGE_DIR}/frontend/.env" ] && EXCLUDED_FOUND+=("frontend/.env")
[ -d "${PACKAGE_DIR}/.git" ] && EXCLUDED_FOUND+=(".git")

if [ ${#EXCLUDED_FOUND[@]} -gt 0 ]; then
  echo -e "${RED}❌ Excluded files found:${NC}"
  printf '  - %s\n' "${EXCLUDED_FOUND[@]}"
  echo -e "${YELLOW}⚠️  Remove these before submission!${NC}"
else
  echo -e "${GREEN}✅ No excluded files found${NC}"
fi

# Package size check
echo ""
ZIP_SIZE_MB=$(du -m "${DIST_DIR}/${PACKAGE_NAME}.zip" | cut -f1)
if [ "$ZIP_SIZE_MB" -gt 50 ]; then
  echo -e "${YELLOW}⚠️  Package size is ${ZIP_SIZE_MB}MB (recommended < 50MB)${NC}"
else
  echo -e "${GREEN}✅ Package size: ${ZIP_SIZE_MB}MB${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Package Created Successfully!${NC}"
echo "=================================================="
echo "Package: ${DIST_DIR}/${PACKAGE_NAME}.zip"
echo "Size: ${ZIP_SIZE}"
echo ""
echo "Next steps:"
echo "1. Extract and test the package"
echo "2. Verify installation works"
echo "3. Add screenshots if missing"
echo "4. Create preview-image.png if missing"
echo "5. Submit to CodeCanyon!"
echo ""
