# Backend Services
## NextSaaS - Service Layer Components

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes all backend services, their responsibilities, methods, and usage patterns.

---

## Service Architecture

### Service Layer Pattern

```
Routes → Services → Prisma → PostgreSQL
```

**Principles**:
- Services contain business logic
- Services are independent and testable
- Services use Prisma for data access
- Services handle errors and logging

---

## Authentication Services

### authService

**Location**: `backend/src/services/authService.ts`

**Purpose**: User authentication and session management

**Key Functions**:

#### `register(email, password, name?, ipAddress?, userAgent?)`
- Registers new user
- Validates password strength
- Hashes password (bcrypt)
- Creates user record
- Generates JWT tokens
- Creates session
- Logs audit trail

#### `login(email, password, ipAddress?, userAgent?)`
- Validates credentials
- Compares password hash
- Generates JWT tokens
- Creates session
- Logs audit trail

#### `logout(userId, token?)`
- Invalidates refresh token
- Deletes session record
- Logs audit trail

#### `refreshToken(refreshToken)`
- Verifies refresh token
- Checks session validity
- Generates new access token
- Returns new token

#### `forgotPassword(email)`
- Generates reset token
- Creates password reset record
- Sends reset email
- Logs audit trail

#### `resetPassword(token, newPassword)`
- Validates reset token
- Checks expiration
- Updates password
- Invalidates token
- Logs audit trail

**Dependencies**:
- `prisma` (database)
- `bcrypt` (password hashing)
- `jsonwebtoken` (token generation)
- `emailService` (password reset emails)
- `auditService` (audit logging)

---

### oauthService

**Location**: `backend/src/services/oauthService.ts`

**Purpose**: OAuth authentication (Google, GitHub, Microsoft)

**Key Functions**:

#### `createOrUpdateUserFromOAuth(provider, profile)`
- Creates or updates user from OAuth profile
- Handles OAuth login flow
- Returns user record

#### `linkOAuthToUser(userId, provider, profile)`
- Links OAuth provider to existing user account
- Validates OAuth profile
- Updates user record
- Returns updated user

#### `unlinkOAuthFromUser(userId, provider)`
- Unlinks OAuth provider from user account
- Validates user has password (if removing last OAuth)
- Updates user record
- Returns updated user

#### `getUserOAuthMethods(userId)`
- Retrieves user's linked OAuth providers
- Returns array of provider names

**Dependencies**:
- `prisma` (database)
- External OAuth APIs (Google, GitHub, Microsoft)

---

### mfaService

**Location**: `backend/src/services/mfaService.ts`

**Purpose**: Multi-factor authentication

**Key Functions**:

#### `setupTotp(userId)`
- Generates TOTP secret
- Creates MFA method record
- Returns QR code data and secret

#### `setupEmailMfa(userId)`
- Sets up email-based MFA
- Creates MFA method record
- Returns setup confirmation

#### `verifyTotp(userId, token)`
- Verifies TOTP code
- Validates against secret
- Returns true/false

#### `verifyEmailOtp(userId, otp)`
- Verifies email OTP
- Checks expiration
- Returns true/false

#### `enableMfa(userId, method, code)`
- Enables MFA method
- Verifies setup code first
- Sets method as enabled
- Sets as primary if first method

#### `disableMfa(userId, method)`
- Disables MFA method
- Removes method record
- Cleans up related data

#### `generateBackupCodes(userId)`
- Generates backup codes
- Stores hashed codes
- Returns plain codes (one-time display)

#### `verifyBackupCode(userId, code)`
- Verifies backup code
- Marks code as used
- Returns true/false

#### `getMfaMethods(userId)`
- Retrieves user's MFA methods
- Returns methods with status

#### `sendEmailOtp(userId)`
- Generates email OTP
- Sends OTP email
- Stores OTP (hashed)
- Returns success confirmation

**Dependencies**:
- `prisma` (database)
- `speakeasy` (TOTP generation)
- `qrcode` (QR code generation)
- `emailService` (email OTP)

---

## User Management Services

### profileService

**Location**: `backend/src/services/profileService.ts`

**Purpose**: User profile management

**Key Functions**:

#### `getProfile(userId)`
- Retrieves user profile
- Returns user data (excluding password)

#### `updateProfile(userId, data, ipAddress?, userAgent?)`
- Updates user profile
- Validates email uniqueness (if changed)
- Sends email notification (if email changed)
- Logs audit trail
- Captures IP and user agent

#### `changePassword(userId, currentPassword, newPassword, ipAddress?, userAgent?)`
- Validates current password
- Validates new password strength
- Updates password hash
- Logs audit trail
- Captures IP and user agent

**Dependencies**:
- `prisma` (database)
- `emailService` (email change notifications)
- `auditService` (audit logging)

---

### adminUserService

**Location**: `backend/src/services/adminUserService.ts`

**Purpose**: Admin user management

**Key Functions**:

#### `listUsers(params, adminUserId)`
- Lists users with filters
- Supports pagination
- Supports search (email, name)
- Supports filtering (role, status)
- Returns paginated user list

#### `getUserById(userId, adminUserId)`
- Retrieves user by ID
- Includes related data (sessions, etc.)
- Validates admin access

#### `createUser(data, adminUserId)`
- Creates new user
- Validates email uniqueness
- Hashes password
- Logs audit trail

#### `updateUser(userId, data, adminUserId)`
- Updates user information
- Validates role changes (SUPER_ADMIN only)
- Handles password updates
- Logs audit trail

#### `deleteUser(userId, adminUserId)`
- Soft deletes user
- Handles related data cleanup
- Logs audit trail

#### `getUserSessions(userId, adminUserId)`
- Lists user sessions
- Returns active sessions
- Validates admin access

#### `revokeUserSession(userId, sessionId, adminUserId)`
- Revokes specific user session
- Deletes session record
- Logs audit trail

#### `getUserActivity(userId, params, adminUserId)`
- Gets user activity log
- Returns audit logs for user
- Supports pagination

**Dependencies**:
- `prisma` (database)
- `auditService` (audit logging)

---

## Payment Services

### paymentService

**Location**: `backend/src/services/paymentService.ts`

**Purpose**: Payment processing

**Key Functions**:

#### `createPayment(params)`
- Creates payment intent
- Uses PaymentProviderFactory
- Stores payment record
- Returns payment with client secret
- Logs audit trail

#### `capturePayment(paymentId, userId, amount?)`
- Captures payment
- Updates payment status
- Handles provider-specific logic
- Logs audit trail

#### `refundPayment(params)`
- Processes refund
- Supports full/partial refunds
- Updates payment status
- Creates refund record
- Logs audit trail
- Params: paymentId, userId, amount, reason

#### `getPayment(paymentId, userId)`
- Retrieves payment
- Validates user access
- Returns payment details

#### `getUserPayments(userId, page, pageSize, status?)`
- Lists user payments
- Supports filtering (status)
- Supports pagination
- Returns paginated payment list

#### `handleWebhook(provider, payload, signature)`
- Verifies webhook signature
- Processes webhook event
- Updates payment status
- Creates webhook log entry
- Returns processing result

**Dependencies**:
- `prisma` (database)
- `PaymentProviderFactory` (payment providers)
- `auditService` (audit logging)

---

### adminPaymentsService

**Location**: `backend/src/services/adminPaymentsService.ts`

**Purpose**: Admin payment management

**Key Functions**:

#### `getPayments(filters, adminUserId)`
- Lists all payments with filters
- Supports filtering (userId, status, date range)
- Supports pagination
- Returns paginated payment list

#### `getSubscriptions(filters, adminUserId)`
- Lists subscriptions with filters
- Supports filtering (userId, status)
- Returns subscription list

**Dependencies**:
- `prisma` (database)

---

## Notification Services

### notificationService

**Location**: `backend/src/services/notificationService.ts`

**Purpose**: Notification management

**Key Functions**:

#### `createNotification(params)`
- Creates notification record
- Respects user preferences
- Sends email (if enabled)
- Params: userId, type, channel, title, message, data?
- Returns notification

#### `getUserNotifications(userId, filters)`
- Lists user notifications
- Supports filtering (unreadOnly)
- Supports pagination (limit, offset)
- Returns notification array

#### `markAsRead(notificationId, userId)`
- Marks notification as read
- Updates read timestamp

#### `markAllAsRead(userId)`
- Marks all user notifications as read

#### `deleteNotification(notificationId, userId)`
- Deletes notification
- Validates user ownership

#### `getUnreadCount(userId)`
- Returns unread notification count

#### `getUserPreferences(userId)`
- Retrieves notification preferences

#### `updateUserPreferences(userId, preferences)`
- Updates notification preferences
- Validates preference values
- Returns updated preferences

**Dependencies**:
- `prisma` (database)
- `emailService` (email notifications)

---

### emailService

**Location**: `backend/src/services/emailService.ts`

**Purpose**: Email sending

**Key Functions**:

#### `sendWelcomeEmail(params)`
- Sends welcome email
- Uses Handlebars template
- Protects PII in logs

#### `sendPasswordResetEmail(params)`
- Sends password reset email
- Includes reset link
- Protects PII in logs

#### `sendVerificationEmail(params)`
- Sends email verification
- Includes verification link

#### `sendNotificationEmail(params)`
- Sends generic notification email
- Customizable content

#### `sendMFAOTPEmail(params)`
- Sends MFA OTP email
- Includes OTP code

**Dependencies**:
- `resend` (email API)
- `handlebars` (template rendering)

---

## Audit & Compliance Services

### auditService

**Location**: `backend/src/services/auditService.ts`

**Purpose**: Audit logging

**Key Functions**:

#### `createAuditLog(params)`
- Creates audit log entry
- Includes user, action, resource, details
- Captures IP address and user agent
- Returns audit log

#### `getAuditLogs(filters, pagination)`
- Lists audit logs
- Supports filtering (user, action, resource, date range)
- Supports pagination
- Returns audit log array

#### `getAuditLogById(id)`
- Retrieves specific audit log by ID
- Returns audit log or null

#### `getUserAuditLogs(userId, pagination)`
- Gets audit logs for specific user
- Supports pagination
- Returns audit log array

#### `getResourceAuditLogs(resource, resourceId?, pagination)`
- Gets audit logs for resource type
- Optionally filters by resource ID
- Supports pagination
- Returns audit log array

#### `deleteOldAuditLogs(daysToKeep)`
- Deletes audit logs older than specified days
- Returns count of deleted logs

#### `getAuditStats(filters?)`
- Calculates audit statistics
- Actions by type
- Recent activity
- Supports date range filtering

**Dependencies**:
- `prisma` (database)

---

### adminAuditService

**Location**: `backend/src/services/adminAuditService.ts`

**Purpose**: Admin audit log management

**Key Functions**:

#### `getAuditLogs(filters, adminUserId)`
- Lists all audit logs
- Admin-only access
- Advanced filtering (user, action, resource, date range)
- Supports pagination
- Returns paginated audit log list

#### `exportAuditLogs(filters, format)`
- Exports audit logs
- Supports CSV, JSON formats
- Returns export data as string

**Dependencies**:
- `prisma` (database)

---

### gdprService

**Location**: `backend/src/services/gdprService.ts`

**Purpose**: GDPR compliance

**Key Functions**:

#### `requestDataExport(userId)`
- Creates export request
- Returns export request record

#### `generateDataExport(requestId)`
- Generates data export file
- Collects all user data
- Creates download link
- Sends email with link
- Returns export data

#### `getUserExportRequests(userId)`
- Retrieves user's export requests
- Returns export request list

#### `requestDataDeletion(userId, deletionType, reason?)`
- Creates deletion request
- Generates confirmation token
- Sends confirmation email
- Returns deletion request

#### `getUserDeletionRequests(userId)`
- Retrieves user's deletion requests
- Returns deletion request list

#### `confirmDataDeletion(token)`
- Confirms deletion request using token
- Processes deletion (soft/hard)
- Sends confirmation email
- Returns deletion status

#### `executeDataDeletion(requestId)`
- Executes the actual data deletion
- Handles soft/hard deletion
- Cleans up related data

#### `grantConsent(userId, consentType, ipAddress?, userAgent?)`
- Grants user consent
- Creates consent record
- Logs consent history
- Captures IP and user agent

#### `revokeConsent(userId, consentType, ipAddress?, userAgent?)`
- Revokes user consent
- Updates consent record
- Logs consent history
- Captures IP and user agent

#### `getUserConsents(userId)`
- Retrieves user consents
- Returns consent status array

#### `hasConsent(userId, consentType)`
- Checks if user has specific consent
- Returns true/false

**Dependencies**:
- `prisma` (database)
- `emailService` (confirmation emails)
- `auditService` (audit logging)

---

## RBAC Services

### rbacService

**Location**: `backend/src/services/rbacService.ts`

**Purpose**: Role-based access control

**Key Functions**:

#### `getUserRole(userId)`
- Retrieves user role
- Returns Role enum value

#### `hasRole(userId, role)`
- Checks if user has specific role
- Returns true/false

#### `hasAnyRole(userId, roles)`
- Checks if user has any of the specified roles
- Returns true/false

#### `hasAllRoles(userId, roles)`
- Checks if user has all specified roles
- Returns true/false

#### `isAdmin(userId)`
- Checks if user is ADMIN or SUPER_ADMIN
- Returns true/false

#### `isSuperAdmin(userId)`
- Checks if user is SUPER_ADMIN
- Returns true/false

#### `getUsersByRole(role)`
- Lists users by role
- Returns user list

#### `updateUserRole(userId, newRole)`
- Updates user role
- SUPER_ADMIN only
- Validates role hierarchy
- Logs audit trail

#### `canAccessResource(userId, resourceType, resourceOwnerId)`
- Checks if user can access specific resource
- Validates ownership or admin status
- Returns true/false

#### `getRoleHierarchy(role)`
- Returns hierarchy level for role
- Higher number = more privileges

#### `hasHigherRole(userId1, userId2)`
- Compares roles of two users
- Returns true if user1 has higher role

#### `requireRoles(userId, roles)`
- Throws error if user doesn't have required roles
- Used in middleware

#### `requireAdmin(userId)`
- Throws error if user is not admin
- Used in middleware

#### `requireSuperAdmin(userId)`
- Throws error if user is not super admin
- Used in middleware

**Dependencies**:
- `prisma` (database)
- `auditService` (audit logging)

---

## Feature Flags Services

### featureFlagsService

**Location**: `backend/src/services/featureFlagsService.ts`

**Purpose**: Feature flag management

**Key Functions**:

#### `getFeatureFlag(flagName, defaultValue?)`
- Retrieves feature flag value
- Returns string value or default

#### `getFeatureFlagAsNumber(flagName, defaultValue?)`
- Retrieves feature flag as number
- Returns number value or default

#### `getFeatureFlagAsBoolean(flagName, defaultValue?)`
- Retrieves feature flag as boolean
- Returns boolean value or default

#### `isFeatureEnabled(flagName)`
- Checks if feature is enabled
- Returns true/false

#### `getAllFeatureFlags()`
- Lists all feature flags
- Returns flag definitions object

#### `clearCache()`
- Clears feature flag cache
- Forces reload from database

#### `disableCache()`
- Disables caching
- Always reads from database

#### `enableCache()`
- Enables caching
- Improves performance

**Dependencies**:
- `prisma` (database)

---

### adminFeatureFlagsService

**Location**: `backend/src/services/adminFeatureFlagsService.ts`

**Purpose**: Admin feature flag management

**Key Functions**:

#### `getAllFeatureFlags(adminUserId)`
- Lists all feature flags
- Returns flag definitions
- Validates admin access

#### `updateFeatureFlag(key, enabled, adminUserId)`
- Updates feature flag
- Logs audit trail
- Clears cache
- Returns updated flag

**Dependencies**:
- `prisma` (database)
- `auditService` (audit logging)
- `featureFlagsService` (cache management)

---

## Admin Services

### adminMonitoringService

**Location**: `backend/src/services/adminMonitoringService.ts`

**Purpose**: System monitoring and metrics

**Key Functions**:

#### `getSystemMetrics()`
- Retrieves system metrics
- Request count, error rate, latency
- Memory usage
- Returns metrics object

#### `getDatabaseMetrics()`
- Retrieves database metrics
- User counts, session counts
- Audit log counts
- Table sizes
- Returns metrics object

#### `getApiMetrics()`
- Retrieves API usage metrics
- Endpoint usage statistics
- Error rates by endpoint
- Response times
- Returns metrics object

#### `getRecentErrors(limit)`
- Retrieves recent errors
- From logs or error tracking
- Returns error list

**Dependencies**:
- `prisma` (database)
- `prom-client` (Prometheus metrics)

---

### adminSettingsService

**Location**: `backend/src/services/adminSettingsService.ts`

**Purpose**: System settings management

**Key Functions**:

#### `getSettings(adminUserId)`
- Retrieves system settings
- Returns settings object
- Validates admin access

#### `updateSettings(settings, adminUserId)`
- Updates system settings
- Validates settings
- Logs audit trail
- Returns updated settings

**Dependencies**:
- `prisma` (database)
- `auditService` (audit logging)

---

## Service Patterns

### 1. Error Handling

**Pattern**: Services throw custom errors
```typescript
throw new NotFoundError('User not found');
throw new ValidationError('Invalid email');
throw new ConflictError('Email already exists');
```

### 2. Audit Logging

**Pattern**: Services log important actions
```typescript
await createAuditLog({
  userId,
  action: 'USER_UPDATED',
  resource: 'users',
  resourceId: userId,
});
```

### 3. Transaction Management

**Pattern**: Services use Prisma transactions for atomic operations
```typescript
await prisma.$transaction(async (tx) => {
  // Multiple operations
});
```

### 4. Input Validation

**Pattern**: Services validate inputs before processing
```typescript
if (!email || !isValidEmail(email)) {
  throw new ValidationError('Invalid email');
}
```

---

## Service Dependencies

### Common Dependencies

- **prisma**: Database access
- **logger**: Logging (Winston)
- **auditService**: Audit logging
- **emailService**: Email sending

### Service-Specific Dependencies

- **authService**: bcrypt, jsonwebtoken
- **paymentService**: PaymentProviderFactory
- **mfaService**: speakeasy, qrcode
- **oauthService**: External OAuth APIs
- **adminMonitoringService**: prom-client

---

## Service Testing

### Testing Approach

- **Unit Tests**: Test service functions in isolation
- **Integration Tests**: Test services with database
- **Mock Dependencies**: Mock external services

### Test Coverage

- ✅ All services have test coverage
- ✅ Critical paths are tested
- ✅ Error cases are tested
- ✅ Edge cases are tested

---

## Service Best Practices

### 1. Single Responsibility
- Each service has one clear purpose

### 2. Stateless
- Services don't maintain state
- All state in database

### 3. Error Handling
- Services throw appropriate errors
- Errors are logged

### 4. Logging
- Important actions are logged
- PII is masked in logs

### 5. Testing
- Services are fully tested
- Tests are maintainable

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
