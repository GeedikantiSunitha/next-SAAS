# System Architecture
## NextSaaS - Overall System Design

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Architecture Overview

NextSaaS follows a **layered, modular architecture** designed for scalability, maintainability, and security. The system is built as a **monolithic full-stack application** with clear separation between frontend and backend, allowing for future microservices migration if needed.

---

## High-Level Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React SPA (Frontend)                          │  │
│  │  - React 18 + TypeScript                              │  │
│  │  - Vite Build Tool                                   │  │
│  │  - React Router (Client-side routing)                │  │
│  │  - React Query (Data fetching & caching)             │  │
│  │  - Tailwind CSS (Styling)                            │  │
│  └───────────────────┬──────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │ HTTP/HTTPS
                        │ (withCredentials: true)
                        │ Cookie-based Auth
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Express.js API (Backend)                    │  │
│  │  - Node.js 18+ + TypeScript                         │  │
│  │  - Express.js Framework                             │  │
│  │  - Security Middleware (Helmet, CORS, Rate Limit)  │  │
│  │  - Request Validation                               │  │
│  │  - API Versioning                                   │  │
│  │  - Metrics Collection                               │  │
│  └───────────────────┬──────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┬──────────────┬──────────────┐           │
│  │   Routes     │  Middleware  │   Services   │           │
│  │  (HTTP)      │  (Auth,      │  (Business   │           │
│  │              │   Validation) │   Logic)     │           │
│  └──────────────┴──────────────┴──────────────┘           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Prisma ORM                                   │  │
│  │  - Type-safe Database Client                        │  │
│  │  - Query Builder                                    │  │
│  │  - Migration System                                 │  │
│  └───────────────────┬──────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Persistence Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database                          │  │
│  │  - Relational Data Storage                           │  │
│  │  - ACID Compliance                                   │  │
│  │  - Connection Pooling                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │  Resend  │  Stripe  │ Razorpay │ Cashfree │            │
│  │  (Email) │ (Payment)│(Payment) │(Payment) │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. Client Layer (Frontend)

**Technology**: React 18 + TypeScript + Vite

**Responsibilities**:
- User interface rendering
- Client-side routing
- State management (React Query for server state)
- Form handling and validation
- Error boundaries
- Toast notifications

**Key Components**:
- **Pages**: Landing, Login, Register, Dashboard, Profile, Admin pages
- **Components**: Reusable UI components (Button, Input, Modal, etc.)
- **Contexts**: AuthContext for authentication state
- **Hooks**: Custom hooks for data fetching
- **API Client**: Axios-based API client with interceptors

**Communication**:
- HTTP/HTTPS requests to backend API
- Cookie-based authentication (HTTP-only cookies)
- CORS-enabled for cross-origin requests

---

### 2. API Gateway Layer (Backend Entry Point)

**Technology**: Express.js + TypeScript

**Responsibilities**:
- Request/response handling
- Security middleware application
- Request validation
- Rate limiting
- API versioning
- Metrics collection
- Error handling

**Middleware Stack** (in order):
1. **Security Headers** (Helmet)
2. **CORS** (Cross-Origin Resource Sharing)
3. **Body Parsers** (JSON, URL-encoded)
4. **Cookie Parser**
5. **Request ID** (for tracing)
6. **Metrics** (Prometheus metrics)
7. **API Versioning**
8. **Rate Limiting**
9. **Request Logging**
10. **Routes** (API endpoints)
11. **404 Handler**
12. **Error Handler** (must be last)

---

### 3. Application Layer

#### 3.1 Routes Layer

**Location**: `backend/src/routes/`

**Responsibilities**:
- HTTP endpoint definitions
- Request/response handling
- Route-level middleware (authentication, authorization)
- Input validation
- Response formatting

**Route Modules**:
- `auth.ts` - Authentication endpoints
- `profile.ts` - User profile management
- `admin.ts` - Admin panel endpoints
- `payments.ts` - Payment processing
- `notifications.ts` - Notification management
- `audit.ts` - Audit log access
- `rbac.ts` - Role-based access control
- `gdpr.ts` - GDPR compliance features
- `featureFlags.ts` - Feature flag management
- `health.ts` - Health checks

#### 3.2 Middleware Layer

**Location**: `backend/src/middleware/`

**Middleware Types**:
- **Authentication** (`auth.ts`): JWT token verification
- **Authorization** (`auth.ts`): Role-based access control
- **Validation** (`validation.ts`): Request validation using express-validator
- **Security** (`security.ts`): Security headers, CORS, rate limiting
- **Error Handling** (`errorHandler.ts`): Global error handler
- **Request ID** (`requestId.ts`): Request tracking
- **API Versioning** (`apiVersioning.ts`): API version management
- **Metrics** (`metrics.ts`): Prometheus metrics collection
- **Idempotency** (`idempotency.ts`): Duplicate request prevention

#### 3.3 Services Layer

**Location**: `backend/src/services/`

**Responsibilities**:
- Business logic implementation
- Data transformation
- External service integration
- Transaction management

**Service Modules**:
- `authService.ts` - Authentication logic
- `profileService.ts` - Profile management
- `paymentService.ts` - Payment processing
- `notificationService.ts` - Notification handling
- `emailService.ts` - Email sending
- `auditService.ts` - Audit logging
- `rbacService.ts` - Role-based access control
- `gdprService.ts` - GDPR compliance
- `mfaService.ts` - Multi-factor authentication
- `oauthService.ts` - OAuth integration
- `featureFlagsService.ts` - Feature flag management
- Admin services (user management, monitoring, etc.)

---

### 4. Data Layer

#### 4.1 ORM Layer (Prisma)

**Location**: `backend/prisma/`

**Responsibilities**:
- Type-safe database access
- Query building
- Migration management
- Schema definition

**Key Features**:
- **Type Safety**: Auto-generated TypeScript types
- **Migrations**: Version-controlled schema changes
- **Query Builder**: Intuitive query API
- **Connection Pooling**: Built-in connection management

#### 4.2 Database Layer (PostgreSQL)

**Responsibilities**:
- Data persistence
- ACID transactions
- Data integrity (foreign keys, constraints)
- Indexing for performance

**Connection Management**:
- Connection pooling via Prisma
- Configurable pool size
- Connection timeout handling

---

## Architecture Patterns

### 1. Layered Architecture

**Pattern**: Separation of concerns across layers

```
Routes → Services → Prisma → PostgreSQL
```

**Benefits**:
- Clear separation of concerns
- Easy to test each layer independently
- Maintainable and scalable
- Easy to understand

### 2. Service-Oriented Architecture (SOA)

**Pattern**: Business logic encapsulated in services

**Benefits**:
- Reusable business logic
- Easy to test
- Clear dependencies
- Modular design

### 3. Repository Pattern (via Prisma)

**Pattern**: Data access abstraction

**Benefits**:
- Database-agnostic business logic
- Easy to test (can mock Prisma)
- Type-safe queries
- Migration support

### 4. Middleware Pattern

**Pattern**: Cross-cutting concerns via middleware

**Benefits**:
- Reusable security, validation, logging
- Consistent request/response handling
- Easy to add new middleware
- Separation of concerns

---

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT tokens (access + refresh)
   ↓
4. Tokens stored in HTTP-only cookies
   ↓
5. Subsequent requests include cookies automatically
   ↓
6. Middleware verifies JWT token
   ↓
7. Request proceeds if valid
```

### Authorization Flow

```
1. Request arrives with JWT token
   ↓
2. Authentication middleware verifies token
   ↓
3. User role extracted from token
   ↓
4. Authorization middleware checks role
   ↓
5. Request allowed/denied based on role
```

### Security Layers

1. **Network Layer**: HTTPS (TLS encryption)
2. **Application Layer**: Security headers (Helmet)
3. **Authentication Layer**: JWT tokens, HTTP-only cookies
4. **Authorization Layer**: RBAC middleware
5. **Input Layer**: Validation, sanitization
6. **Database Layer**: Parameterized queries (Prisma)
7. **Rate Limiting**: Brute force protection

---

## Scalability Architecture

### Horizontal Scaling

**Current Design**: Stateless API
- ✅ No server-side sessions (JWT tokens)
- ✅ Database-backed sessions (for refresh tokens)
- ✅ Stateless middleware
- ✅ Load balancer ready

**Scaling Strategy**:
1. Add load balancer
2. Deploy multiple API instances
3. Shared database (PostgreSQL)
4. Shared session storage (if needed)

### Vertical Scaling

**Current Design**: Efficient Queries**
- ✅ Prisma connection pooling
- ✅ Indexed database queries
- ✅ Efficient middleware stack
- ✅ Optimized React builds

---

## Data Flow Architecture

### Request Flow

```
Client Request
    ↓
Express App (app.ts)
    ↓
Security Middleware (Helmet, CORS)
    ↓
Body Parsers
    ↓
Request ID Middleware
    ↓
Metrics Middleware
    ↓
API Versioning Middleware
    ↓
Rate Limiting Middleware
    ↓
Route Handler
    ↓
Authentication Middleware (if protected)
    ↓
Authorization Middleware (if admin)
    ↓
Validation Middleware
    ↓
Service Layer (Business Logic)
    ↓
Prisma ORM (Data Access)
    ↓
PostgreSQL Database
    ↓
Response flows back up
```

### Response Flow

```
Database Result
    ↓
Prisma ORM (Type-safe result)
    ↓
Service Layer (Business logic processing)
    ↓
Route Handler (Response formatting)
    ↓
Response Middleware (if any)
    ↓
Error Handler (if error occurred)
    ↓
Client Response
```

---

## Error Handling Architecture

### Error Flow

```
Error Occurs (anywhere in stack)
    ↓
Caught by try-catch or error handler
    ↓
Error transformed to AppError
    ↓
Error logged (Winston)
    ↓
Error sent to Sentry (if configured)
    ↓
Error Handler Middleware
    ↓
Formatted error response
    ↓
Client receives error
```

### Error Types

1. **ValidationError**: Input validation failures
2. **AuthenticationError**: Authentication failures
3. **AuthorizationError**: Authorization failures
4. **NotFoundError**: Resource not found
5. **ConflictError**: Resource conflicts (e.g., duplicate email)
6. **AppError**: Generic application errors

---

## Monitoring & Observability Architecture

### Metrics Collection

**Technology**: Prometheus (prom-client)

**Metrics Collected**:
- HTTP request count
- HTTP request duration
- HTTP error count
- Database query metrics (via Prisma)

**Metrics Endpoint**: `/api/metrics`

### Logging Architecture

**Technology**: Winston

**Log Levels**:
- **Error**: Errors that need attention
- **Warn**: Warnings that should be reviewed
- **Info**: Informational messages
- **Debug**: Debug information (development only)

**Log Destinations**:
- Console (development)
- File (production, daily rotation)
- Sentry (errors, if configured)

### Error Tracking

**Technology**: Sentry (optional)

**Features**:
- Error aggregation
- Performance monitoring
- Release tracking
- User context

---

## Deployment Architecture

### Development Environment

```
Developer Machine
    ↓
Local PostgreSQL (or Docker)
    ↓
Backend (npm run dev)
    ↓
Frontend (npm run dev)
```

### Production Environment

```
Load Balancer
    ↓
┌──────────┬──────────┬──────────┐
│ API      │ API      │ API      │
│ Instance │ Instance │ Instance │
└────┬─────┴────┬─────┴────┬─────┘
     │          │          │
     └──────────┼──────────┘
                ↓
        PostgreSQL (Primary)
                ↓
        PostgreSQL (Replica - optional)
```

---

## Technology Decisions

### Why Monolithic Architecture?

**Reasons**:
- ✅ Simpler to develop and deploy
- ✅ Easier to test
- ✅ Lower operational complexity
- ✅ Can migrate to microservices later if needed

### Why Layered Architecture?

**Reasons**:
- ✅ Clear separation of concerns
- ✅ Easy to test
- ✅ Maintainable
- ✅ Scalable

### Why Prisma?

**Reasons**:
- ✅ Best TypeScript support
- ✅ Type-safe queries
- ✅ Excellent developer experience
- ✅ Simple migrations

---

## Future Architecture Considerations

### Potential Microservices Migration

**If needed in future**:
- Services can be extracted to separate services
- API Gateway pattern for routing
- Service-to-service communication (REST or gRPC)
- Shared database or database per service

**Current Design Supports**:
- ✅ Modular service layer
- ✅ Clear service boundaries
- ✅ Independent service logic
- ✅ API versioning for backward compatibility

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
