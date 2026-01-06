# Swagger Annotations - Incremental Addition Summary

**Date**: January 5, 2026  
**Status**: ✅ In Progress

---

## Summary

Added Swagger/OpenAPI annotations to remaining routes incrementally. This document tracks which routes have been annotated and which still need annotations.

---

## Routes with Swagger Annotations ✅

### 1. Authentication Routes (`backend/src/routes/auth.ts`)
- ✅ `POST /api/auth/register` - User registration
- ✅ `POST /api/auth/login` - User login

### 2. Health Routes (`backend/src/routes/health.ts`)
- ✅ `GET /api/health` - Health check endpoint

### 3. Profile Routes (`backend/src/routes/profile.ts`)
- ✅ `GET /api/profile/me` - Get user profile

### 4. Notifications Routes (`backend/src/routes/notifications.ts`)
- ✅ `GET /api/notifications` - Get user notifications (with query params)
- ✅ `GET /api/notifications/unread-count` - Get unread count
- ✅ `PUT /api/notifications/{id}/read` - Mark notification as read
- ✅ `PUT /api/notifications/read-all` - Mark all as read
- ✅ `GET /api/notifications/preferences` - Get preferences
- ✅ `PUT /api/notifications/preferences` - Update preferences

### 5. Payments Routes (`backend/src/routes/payments.ts`)
- ✅ `POST /api/payments` - Create payment
- ✅ `GET /api/payments` - Get user's payments (with pagination)
- ✅ `GET /api/payments/{id}` - Get payment by ID
- ✅ `POST /api/payments/{id}/capture` - Capture payment

### 6. Admin Routes (`backend/src/routes/admin.ts`)
- ✅ `GET /api/admin/dashboard` - Admin dashboard
- ✅ `GET /api/admin/users` - List users (with filters)
- ✅ `GET /api/admin/users/{id}` - Get user by ID
- ✅ `POST /api/admin/users` - Create user (admin only)

### 7. Audit Routes (`backend/src/routes/audit.ts`)
- ✅ `GET /api/audit` - Get audit logs (with filters)

### 8. GDPR Routes (`backend/src/routes/gdpr.ts`)
- ✅ `POST /api/gdpr/export` - Request data export
- ✅ `POST /api/gdpr/deletion` - Request data deletion
- ✅ `POST /api/gdpr/consents` - Grant consent

### 9. Newsletter Routes (`backend/src/routes/newsletter.ts`)
- ✅ `POST /api/newsletter/subscribe` - Subscribe (public)
- ✅ `POST /api/newsletter/unsubscribe` - Unsubscribe (public)
- ✅ `POST /api/newsletter` - Create newsletter (admin only)

---

## Routes Still Needing Annotations ⏳

### Authentication Routes (`backend/src/routes/auth.ts`)
- ⏳ `POST /api/auth/logout`
- ⏳ `GET /api/auth/me`
- ⏳ `POST /api/auth/refresh`
- ⏳ `POST /api/auth/forgot-password`
- ⏳ `POST /api/auth/reset-password/:token`
- ⏳ OAuth endpoints

### Profile Routes (`backend/src/routes/profile.ts`)
- ⏳ `PUT /api/profile/me` - Update profile
- ⏳ `PUT /api/profile/password` - Change password

### Payments Routes (`backend/src/routes/payments.ts`)
- ⏳ `POST /api/payments/{id}/refund` - Refund payment
- ⏳ `POST /api/payments/webhook/:provider` - Webhook handler

### Admin Routes (`backend/src/routes/admin.ts`)
- ⏳ `PUT /api/admin/users/{id}` - Update user
- ⏳ `DELETE /api/admin/users/{id}` - Delete user
- ⏳ Other admin endpoints (metrics, settings, etc.)

### Audit Routes (`backend/src/routes/audit.ts`)
- ⏳ `GET /api/audit/stats` - Get audit statistics
- ⏳ `GET /api/audit/user/:userId` - Get user audit logs
- ⏳ `GET /api/audit/resource/:resource` - Get resource audit logs
- ⏳ `GET /api/audit/:id` - Get audit log by ID
- ⏳ `POST /api/audit` - Create audit log
- ⏳ `DELETE /api/audit/old/:days` - Delete old audit logs

### GDPR Routes (`backend/src/routes/gdpr.ts`)
- ⏳ `GET /api/gdpr/exports` - Get export requests
- ⏳ `GET /api/gdpr/deletions` - Get deletion requests
- ⏳ `POST /api/gdpr/deletion/confirm/:token` - Confirm deletion
- ⏳ `DELETE /api/gdpr/consents/:consentType` - Revoke consent
- ⏳ `GET /api/gdpr/consents` - Get user consents
- ⏳ `GET /api/gdpr/consents/:consentType/check` - Check consent

### Newsletter Routes (`backend/src/routes/newsletter.ts`)
- ⏳ `GET /api/newsletter/subscription` - Get subscription (authenticated)
- ⏳ `GET /api/newsletter` - Get all newsletters (admin)
- ⏳ `GET /api/newsletter/{id}` - Get newsletter by ID (admin)
- ⏳ `PUT /api/newsletter/{id}` - Update newsletter (admin)
- ⏳ `POST /api/newsletter/{id}/send` - Send newsletter (admin)
- ⏳ `POST /api/newsletter/{id}/schedule` - Schedule newsletter (admin)
- ⏳ `GET /api/newsletter/subscriptions` - Get all subscriptions (admin)

### Other Routes
- ⏳ `backend/src/routes/rbac.ts` - RBAC endpoints
- ⏳ `backend/src/routes/featureFlags.ts` - Feature flags endpoints
- ⏳ `backend/src/routes/observability.ts` - Observability endpoints
- ⏳ `backend/src/routes/metrics.ts` - Metrics endpoint

---

## Statistics

**Total Annotated**: 21 endpoints  
**Total Remaining**: ~40+ endpoints (estimated)

**Coverage**: ~35% of API endpoints documented

---

## Next Steps

1. Continue adding annotations to remaining authentication endpoints
2. Complete profile routes annotations
3. Add annotations to remaining admin endpoints
4. Document RBAC, feature flags, and observability routes
5. Add request/response examples to existing annotations
6. Expand schema definitions for complex types

---

## Testing

All existing Swagger tests continue to pass:
- ✅ Unit tests: 7/7 passing
- ✅ Integration tests: 8/8 passing
- ✅ E2E tests: 10/10 passing

**Total**: 25/25 tests passing

---

## Notes

- Annotations follow OpenAPI 3.0 specification
- Security schemes (cookieAuth) are properly referenced
- Common schemas (Error, Success, User) are reused
- Tags are used for grouping endpoints
- Query parameters, path parameters, and request bodies are documented
- Response codes and schemas are specified
