#!/bin/bash

###############################################################################
# Template Sync Script
#
# Syncs compliance updates from nextsaas template to your product
#
# Usage:
#   ./sync.sh [product-path] [--dry-run] [--selective] [--force]
#
# Examples:
#   ./sync.sh ~/projects/product-a --dry-run
#   ./sync.sh ~/projects/product-a --selective gdpr,audit
#   ./sync.sh ~/projects/product-a --force
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEMPLATE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
PRODUCT_DIR="${1:-}"
DRY_RUN=false
SELECTIVE=false
FORCE=false
CATEGORIES=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      ;;
    --force)
      FORCE=true
      ;;
    --selective)
      SELECTIVE=true
      shift
      CATEGORIES="$1"
      ;;
    --help)
      echo "Usage: $0 [product-path] [--dry-run] [--selective categories] [--force]"
      echo ""
      echo "Options:"
      echo "  --dry-run              Show what would be synced without making changes"
      echo "  --selective categories Sync only specific categories (gdpr,audit,ui,etc)"
      echo "  --force                Skip confirmations"
      echo "  --help                 Show this help"
      exit 0
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

confirm() {
  if [ "$FORCE" = true ]; then
    return 0
  fi

  read -p "$1 (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    return 1
  fi
  return 0
}

check_git() {
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository: $1"
    return 1
  fi
  return 0
}

###############################################################################
# Validation
###############################################################################

log_info "🚀 NextSaaS Template Sync Script"
echo ""

# Validate product directory
if [ -z "$PRODUCT_DIR" ]; then
  log_error "Product directory not specified"
  echo "Usage: $0 [product-path]"
  exit 1
fi

if [ ! -d "$PRODUCT_DIR" ]; then
  log_error "Product directory does not exist: $PRODUCT_DIR"
  exit 1
fi

log_info "Template: $TEMPLATE_DIR"
log_info "Product:  $PRODUCT_DIR"
echo ""

# Check if directories are git repositories
if ! check_git "$PRODUCT_DIR"; then
  log_error "Product directory is not a git repository"
  exit 1
fi

###############################################################################
# Pre-Sync Checks
###############################################################################

log_info "📋 Running pre-sync checks..."

# Check for uncommitted changes
cd "$PRODUCT_DIR"
if ! git diff-index --quiet HEAD --; then
  log_warning "Product has uncommitted changes"
  if ! confirm "Continue anyway?"; then
    log_info "Aborted by user"
    exit 0
  fi
fi

# Check if template remote exists
if ! git remote | grep -q "nextsaas-template"; then
  log_info "Adding nextsaas-template remote..."
  git remote add nextsaas-template "$TEMPLATE_DIR"
fi

# Fetch latest from template
log_info "Fetching latest from template..."
git fetch nextsaas-template

log_success "Pre-sync checks complete"
echo ""

###############################################################################
# Analyze Changes
###############################################################################

log_info "📊 Analyzing changes from template..."

# Get list of changed files
CHANGED_FILES=$(git diff --name-only HEAD..nextsaas-template/main)

if [ -z "$CHANGED_FILES" ]; then
  log_success "No changes to sync"
  exit 0
fi

echo "Changed files in template:"
echo "$CHANGED_FILES" | head -20
if [ $(echo "$CHANGED_FILES" | wc -l) -gt 20 ]; then
  echo "... and $(($(echo "$CHANGED_FILES" | wc -l) - 20)) more"
fi
echo ""

###############################################################################
# Categorize Files
###############################################################################

COMPLIANCE_FILES=$(echo "$CHANGED_FILES" | grep -E "gdpr|audit|compliance|consent|cookie|breach|retention" || true)
UI_FILES=$(echo "$CHANGED_FILES" | grep -E "frontend/src/components|frontend/src/pages" || true)
SERVICE_FILES=$(echo "$CHANGED_FILES" | grep -E "backend/src/services" || true)
ROUTE_FILES=$(echo "$CHANGED_FILES" | grep -E "backend/src/routes" || true)
SCHEMA_FILES=$(echo "$CHANGED_FILES" | grep -E "prisma/schema.prisma" || true)
MIGRATION_FILES=$(echo "$CHANGED_FILES" | grep -E "prisma/migrations" || true)
TEST_FILES=$(echo "$CHANGED_FILES" | grep -E "__tests__|test\.ts|test\.tsx" || true)
DOC_FILES=$(echo "$CHANGED_FILES" | grep -E "docs/|README\.md" || true)

log_info "File categories:"
[ -n "$COMPLIANCE_FILES" ] && echo "  - Compliance: $(echo "$COMPLIANCE_FILES" | wc -l) files"
[ -n "$UI_FILES" ] && echo "  - UI: $(echo "$UI_FILES" | wc -l) files"
[ -n "$SERVICE_FILES" ] && echo "  - Services: $(echo "$SERVICE_FILES" | wc -l) files"
[ -n "$ROUTE_FILES" ] && echo "  - Routes: $(echo "$ROUTE_FILES" | wc -l) files"
[ -n "$SCHEMA_FILES" ] && echo "  - Schema: $(echo "$SCHEMA_FILES" | wc -l) files"
[ -n "$MIGRATION_FILES" ] && echo "  - Migrations: $(echo "$MIGRATION_FILES" | wc -l) files"
[ -n "$TEST_FILES" ] && echo "  - Tests: $(echo "$TEST_FILES" | wc -l) files"
[ -n "$DOC_FILES" ] && echo "  - Docs: $(echo "$DOC_FILES" | wc -l) files"
echo ""

###############################################################################
# Dry Run
###############################################################################

if [ "$DRY_RUN" = true ]; then
  log_info "🔍 DRY RUN MODE - No changes will be made"
  echo ""

  log_info "Would sync the following files:"
  echo ""

  echo "REPLACE (low risk):"
  echo "$SERVICE_FILES" | grep -E "gdprService|auditService" || echo "  None"
  echo ""

  echo "MERGE (review carefully):"
  echo "$UI_FILES" || echo "  None"
  echo "$SCHEMA_FILES" || echo "  None"
  echo ""

  echo "SELECTIVE:"
  echo "$MIGRATION_FILES" || echo "  None"
  echo ""

  log_info "To actually sync, run without --dry-run flag"
  exit 0
fi

###############################################################################
# Create Backup
###############################################################################

log_info "💾 Creating backup..."

BACKUP_DIR="$PRODUCT_DIR/.sync-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup files that will be changed
if [ -n "$COMPLIANCE_FILES" ]; then
  for file in $COMPLIANCE_FILES; do
    if [ -f "$PRODUCT_DIR/$file" ]; then
      backup_path="$BACKUP_DIR/$file"
      mkdir -p "$(dirname "$backup_path")"
      cp "$PRODUCT_DIR/$file" "$backup_path" 2>/dev/null || true
    fi
  done
fi

log_success "Backup created at: $BACKUP_DIR"
echo ""

###############################################################################
# Sync Files
###############################################################################

log_info "🔄 Syncing files..."
echo ""

# Create sync branch
SYNC_BRANCH="sync-compliance-$(date +%Y%m%d-%H%M%S)"
log_info "Creating branch: $SYNC_BRANCH"
git checkout -b "$SYNC_BRANCH"

# Sync strategy
sync_file() {
  local file=$1
  local strategy=$2

  if [ ! -f "$TEMPLATE_DIR/$file" ]; then
    return
  fi

  case $strategy in
    replace)
      log_info "Replacing: $file"
      cp "$TEMPLATE_DIR/$file" "$PRODUCT_DIR/$file"
      git add "$file"
      ;;
    merge)
      log_warning "Manual merge needed: $file"
      echo "  Run: git checkout nextsaas-template/main -- $file"
      echo "  Then manually merge with your version"
      ;;
    skip)
      log_info "Skipping: $file (product-specific)"
      ;;
  esac
}

# Sync compliance services (REPLACE)
if [ -n "$SERVICE_FILES" ]; then
  for file in $SERVICE_FILES; do
    if echo "$file" | grep -qE "gdprService|auditService|dataRetentionService|securityIncidentService"; then
      sync_file "$file" "replace"
    else
      sync_file "$file" "merge"
    fi
  done
fi

# Sync routes (REPLACE)
if [ -n "$ROUTE_FILES" ]; then
  for file in $ROUTE_FILES; do
    if echo "$file" | grep -qE "gdpr\.ts|audit\.ts|securityIncidents\.ts"; then
      sync_file "$file" "replace"
    else
      sync_file "$file" "merge"
    fi
  done
fi

# Sync UI (MERGE)
if [ -n "$UI_FILES" ]; then
  log_warning "UI files need manual review:"
  echo "$UI_FILES"
  echo "Run merge-guide.md for instructions"
fi

# Sync schema (MERGE - manual)
if [ -n "$SCHEMA_FILES" ]; then
  log_warning "⚠️  Prisma schema needs CAREFUL manual merge!"
  echo "  See merge-guide.md for instructions"
  echo "  File: $SCHEMA_FILES"
fi

# Sync migrations (SELECTIVE)
if [ -n "$MIGRATION_FILES" ]; then
  log_info "New migrations found:"
  echo "$MIGRATION_FILES" | grep -E "gdpr|compliance|audit" || echo "  None (skip product-specific migrations)"
fi

# Sync tests (REPLACE)
if [ -n "$TEST_FILES" ]; then
  for file in $TEST_FILES; do
    if echo "$file" | grep -qE "gdpr|audit|compliance"; then
      sync_file "$file" "replace"
    fi
  done
fi

# Sync docs (REPLACE)
if [ -n "$DOC_FILES" ]; then
  for file in $DOC_FILES; do
    if echo "$file" | grep -qE "COMPLIANCE|compliance_view"; then
      sync_file "$file" "replace"
    fi
  done
fi

echo ""
log_success "File sync complete"
echo ""

###############################################################################
# Post-Sync Actions
###############################################################################

log_info "🧹 Running post-sync actions..."

# Install new dependencies
if [ -f "$PRODUCT_DIR/package.json" ]; then
  log_info "Checking for new dependencies..."
  # Compare package.json
  if ! diff -q "$TEMPLATE_DIR/package.json" "$PRODUCT_DIR/package.json" > /dev/null 2>&1; then
    log_warning "package.json differs - you may need to install new dependencies"
    echo "  Run: npm install"
  fi
fi

# Generate Prisma client
if [ -f "$PRODUCT_DIR/backend/prisma/schema.prisma" ]; then
  log_info "Run after reviewing changes:"
  echo "  cd backend && npx prisma generate"
  echo "  cd backend && npx prisma migrate deploy"
fi

echo ""
log_success "Post-sync actions noted"
echo ""

###############################################################################
# Summary
###############################################################################

log_info "📊 Sync Summary"
echo ""
echo "Branch: $SYNC_BRANCH"
echo "Backup: $BACKUP_DIR"
echo ""

# Show git status
log_info "Changed files:"
git status --short

echo ""
log_info "Next steps:"
echo "  1. Review changes:    git diff"
echo "  2. Install deps:      npm install"
echo "  3. Generate Prisma:   cd backend && npx prisma generate"
echo "  4. Run migrations:    cd backend && npx prisma migrate deploy"
echo "  5. Run tests:         npm test"
echo "  6. Manual merges:     See merge-guide.md"
echo "  7. Commit:            git commit -m 'sync: merge compliance updates'"
echo "  8. Test thoroughly"
echo "  9. Create PR"
echo ""

# Check for conflicts
if git ls-files -u | grep -q .; then
  log_error "⚠️  Merge conflicts detected!"
  echo "Resolve conflicts before committing"
  echo "See: merge-guide.md"
else
  log_success "✅ No conflicts detected"
fi

echo ""
log_info "🔄 Rollback if needed:"
echo "  git checkout main && git branch -D $SYNC_BRANCH"
echo "  cp -r $BACKUP_DIR/* ."
echo ""

log_success "🎉 Sync complete!"
