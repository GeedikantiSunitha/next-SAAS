#!/bin/bash

###############################################################################
# Manual Copy Sync Script
#
# Alternative to Git-based sync - copies files directly
# Use when Git conflicts are too complex to resolve
#
# Usage:
#   ./copy-sync.sh [product-path] [--dry-run] [--category category]
#
# Examples:
#   ./copy-sync.sh ~/projects/product-a --dry-run
#   ./copy-sync.sh ~/projects/product-a --category gdpr
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TEMPLATE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
PRODUCT_DIR="${1:-}"
DRY_RUN=false
CATEGORY=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --category)
      shift
      CATEGORY="$1"
      shift
      ;;
  esac
done

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

copy_file() {
  local src=$1
  local dst=$2
  local desc=$3

  if [ ! -f "$src" ]; then
    log_warning "Source file not found: $src"
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "  Would copy: $desc"
    return
  fi

  # Create directory if needed
  mkdir -p "$(dirname "$dst")"

  # Backup existing file
  if [ -f "$dst" ]; then
    cp "$dst" "$dst.backup-$(date +%Y%m%d-%H%M%S)"
    log_info "Backed up: $dst"
  fi

  # Copy file
  cp "$src" "$dst"
  log_success "Copied: $desc"
}

###############################################################################
# Validation
###############################################################################

if [ -z "$PRODUCT_DIR" ]; then
  log_error "Product directory not specified"
  echo "Usage: $0 [product-path] [--dry-run] [--category category]"
  exit 1
fi

if [ ! -d "$PRODUCT_DIR" ]; then
  log_error "Product directory does not exist: $PRODUCT_DIR"
  exit 1
fi

log_info "📦 Manual Copy Sync"
log_info "Template: $TEMPLATE_DIR"
log_info "Product:  $PRODUCT_DIR"
[ "$DRY_RUN" = true ] && log_warning "DRY RUN MODE - No changes will be made"
echo ""

###############################################################################
# Sync Files
###############################################################################

if [ -z "$CATEGORY" ] || [ "$CATEGORY" = "gdpr" ]; then
  log_info "📋 GDPR Services"
  copy_file \
    "$TEMPLATE_DIR/backend/src/services/gdprService.ts" \
    "$PRODUCT_DIR/backend/src/services/gdprService.ts" \
    "GDPR Service"

  copy_file \
    "$TEMPLATE_DIR/backend/src/routes/gdpr.ts" \
    "$PRODUCT_DIR/backend/src/routes/gdpr.ts" \
    "GDPR Routes"

  copy_file \
    "$TEMPLATE_DIR/frontend/src/api/gdpr.ts" \
    "$PRODUCT_DIR/frontend/src/api/gdpr.ts" \
    "GDPR API Client"

  echo ""
fi

if [ -z "$CATEGORY" ] || [ "$CATEGORY" = "audit" ]; then
  log_info "📝 Audit Logging"
  copy_file \
    "$TEMPLATE_DIR/backend/src/services/auditService.ts" \
    "$PRODUCT_DIR/backend/src/services/auditService.ts" \
    "Audit Service"

  copy_file \
    "$TEMPLATE_DIR/backend/src/routes/audit.ts" \
    "$PRODUCT_DIR/backend/src/routes/audit.ts" \
    "Audit Routes"

  echo ""
fi

if [ -z "$CATEGORY" ] || [ "$CATEGORY" = "ui" ]; then
  log_info "🎨 UI Components"
  log_warning "UI components may need styling customization"

  copy_file \
    "$TEMPLATE_DIR/frontend/src/components/ConsentManagement.tsx" \
    "$PRODUCT_DIR/frontend/src/components/ConsentManagement.tsx" \
    "Consent Management Component"

  copy_file \
    "$TEMPLATE_DIR/frontend/src/components/DataDeletionRequest.tsx" \
    "$PRODUCT_DIR/frontend/src/components/DataDeletionRequest.tsx" \
    "Data Deletion Component"

  copy_file \
    "$TEMPLATE_DIR/frontend/src/components/gdpr/DataExport.tsx" \
    "$PRODUCT_DIR/frontend/src/components/gdpr/DataExport.tsx" \
    "Data Export Component"

  copy_file \
    "$TEMPLATE_DIR/frontend/src/pages/GdprSettings.tsx" \
    "$PRODUCT_DIR/frontend/src/pages/GdprSettings.tsx" \
    "GDPR Settings Page"

  echo ""
fi

if [ -z "$CATEGORY" ] || [ "$CATEGORY" = "tests" ]; then
  log_info "🧪 Tests"

  copy_file \
    "$TEMPLATE_DIR/backend/src/__tests__/gdprService.test.ts" \
    "$PRODUCT_DIR/backend/src/__tests__/gdprService.test.ts" \
    "GDPR Service Tests"

  copy_file \
    "$TEMPLATE_DIR/backend/src/__tests__/auditService.test.ts" \
    "$PRODUCT_DIR/backend/src/__tests__/auditService.test.ts" \
    "Audit Service Tests"

  copy_file \
    "$TEMPLATE_DIR/backend/src/__tests__/routes/gdpr.consent.e2e.test.ts" \
    "$PRODUCT_DIR/backend/src/__tests__/routes/gdpr.consent.e2e.test.ts" \
    "GDPR Consent E2E Tests"

  copy_file \
    "$TEMPLATE_DIR/backend/src/__tests__/routes/gdpr.deletion.e2e.test.ts" \
    "$PRODUCT_DIR/backend/src/__tests__/routes/gdpr.deletion.e2e.test.ts" \
    "GDPR Deletion E2E Tests"

  echo ""
fi

if [ -z "$CATEGORY" ] || [ "$CATEGORY" = "docs" ]; then
  log_info "📚 Documentation"

  copy_file \
    "$TEMPLATE_DIR/docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md" \
    "$PRODUCT_DIR/docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md" \
    "Compliance Roadmap"

  copy_file \
    "$TEMPLATE_DIR/docs/compliance_view" \
    "$PRODUCT_DIR/docs/compliance_view" \
    "Compliance Requirements"

  echo ""
fi

###############################################################################
# Summary
###############################################################################

if [ "$DRY_RUN" = true ]; then
  log_info "🔍 DRY RUN complete - no files were changed"
  log_info "Run without --dry-run to actually copy files"
else
  log_success "✅ Copy sync complete!"
  echo ""
  log_info "Next steps:"
  echo "  1. Review copied files"
  echo "  2. Customize UI styling if needed"
  echo "  3. npm install (if new dependencies)"
  echo "  4. npx prisma generate"
  echo "  5. npm test"
  echo ""
  log_info "Backups created with .backup-* extension"
fi

echo ""
