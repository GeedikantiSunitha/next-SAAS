# Database Schema Details
## NextSaaS - Database Models and Relationships

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes the complete database schema, including all models, relationships, indexes, and constraints.

---

## Database Technology

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Schema File**: `backend/prisma/schema.prisma`

---

## Core Models

### User Model

**Table**: `users`

**Purpose**: User accounts and authentication

**Fields**:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String?  // Optional for OAuth users
  name      String?
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // OAuth fields
  oauthProvider   String?
  oauthProviderId String?
  oauthEmail      String?
  emailVerified   Boolean   @default(false)
  emailVerifiedAt DateTime?

  // Relations
  sessions                Session[]
  auditLogs               AuditLog[]
  passwordResets          PasswordReset[]
  notifications           Notification[]
  notificationPreferences NotificationPreference?
  payments                Payment[]
  subscriptions           Subscription[]
  dataExportRequests      DataExportRequest[]
  dataDeletionRequests    DataDeletionRequest[]
  consentRecords          ConsentRecord[]
  mfaMethods              MfaMethod[]
  mfaBackupCodes          MfaBackupCode[]
}
```

**Indexes**:
- `email` (unique)
- `[oauthProvider, oauthProviderId]` (unique, composite)

**Constraints**:
- Email must be unique
- OAuth provider + provider ID must be unique (if both present)

---

### Session Model

**Table**: `sessions`

**Purpose**: Refresh token storage

**Fields**:
```prisma
model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  userAgent String?
  ipAddress String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Indexes**:
- `userId`
- `token` (unique)
- `expiresAt`

**Relations**:
- Belongs to `User` (cascade delete)

---

### PasswordReset Model

**Table**: `password_resets`

**Purpose**: Password reset tokens

**Fields**:
```prisma
model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Indexes**:
- `userId`
- `token` (unique)
- `expiresAt`

**Relations**:
- Belongs to `User` (cascade delete)

---

## Audit & Logging Models

### AuditLog Model

**Table**: `audit_logs`

**Purpose**: Audit trail for all important actions

**Fields**:
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  action     String
  resource   String?
  resourceId String?
  details    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

**Indexes**:
- `userId`
- `action`
- `createdAt`

**Relations**:
- Optional belongs to `User` (set null on delete)

**Notes**:
- Immutable (no updates/deletes)
- JSON details field for flexible data storage

---

## Notification Models

### Notification Model

**Table**: `notifications`

**Purpose**: In-app notifications

**Fields**:
```prisma
model Notification {
  id        String              @id @default(uuid())
  userId    String
  type      NotificationType    @default(INFO)
  channel   NotificationChannel @default(IN_APP)
  status    NotificationStatus  @default(PENDING)
  title     String
  message   String
  data      Json?
  readAt    DateTime?
  sentAt    DateTime?
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Enums**:
- `NotificationType`: INFO, SUCCESS, WARNING, ERROR
- `NotificationChannel`: EMAIL, IN_APP, SMS
- `NotificationStatus`: PENDING, SENT, FAILED, READ

**Indexes**:
- `[userId, status]` (composite)
- `[userId, createdAt(sort: Desc)]` (composite, sorted)
- `[status, createdAt]` (composite)

**Relations**:
- Belongs to `User` (cascade delete)

---

### NotificationPreference Model

**Table**: `notification_preferences`

**Purpose**: User notification preferences

**Fields**:
```prisma
model NotificationPreference {
  id           String   @id @default(uuid())
  userId       String   @unique
  emailEnabled Boolean  @default(true)
  inAppEnabled Boolean  @default(true)
  smsEnabled   Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Indexes**:
- `userId` (unique)

**Relations**:
- One-to-one with `User` (cascade delete)

---

## Payment Models

### Payment Model

**Table**: `payments`

**Purpose**: Payment records

**Fields**:
```prisma
model Payment {
  id                String          @id @default(uuid())
  userId            String
  provider          PaymentProvider
  providerPaymentId String?          @unique
  amount            Decimal         @db.Decimal(10, 2)
  currency          Currency        @default(USD)
  status            PaymentStatus   @default(PENDING)
  paymentMethod     PaymentMethod?
  description       String?
  metadata          Json?
  errorMessage      String?
  errorCode         String?
  refundedAmount    Decimal?        @db.Decimal(10, 2)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  capturedAt        DateTime?
  refundedAt        DateTime?

  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  refunds     PaymentRefund[]
  webhookLogs PaymentWebhookLog[]
}
```

**Enums**:
- `PaymentProvider`: STRIPE, RAZORPAY, CASHFREE
- `PaymentStatus`: PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED, REFUNDED, PARTIALLY_REFUNDED
- `PaymentMethod`: CARD, UPI, NETBANKING, WALLET, EMI
- `Currency`: USD, INR, EUR, GBP

**Indexes**:
- `userId`
- `provider`
- `status`
- `providerPaymentId` (unique)
- `createdAt`

**Relations**:
- Belongs to `User` (cascade delete)
- Has many `PaymentRefund`
- Has many `PaymentWebhookLog`

---

### PaymentRefund Model

**Table**: `payment_refunds`

**Purpose**: Payment refund records

**Fields**:
```prisma
model PaymentRefund {
  id               String        @id @default(uuid())
  paymentId        String
  providerRefundId String?       @unique
  amount           Decimal       @db.Decimal(10, 2)
  reason           String?
  status           PaymentStatus @default(PENDING)
  metadata         Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  processedAt      DateTime?

  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
}
```

**Indexes**:
- `paymentId`
- `status`
- `providerRefundId` (unique)

**Relations**:
- Belongs to `Payment` (cascade delete)

---

### PaymentWebhookLog Model

**Table**: `payment_webhook_logs`

**Purpose**: Webhook event logs

**Fields**:
```prisma
model PaymentWebhookLog {
  id           String          @id @default(uuid())
  paymentId    String?
  provider     PaymentProvider
  eventType    String
  eventId      String?         @unique
  payload      Json
  signature    String?
  verified     Boolean         @default(false)
  processed    Boolean         @default(false)
  errorMessage String?
  createdAt    DateTime        @default(now())
  processedAt  DateTime?

  payment Payment? @relation(fields: [paymentId], references: [id], onDelete: SetNull)
}
```

**Indexes**:
- `provider`
- `eventType`
- `processed`
- `createdAt`
- `eventId` (unique)

**Relations**:
- Optional belongs to `Payment` (set null on delete)

---

### Subscription Model

**Table**: `subscriptions`

**Purpose**: Recurring payment subscriptions

**Fields**:
```prisma
model Subscription {
  id                 String             @id @default(uuid())
  userId             String
  provider           PaymentProvider
  providerSubId      String?            @unique
  planId             String
  planName           String
  amount             Decimal            @db.Decimal(10, 2)
  currency           Currency           @default(USD)
  status             SubscriptionStatus @default(ACTIVE)
  billingCycle       BillingCycle       @default(MONTHLY)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean            @default(false)
  cancelledAt        DateTime?
  metadata           Json?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Enums**:
- `SubscriptionStatus`: ACTIVE, PAUSED, CANCELLED, EXPIRED, PAST_DUE
- `BillingCycle`: DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY

**Indexes**:
- `userId`
- `provider`
- `status`
- `providerSubId` (unique)

**Relations**:
- Belongs to `User` (cascade delete)

---

## GDPR Models

### DataExportRequest Model

**Table**: `data_export_requests`

**Purpose**: GDPR data export requests

**Fields**:
```prisma
model DataExportRequest {
  id           String           @id @default(uuid())
  userId       String
  status       DataExportStatus @default(PENDING)
  requestedAt  DateTime         @default(now())
  completedAt  DateTime?
  expiresAt    DateTime?
  downloadUrl  String?
  fileSize     Int?
  errorMessage String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Enums**:
- `DataExportStatus`: PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED

**Indexes**:
- `userId`
- `status`
- `requestedAt`

**Relations**:
- Belongs to `User` (cascade delete)

---

### DataDeletionRequest Model

**Table**: `data_deletion_requests`

**Purpose**: GDPR data deletion requests

**Fields**:
```prisma
model DataDeletionRequest {
  id                String             @id @default(uuid())
  userId            String
  status            DataDeletionStatus @default(PENDING)
  deletionType      DeletionType       @default(SOFT)
  requestedAt       DateTime           @default(now())
  scheduledFor      DateTime?
  completedAt       DateTime?
  reason            String?
  confirmedAt       DateTime?
  confirmationToken String?            @unique
  errorMessage      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Enums**:
- `DataDeletionStatus`: PENDING, CONFIRMED, PROCESSING, COMPLETED, CANCELLED, FAILED
- `DeletionType`: SOFT, HARD

**Indexes**:
- `userId`
- `status`
- `scheduledFor`
- `confirmationToken` (unique)

**Relations**:
- Belongs to `User` (cascade delete)

---

### ConsentRecord Model

**Table**: `consent_records`

**Purpose**: GDPR consent tracking

**Fields**:
```prisma
model ConsentRecord {
  id          String      @id @default(uuid())
  userId      String
  consentType ConsentType
  granted     Boolean     @default(false)
  grantedAt   DateTime?
  revokedAt   DateTime?
  ipAddress   String?
  userAgent   String?
  version     String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Enums**:
- `ConsentType`: MARKETING_EMAILS, ANALYTICS, THIRD_PARTY_SHARING, COOKIES, TERMS_OF_SERVICE, PRIVACY_POLICY

**Indexes**:
- `[userId, consentType]` (unique, composite)
- `userId`
- `consentType`

**Relations**:
- Belongs to `User` (cascade delete)

---

## MFA Models

### MfaMethod Model

**Table**: `mfa_methods`

**Purpose**: Multi-factor authentication methods

**Fields**:
```prisma
model MfaMethod {
  id        String        @id @default(uuid())
  userId    String
  method    MfaMethodType
  secret    String?
  isEnabled Boolean       @default(false)
  isPrimary Boolean       @default(false)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Enums**:
- `MfaMethodType`: TOTP, EMAIL

**Indexes**:
- `[userId, method]` (unique, composite)
- `userId`

**Relations**:
- Belongs to `User` (cascade delete)

---

### MfaBackupCode Model

**Table**: `mfa_backup_codes`

**Purpose**: MFA backup codes

**Fields**:
```prisma
model MfaBackupCode {
  id        String    @id @default(uuid())
  userId    String
  code      String    @unique
  used      Boolean   @default(false)
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Indexes**:
- `[userId, used]` (composite)
- `code` (unique)

**Relations**:
- Belongs to `User` (cascade delete)

---

## Enums

### Role Enum

```prisma
enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}
```

### Notification Enums

```prisma
enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
}

enum NotificationChannel {
  EMAIL
  IN_APP
  SMS
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  READ
}
```

### Payment Enums

```prisma
enum PaymentProvider {
  STRIPE
  RAZORPAY
  CASHFREE
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELLED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum PaymentMethod {
  CARD
  UPI
  NETBANKING
  WALLET
  EMI
}

enum Currency {
  USD
  INR
  EUR
  GBP
}
```

### Subscription Enums

```prisma
enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED
  EXPIRED
  PAST_DUE
}

enum BillingCycle {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

### GDPR Enums

```prisma
enum DataExportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  EXPIRED
}

enum DataDeletionStatus {
  PENDING
  CONFIRMED
  PROCESSING
  COMPLETED
  CANCELLED
  FAILED
}

enum DeletionType {
  SOFT
  HARD
}

enum ConsentType {
  MARKETING_EMAILS
  ANALYTICS
  THIRD_PARTY_SHARING
  COOKIES
  TERMS_OF_SERVICE
  PRIVACY_POLICY
}
```

### MFA Enums

```prisma
enum MfaMethodType {
  TOTP
  EMAIL
}
```

---

## Relationships Summary

### User Relationships

- One-to-many: `sessions`, `auditLogs`, `passwordResets`, `notifications`, `payments`, `subscriptions`, `dataExportRequests`, `dataDeletionRequests`, `consentRecords`, `mfaMethods`, `mfaBackupCodes`
- One-to-one: `notificationPreferences`

### Payment Relationships

- Many-to-one: `User`
- One-to-many: `PaymentRefund`, `PaymentWebhookLog`

---

## Indexes Summary

### Performance Indexes

- **User lookups**: `email`, `[oauthProvider, oauthProviderId]`
- **Session lookups**: `userId`, `token`, `expiresAt`
- **Notification queries**: `[userId, status]`, `[userId, createdAt]`
- **Payment queries**: `userId`, `provider`, `status`, `providerPaymentId`
- **Audit log queries**: `userId`, `action`, `createdAt`

### Composite Indexes

- `[userId, status]` - Notification filtering
- `[userId, createdAt(sort: Desc)]` - Notification sorting
- `[userId, method]` - MFA method lookup
- `[userId, consentType]` - Consent lookup

---

## Constraints

### Unique Constraints

- `User.email` - Email uniqueness
- `User.[oauthProvider, oauthProviderId]` - OAuth uniqueness
- `Session.token` - Token uniqueness
- `PasswordReset.token` - Reset token uniqueness
- `Payment.providerPaymentId` - Provider payment ID uniqueness
- `NotificationPreference.userId` - One preference per user
- `ConsentRecord.[userId, consentType]` - One consent per type per user
- `MfaMethod.[userId, method]` - One method per type per user

### Foreign Key Constraints

- All foreign keys have `onDelete` behavior:
  - `Cascade`: Delete related records
  - `SetNull`: Set foreign key to null

---

## Data Types

### String Types
- UUIDs: `String @id @default(uuid())`
- Emails: `String @unique`
- Tokens: `String @unique`
- Text fields: `String?` (nullable)

### Numeric Types
- Decimal: `Decimal @db.Decimal(10, 2)` (for money)
- Integer: `Int` (for counts, sizes)

### Date Types
- `DateTime @default(now())` - Created timestamps
- `DateTime @updatedAt` - Updated timestamps
- `DateTime?` - Optional dates

### JSON Types
- `Json?` - Flexible data storage (metadata, details, payloads)

### Boolean Types
- `Boolean @default(true/false)` - Flags, preferences

---

## Migration Strategy

### Prisma Migrations

- Migrations stored in `backend/prisma/migrations/`
- Version-controlled schema changes
- Rollback support
- Production-safe migrations

### Migration Best Practices

1. Always test migrations in development first
2. Backup database before production migrations
3. Use transactions for multi-step migrations
4. Document breaking changes

---

## Database Best Practices

### 1. Indexes
- Index frequently queried fields
- Use composite indexes for multi-column queries
- Monitor index usage

### 2. Constraints
- Use foreign keys for referential integrity
- Use unique constraints for business rules
- Use check constraints for data validation

### 3. Relationships
- Use appropriate `onDelete` behavior
- Consider cascade vs. set null
- Document relationship rules

### 4. Data Types
- Use appropriate types (Decimal for money)
- Use nullable fields correctly
- Use enums for fixed value sets

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
