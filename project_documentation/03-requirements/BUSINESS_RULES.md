# Business Rules
## NextSaaS - Business Logic and Rules

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes the business rules and logic that govern the NextSaaS application.

---

## Authentication Business Rules

### BR-1: User Registration Rules

**Rule ID**: BR-1  
**Description**: Rules governing user registration

**Rules**:
1. **BR-1.1**: Email addresses must be unique across the system.
   - **Enforcement**: Database unique constraint
   - **Error**: "Email already registered"

2. **BR-1.2**: Password must meet strength requirements:
   - Minimum 8 characters
   - Must contain uppercase letter
   - Must contain lowercase letter
   - Must contain number
   - Must contain special character
   - WEAK passwords (< 8 chars) are rejected
   - FAIR passwords (8-9 chars) are rejected
   - GOOD passwords (10-12 chars) are accepted
   - STRONG passwords (13+ chars) are accepted

3. **BR-1.3**: User is automatically assigned "USER" role upon registration.

4. **BR-1.4**: User is automatically logged in after successful registration.

5. **BR-1.5**: User account is active by default (`isActive = true`).

---

### BR-2: Password Rules

**Rule ID**: BR-2  
**Description**: Rules governing password management

**Rules**:
1. **BR-2.1**: Passwords must be hashed using bcrypt with 12 salt rounds.

2. **BR-2.2**: Passwords must never be stored in plain text.

3. **BR-2.3**: Passwords must never be logged.

4. **BR-2.4**: Password changes require current password verification.

5. **BR-2.5**: New password cannot be the same as current password.

6. **BR-2.6**: Password reset tokens expire after 1 hour.

7. **BR-2.7**: Password reset tokens can only be used once.

---

### BR-3: Session Management Rules

**Rule ID**: BR-3  
**Description**: Rules governing user sessions

**Rules**:
1. **BR-3.1**: Access tokens expire after 15 minutes.

2. **BR-3.2**: Refresh tokens expire after 30 days.

3. **BR-3.3**: Refresh tokens are stored in database (sessions table).

4. **BR-3.4**: Sessions are automatically cleaned up when expired.

5. **BR-3.5**: Users can have multiple active sessions (different devices).

6. **BR-3.6**: Admins can revoke user sessions.

---

## Role-Based Access Control Rules

### BR-4: Role Hierarchy Rules

**Rule ID**: BR-4  
**Description**: Rules governing role hierarchy

**Rules**:
1. **BR-4.1**: Role hierarchy is: SUPER_ADMIN > ADMIN > USER

2. **BR-4.2**: SUPER_ADMIN has access to all features.

3. **BR-4.3**: ADMIN has access to admin panel features.

4. **BR-4.4**: USER has access to user-facing features only.

5. **BR-4.5**: Only SUPER_ADMIN can change user roles.

6. **BR-4.6**: Users cannot change their own role.

7. **BR-4.7**: ADMIN cannot change roles to SUPER_ADMIN.

---

### BR-5: Permission Rules

**Rule ID**: BR-5  
**Description**: Rules governing permissions

**Rules**:
1. **BR-5.1**: Users can only access their own resources unless they have higher role.

2. **BR-5.2**: ADMIN can access all user resources.

3. **BR-5.3**: SUPER_ADMIN can access all resources.

4. **BR-5.4**: Resource access is checked before allowing operations.

---

## User Management Rules

### BR-6: Profile Update Rules

**Rule ID**: BR-6  
**Description**: Rules governing profile updates

**Rules**:
1. **BR-6.1**: Users can update their own profile.

2. **BR-6.2**: Email changes must be unique.

3. **BR-6.3**: Email changes trigger email notification to old email.

4. **BR-6.4**: Name can be updated without restrictions.

5. **BR-6.5**: Role cannot be changed by user.

6. **BR-6.6**: Profile updates are logged in audit log.

---

### BR-7: Admin User Management Rules

**Rule ID**: BR-7  
**Description**: Rules governing admin user management

**Rules**:
1. **BR-7.1**: Only ADMIN and SUPER_ADMIN can access admin panel.

2. **BR-7.2**: ADMIN can view and manage users.

3. **BR-7.3**: ADMIN can create, edit, and delete users.

4. **BR-7.4**: Only SUPER_ADMIN can change user roles.

5. **BR-7.5**: ADMIN cannot delete SUPER_ADMIN users.

6. **BR-7.6**: ADMIN cannot change their own role.

7. **BR-7.7**: User deletion is soft delete (deactivate) by default.

8. **BR-7.8**: All admin actions are logged in audit log.

---

## Payment Processing Rules

### BR-8: Payment Creation Rules

**Rule ID**: BR-8  
**Description**: Rules governing payment creation

**Rules**:
1. **BR-8.1**: Only authenticated users can create payments.

2. **BR-8.2**: Payment amount must be greater than 0.

3. **BR-8.3**: Payment currency must be supported (USD, INR, EUR, GBP).

4. **BR-8.4**: Payment provider is selected based on environment configuration.

5. **BR-8.5**: Payment status starts as "PENDING".

6. **BR-8.6**: Payment records are created before calling payment provider.

7. **BR-8.7**: All payments are logged in audit log.

---

### BR-9: Payment Status Rules

**Rule ID**: BR-9  
**Description**: Rules governing payment status transitions

**Rules**:
1. **BR-9.1**: Payment status can transition:
   - PENDING → PROCESSING → SUCCEEDED
   - PENDING → PROCESSING → FAILED
   - SUCCEEDED → REFUNDED
   - SUCCEEDED → PARTIALLY_REFUNDED

2. **BR-9.2**: Payment status cannot be manually changed (only via webhooks or API).

3. **BR-9.3**: Refunded payments cannot be refunded again.

4. **BR-9.4**: Partial refunds cannot exceed payment amount.

---

### BR-10: Refund Rules

**Rule ID**: BR-10  
**Description**: Rules governing refunds

**Rules**:
1. **BR-10.1**: Only payments with status "SUCCEEDED" can be refunded.

2. **BR-10.2**: Only ADMIN and SUPER_ADMIN can process refunds.

3. **BR-10.3**: Refund amount cannot exceed payment amount.

4. **BR-10.4**: Refund amount cannot exceed remaining refundable amount.

5. **BR-10.5**: All refunds are logged in audit log.

---

## Notification Rules

### BR-11: Notification Creation Rules

**Rule ID**: BR-11  
**Description**: Rules governing notification creation

**Rules**:
1. **BR-11.1**: Notifications can be created by system or users.

2. **BR-11.2**: Notification types: SUCCESS, ERROR, INFO, WARNING.

3. **BR-11.3**: Notification channels: EMAIL, IN_APP, SMS (if available).

4. **BR-11.4**: User preferences determine which channels are used.

5. **BR-11.5**: Email notifications respect user email preference.

6. **BR-11.6**: In-app notifications are always created (if enabled).

---

### BR-12: Notification Delivery Rules

**Rule ID**: BR-12  
**Description**: Rules governing notification delivery

**Rules**:
1. **BR-12.1**: Email notifications are sent asynchronously.

2. **BR-12.2**: Email delivery failures are logged but don't block operations.

3. **BR-12.3**: In-app notifications are stored in database.

4. **BR-12.4**: Notifications are marked as unread by default.

5. **BR-12.5**: Users can mark notifications as read.

6. **BR-12.6**: Users can delete their own notifications.

---

## Audit Logging Rules

### BR-13: Audit Log Creation Rules

**Rule ID**: BR-13  
**Description**: Rules governing audit log creation

**Rules**:
1. **BR-13.1**: All authentication events are logged (login, logout, registration).

2. **BR-13.2**: All admin actions are logged.

3. **BR-13.3**: All payment transactions are logged.

4. **BR-13.4**: All profile updates are logged.

5. **BR-13.5**: All role changes are logged.

6. **BR-13.6**: Audit logs are immutable (cannot be modified or deleted).

7. **BR-13.7**: Audit logs include: userId, action, resource, resourceId, timestamp, IP, userAgent.

---

### BR-14: Audit Log Access Rules

**Rule ID**: BR-14  
**Description**: Rules governing audit log access

**Rules**:
1. **BR-14.1**: Only ADMIN and SUPER_ADMIN can view audit logs.

2. **BR-14.2**: Users can view their own audit logs (if implemented).

3. **BR-14.3**: Audit logs can be filtered by user, action, date range.

4. **BR-14.4**: Audit logs can be exported (CSV, JSON).

5. **BR-14.5**: Audit logs are retained for minimum 7 years (configurable).

---

## GDPR Compliance Rules

### BR-15: Data Export Rules

**Rule ID**: BR-15  
**Description**: Rules governing data export

**Rules**:
1. **BR-15.1**: Users can request their data export.

2. **BR-15.2**: Data export includes all user data:
   - Profile information
   - Payment history
   - Notification history
   - Audit logs (user's actions)
   - Consent records

3. **BR-15.3**: Data export is generated in JSON format.

4. **BR-15.4**: Download link expires after 7 days.

5. **BR-15.5**: Data export requests are logged.

---

### BR-16: Data Deletion Rules

**Rule ID**: BR-16  
**Description**: Rules governing data deletion

**Rules**:
1. **BR-16.1**: Users can request data deletion.

2. **BR-16.2**: Soft deletion (deactivate account) is default.

3. **BR-16.3**: Hard deletion (permanent removal) requires email confirmation.

4. **BR-16.4**: Hard deletion removes:
   - User account
   - User sessions
   - User notifications
   - User preferences
   - User MFA methods
   - User backup codes

5. **BR-16.5**: Hard deletion preserves:
   - Audit logs (for compliance)
   - Payment records (for accounting)

6. **BR-16.6**: Data deletion requests are logged.

7. **BR-16.7**: Deletion is processed within 24 hours of confirmation.

---

### BR-17: Consent Management Rules

**Rule ID**: BR-17  
**Description**: Rules governing consent management

**Rules**:
1. **BR-17.1**: Users can grant consent for:
   - Marketing communications
   - Analytics tracking
   - Privacy policy acceptance

2. **BR-17.2**: Users can revoke consent at any time.

3. **BR-17.3**: Consent history is tracked (granted/revoked, timestamp).

4. **BR-17.4**: System respects user consent preferences.

5. **BR-17.5**: Consent records are immutable (cannot be modified, only new records created).

---

## Feature Flag Rules

### BR-18: Feature Flag Rules

**Rule ID**: BR-18  
**Description**: Rules governing feature flags

**Rules**:
1. **BR-18.1**: Feature flags can be enabled/disabled dynamically.

2. **BR-18.2**: Only ADMIN and SUPER_ADMIN can manage feature flags.

3. **BR-18.3**: Feature flag changes are logged in audit log.

4. **BR-18.4**: Feature flags are checked at runtime (not build time).

5. **BR-18.5**: Feature flags can be per-user, per-role, or global.

---

## Validation Rules

### BR-19: Input Validation Rules

**Rule ID**: BR-19  
**Description**: Rules governing input validation

**Rules**:
1. **BR-19.1**: All inputs are validated on server side (client-side validation is for UX only).

2. **BR-19.2**: Email addresses must match valid email format.

3. **BR-19.3**: Passwords must meet strength requirements.

4. **BR-19.4**: Payment amounts must be positive numbers.

5. **BR-19.5**: Dates must be valid ISO 8601 format.

6. **BR-19.6**: UUIDs must be valid UUID format.

7. **BR-19.7**: String inputs are trimmed and sanitized.

---

## Business Logic Rules Summary

### Authentication
- ✅ Email uniqueness enforced
- ✅ Password strength enforced
- ✅ Auto-login after registration
- ✅ Session management

### Authorization
- ✅ Role hierarchy enforced
- ✅ Permission checks before access
- ✅ Resource-level access control

### Payments
- ✅ Payment status transitions
- ✅ Refund rules enforced
- ✅ Payment provider selection

### Notifications
- ✅ User preferences respected
- ✅ Multi-channel support
- ✅ Delivery rules

### Compliance
- ✅ GDPR data export/deletion
- ✅ Consent management
- ✅ Audit logging

### Admin
- ✅ Role-based admin access
- ✅ Admin action logging
- ✅ User management rules

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
