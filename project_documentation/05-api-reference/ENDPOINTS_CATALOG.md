# API Endpoints Catalog
## NextSaaS - Complete API Endpoint Reference

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

Complete catalog of all API endpoints organized by resource.

---

## Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| POST | `/api/auth/logout` | Yes | Logout user |
| POST | `/api/auth/refresh` | No* | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password/:token` | No | Reset password |
| GET | `/api/auth/oauth/:provider` | No | OAuth login (redirect) |
| POST | `/api/auth/oauth/:provider` | No | OAuth login (token-based) |
| GET | `/api/auth/oauth/:provider/callback` | No | OAuth callback |
| GET | `/api/auth/oauth/methods` | Yes | Get user's linked OAuth methods |
| POST | `/api/auth/oauth/link` | Yes | Link OAuth provider |
| POST | `/api/auth/oauth/unlink` | Yes | Unlink OAuth provider |
| POST | `/api/auth/mfa/setup/totp` | Yes | Setup TOTP MFA |
| POST | `/api/auth/mfa/setup/email` | Yes | Setup Email MFA |
| POST | `/api/auth/mfa/verify` | Yes | Verify MFA code |
| POST | `/api/auth/mfa/enable` | Yes | Enable MFA method |
| POST | `/api/auth/mfa/disable` | Yes | Disable MFA method |
| POST | `/api/auth/mfa/backup-codes` | Yes | Generate backup codes |
| POST | `/api/auth/mfa/verify-backup` | Yes | Verify backup code |
| GET | `/api/auth/mfa/methods` | Yes | Get user's MFA methods |
| POST | `/api/auth/mfa/send-email-otp` | Yes | Send email OTP |

*Uses refreshToken cookie

---

## Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile/me` | Yes | Get current user profile |
| PUT | `/api/profile/me` | Yes | Update profile |
| PUT | `/api/profile/password` | Yes | Change password |

---

## Notification Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Yes | List notifications |
| GET | `/api/notifications/unread-count` | Yes | Get unread count |
| POST | `/api/notifications` | Yes | Create notification |
| PUT | `/api/notifications/:id/read` | Yes | Mark notification as read |
| PUT | `/api/notifications/read-all` | Yes | Mark all as read |
| DELETE | `/api/notifications/:id` | Yes | Delete notification |
| GET | `/api/notifications/preferences` | Yes | Get preferences |
| PUT | `/api/notifications/preferences` | Yes | Update preferences |

---

## Payment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments` | Yes | Create payment |
| GET | `/api/payments` | Yes | List user payments |
| GET | `/api/payments/:id` | Yes | Get payment details |
| POST | `/api/payments/:id/capture` | Yes | Capture payment |
| POST | `/api/payments/:id/refund` | Yes | Refund payment |
| POST | `/api/payments/webhook/:provider` | No* | Payment webhook (stripe/razorpay/cashfree) |
| GET | `/api/payments/admin/all` | Yes | List all payments (admin) |

*Signature verification required

---

## Audit Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/audit` | Yes | List audit logs (with filters) |
| GET | `/api/audit/stats` | Yes | Get audit statistics |
| GET | `/api/audit/user/:userId` | Yes | Get audit logs for specific user |
| GET | `/api/audit/resource/:resource` | Yes | Get audit logs for resource type |
| GET | `/api/audit/:id` | Yes | Get specific audit log by ID |
| POST | `/api/audit` | Yes | Create audit log entry |
| DELETE | `/api/audit/old/:days` | Yes | Delete audit logs older than N days |

---

## RBAC Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/rbac/me/role` | Yes | Any | Get current user's role |
| GET | `/api/rbac/me/permissions` | Yes | Any | Get current user's permissions |
| GET | `/api/rbac/users/role/:role` | Yes | Admin | List users by role |
| PUT | `/api/rbac/users/:userId/role` | Yes | Super Admin | Update user role |
| GET | `/api/rbac/check/role/:role` | Yes | Any | Check if user has specific role |
| POST | `/api/rbac/check/access` | Yes | Any | Check if user can access resource |
| GET | `/api/rbac/compare/:userId` | Yes | Admin | Compare roles with another user |

---

## GDPR Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/gdpr/export` | Yes | Request data export |
| GET | `/api/gdpr/exports` | Yes | Get user's export requests |
| POST | `/api/gdpr/deletion` | Yes | Request data deletion |
| GET | `/api/gdpr/deletions` | Yes | Get user's deletion requests |
| POST | `/api/gdpr/deletion/confirm/:token` | No | Confirm data deletion (public) |
| GET | `/api/gdpr/consents` | Yes | Get user's consents |
| POST | `/api/gdpr/consents` | Yes | Grant consent |
| DELETE | `/api/gdpr/consents/:consentType` | Yes | Revoke consent |
| GET | `/api/gdpr/consents/:consentType/check` | Yes | Check if user has specific consent |

---

## Feature Flags Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/feature-flags` | Yes | List all feature flags |
| GET | `/api/feature-flags/:flagName` | Yes | Get specific feature flag |

---

## Admin Endpoints

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/dashboard` | Yes | Admin | Get dashboard overview |

### User Management

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/users` | Yes | Admin | List users (with filters) |
| GET | `/api/admin/users/:id` | Yes | Admin | Get user details |
| POST | `/api/admin/users` | Yes | Admin | Create user |
| PUT | `/api/admin/users/:id` | Yes | Admin | Update user |
| DELETE | `/api/admin/users/:id` | Yes | Admin | Delete user |
| GET | `/api/admin/users/:id/sessions` | Yes | Admin | Get user sessions |
| DELETE | `/api/admin/users/:id/sessions/:sessionId` | Yes | Admin | Revoke session |
| GET | `/api/admin/users/:id/activity` | Yes | Admin | Get user activity log |

### Metrics

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/metrics/system` | Yes | Admin | System metrics |
| GET | `/api/admin/metrics/database` | Yes | Admin | Database metrics |
| GET | `/api/admin/metrics/api` | Yes | Admin | API usage metrics |
| GET | `/api/admin/errors/recent` | Yes | Admin | Get recent errors |

### Audit Logs

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/audit-logs` | Yes | Admin | List all audit logs |
| GET | `/api/admin/audit-logs/export` | Yes | Admin | Export audit logs |

### Feature Flags

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/feature-flags` | Yes | Admin | List feature flags |
| PUT | `/api/admin/feature-flags/:key` | Yes | Admin | Update feature flag |

### Payments

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/payments` | Yes | Admin | List all payments (with filters) |
| GET | `/api/admin/subscriptions` | Yes | Admin | List subscriptions (with filters) |

### Settings

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/settings` | Yes | Admin | Get settings |
| PUT | `/api/admin/settings` | Yes | Admin | Update settings |

---

## Health Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check (includes database status) |
| GET | `/api/health/ready` | No | Readiness probe (Kubernetes/Docker) |

---

## Metrics Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/metrics` | No | Prometheus metrics |

---

## Root Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/` | No | API information |

---

## Endpoint Details

### Query Parameters

**Pagination**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Filtering**:
- `status`: Filter by status
- `role`: Filter by role
- `search`: Search query
- `isActive`: Filter by active status

**Sorting**:
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: `desc`)

**Date Range**:
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "requestId": "req_123456"
}
```

---

## Authentication Requirements

### Public Endpoints

- `/api/health/*`
- `/api/metrics`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/refresh`
- `/api/auth/forgot-password`
- `/api/auth/reset-password/:token`
- `/api/auth/oauth/*`
- `/api/feature-flags`

### Authenticated Endpoints

All other endpoints require authentication (JWT token in cookie).

### Admin Endpoints

Admin endpoints require:
- Authentication
- `ADMIN` or `SUPER_ADMIN` role

### Super Admin Endpoints

Some endpoints require `SUPER_ADMIN` role:
- `/api/rbac/users/:id/role` (update role)
- `/api/admin/users/:id` (delete user, if restricted)

---

## Rate Limiting

### Authentication Endpoints

- **Limit**: 5 requests per 15 minutes per IP
- **Endpoints**: All `/api/auth/*` endpoints

### General API Endpoints

- **Limit**: 100 requests per 15 minutes per IP
- **Endpoints**: All other endpoints

---

## Webhook Endpoints

### Payment Webhooks

**Endpoints**:
- `/api/payments/webhook/stripe`
- `/api/payments/webhook/razorpay`
- `/api/payments/webhook/cashfree`

**Security**:
- Signature verification required
- Idempotency handled automatically

**Method**: POST

**Content-Type**: `application/json`

---

## Endpoint Versioning

**Current Version**: v1

**Version Header**: `X-API-Version: v1` (optional)

**Default**: v1 if not specified

**Future Versions**: v2, v3, etc.

---

## Endpoint Status Codes

### Success

- `200 OK`: Request successful
- `201 Created`: Resource created
- `204 No Content`: Request successful, no content

### Client Errors

- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded

### Server Errors

- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service unavailable

---

## Endpoint Examples

See [API_EXAMPLES.md](./API_EXAMPLES.md) for detailed examples.

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
