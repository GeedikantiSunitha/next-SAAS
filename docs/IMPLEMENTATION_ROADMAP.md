# Implementation Roadmap: Step-by-Step Guide

## Getting Started: Practical Implementation Steps

This document provides a concrete, actionable roadmap for building your template.

---

## 🎯 Prerequisites

Before starting, decide:

1. **Technology Stack**: Node.js/Express OR Python/FastAPI (pick one!)
2. **Database**: PostgreSQL (always)
3. **Frontend**: React (Next.js) OR Vue (Nuxt) OR API-only
4. **ORM**: Prisma (Node.js) OR SQLAlchemy (Python) OR TypeORM

**Recommendation**: Node.js + Express + Prisma + React (Next.js) for full-stack

---

## 📅 Week-by-Week Breakdown

### Week 1: Foundation & Structure

#### Day 1-2: Project Setup

**Tasks:**

1. **Initialize Repository**
   ```bash
   mkdir nextsaas
   cd nextsaas
   git init
   npm init -y
   ```

2. **Create Folder Structure**
   ```
   nextsaas/
   ├── backend/
   │   ├── src/
   │   │   ├── config/
   │   │   ├── middleware/
   │   │   ├── routes/
   │   │   ├── services/
   │   │   ├── repositories/
   │   │   ├── utils/
   │   │   ├── types/
   │   │   └── app.js
   │   ├── tests/
   │   └── package.json
   ├── frontend/          # Optional, skip if API-only
   ├── database/
   │   ├── migrations/
   │   ├── seeds/
   │   └── schema.sql
   ├── docker/
   ├── scripts/
   ├── docs/
   │   ├── MODULES/
   │   └── SETUP.md
   ├── .env.example
   ├── .gitignore
   ├── docker-compose.yml
   ├── README.md
   └── package.json
   ```

3. **Set Up .gitignore**
   ```
   node_modules/
   .env
   .env.local
   dist/
   build/
   *.log
   .DS_Store
   ```

4. **Create .env.example**
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname

   # Server
   PORT=3000
   NODE_ENV=development

   # Auth
   JWT_SECRET=your-secret-key-min-32-chars
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-refresh-secret
   JWT_REFRESH_EXPIRES_IN=30d

   # Frontend
   FRONTEND_URL=http://localhost:3000

   # Email (Resend)
   RESEND_API_KEY=your-resend-api-key
   FROM_EMAIL=noreply@yourdomain.com

   # Payments (optional)
   STRIPE_SECRET_KEY=your-stripe-secret
   STRIPE_WEBHOOK_SECRET=your-webhook-secret
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   CASHFREE_APP_ID=your-cashfree-app-id
   CASHFREE_SECRET_KEY=your-cashfree-secret
   ```

#### Day 3-4: Docker Setup

**Tasks:**

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'

   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: app_db
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 5s
         timeout: 5s
         retries: 5

     redis:  # For caching/queues (optional)
       image: redis:7-alpine
       ports:
         - "6379:6379"

   volumes:
     postgres_data:
   ```

2. **Create Dockerfile (Backend)**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .

   EXPOSE 3000

   CMD ["node", "src/app.js"]
   ```

3. **Create Development Scripts**
   ```bash
   # scripts/dev.sh
   #!/bin/bash
   docker-compose up -d postgres
   npm run dev
   ```

#### Day 5: Database Setup

**Tasks:**

1. **Install ORM**
   ```bash
   npm install prisma @prisma/client
   npm install -D prisma
   ```

2. **Initialize Prisma**
   ```bash
   npx prisma init
   ```

3. **Create Base Schema** (`prisma/schema.prisma`)
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   model User {
     id        String   @id @default(uuid())
     email     String   @unique
     password  String
     name      String?
     role      Role     @default(USER)
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     
     sessions  Session[]
     auditLogs AuditLog[]
   }

   model Session {
     id        String   @id @default(uuid())
     userId    String
     token     String   @unique
     expiresAt DateTime
     createdAt DateTime @default(now())
     
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   }

   model AuditLog {
     id        String   @id @default(uuid())
     userId    String?
     action    String
     resource  String?
     ipAddress String?
     userAgent String?
     createdAt DateTime @default(now())
     
     user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
   }

   enum Role {
     USER
     ADMIN
   }
   ```

4. **Create Migration**
   ```bash
   npx prisma migrate dev --name init
   ```

---

### Week 2: Core Modules

#### Day 6-7: Logging & Error Handling

**Tasks:**

1. **Install Dependencies**
   ```bash
   npm install winston winston-daily-rotate-file
   npm install uuid  # For request IDs
   ```

2. **Create Logger** (`backend/src/utils/logger.js`)
   ```javascript
   const winston = require('winston');
   const DailyRotateFile = require('winston-daily-rotate-file');

   const logger = winston.createLogger({
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.json()
     ),
     transports: [
       new winston.transports.Console({
         format: winston.format.simple(),
         level: process.env.LOG_LEVEL || 'info'
       }),
       new DailyRotateFile({
         filename: 'logs/error-%DATE%.log',
         datePattern: 'YYYY-MM-DD',
         level: 'error',
         maxSize: '20m',
         maxFiles: '14d'
       }),
       new DailyRotateFile({
         filename: 'logs/combined-%DATE%.log',
         datePattern: 'YYYY-MM-DD',
         maxSize: '20m',
         maxFiles: '14d'
       })
     ]
   });

   module.exports = logger;
   ```

3. **Create Error Classes** (`backend/src/utils/errors.js`)
   ```javascript
   class AppError extends Error {
     constructor(message, statusCode = 500, isOperational = true) {
       super(message);
       this.statusCode = statusCode;
       this.isOperational = isOperational;
       Error.captureStackTrace(this, this.constructor);
     }
   }

   class ValidationError extends AppError {
     constructor(message) {
       super(message, 400);
     }
   }

   class NotFoundError extends AppError {
     constructor(message = 'Resource not found') {
       super(message, 404);
     }
   }

   class UnauthorizedError extends AppError {
     constructor(message = 'Unauthorized') {
       super(message, 401);
     }
   }

   module.exports = {
     AppError,
     ValidationError,
     NotFoundError,
     UnauthorizedError
   };
   ```

4. **Create Error Handler** (`backend/src/middleware/errorHandler.js`)
   ```javascript
   const logger = require('../utils/logger');
   const { AppError } = require('../utils/errors');

   const errorHandler = (err, req, res, next) => {
     const statusCode = err.statusCode || 500;
     const message = err.isOperational ? err.message : 'Internal server error';

     logger.error({
       error: err.message,
       stack: err.stack,
       requestId: req.id,
       userId: req.user?.id,
       endpoint: req.path,
       method: req.method
     });

     res.status(statusCode).json({
       success: false,
       error: message,
       requestId: req.id,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
     });
   };

   module.exports = errorHandler;
   ```

#### Day 8-9: Security Middleware

**Tasks:**

1. **Install Dependencies**
   ```bash
   npm install helmet cors express-rate-limit express-validator bcryptjs
   ```

2. **Create Security Middleware** (`backend/src/middleware/security.js`)
   ```javascript
   const helmet = require('helmet');
   const cors = require('cors');
   const rateLimit = require('express-rate-limit');

   const securityHeaders = helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         imgSrc: ["'self'", 'data:', 'https:'],
       },
     },
     hsts: {
       maxAge: 31536000,
       includeSubDomains: true,
       preload: true
     }
   });

   const corsConfig = cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     allowedHeaders: ['Content-Type', 'Authorization']
   });

   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // 100 requests per window
     message: 'Too many requests from this IP'
   });

   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5, // 5 login attempts per window
     message: 'Too many login attempts'
   });

   module.exports = {
     securityHeaders,
     corsConfig,
     apiLimiter,
     authLimiter
   };
   ```

3. **Create Request ID Middleware** (`backend/src/middleware/requestId.js`)
   ```javascript
   const { v4: uuidv4 } = require('uuid');

   const requestId = (req, res, next) => {
     req.id = req.headers['x-request-id'] || uuidv4();
     res.setHeader('X-Request-ID', req.id);
     next();
   };

   module.exports = requestId;
   ```

#### Day 10: Input Validation

**Tasks:**

1. **Create Validation Middleware** (`backend/src/middleware/validation.js`)
   ```javascript
   const { body, validationResult } = require('express-validator');

   const validate = (validations) => {
     return async (req, res, next) => {
       await Promise.all(validations.map(validation => validation.run(req)));

       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({
           success: false,
           errors: errors.array()
         });
       }

       next();
     };
   };

   // Common validators
   const emailValidator = body('email')
     .isEmail()
     .normalizeEmail()
     .withMessage('Invalid email address');

   const passwordValidator = body('password')
     .isLength({ min: 8 })
     .withMessage('Password must be at least 8 characters')
     .matches(/[A-Z]/)
     .withMessage('Password must contain uppercase letter')
     .matches(/[a-z]/)
     .withMessage('Password must contain lowercase letter')
     .matches(/[0-9]/)
     .withMessage('Password must contain number');

   module.exports = {
     validate,
     emailValidator,
     passwordValidator
   };
   ```

---

### Week 3: Authentication System

#### Day 11-12: Auth Core

**Tasks:**

1. **Install Dependencies**
   ```bash
   npm install jsonwebtoken cookie-parser
   ```

2. **Create Auth Service** (`backend/src/services/authService.js`)
   ```javascript
   const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   const { prisma } = require('../config/database');
   const { UnauthorizedError, ValidationError } = require('../utils/errors');

   const hashPassword = async (password) => {
     return bcrypt.hash(password, 12);
   };

   const comparePassword = async (password, hash) => {
     return bcrypt.compare(password, hash);
   };

   const generateTokens = (userId) => {
     const accessToken = jwt.sign(
       { userId },
       process.env.JWT_SECRET,
       { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
     );

     const refreshToken = jwt.sign(
       { userId },
       process.env.JWT_REFRESH_SECRET,
       { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
     );

     return { accessToken, refreshToken };
   };

   const register = async (email, password, name) => {
     // Check if user exists
     const existing = await prisma.user.findUnique({ where: { email } });
     if (existing) {
       throw new ValidationError('Email already registered');
     }

     // Hash password
     const hashedPassword = await hashPassword(password);

     // Create user
     const user = await prisma.user.create({
       data: {
         email,
         password: hashedPassword,
         name
       },
       select: {
         id: true,
         email: true,
         name: true,
         role: true,
         createdAt: true
       }
     });

     return user;
   };

   const login = async (email, password) => {
     // Find user
     const user = await prisma.user.findUnique({ where: { email } });
     if (!user) {
       throw new UnauthorizedError('Invalid credentials');
     }

     // Verify password
     const isValid = await comparePassword(password, user.password);
     if (!isValid) {
       throw new UnauthorizedError('Invalid credentials');
     }

     // Generate tokens
     const { accessToken, refreshToken } = generateTokens(user.id);

     // Save session
     await prisma.session.create({
       data: {
         userId: user.id,
         token: refreshToken,
         expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
       }
     });

     return {
       user: {
         id: user.id,
         email: user.email,
         name: user.name,
         role: user.role
       },
       accessToken,
       refreshToken
     };
   };

   module.exports = {
     register,
     login,
     hashPassword,
     comparePassword,
     generateTokens
   };
   ```

3. **Create Auth Routes** (`backend/src/routes/auth.js`)
   ```javascript
   const express = require('express');
   const router = express.Router();
   const authService = require('../services/authService');
   const { validate, emailValidator, passwordValidator } = require('../middleware/validation');
   const { authLimiter } = require('../middleware/security');

   // Register
   router.post(
     '/register',
     authLimiter,
     validate([emailValidator, passwordValidator, body('name').optional().trim()]),
     async (req, res, next) => {
       try {
         const { email, password, name } = req.body;
         const user = await authService.register(email, password, name);
         res.status(201).json({ success: true, data: user });
       } catch (error) {
         next(error);
       }
     }
   );

   // Login
   router.post(
     '/login',
     authLimiter,
     validate([emailValidator, body('password').notEmpty()]),
     async (req, res, next) => {
       try {
         const { email, password } = req.body;
         const { user, accessToken, refreshToken } = await authService.login(email, password);

         res.cookie('refreshToken', refreshToken, {
           httpOnly: true,
           secure: process.env.NODE_ENV === 'production',
           sameSite: 'strict',
           maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
         });

         res.json({
           success: true,
           data: { user, accessToken }
         });
       } catch (error) {
         next(error);
       }
     }
   );

   module.exports = router;
   ```

#### Day 13: Auth Middleware

**Tasks:**

1. **Create Auth Middleware** (`backend/src/middleware/auth.js`)
   ```javascript
   const jwt = require('jsonwebtoken');
   const { UnauthorizedError } = require('../utils/errors');
   const { prisma } = require('../config/database');

   const authenticate = async (req, res, next) => {
     try {
       const token = req.headers.authorization?.replace('Bearer ', '');

       if (!token) {
         throw new UnauthorizedError('No token provided');
       }

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       
       const user = await prisma.user.findUnique({
         where: { id: decoded.userId },
         select: { id: true, email: true, name: true, role: true }
       });

       if (!user) {
         throw new UnauthorizedError('User not found');
      }

       req.user = user;
       next();
     } catch (error) {
       if (error.name === 'JsonWebTokenError') {
         return next(new UnauthorizedError('Invalid token'));
       }
       next(error);
     }
   };

   const requireRole = (...roles) => {
     return (req, res, next) => {
       if (!req.user) {
         return next(new UnauthorizedError('Authentication required'));
       }

       if (!roles.includes(req.user.role)) {
         return next(new UnauthorizedError('Insufficient permissions'));
       }

       next();
     };
   };

   module.exports = {
     authenticate,
     requireRole
   };
   ```

---

### Week 4: Testing & CI/CD

#### Day 14-15: Testing Setup

**Tasks:**

1. **Install Testing Dependencies**
   ```bash
   npm install -D jest supertest @jest/globals
   ```

2. **Create Test Setup** (`backend/tests/setup.js`)
   ```javascript
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();

   beforeAll(async () => {
     // Run migrations
     // Set test database
   });

   afterAll(async () => {
     await prisma.$disconnect();
   });

   beforeEach(async () => {
     // Clean database
     await prisma.session.deleteMany();
     await prisma.auditLog.deleteMany();
     await prisma.user.deleteMany();
   });
   ```

3. **Write Auth Tests** (`backend/tests/auth.test.js`)
   ```javascript
   const request = require('supertest');
   const app = require('../src/app');

   describe('Auth API', () => {
     describe('POST /api/auth/register', () => {
       it('should register a new user', async () => {
         const response = await request(app)
           .post('/api/auth/register')
           .send({
             email: 'test@example.com',
             password: 'Password123!',
             name: 'Test User'
           });

         expect(response.status).toBe(201);
         expect(response.body.success).toBe(true);
         expect(response.body.data.email).toBe('test@example.com');
       });
     });
   });
   ```

#### Day 16: CI/CD Setup

**Tasks:**

1. **Create GitHub Actions** (`.github/workflows/ci.yml`)
   ```yaml
   name: CI

   on: [push, pull_request]

   jobs:
     test:
       runs-on: ubuntu-latest
       
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_PASSWORD: postgres
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5

       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         
         - run: npm ci
         - run: npm test
   ```

---

## 📝 Next Steps

After Week 4, you'll have a **functional foundation**. Next steps:

1. **Test in Real Project**: Use template in an actual project
2. **Add Email Module**: Integrate Resend
3. **Add Payment Module**: Stripe/Razorpay/Cashfree
4. **Add RBAC**: Enhanced permissions
5. **Add GDPR**: Compliance features

---

## ✅ Weekly Checklist

Use this checklist to track progress:

- [ ] Week 1: Project structure, Docker, Database
- [ ] Week 2: Logging, Error handling, Security
- [ ] Week 3: Authentication system
- [ ] Week 4: Testing, CI/CD
- [ ] Week 5: Email notifications
- [ ] Week 6: Payments, RBAC
- [ ] Week 7: Polish, documentation
- [ ] Week 8: First real project using template

---

## 🎯 Success Criteria

Your template is ready when:

- ✅ New project setup takes < 5 minutes
- ✅ All tests pass
- ✅ Docker setup works
- ✅ Auth system functional
- ✅ Used in one real project successfully

Good luck! 🚀

