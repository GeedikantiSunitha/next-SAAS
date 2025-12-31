# Environment Setup
## NextSaaS - Environment Configuration Guide

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes how to set up different environments (development, test, staging, production) for NextSaaS.

---

## Environment Types

### Development

**Purpose**: Local development

**Characteristics**:
- Local machine
- Can break things
- Debug tools enabled
- Hot reload enabled
- Synthetic data only

---

### Test

**Purpose**: Automated testing

**Characteristics**:
- CI/CD pipeline
- Reset before test runs
- Synthetic data only
- Fast test execution

---

### Staging

**Purpose**: Pre-production testing

**Characteristics**:
- Mirrors production
- Final testing
- Anonymized production data
- Full monitoring

---

### Production

**Purpose**: Live application

**Characteristics**:
- Real users
- Real data
- Highest security
- Full monitoring and alerting

---

## Environment Variables

### Required Variables

**Database**:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

**JWT Secrets**:
```env
JWT_SECRET=your-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
```

**Server**:
```env
PORT=3001
NODE_ENV=development|test|staging|production
FRONTEND_URL=http://localhost:3000
```

---

### Optional Variables

**Email**:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_NAME=NextSaaS
```

**OAuth**:
```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
```

**Payments**:
```env
PAYMENT_PROVIDER=STRIPE|RAZORPAY|CASHFREE
STRIPE_SECRET_KEY=sk_test_xxx
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

**Monitoring**:
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
```

---

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

### Steps

1. **Clone Repository**:
```bash
git clone https://github.com/yourusername/nextsaas.git
cd nextsaas
```

2. **Backend Setup**:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npx prisma migrate dev
npx prisma generate
npm run dev
```

3. **Frontend Setup**:
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

---

## Test Environment Setup

### Database

**Separate Test Database**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/nextsaas_test
```

**Migrations**:
```bash
npx prisma migrate deploy
```

---

### Configuration

**Environment**:
```env
NODE_ENV=test
```

**Secrets**: Use test secrets (different from production)

---

## Staging Environment Setup

### Database

**Staging Database**:
```env
DATABASE_URL=postgresql://user:password@staging-db:5432/nextsaas_staging
```

**Data**: Anonymized production data

---

### Configuration

**Environment**:
```env
NODE_ENV=staging
```

**URLs**:
```env
FRONTEND_URL=https://staging.yourdomain.com
```

**Monitoring**: Full monitoring enabled

---

## Production Environment Setup

### Database

**Production Database**:
```env
DATABASE_URL=postgresql://user:password@prod-db:5432/nextsaas_prod
```

**Backup**: Automated backups configured

**SSL**: Required

---

### Configuration

**Environment**:
```env
NODE_ENV=production
```

**URLs**:
```env
FRONTEND_URL=https://yourdomain.com
```

**Security**:
- Strong secrets (32+ characters)
- HTTPS only
- Security headers enabled
- Rate limiting enabled

---

## Environment-Specific Configs

### Development

**Features**:
- Hot reload
- Debug logging
- CORS relaxed
- Rate limiting relaxed

---

### Test

**Features**:
- Fast execution
- Test database
- Mock external services
- Coverage reporting

---

### Staging

**Features**:
- Production-like
- Full monitoring
- Real external services
- Anonymized data

---

### Production

**Features**:
- Optimized builds
- Error tracking
- Full monitoring
- Security hardened

---

## Database Setup

### Create Databases

**Development**:
```sql
CREATE DATABASE nextsaas_dev;
```

**Test**:
```sql
CREATE DATABASE nextsaas_test;
```

**Staging**:
```sql
CREATE DATABASE nextsaas_staging;
```

**Production**:
```sql
CREATE DATABASE nextsaas_prod;
```

---

### Run Migrations

**Development**:
```bash
npx prisma migrate dev
```

**Other Environments**:
```bash
npx prisma migrate deploy
```

---

## Environment Validation

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
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

## Data Anonymization

### Staging Data

**Purpose**: Use production-like data without PII

**Anonymization**:
- Emails: `user{N}@test.example.com`
- Names: `Test User {N}`
- Phone: `+1-555-000-{N}`

**Keep**:
- Data structure
- Relationships
- Business logic

---

## Environment Separation

### Principles

1. **No Real Data in Non-Prod**: Never use real user data
2. **Separate Databases**: Each environment has its own database
3. **Separate Secrets**: Different secrets per environment
4. **Access Control**: Limit access to production

---

## Docker Setup

### Development

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: nextsaas_dev
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
```

---

### Production

**Dockerfile**: Multi-stage build

**Build**:
```bash
docker build -t nextsaas:latest .
```

**Run**:
```bash
docker run -d \
  -p 3001:3001 \
  --env-file .env.production \
  nextsaas:latest
```

---

## Environment Checklist

### Development

- [ ] Node.js installed
- [ ] PostgreSQL installed
- [ ] `.env` configured
- [ ] Database created
- [ ] Migrations run
- [ ] Dependencies installed

---

### Test

- [ ] Test database created
- [ ] Test `.env` configured
- [ ] Migrations run
- [ ] CI/CD configured

---

### Staging

- [ ] Staging database created
- [ ] Staging `.env` configured
- [ ] Migrations run
- [ ] Monitoring configured
- [ ] Anonymized data loaded

---

### Production

- [ ] Production database created
- [ ] Production `.env` configured
- [ ] Strong secrets generated
- [ ] Migrations run
- [ ] Backups configured
- [ ] Monitoring configured
- [ ] SSL certificates valid
- [ ] Security hardened

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
