# Component Interactions
## NextSaaS - Component Relationships and Interactions

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes how components interact with each other in the NextSaaS application, including frontend components, backend services, and external systems.

---

## Backend Component Interactions

### Authentication Flow Components

```
┌─────────────┐
│   Routes    │  /api/auth/login
│  (auth.ts)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │  Validation, Rate Limiting
│ (validation)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  authService.login()
│(authService)│
└──────┬──────┘
       │
       ├──► ┌─────────────┐
       │    │   Prisma    │  Find user
       │    │   (ORM)     │
       │    └─────────────┘
       │
       ├──► ┌─────────────┐
       │    │   bcrypt    │  Compare password
       │    └─────────────┘
       │
       ├──► ┌─────────────┐
       │    │     JWT     │  Generate tokens
       │    └─────────────┘
       │
       └──► ┌─────────────┐
            │   Prisma    │  Create session
            │   (ORM)     │
            └─────────────┘
```

### Payment Processing Components

```
┌─────────────┐
│   Routes    │  /api/payments
│(payments.ts)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  paymentService.createPayment()
│(paymentService)│
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ PaymentProviderFactory│  getProvider()
└──────┬──────────────┘
       │
       ├──► ┌─────────────┐
       │    │StripeProvider│  createPayment()
       │    └──────┬───────┘
       │           │
       │           ▼
       │    ┌─────────────┐
       │    │   Stripe    │  External API
       │    │     API     │
       │    └─────────────┘
       │
       ├──► ┌─────────────┐
       │    │RazorpayProvider│
       │    └─────────────┘
       │
       └──► ┌─────────────┐
            │CashfreeProvider│
            └─────────────┘
```

---

## Frontend Component Interactions

### Authentication Context Flow

```
┌─────────────────┐
│   App.tsx       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthProvider    │  Provides auth context
│  (AuthContext)   │
└────────┬────────┘
         │
         ├──► ┌─────────────┐
         │    │  Login Page  │  Uses useAuth()
         │    └─────────────┘
         │
         ├──► ┌─────────────┐
         │    │  Dashboard  │  Uses useAuth()
         │    └─────────────┘
         │
         └──► ┌─────────────┐
              │  Profile    │  Uses useAuth()
              └─────────────┘
```

### Data Fetching Flow

```
┌─────────────┐
│  Component  │  ProfilePage
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  useQuery   │  React Query hook
│(React Query)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Client │  profileApi.getProfile()
│  (axios)    │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────┐
│   Backend   │  /api/profile
│     API     │
└─────────────┘
```

---

## Cross-Layer Interactions

### Full Request-Response Cycle

```
┌─────────────────────────────────────────┐
│         Frontend Layer                   │
│  ┌──────────┐      ┌──────────┐         │
│  │Component │─────►│ API Client│        │
│  └──────────┘      └─────┬────┘         │
└──────────────────────────┼──────────────┘
                            │ HTTP Request
                            ▼
┌─────────────────────────────────────────┐
│         Backend Layer                    │
│  ┌──────────┐      ┌──────────┐         │
│  │  Route   │─────►│ Middleware│         │
│  └────┬─────┘      └─────┬────┘         │
│       │                  │              │
│       ▼                  ▼              │
│  ┌──────────┐      ┌──────────┐         │
│  │ Service  │─────►│  Prisma  │         │
│  └──────────┘      └─────┬────┘         │
└──────────────────────────┼──────────────┘
                            │ SQL Query
                            ▼
┌─────────────────────────────────────────┐
│         Database Layer                    │
│  ┌──────────┐                           │
│  │PostgreSQL│                           │
│  └──────────┘                           │
└─────────────────────────────────────────┘
```

---

## Service-to-Service Interactions

### Notification Service Integration

```
┌─────────────┐
│PaymentService│  Payment succeeded
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Notification │  createNotification()
│  Service    │
└──────┬──────┘
       │
       ├──► ┌─────────────┐
       │    │ EmailService│  Send email
       │    └──────┬──────┘
       │           │
       │           ▼
       │    ┌─────────────┐
       │    │   Resend    │  External API
       │    └─────────────┘
       │
       └──► ┌─────────────┐
            │   Prisma    │  Create notification
            │   (ORM)     │
            └─────────────┘
```

### Audit Logging Integration

```
┌─────────────┐
│ Any Service │  User action
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ AuditService│  createAuditLog()
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Prisma    │  Insert audit log
│   (ORM)     │
└─────────────┘
```

---

## External Service Interactions

### Payment Provider Integration

```
┌─────────────┐
│PaymentService│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│PaymentProvider  │
│    Factory      │
└──────┬──────────┘
       │
       ├──► ┌─────────────┐
       │    │   Stripe    │  HTTPS API
       │    │   Provider  │
       │    └─────────────┘
       │
       ├──► ┌─────────────┐
       │    │  Razorpay   │  HTTPS API
       │    │   Provider  │
       │    └─────────────┘
       │
       └──► ┌─────────────┐
            │  Cashfree   │  HTTPS API
            │   Provider  │
            └─────────────┘
```

### Email Service Integration

```
┌─────────────┐
│EmailService │
└──────┬──────┘
       │
       ├──► ┌─────────────┐
       │    │  Handlebars │  Render template
       │    └─────────────┘
       │
       └──► ┌─────────────┐
            │   Resend     │  Send email
            │     API      │
            └─────────────┘
```

### OAuth Integration

```
┌─────────────┐
│ OAuthService  │
└──────┬──────┘
       │
       ├──► ┌─────────────┐
       │    │   Google    │  Verify token
       │    │     API     │
       │    └─────────────┘
       │
       ├──► ┌─────────────┐
       │    │   GitHub    │  Verify token
       │    │     API     │
       │    └─────────────┘
       │
       └──► ┌─────────────┐
            │  Microsoft  │  Verify token
            │     API     │
            └─────────────┘
```

---

## Frontend Component Hierarchy

### Page Component Structure

```
App.tsx
  ├── AuthProvider
  │     ├── BrowserRouter
  │     │     ├── Routes
  │     │     │     ├── Landing
  │     │     │     ├── Login
  │     │     │     │     └── OAuthButtons
  │     │     │     ├── Register
  │     │     │     ├── Dashboard
  │     │     │     │     └── Header
  │     │     │     ├── Profile
  │     │     │     │     ├── ProfileForm
  │     │     │     │     └── PasswordForm
  │     │     │     └── AdminLayout
  │     │     │           ├── AdminDashboard
  │     │     │           ├── AdminUsers
  │     │     │           └── AdminAuditLogs
  │     │     └── Toaster
  │     └── ErrorBoundary
  └── QueryClientProvider
```

---

## Component Communication Patterns

### 1. Props Down, Events Up

**Pattern**: Parent passes data down, child emits events up

**Example**:
```typescript
// Parent component
<ProfileForm 
  user={user}           // Props down
  onUpdate={handleUpdate} // Callback up
/>

// Child component
function ProfileForm({ user, onUpdate }) {
  const handleSubmit = () => {
    // Update logic
    onUpdate(updatedUser); // Event up
  };
}
```

### 2. Context API

**Pattern**: Shared state via context

**Example**:
```typescript
// Provider
<AuthContext.Provider value={{ user, login, logout }}>
  {children}
</AuthContext.Provider>

// Consumer
const { user, login } = useAuth();
```

### 3. React Query

**Pattern**: Server state management

**Example**:
```typescript
// Data fetching
const { data, isLoading } = useQuery({
  queryKey: ['profile'],
  queryFn: () => profileApi.getProfile()
});

// Mutations
const mutation = useMutation({
  mutationFn: profileApi.updateProfile,
  onSuccess: () => {
    queryClient.invalidateQueries(['profile']);
  }
});
```

---

## Backend Service Dependencies

### Service Dependency Graph

```
authService
  ├── prisma (User, Session)
  ├── bcrypt (password hashing)
  ├── jwt (token generation)
  └── emailService (password reset)

paymentService
  ├── PaymentProviderFactory
  │     ├── StripeProvider
  │     ├── RazorpayProvider
  │     └── CashfreeProvider
  ├── prisma (Payment, PaymentRefund)
  └── auditService (audit logging)

notificationService
  ├── prisma (Notification, NotificationPreference)
  ├── emailService (email notifications)
  └── auditService (audit logging)

profileService
  ├── prisma (User)
  ├── emailService (email change notification)
  └── auditService (audit logging)

adminUserService
  ├── prisma (User, Session, AuditLog)
  ├── rbacService (role checking)
  └── auditService (audit logging)
```

---

## Data Flow Between Components

### Profile Update Flow

```
1. ProfilePage component
   ↓
2. ProfileForm component (user input)
   ↓
3. React Hook Form validation
   ↓
4. useMutation hook (React Query)
   ↓
5. profileApi.updateProfile() (API client)
   ↓
6. HTTP PUT /api/profile
   ↓
7. Backend route handler
   ↓
8. Validation middleware
   ↓
9. profileService.updateProfile()
   ↓
10. Prisma update user
   ↓
11. auditService.createAuditLog()
   ↓
12. Response returned
   ↓
13. React Query cache invalidation
   ↓
14. ProfilePage re-renders with new data
```

---

## Error Propagation

### Error Flow Through Layers

```
1. Error occurs in Service layer
   ↓
2. Service throws AppError
   ↓
3. Route handler catches error
   ↓
4. Error logged (Winston)
   ↓
5. Error sent to Sentry (if configured)
   ↓
6. Error handler middleware formats response
   ↓
7. HTTP error response sent
   ↓
8. Frontend API client receives error
   ↓
9. React Query handles error
   ↓
10. Component receives error state
   ↓
11. Error displayed to user (toast/alert)
```

---

## Component Lifecycle Interactions

### Authentication State Lifecycle

```
1. App mounts
   ↓
2. AuthProvider initializes
   ↓
3. Check for existing session (cookies)
   ↓
4. If valid: Set user state
   If invalid: Clear user state
   ↓
5. Components using useAuth() receive state
   ↓
6. Protected routes check authentication
   ↓
7. Redirect if not authenticated
```

---

## Async Operation Interactions

### Concurrent Operations

```
User Action: Update profile and change password
   ↓
┌─────────────────┬─────────────────┐
│  Profile Update │ Password Change │
│     (async)     │     (async)     │
└────────┬────────┴────────┬────────┘
         │                 │
         ▼                 ▼
   API Request 1    API Request 2
         │                 │
         └────────┬────────┘
                  │
                  ▼
         React Query manages
         both requests
                  │
         └────────┬────────┘
                  │
                  ▼
         Both complete
                  │
                  ▼
         UI updates with
         both results
```

---

## Component Interaction Principles

### 1. Single Responsibility
- Each component has one clear purpose
- Components don't do too much

### 2. Loose Coupling
- Components don't depend on specific implementations
- Use interfaces and abstractions

### 3. High Cohesion
- Related functionality grouped together
- Components are focused and cohesive

### 4. Clear Interfaces
- Components have clear input/output
- Well-defined props and callbacks

### 5. Dependency Direction
- Dependencies flow in one direction
- No circular dependencies

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
