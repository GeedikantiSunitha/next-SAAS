# Git Workflow
## NextSaaS - Version Control Standards

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes the Git workflow and version control standards for NextSaaS.

---

## Branch Strategy

### Main Branches

**`main`**: Production-ready code
- Protected branch
- Requires pull request
- Requires code review
- Requires passing tests

**`develop`**: Development branch
- Integration branch
- Feature branches merge here
- Pre-production testing

---

### Feature Branches

**Naming**: `feature/feature-name`

**Example**: `feature/user-authentication`

**Workflow**:
1. Create from `develop`
2. Develop feature
3. Create pull request to `develop`
4. Code review
5. Merge after approval

---

### Hotfix Branches

**Naming**: `hotfix/issue-description`

**Example**: `hotfix/security-patch`

**Workflow**:
1. Create from `main`
2. Fix issue
3. Create pull request to `main`
4. Merge after approval
5. Merge back to `develop`

---

## Commit Messages

### Format

**Pattern**: `<type>: <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Examples**:
```
feat: add user registration endpoint
fix: resolve password validation issue
docs: update API documentation
refactor: simplify authentication logic
test: add tests for payment service
```

---

### Commit Message Guidelines

**Subject**:
- Use imperative mood ("add" not "added")
- First line < 50 characters
- No period at end
- Capitalize first letter

**Body** (optional):
- Explain what and why
- Wrap at 72 characters
- Separate from subject with blank line

**Example**:
```
feat: add password reset functionality

Implement password reset flow with email verification.
Users can now reset their passwords through email link.
```

---

## Pull Request Process

### Creating PR

**Checklist**:
- [ ] Code follows standards
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No hardcoded secrets
- [ ] Linter passes

---

### PR Description

**Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows standards
- [ ] Tests passing
- [ ] Documentation updated
```

---

### Code Review

**Reviewers**: At least one approval required

**Review Focus**:
- Code quality
- Security
- Test coverage
- Documentation
- Performance

---

## Git Best Practices

### 1. Commit Often

**Practice**: Small, focused commits

**Benefits**:
- Easier to review
- Easier to revert
- Better history

---

### 2. Write Clear Messages

**Practice**: Descriptive commit messages

**Benefits**:
- Better history
- Easier debugging
- Clearer changes

---

### 3. Don't Commit Secrets

**Practice**: Use `.gitignore`

**Never Commit**:
- `.env` files
- API keys
- Passwords
- Private keys

---

### 4. Keep Branches Updated

**Practice**: Regularly merge `develop` into feature branches

**Command**:
```bash
git checkout feature/my-feature
git merge develop
```

---

### 5. Use `.gitignore`

**Required Entries**:
```
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
coverage/
```

---

## Workflow Examples

### Feature Development

```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/user-profile

# Make changes
git add .
git commit -m "feat: add user profile page"

# Push and create PR
git push origin feature/user-profile
```

---

### Hotfix

```bash
# Create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/security-patch

# Fix issue
git add .
git commit -m "fix: patch security vulnerability"

# Push and create PR to main
git push origin hotfix/security-patch
```

---

## Tagging

### Version Tags

**Format**: `v1.0.0` (semantic versioning)

**Create Tag**:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

### Semantic Versioning

**Format**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

---

## Git Hooks

### Pre-commit Hook

**Purpose**: Run checks before commit

**Checks**:
- Linter
- Tests
- No secrets

---

### Pre-push Hook

**Purpose**: Run checks before push

**Checks**:
- All tests passing
- Coverage threshold met

---

## Merge Strategies

### Squash and Merge

**Use For**: Feature branches

**Benefits**:
- Clean history
- Single commit per feature

---

### Merge Commit

**Use For**: Hotfixes

**Benefits**:
- Preserves branch history
- Clear merge point

---

## Conflict Resolution

### Process

1. Pull latest changes
2. Resolve conflicts
3. Test resolution
4. Commit resolution
5. Continue workflow

---

## Git Configuration

### Recommended Settings

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
