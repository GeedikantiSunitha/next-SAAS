# Configuration Management
## NextSaaS - Configuration and Secrets Management

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes configuration management practices for NextSaaS, including environment variables, secrets management, and configuration validation.

---

## Configuration Principles

### 1. Environment-Based

**Principle**: Different configs for different environments

**Practice**: Use environment variables

---

### 2. Never Commit Secrets

**Principle**: Secrets never in version control

**Practice**: Use `.env` files (not committed)

---

### 3. Validate on Startup

**Principle**: Fail fast if config invalid

**Practice**: Validate required variables at startup

---

## Environment Variables

### Required Variables

**Database**:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

**JWT**:
```env
JWT_SECRET=minimum-32-characters-long-secret
JWT_REFRESH_SECRET=minimum-32-characters-long-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

**Server**:
```env
PORT=3001
NODE_ENV=development|production
FRONTEND_URL=http://localhost:3000
```

---

### Optional Variables

**Email**:
```env
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@yourdomain.com
APP_NAME=NextSaaS
```

**OAuth**:
```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

**Payments**:
```env
PAYMENT_PROVIDER=STRIPE
STRIPE_SECRET_KEY=sk_test_xxx
```

**Monitoring**:
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## Configuration Files

### .env.example

**Purpose**: Template for environment variables

**Content**: All variables with example values (no secrets)

**Committed**: Yes

---

### .env

**Purpose**: Actual environment variables

**Content**: Real values (including secrets)

**Committed**: Never

---

### .env.development

**Purpose**: Development-specific config

**Usage**: Development environment

---

### .env.production

**Purpose**: Production-specific config

**Usage**: Production environment

---

## Configuration Validation

### Startup Validation

**Check Required Variables**:
```typescript
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required variable: ${varName}`);
  }
});
```

---

### Type Validation

**Validate Types**:
```typescript
const port = parseInt(process.env.PORT || '3001');
if (isNaN(port)) {
  throw new Error('PORT must be a number');
}
```

---

### Format Validation

**Validate Formats**:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(process.env.FROM_EMAIL)) {
  throw new Error('FROM_EMAIL must be valid email');
}
```

---

## Secrets Management

### Development

**Method**: `.env` file (local only)

**Security**: Not committed to git

---

### Production

**Method**: Secret management service

**Options**:
- AWS Secrets Manager
- Google Cloud Secret Manager
- HashiCorp Vault
- Azure Key Vault

---

### Secret Rotation

**Practice**: Rotate secrets regularly

**Frequency**:
- JWT secrets: Every 90 days
- API keys: Every 180 days
- Database passwords: Every 90 days

---

## Configuration Organization

### Backend Config

**Location**: `backend/src/config/`

**Files**:
- `index.ts`: Main config
- `database.ts`: Database config
- `jwt.ts`: JWT config
- `email.ts`: Email config
- `payment.ts`: Payment config

---

### Frontend Config

**Location**: `frontend/.env`

**Variables**:
- `VITE_API_URL`: API base URL
- `VITE_APP_NAME`: Application name

---

## Configuration Best Practices

### 1. Use .env.example

**Practice**: Always provide `.env.example`

**Benefits**:
- Documents required variables
- Helps new developers
- No secrets exposed

---

### 2. Validate Early

**Practice**: Validate on startup

**Benefits**:
- Fail fast
- Clear error messages
- Prevents runtime errors

---

### 3. Type Safety

**Practice**: Type configuration values

**Benefits**:
- Type checking
- Better IDE support
- Fewer bugs

---

### 4. Default Values

**Practice**: Provide sensible defaults

**Example**:
```typescript
const port = parseInt(process.env.PORT || '3001');
```

---

## Configuration Documentation

### Document All Variables

**Include**:
- Variable name
- Description
- Required/Optional
- Default value
- Example value

---

### Example Documentation

```markdown
## DATABASE_URL
- **Description**: PostgreSQL connection string
- **Required**: Yes
- **Format**: `postgresql://user:password@host:port/database`
- **Example**: `postgresql://user:pass@localhost:5432/nextsaas`
```

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
