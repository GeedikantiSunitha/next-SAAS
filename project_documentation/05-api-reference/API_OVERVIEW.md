# API Overview
## NextSaaS - REST API Documentation

**Last Updated:** December 23, 2025  
**Version:** 2.0.0  
**Base URL**: `http://localhost:3001/api` (development)  
**Production URL**: `https://api.yourdomain.com/api`

---

## Overview

NextSaaS provides a RESTful API for all application functionality. The API follows REST principles and uses JSON for request/response bodies.

---

## API Versioning

**Current Version**: v1

**Version Header**: `X-API-Version: v1` (optional, defaults to v1)

**Versioning Strategy**: Header-based versioning

**Example**:
```http
GET /api/profile/me HTTP/1.1
Host: api.yourdomain.com
X-API-Version: v1
```

---

## Authentication

### Cookie-Based Authentication

**Method**: HTTP-only cookies

**Cookies**:
- `accessToken`: JWT access token (15 minutes expiry)
- `refreshToken`: JWT refresh token (30 days expiry)

**Usage**:
```javascript
// Cookies are automatically sent with requests
fetch('/api/profile/me', {
  credentials: 'include', // Important: include cookies
});
```

**Token Refresh**:
```http
POST /api/auth/refresh
Cookie: refreshToken=xxx
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
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

### Pagination Response

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

---

## HTTP Status Codes

### Success Codes

- `200 OK`: Request successful
- `201 Created`: Resource created
- `204 No Content`: Request successful, no content

### Client Error Codes

- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded

### Server Error Codes

- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service unavailable

---

## Rate Limiting

**Authentication Endpoints**: 5 requests per 15 minutes per IP

**General API Endpoints**: 100 requests per 15 minutes per IP

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "requestId": "req_123456"
}
```

---

## Request Headers

### Required Headers

```http
Content-Type: application/json
```

### Optional Headers

```http
X-API-Version: v1
X-Request-ID: custom-request-id
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "User-friendly error message",
  "requestId": "req_123456",
  "details": {
    // Additional error details (development only)
  }
}
```

### Error Types

1. **ValidationError**: Input validation failed
   - Status: `422`
   - Example: `"Email is required"`

2. **AuthenticationError**: Authentication failed
   - Status: `401`
   - Example: `"Invalid credentials"`

3. **AuthorizationError**: Insufficient permissions
   - Status: `403`
   - Example: `"Insufficient permissions"`

4. **NotFoundError**: Resource not found
   - Status: `404`
   - Example: `"User not found"`

5. **ConflictError**: Resource conflict
   - Status: `409`
   - Example: `"Email already registered"`

6. **AppError**: Generic application error
   - Status: `500`
   - Example: `"Internal server error"`

---

## API Endpoints Summary

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/oauth/:provider` - OAuth login
- `GET /api/auth/oauth/:provider/callback` - OAuth callback

### Profile (`/api/profile`)

- `GET /api/profile/me` - Get current user profile
- `PUT /api/profile/me` - Update profile
- `POST /api/profile/change-password` - Change password

### Notifications (`/api/notifications`)

- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences

### Payments (`/api/payments`)

- `POST /api/payments` - Create payment
- `GET /api/payments` - List payments
- `GET /api/payments/:id` - Get payment
- `POST /api/payments/:id/capture` - Capture payment
- `POST /api/payments/:id/refund` - Refund payment
- `POST /api/payments/webhook/:provider` - Webhook handler

### Audit (`/api/audit`)

- `GET /api/audit/logs` - List audit logs (user's own)
- `GET /api/audit/stats` - Get audit statistics

### RBAC (`/api/rbac`)

- `GET /api/rbac/role` - Get user role
- `GET /api/rbac/permissions` - Get user permissions
- `GET /api/rbac/check/:permission` - Check permission
- `GET /api/rbac/users/:role` - List users by role (admin)

### GDPR (`/api/gdpr`)

- `POST /api/gdpr/export` - Request data export
- `GET /api/gdpr/export/:id` - Get export status
- `POST /api/gdpr/delete` - Request data deletion
- `POST /api/gdpr/delete/confirm` - Confirm deletion
- `GET /api/gdpr/consents` - Get consents
- `POST /api/gdpr/consents/grant` - Grant consent
- `POST /api/gdpr/consents/revoke` - Revoke consent

### Feature Flags (`/api/feature-flags`)

- `GET /api/feature-flags` - List all flags
- `GET /api/feature-flags/:key` - Get flag value

### Admin (`/api/admin`)

- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/users/:id/sessions` - Get user sessions
- `DELETE /api/admin/users/:id/sessions/:sessionId` - Revoke session
- `GET /api/admin/metrics/system` - System metrics
- `GET /api/admin/metrics/database` - Database metrics
- `GET /api/admin/metrics/api-usage` - API usage metrics
- `GET /api/admin/audit-logs` - List audit logs
- `GET /api/admin/audit-logs/export` - Export audit logs
- `GET /api/admin/feature-flags` - List feature flags
- `PUT /api/admin/feature-flags/:key` - Update feature flag
- `GET /api/admin/payments` - List payments
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

### Health (`/api/health`)

- `GET /api/health` - Health check
- `GET /api/health/db` - Database health check

### Metrics (`/api/metrics`)

- `GET /api/metrics` - Prometheus metrics

---

## CORS Configuration

**Allowed Origins**: Configured via `CORS_ORIGIN` environment variable

**Credentials**: Enabled (`withCredentials: true`)

**Example**:
```javascript
fetch('https://api.yourdomain.com/api/profile/me', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## Request ID

**Purpose**: Track requests across logs

**Header**: `X-Request-ID` (optional, auto-generated if not provided)

**Response Header**: `X-Request-ID`

**Usage**: Include in error reports for debugging

---

## Pagination

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Example**:
```http
GET /api/admin/users?page=2&limit=50
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

---

## Filtering & Sorting

### Filtering

**Query Parameters**: Varies by endpoint

**Example**:
```http
GET /api/admin/users?role=ADMIN&status=active
```

### Sorting

**Query Parameters**:
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: `desc`)

**Example**:
```http
GET /api/admin/users?sortBy=createdAt&sortOrder=desc
```

---

## Webhooks

### Payment Webhooks

**Endpoints**:
- `/api/payments/webhook/stripe`
- `/api/payments/webhook/razorpay`
- `/api/payments/webhook/cashfree`

**Security**: Signature verification required

**Idempotency**: Handled automatically

---

## API Best Practices

### 1. Use HTTPS in Production

Always use HTTPS for API requests in production.

### 2. Include Credentials

Always include `credentials: 'include'` for cookie-based auth.

### 3. Handle Errors Gracefully

Check `success` field and handle errors appropriately.

### 4. Use Request IDs

Include request ID in error reports for debugging.

### 5. Respect Rate Limits

Implement exponential backoff for rate limit errors.

---

## SDK/Client Libraries

### JavaScript/TypeScript

```typescript
import { apiClient } from './api/client';

const profile = await apiClient.get('/profile/me');
```

### cURL Examples

See [API_EXAMPLES.md](./API_EXAMPLES.md) for cURL examples.

---

## API Documentation

**Interactive Docs**: Available at `/api/docs` (if Swagger is enabled)

**OpenAPI Spec**: Available at `/api/docs/json`

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
