# Test Cases
## NextSaaS - Detailed Test Case Documentation

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document provides detailed test cases for all major features and functionalities.

---

## Authentication Test Cases

### TC-AUTH-001: User Registration

**Priority**: Critical  
**Type**: Integration

**Preconditions**: None

**Test Steps**:
1. Send POST request to `/api/auth/register`
2. Include valid email, password, and optional name
3. Verify response status is 201
4. Verify user is created in database
5. Verify tokens are set in cookies
6. Verify user is automatically logged in

**Expected Result**:
- User created successfully
- Tokens in HTTP-only cookies
- Response contains user data (no password)

**Test Data**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "New User"
}
```

---

### TC-AUTH-002: User Registration - Duplicate Email

**Priority**: High  
**Type**: Integration

**Preconditions**: User with email exists

**Test Steps**:
1. Send POST request to `/api/auth/register`
2. Use existing email
3. Verify response status is 409
4. Verify error message indicates duplicate email

**Expected Result**:
- Registration fails
- Error: "Email already registered"

---

### TC-AUTH-003: User Registration - Weak Password

**Priority**: High  
**Type**: Integration

**Preconditions**: None

**Test Steps**:
1. Send POST request to `/api/auth/register`
2. Use weak password (< 8 chars or missing requirements)
3. Verify response status is 422
4. Verify error message indicates password requirements

**Expected Result**:
- Registration fails
- Error: "Password is too weak"

---

### TC-AUTH-004: User Login

**Priority**: Critical  
**Type**: Integration

**Preconditions**: User exists in database

**Test Steps**:
1. Send POST request to `/api/auth/login`
2. Include valid email and password
3. Verify response status is 200
4. Verify tokens are set in cookies
5. Verify response contains user data

**Expected Result**:
- Login successful
- Tokens in HTTP-only cookies
- User data returned

---

### TC-AUTH-005: User Login - Invalid Credentials

**Priority**: High  
**Type**: Integration

**Preconditions**: User exists

**Test Steps**:
1. Send POST request to `/api/auth/login`
2. Use invalid password
3. Verify response status is 401
4. Verify error message indicates invalid credentials

**Expected Result**:
- Login fails
- Error: "Invalid credentials"

---

### TC-AUTH-006: Token Refresh

**Priority**: High  
**Type**: Integration

**Preconditions**: User logged in (refreshToken cookie exists)

**Test Steps**:
1. Wait for access token to expire (or use expired token)
2. Send POST request to `/api/auth/refresh`
3. Include refreshToken cookie
4. Verify response status is 200
5. Verify new accessToken cookie is set

**Expected Result**:
- New access token issued
- Refresh token remains valid

---

### TC-AUTH-007: Logout

**Priority**: High  
**Type**: Integration

**Preconditions**: User logged in

**Test Steps**:
1. Send POST request to `/api/auth/logout`
2. Include authentication cookies
3. Verify response status is 200
4. Verify cookies are cleared
5. Verify session is deleted from database

**Expected Result**:
- Logout successful
- Cookies cleared
- Session invalidated

---

## Payment Test Cases

### TC-PAY-001: Create Payment

**Priority**: Critical  
**Type**: Integration

**Preconditions**: User authenticated, payment provider configured

**Test Steps**:
1. Send POST request to `/api/payments`
2. Include amount, currency, description
3. Verify response status is 201
4. Verify payment record created in database
5. Verify payment intent created with provider
6. Verify clientSecret returned

**Expected Result**:
- Payment created
- Payment status: PENDING
- Client secret for confirmation

---

### TC-PAY-002: List Payments

**Priority**: High  
**Type**: Integration

**Preconditions**: User authenticated, payments exist

**Test Steps**:
1. Send GET request to `/api/payments`
2. Include pagination parameters
3. Verify response status is 200
4. Verify payments list returned
5. Verify pagination metadata

**Expected Result**:
- Payments list returned
- Pagination information included
- Only user's payments returned

---

### TC-PAY-003: Payment Webhook

**Priority**: Critical  
**Type**: Integration

**Preconditions**: Payment exists, webhook configured

**Test Steps**:
1. Simulate webhook from payment provider
2. Include valid signature
3. Send POST to `/api/payments/webhook/:provider`
4. Verify response status is 200
5. Verify payment status updated in database
6. Verify webhook logged

**Expected Result**:
- Webhook processed
- Payment status updated
- Webhook event logged

---

## Profile Test Cases

### TC-PROF-001: Get Profile

**Priority**: High  
**Type**: Integration

**Preconditions**: User authenticated

**Test Steps**:
1. Send GET request to `/api/profile/me`
2. Verify response status is 200
3. Verify user data returned
4. Verify password not included

**Expected Result**:
- Profile data returned
- No sensitive data exposed

---

### TC-PROF-002: Update Profile

**Priority**: High  
**Type**: Integration

**Preconditions**: User authenticated

**Test Steps**:
1. Send PUT request to `/api/profile/me`
2. Include updated name and email
3. Verify response status is 200
4. Verify profile updated in database
5. Verify audit log created

**Expected Result**:
- Profile updated
- Changes persisted
- Audit trail created

---

## Admin Test Cases

### TC-ADMIN-001: List Users

**Priority**: High  
**Type**: Integration

**Preconditions**: Admin authenticated

**Test Steps**:
1. Send GET request to `/api/admin/users`
2. Include pagination and filters
3. Verify response status is 200
4. Verify users list returned
5. Verify pagination metadata

**Expected Result**:
- Users list returned
- Filters applied
- Pagination working

---

### TC-ADMIN-002: Create User

**Priority**: High  
**Type**: Integration

**Preconditions**: Admin authenticated

**Test Steps**:
1. Send POST request to `/api/admin/users`
2. Include user data
3. Verify response status is 201
4. Verify user created in database
5. Verify audit log created

**Expected Result**:
- User created
- Password hashed
- Audit trail created

---

## Notification Test Cases

### TC-NOTIF-001: List Notifications

**Priority**: High  
**Type**: Integration

**Preconditions**: User authenticated, notifications exist

**Test Steps**:
1. Send GET request to `/api/notifications`
2. Verify response status is 200
3. Verify notifications list returned
4. Verify unread count accurate

**Expected Result**:
- Notifications returned
- Unread count correct

---

### TC-NOTIF-002: Mark as Read

**Priority**: Medium  
**Type**: Integration

**Preconditions**: User authenticated, notification exists

**Test Steps**:
1. Send POST request to `/api/notifications/:id/read`
2. Verify response status is 200
3. Verify notification marked as read
4. Verify readAt timestamp set

**Expected Result**:
- Notification marked as read
- Unread count decreased

---

## GDPR Test Cases

### TC-GDPR-001: Request Data Export

**Priority**: High  
**Type**: Integration

**Preconditions**: User authenticated

**Test Steps**:
1. Send POST request to `/api/gdpr/export`
2. Verify response status is 200
3. Verify export request created
4. Verify email sent with download link

**Expected Result**:
- Export request created
- Status: PENDING
- Email notification sent

---

### TC-GDPR-002: Request Data Deletion

**Priority**: High  
**Type**: Integration

**Preconditions**: User authenticated

**Test Steps**:
1. Send POST request to `/api/gdpr/delete`
2. Include deletion type (SOFT/HARD)
3. Verify response status is 200
4. Verify deletion request created
5. Verify confirmation email sent

**Expected Result**:
- Deletion request created
- Status: PENDING
- Confirmation required

---

## E2E Test Cases

### TC-E2E-001: Complete Registration Flow

**Priority**: Critical  
**Type**: E2E

**Preconditions**: None

**Test Steps**:
1. Navigate to `/register`
2. Fill registration form
3. Submit form
4. Verify redirect to dashboard
5. Verify user logged in

**Expected Result**:
- Registration successful
- Auto-login works
- Dashboard accessible

---

### TC-E2E-002: Complete Login Flow

**Priority**: Critical  
**Type**: E2E

**Preconditions**: User exists

**Test Steps**:
1. Navigate to `/login`
2. Fill login form
3. Submit form
4. Verify redirect to dashboard
5. Verify user logged in

**Expected Result**:
- Login successful
- Dashboard accessible
- User data displayed

---

### TC-E2E-003: Protected Route Access

**Priority**: High  
**Type**: E2E

**Preconditions**: None

**Test Steps**:
1. Navigate to `/dashboard` (not logged in)
2. Verify redirect to `/login`
3. Login
4. Navigate to `/dashboard`
5. Verify dashboard accessible

**Expected Result**:
- Unauthenticated users redirected
- Authenticated users can access

---

## Performance Test Cases

### TC-PERF-001: API Response Time

**Priority**: Medium  
**Type**: Performance

**Preconditions**: System running

**Test Steps**:
1. Send 100 requests to `/api/profile/me`
2. Measure response times
3. Calculate p95, p99
4. Verify p95 < 200ms

**Expected Result**:
- p95 response time < 200ms
- p99 response time < 500ms

---

### TC-PERF-002: Concurrent Users

**Priority**: Medium  
**Type**: Performance

**Preconditions**: System running

**Test Steps**:
1. Simulate 100 concurrent users
2. Each user makes 10 requests
3. Monitor system resources
4. Verify all requests succeed

**Expected Result**:
- All requests succeed
- No errors
- Response times acceptable

---

## Security Test Cases

### TC-SEC-001: SQL Injection Attempt

**Priority**: Critical  
**Type**: Security

**Preconditions**: System running

**Test Steps**:
1. Send request with SQL injection payload
2. Verify request rejected
3. Verify no SQL executed
4. Verify error logged

**Expected Result**:
- SQL injection prevented
- Request rejected
- Error logged

---

### TC-SEC-002: XSS Attempt

**Priority**: Critical  
**Type**: Security

**Preconditions**: System running

**Test Steps**:
1. Send request with XSS payload
2. Verify payload escaped
3. Verify no script execution

**Expected Result**:
- XSS prevented
- Payload escaped
- No script execution

---

## Test Case Status

### Implemented Test Cases

- ✅ Authentication: 7 test cases
- ✅ Payments: 3 test cases
- ✅ Profile: 2 test cases
- ✅ Admin: 2 test cases
- ✅ Notifications: 2 test cases
- ✅ GDPR: 2 test cases
- ✅ E2E: 3 test cases
- ✅ Performance: 2 test cases
- ✅ Security: 2 test cases

**Total**: 25+ test cases documented

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
