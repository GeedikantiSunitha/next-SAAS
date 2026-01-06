# NextSaaS - Backend Deployment Guide

**Last Updated**: January 2025  
**Status**: Production Ready  
**Version**: 1.0.0

---

## 🎯 Overview

This guide provides comprehensive step-by-step instructions for deploying the NextSaaS backend to production environments. It covers multiple deployment platforms and includes troubleshooting for common issues.

**Prerequisites**:
- ✅ All tests passing (403/403 backend tests)
- ✅ Database accessible (PostgreSQL 15+)
- ✅ Environment variables documented
- ✅ Dockerfile verified (non-root user, multi-stage build)

---

## 📋 Pre-Deployment Checklist

### 1. Code Quality ✅
- [ ] All tests passing (`npm test` in backend/)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No linter errors (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] No console.log statements in production code

### 2. Database Setup ✅
- [ ] PostgreSQL database created
- [ ] Database connection string ready
- [ ] Migrations tested locally
- [ ] Database accessible from deployment environment
- [ ] Backup strategy in place

### 3. Environment Variables ✅
- [ ] All required variables documented
- [ ] JWT secrets generated (32+ characters)
- [ ] Database URL configured
- [ ] Frontend URL known (or placeholder)
- [ ] Optional services configured (email, OAuth, etc.)

### 4. Dockerfile Verification ✅
- [ ] Dockerfile exists in `backend/` directory
- [ ] Multi-stage build configured
- [ ] Non-root user (nodejs) configured
- [ ] OpenSSL installed for Prisma
- [ ] Health check configured
- [ ] Logs directory created

---

## 🔐 Step 1: Generate JWT Secrets

Generate secure JWT secrets (minimum 32 characters):

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Save these values securely** - you'll need them in deployment configuration.

---

## 📝 Step 2: Environment Variables

### Required Environment Variables

```env
# Node Environment
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Authentication (from Step 1)
JWT_SECRET=<your-generated-jwt-secret-32-chars-minimum>
JWT_REFRESH_SECRET=<your-generated-refresh-secret-32-chars-minimum>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://your-frontend-domain.com
```

### Optional Environment Variables

```env
# CORS & Cookies
ALLOWED_ORIGINS=https://your-frontend-domain.com
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Email (Resend - optional)
RESEND_API_KEY=<your-resend-api-key>
FROM_EMAIL=noreply@yourdomain.com
APP_NAME=NextSaaS

# OAuth (optional - enable providers as needed)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
MICROSOFT_CLIENT_ID=<your-microsoft-client-id>
MICROSOFT_CLIENT_SECRET=<your-microsoft-client-secret>

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_EMAIL_VERIFICATION=false

# Payment Providers (optional)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>

# Observability (optional)
SENTRY_DSN=<your-sentry-dsn>
SENTRY_TRACES_SAMPLE_RATE=0.1

# Swagger (optional - for production API docs)
ENABLE_SWAGGER=false
```

---

## 🚀 Step 3: Platform-Specific Deployment

### Option A: Docker-Based Deployment (Recommended)

Works for: Railway, Render, DigitalOcean App Platform, AWS ECS, Google Cloud Run, Azure Container Instances

#### 3.1: Prepare Dockerfile

Ensure `backend/Dockerfile` exists and includes:
- Multi-stage build
- Non-root user (nodejs)
- OpenSSL for Prisma
- Health check

#### 3.2: Configure Platform

**Railway / Render / DigitalOcean**:
1. Connect your Git repository
2. Set root directory to `backend/`
3. Set Dockerfile path to `backend/Dockerfile` (or auto-detect)
4. Set port to `3001`
5. Add all environment variables from Step 2
6. Deploy

**AWS ECS / Google Cloud Run / Azure**:
1. Build Docker image: `docker build -t nextsaas-backend ./backend`
2. Push to container registry
3. Create service/container instance
4. Configure environment variables
5. Set port to 3001
6. Deploy

---

### Option B: Traditional Server Deployment

Works for: VPS, dedicated servers, EC2, DigitalOcean Droplets

#### 3.1: Server Setup

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client (for migrations)
sudo apt-get install -y postgresql-client

# Create app directory
sudo mkdir -p /app/nextsaas-backend
sudo chown $USER:$USER /app/nextsaas-backend
```

#### 3.2: Deploy Code

```bash
# Clone repository
cd /app/nextsaas-backend
git clone <your-repo-url> .
cd backend

# Install dependencies
npm ci --production

# Build application
npm run build

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

#### 3.3: Configure Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'nextsaas-backend',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3.4: Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ✅ Step 4: Verify Deployment

### 4.1: Health Check

```bash
# Test health endpoint
curl https://your-backend-url/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "version": "1.0.0"
}
```

### 4.2: Database Connection

Check logs for:
```
✅ Database connected successfully
```

### 4.3: Test API Endpoints

```bash
# Test public endpoint
curl https://your-backend-url/api/health/ready

# Test auth endpoint (should return 401 without token)
curl https://your-backend-url/api/auth/me

# Test registration (should return validation errors, not 500)
curl -X POST https://your-backend-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 4.4: Check Logs

Verify in logs:
- ✅ "Server started on port 3001"
- ✅ "Database connected successfully"
- ✅ "Prisma Client initialized"
- ✅ No errors or warnings

---

## 🔧 Step 5: Post-Deployment Configuration

### 5.1: Update CORS (After Frontend Deployment)

Once frontend is deployed:

1. Update environment variables:
   ```env
   FRONTEND_URL=https://your-frontend-domain.com
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```

2. Restart service (or redeploy)

**Important**: CORS changes require service restart to take effect.

### 5.2: Enable Swagger (Optional)

If you want API documentation in production:

```env
ENABLE_SWAGGER=true
```

Access at: `https://your-backend-url/api-docs`

---

## 🐛 Troubleshooting

### Issue 1: Build Fails - Prisma OpenSSL Error

**Symptom**:
```
Prisma failed to detect the libssl/openssl version
```

**Solution**: 
- Verify Dockerfile includes OpenSSL installation
- Ensure Prisma Client is regenerated in production stage after OpenSSL installation
- Check Dockerfile has both `openssl` and `openssl-dev` packages

### Issue 2: Build Fails - TypeScript Errors

**Symptom**:
```
Module '@prisma/client' has no exported member 'User'
```

**Solution**:
- Verify Prisma Client is generated before TypeScript build
- Check build order in Dockerfile: Generate Prisma → Build TypeScript

### Issue 3: Database Connection Fails

**Symptom**:
```
Failed to connect to database
PrismaClientInitializationError
```

**Check**:
1. `DATABASE_URL` is correct in environment variables
2. Database is accessible from deployment environment
3. OpenSSL is installed (check Dockerfile)
4. Prisma Client was regenerated in production stage
5. Database firewall allows connections from deployment IP

**Solution**:
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Test connection from local machine first
- Check database firewall/security group rules

### Issue 4: CORS Errors

**Symptom**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
1. Set `FRONTEND_URL` environment variable
2. Set `ALLOWED_ORIGINS` environment variable (comma-separated if multiple)
3. **Restart service** (CORS is runtime configuration)
4. Verify CORS middleware configuration

### Issue 5: Port Already in Use

**Symptom**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**:
- Verify `PORT=3001` in environment variables
- Check platform port configuration matches
- Ensure no other service is using port 3001

### Issue 6: JWT Errors

**Symptom**:
```
JsonWebTokenError: invalid signature
```

**Solution**:
- Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Ensure secrets are 32+ characters
- Regenerate secrets if needed
- Ensure secrets are the same across all instances (if load balanced)

### Issue 7: Missing Logs Directory

**Symptom**:
```
Error: ENOENT: no such file or directory, open 'logs/error.log'
```

**Solution**:
- Verify Dockerfile creates `/app/logs` directory
- Check directory permissions (nodejs user should have write access)

---

## 📊 Deployment Verification Checklist

After deployment, verify:

- [ ] Service status is "Running" or "Active"
- [ ] Health endpoint returns 200 OK (`/api/health`)
- [ ] Readiness endpoint returns 200 OK (`/api/health/ready`)
- [ ] Database connection successful (check logs)
- [ ] No Prisma errors in logs
- [ ] API endpoints responding
- [ ] Authentication working (test login/register)
- [ ] CORS configured (after frontend deployment)
- [ ] Logs directory writable
- [ ] Non-root user running (security check)

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

**Railway / Render / DigitalOcean**:
1. Go to service → Settings → Auto Deploy
2. Enable "Auto Deploy on Push"
3. Select branch: `main` (or your production branch)
4. Save

**GitHub Actions** (if using CI/CD):
```yaml
# Example workflow
name: Deploy Backend
on:
  push:
    branches: [main]
    paths: ['backend/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to platform
        # Platform-specific deployment steps
```

### Manual Redeploy

1. Go to service dashboard
2. Click "Redeploy" or "Restart"
3. Monitor build logs
4. Verify deployment

---

## 📝 Next Steps

After backend is deployed:

1. **Deploy Frontend** (see `docs/DEPLOYMENT_FRONTEND.md`)
2. **Update CORS** in backend with frontend URL
3. **Test Complete Flow**:
   - User registration
   - User login
   - Profile management
   - Admin features
   - Payment processing (if enabled)
4. **Set Up Monitoring** (optional - Sentry, logs aggregation)
5. **Configure Custom Domain** (optional)
6. **Set Up SSL/TLS** (if using custom domain)

---

## 🔗 Related Documentation

- `docs/DEPLOYMENT_FRONTEND.md` - Frontend deployment guide
- `docs/ACTION_PLAN_8_TO_10.md` - Improvement roadmap
- `backend/README.md` - Backend setup and development
- `backend/Dockerfile` - Docker configuration
- `backend/.env.example` - Environment variable template

---

## 📋 Key Lessons & Best Practices

1. ✅ **Prisma OpenSSL**: Regenerate Prisma Client in production stage after OpenSSL installation
2. ✅ **Build Order**: Generate Prisma Client before TypeScript compilation
3. ✅ **Non-root User**: Always run containers as non-root user (security)
4. ✅ **Environment Variables**: Set all required variables before first deployment
5. ✅ **CORS**: Configure for production URLs before frontend deployment
6. ✅ **Health Checks**: Use `/api/health/ready` for orchestration health checks
7. ✅ **Logs**: Ensure logs directory exists and is writable
8. ✅ **Secrets**: Never commit secrets to repository, use environment variables

---

**Document Version**: 1.0  
**Created**: January 2025  
**Status**: Production Ready  
**Maintained By**: NextSaaS Team
