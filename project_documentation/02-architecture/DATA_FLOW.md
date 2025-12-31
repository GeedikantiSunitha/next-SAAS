# Data Flow
## NextSaaS - Data Flow Diagrams and Processes

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes how data flows through the NextSaaS application, from user input to database storage and back to the user interface.

---

## Authentication Data Flow

### User Registration Flow

```
1. User submits registration form
   ↓
2. Frontend validates input (client-side)
   ↓
3. Frontend sends POST /api/auth/register
   {
     email: "user@example.com",
     password: "SecurePass123!",
     name: "John Doe"
   }
   ↓
4. Backend receives request
   ↓
5. Validation middleware validates input
   ↓
6. Password strength check
   ↓
7. Check if email exists (database query)
   ↓
8. Hash password (bcrypt)
   ↓
9. Create user record (Prisma → PostgreSQL)
   INSERT INTO users (email, password, name, role)
   ↓
10. Generate JWT tokens (access + refresh)
   ↓
11. Create session record (Prisma → PostgreSQL)
   INSERT INTO sessions (userId, token, expiresAt)
   ↓
12. Set HTTP-only cookies (accessToken, refreshToken)
   ↓
13. Return response
   {
     success: true,
     data: { id, email, name, role }
   }
   ↓
14. Frontend receives response
   ↓
15. User automatically logged in
   ↓
16. Redirect to dashboard
```

### User Login Flow

```
1. User submits login form
   ↓
2. Frontend sends POST /api/auth/login
   {
     email: "user@example.com",
     password: "SecurePass123!"
   }
   ↓
3. Backend receives request
   ↓
4. Validation middleware validates input
   ↓
5. Find user by email (Prisma → PostgreSQL)
   SELECT * FROM users WHERE email = ?
   ↓
6. Compare password (bcrypt.compare)
   ↓
7. If valid:
   - Generate JWT tokens
   - Create session record
   - Set HTTP-only cookies
   - Return user data
   ↓
8. If invalid:
   - Return error (401 Unauthorized)
   ↓
9. Frontend receives response
   ↓
10. If successful: Redirect to dashboard
    If failed: Show error message
```

### Token Refresh Flow

```
1. Access token expires
   ↓
2. Frontend makes API request
   ↓
3. Backend middleware verifies token
   ↓
4. Token invalid/expired
   ↓
5. Frontend detects 401 response
   ↓
6. Frontend sends POST /api/auth/refresh
   (with refreshToken cookie)
   ↓
7. Backend verifies refresh token
   ↓
8. Check session exists and not expired
   SELECT * FROM sessions WHERE token = ? AND expiresAt > NOW()
   ↓
9. Generate new access token
   ↓
10. Update session (optional)
   ↓
11. Set new accessToken cookie
   ↓
12. Return new token
   ↓
13. Frontend retries original request
```

---

## Payment Processing Data Flow

### Create Payment Flow

```
1. User initiates payment
   ↓
2. Frontend sends POST /api/payments
   {
     amount: 100.00,
     currency: "USD",
     description: "Subscription"
   }
   ↓
3. Backend receives request
   ↓
4. Authentication middleware verifies user
   ↓
5. Validation middleware validates input
   ↓
6. Payment service determines provider (from config)
   ↓
7. PaymentProviderFactory creates provider instance
   (Singleton pattern - reuses existing instance)
   ↓
8. Provider creates payment intent
   - Stripe: stripe.paymentIntents.create()
   - Razorpay: razorpay.orders.create()
   - Cashfree: cashfree.pg.orders.create()
   ↓
9. External payment provider returns payment intent
   ↓
10. Create payment record (Prisma → PostgreSQL)
    INSERT INTO payments (userId, provider, amount, status, providerPaymentId)
   ↓
11. Create audit log
    INSERT INTO audit_logs (userId, action, resource, resourceId)
   ↓
12. Return payment intent to frontend
   {
     success: true,
     data: {
       id: "payment_123",
       clientSecret: "pi_xxx_secret_xxx",
       status: "PENDING"
     }
   }
   ↓
13. Frontend receives payment intent
   ↓
14. Frontend redirects to payment provider
    (or shows payment form)
```

### Payment Webhook Flow

```
1. Payment provider sends webhook
   POST /api/payments/webhook/stripe
   ↓
2. Backend receives webhook
   ↓
3. Verify webhook signature
   (to ensure request is from payment provider)
   ↓
4. Parse webhook event
   ↓
5. Update payment record (Prisma → PostgreSQL)
   UPDATE payments SET status = ?, providerPaymentId = ?
   WHERE id = ?
   ↓
6. Create webhook log
   INSERT INTO payment_webhook_logs (paymentId, eventType, payload)
   ↓
7. Create audit log
   INSERT INTO audit_logs (userId, action, resource, resourceId)
   ↓
8. Send notification to user (if payment succeeded)
   ↓
9. Return 200 OK to webhook
```

---

## Notification Data Flow

### Send Notification Flow

```
1. System event occurs (e.g., payment succeeded)
   ↓
2. Service calls notificationService.createNotification()
   ↓
3. Notification service checks user preferences
   SELECT * FROM notification_preferences WHERE userId = ?
   ↓
4. Create notification record (Prisma → PostgreSQL)
   INSERT INTO notifications (userId, type, channel, title, message)
   ↓
5. If email enabled:
   - Render email template (Handlebars)
   - Send email via Resend
   ↓
6. If in-app enabled:
   - Notification already in database
   - Frontend polls or uses WebSocket (future)
   ↓
7. Create audit log
   INSERT INTO audit_logs (userId, action, resource)
```

### User Views Notifications Flow

```
1. User navigates to notifications page
   ↓
2. Frontend sends GET /api/notifications
   ↓
3. Backend receives request
   ↓
4. Authentication middleware verifies user
   ↓
5. Query notifications (Prisma → PostgreSQL)
   SELECT * FROM notifications 
   WHERE userId = ? 
   ORDER BY createdAt DESC 
   LIMIT 20
   ↓
6. Return notifications
   {
     success: true,
     data: [
       {
         id: "notif_123",
         type: "SUCCESS",
         title: "Payment Successful",
         message: "Your payment of $100 was processed",
         read: false,
         createdAt: "2025-12-23T10:00:00Z"
       }
     ]
   }
   ↓
7. Frontend displays notifications
```

---

## Profile Update Data Flow

```
1. User updates profile form
   ↓
2. Frontend validates input (client-side)
   ↓
3. Frontend sends PUT /api/profile
   {
     name: "Updated Name",
     email: "newemail@example.com"
   }
   ↓
4. Backend receives request
   ↓
5. Authentication middleware verifies user
   ↓
6. Validation middleware validates input
   ↓
7. Check email uniqueness (if email changed)
   SELECT * FROM users WHERE email = ? AND id != ?
   ↓
8. Update user record (Prisma → PostgreSQL)
   UPDATE users SET name = ?, email = ?, updatedAt = NOW()
   WHERE id = ?
   ↓
9. Create audit log
   INSERT INTO audit_logs (userId, action, resource, resourceId, details)
   ↓
10. Return updated user data
   {
     success: true,
     data: { id, email, name, role }
   }
   ↓
11. Frontend receives response
   ↓
12. Update React Query cache
   ↓
13. Show success toast notification
```

---

## Audit Logging Data Flow

### Automatic Audit Logging

```
1. User action occurs (any protected endpoint)
   ↓
2. Route handler processes request
   ↓
3. Service layer executes business logic
   ↓
4. Service calls createAuditLog()
   ↓
5. Audit service creates log entry (Prisma → PostgreSQL)
   INSERT INTO audit_logs (
     userId,
     action,
     resource,
     resourceId,
     details,
     ipAddress,
     userAgent
   )
   ↓
6. Log entry persisted
   (No response needed - async operation)
```

### Admin Views Audit Logs Flow

```
1. Admin navigates to audit logs page
   ↓
2. Frontend sends GET /api/admin/audit-logs?page=1&limit=50
   ↓
3. Backend receives request
   ↓
4. Authentication middleware verifies admin role
   ↓
5. Query audit logs (Prisma → PostgreSQL)
   SELECT * FROM audit_logs
   WHERE userId = ? OR userId IS NULL
   ORDER BY createdAt DESC
   LIMIT 50 OFFSET 0
   ↓
6. Return audit logs with pagination
   {
     success: true,
     data: {
       logs: [...],
       pagination: {
         page: 1,
         limit: 50,
         total: 1000,
         totalPages: 20
       }
     }
   }
   ↓
7. Frontend displays audit logs table
```

---

## GDPR Data Export Flow

```
1. User requests data export
   ↓
2. Frontend sends POST /api/gdpr/export
   ↓
3. Backend receives request
   ↓
4. Authentication middleware verifies user
   ↓
5. Create export request (Prisma → PostgreSQL)
   INSERT INTO data_export_requests (userId, status)
   ↓
6. Generate export data
   - Query all user data
   - Format as JSON
   - Create download link (temporary, expires in 7 days)
   ↓
7. Update export request
   UPDATE data_export_requests SET status = 'COMPLETED', downloadUrl = ?
   ↓
8. Send email with download link
   ↓
9. Return export request
   {
     success: true,
     data: {
       id: "export_123",
       downloadUrl: "https://...",
       expiresAt: "2025-12-30T10:00:00Z"
     }
   }
   ↓
10. Frontend shows success message
```

---

## Database Transaction Flow

### Example: Payment with Audit Logging

```
1. Begin transaction
   ↓
2. Create payment record
   INSERT INTO payments (...)
   ↓
3. Create audit log
   INSERT INTO audit_logs (...)
   ↓
4. Create notification
   INSERT INTO notifications (...)
   ↓
5. Commit transaction
   ↓
6. If any step fails:
   - Rollback transaction
   - Return error
```

**Note**: Prisma handles transactions automatically for related operations, but explicit transactions can be used for complex operations.

---

## Error Data Flow

### Error Handling Flow

```
1. Error occurs (anywhere in stack)
   ↓
2. Error caught by try-catch or error handler
   ↓
3. Error transformed to AppError
   ↓
4. Error logged (Winston)
   - Log level: ERROR
   - Includes: message, stack, requestId, userId, ipAddress
   ↓
5. Error sent to Sentry (if configured)
   ↓
6. Error handler middleware formats response
   {
     success: false,
     error: "User-friendly error message",
     requestId: "req_123"
   }
   ↓
7. Response sent to client
   ↓
8. Frontend receives error
   ↓
9. Frontend displays error toast/alert
```

---

## Caching Data Flow (Future)

### React Query Caching

```
1. Frontend requests data
   GET /api/profile
   ↓
2. React Query checks cache
   ↓
3. If cached and fresh:
   - Return cached data immediately
   - No API call
   ↓
4. If not cached or stale:
   - Make API call
   - Store in cache
   - Return data
   ↓
5. Cache invalidated on mutations
   (e.g., profile update invalidates profile cache)
```

---

## Real-Time Data Flow (Future)

### WebSocket Flow (Not Currently Implemented)

```
1. User connects via WebSocket
   ↓
2. Server authenticates connection (JWT)
   ↓
3. Server subscribes user to channels
   ↓
4. Event occurs (e.g., new notification)
   ↓
5. Server sends event to subscribed clients
   ↓
6. Frontend receives event
   ↓
7. Frontend updates UI (e.g., notification badge)
```

---

## Data Flow Principles

### 1. Single Source of Truth
- Database is the single source of truth
- Frontend state is derived from API responses
- React Query manages server state

### 2. Data Validation
- Client-side validation (UX)
- Server-side validation (Security)
- Database constraints (Data integrity)

### 3. Error Handling
- Errors caught at each layer
- User-friendly error messages
- Detailed error logging

### 4. Audit Trail
- All important actions logged
- Immutable audit logs
- Complete user activity history

### 5. Security
- Authentication required for protected endpoints
- Authorization checked before data access
- Input sanitized at every layer

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
