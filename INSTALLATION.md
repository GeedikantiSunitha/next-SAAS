# NextSaaS - Installation Guide

**Version**: 1.0.0  
**Last Updated**: January 2025

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Installation](#detailed-installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing NextSaaS, ensure you have the following installed:

### Required Software

- **Node.js** 18.0.0 or higher
  - Download from: https://nodejs.org/
  - Verify: `node --version`

- **npm** 9.0.0 or higher (comes with Node.js)
  - Verify: `npm --version`

- **PostgreSQL** 14.0 or higher
  - Download from: https://www.postgresql.org/download/
  - Verify: `psql --version`

- **Git** (optional, for version control)
  - Download from: https://git-scm.com/downloads

### Required Accounts (Optional but Recommended)

- **Resend** account (for email functionality)
  - Sign up at: https://resend.com
  - Get API key from dashboard

- **OAuth Providers** (optional)
  - Google: https://console.cloud.google.com/
  - GitHub: https://github.com/settings/developers
  - Microsoft: https://portal.azure.com/

- **Payment Providers** (optional)
  - Stripe: https://stripe.com
  - Razorpay: https://razorpay.com
  - Cashfree: https://cashfree.com

---

## Quick Start

For experienced developers who want to get started quickly:

```bash
# 1. Install dependencies
npm run install:all

# 2. Setup database
cd backend
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npx prisma generate

# 3. Start backend
npm run dev

# 4. In a new terminal, start frontend
cd frontend
cp .env.example .env
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## Detailed Installation

### Step 1: Download/Clone the Project

If you purchased from CodeCanyon, extract the ZIP file to your desired location.

```bash
# If using Git (for updates)
git clone <repository-url>
cd nextsaas
```

### Step 2: Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

Or use the convenience script:

```bash
npm run install:all
```

### Step 3: Database Setup

#### 3.1: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE nextsaas_db;

# Create user (optional)
CREATE USER nextsaas_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nextsaas_db TO nextsaas_user;

# Exit psql
\q
```

#### 3.2: Configure Database Connection

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and update the database URL:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/nextsaas_db
```

#### 3.3: Run Database Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

This will:
- Generate Prisma Client
- Create all database tables
- Run seed script (if configured)

### Step 4: Backend Configuration

#### 4.1: Configure Environment Variables

Edit `backend/.env`:

```env
# Required
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/nextsaas_db

# Generate secure JWT secrets (minimum 32 characters)
# Use: openssl rand -base64 32
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long

# Optional - Email (get from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_NAME=NextSaaS
```

#### 4.2: Generate JWT Secrets

Generate secure random strings for JWT secrets:

```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output to `JWT_SECRET` and generate another for `JWT_REFRESH_SECRET`.

### Step 5: Frontend Configuration

#### 5.1: Configure Environment Variables

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=NextSaaS
```

### Step 6: Start the Application

#### 6.1: Start Backend

```bash
cd backend
npm run dev
```

Backend will start on `http://localhost:3001`

#### 6.2: Start Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:3000`

### Step 7: Verify Installation

1. **Check Backend Health**
   - Visit: http://localhost:3001/api/health
   - Should return: `{"status":"ok"}`

2. **Check Frontend**
   - Visit: http://localhost:3000
   - Should see the login page

3. **Create Test User**
   - Click "Register" on the frontend
   - Fill in the registration form
   - Check backend logs for any errors

---

## Configuration

### Environment Variables

See detailed environment variable documentation:

- **Backend**: `backend/.env.example`
- **Frontend**: `frontend/.env.example`

### Optional Features

#### Enable Email Notifications

1. Sign up at https://resend.com
2. Get your API key
3. Add to `backend/.env`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com
   ```

#### Enable OAuth Login

1. Create OAuth app with provider (Google/GitHub/Microsoft)
2. Get Client ID and Secret
3. Add to `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   ```
4. Add Client ID to `frontend/.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=xxx
   ```

#### Enable Payment Processing

1. Sign up with payment provider (Stripe/Razorpay/Cashfree)
2. Get API keys
3. Add to `backend/.env`:
   ```env
   PAYMENT_PROVIDER=STRIPE
   STRIPE_API_KEY=sk_test_xxx
   ```
4. Add publishable key to `frontend/.env`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```

---

## Running the Application

### Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Production Mode

**Build:**
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

**Start:**
```bash
# Start backend
cd backend
npm start

# Serve frontend (use a web server like nginx)
# Or use Vite preview
cd frontend
npm run preview
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `Error: connect ECONNREFUSED`

**Solution**:
- Verify PostgreSQL is running: `pg_isready`
- Check database URL in `.env`
- Verify database exists: `psql -l`

#### 2. JWT Secret Error

**Error**: `JWT_SECRET must be at least 32 characters long`

**Solution**:
- Generate a new secret: `openssl rand -base64 32`
- Update `backend/.env`

#### 3. Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
- Change port in `.env`: `PORT=3002`
- Or kill the process using the port

#### 4. Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
npx prisma generate
```

#### 5. Frontend Can't Connect to Backend

**Error**: `Network Error` or `CORS Error`

**Solution**:
- Verify backend is running on correct port
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Verify CORS settings in backend

#### 6. Email Not Sending

**Error**: No error, but emails not received

**Solution**:
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Verify `FROM_EMAIL` is verified in Resend

### Getting Help

1. **Check Documentation**
   - Read `README.md`
   - Check `docs/` folder
   - Review API documentation

2. **Check Logs**
   - Backend logs: `backend/logs/`
   - Browser console for frontend errors

3. **Verify Configuration**
   - Check all environment variables
   - Verify database connection
   - Check API keys are valid

4. **Test Individual Components**
   - Test backend: `curl http://localhost:3001/api/health`
   - Test database: `psql -U postgres -d nextsaas_db`
   - Test frontend: Open browser console

---

## Next Steps

After installation:

1. **Read the Documentation**
   - `README.md` - Project overview
   - `docs/` - Detailed documentation

2. **Explore the Features**
   - Register a user
   - Test authentication
   - Explore admin panel

3. **Customize**
   - Update branding
   - Configure features
   - Add your business logic

4. **Deploy**
   - See `docs/DEPLOYMENT_BACKEND.md`
   - See `docs/DEPLOYMENT_FRONTEND.md`

---

## Support

For support:
- Check the documentation in `docs/` folder
- Review `TROUBLESHOOTING.md`
- Contact support through CodeCanyon

---

**Congratulations!** You've successfully installed NextSaaS. 🎉
