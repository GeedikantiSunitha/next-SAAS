# NextSaaS - Complete End-to-End (E2E) Manual Testing Guide

**Purpose**: Detailed step-by-step manual testing guide for all features in NextSaaS  
**Last Updated**: February 2026  
**Version**: 1.0.1

> **See also**: [MANUAL_TESTING_GUIDE.md](./MANUAL_TESTING_GUIDE.md) – Checklist-style guide covering all features and test cases.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Environment Setup](#test-environment-setup)
3. [Authentication & Security](#1-authentication--security)
4. [User Profile Management](#2-user-profile-management)
5. [Multi-Factor Authentication (MFA)](#3-multi-factor-authentication-mfa)
6. [OAuth Authentication](#4-oauth-authentication)
7. [Payment Processing](#5-payment-processing)
8. [Notifications System](#6-notifications-system)
9. [GDPR Compliance](#7-gdpr-compliance)
10. [Admin Panel](#8-admin-panel)
11. [Responsive Design](#9-responsive-design)
12. [Browser Compatibility](#10-browser-compatibility)
13. [Security Testing](#11-security-testing)
14. [Error Handling](#12-error-handling)
15. [Performance Testing](#13-performance-testing)
16. [Test Results Template](#test-results-template)

---

## Prerequisites

### Required Accounts

1. **Admin Account** (from seed or created manually):
   - Email: `admin@demo.com`
   - Password: `AdminDemo123!`
   - Role: `SUPER_ADMIN`

2. **Regular User Account**:
   - Email: `user@demo.com`
   - Password: `UserDemo123!`
   - Role: `USER`

3. **OAuth Accounts** (optional, for OAuth testing):
   - Google account
   - GitHub account
   - Microsoft account

### Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs (if enabled)

### Test Payment Cards (Stripe Test Mode)

- **Success Card**: `4242 4242 4242 4242`
- **Decline Card**: `4000 0000 0000 0002`
- **3D Secure Card**: `4000 0025 0000 3155`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **ZIP**: Any 5 digits (e.g., `12345`)

---

## Test Environment Setup

### Step 1: Start Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Verify Services

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Database connected
- [ ] No console errors

### Step 3: Seed Demo Data (if needed)

```bash
cd backend
npm run seed
```

---

## 1. Authentication & Security

### 1.1 User Registration

#### Test Case 1.1.1: Successful Registration
- **Steps**:
  1. Navigate to `http://localhost:3000/register`
  2. Fill in registration form:
     - Email: `testuser@example.com`
     - Name: `Test User`
     - Password: `SecurePass123!`
     - Confirm Password: `SecurePass123!`
  3. Click "Register" button
- **Expected Result**:
  - ✅ User account created successfully
  - ✅ Automatic login after registration
  - ✅ Redirected to dashboard
  - ✅ Success message displayed
  - ✅ User appears in database

#### Test Case 1.1.2: Password Strength Validation - Weak Password
- **Steps**:
  1. Navigate to registration page
  2. Enter weak password: `123456`
  3. Try to submit
- **Expected Result**:
  - ✅ Password strength indicator shows "WEAK"
  - ✅ Form submission blocked
  - ✅ Error message: "Password is too weak"
  - ✅ Specific feedback displayed (e.g., "Must be at least 8 characters")

#### Test Case 1.1.3: Password Strength Validation - Strong Password
- **Steps**:
  1. Enter strong password: `SecurePass123!@#`
  2. Check password strength indicator
- **Expected Result**:
  - ✅ Password strength indicator shows "STRONG" or "VERY_STRONG"
  - ✅ Form allows submission

#### Test Case 1.1.4: Email Uniqueness Validation
- **Steps**:
  1. Register with email: `existing@example.com`
  2. Try to register again with same email
- **Expected Result**:
  - ✅ Error message: "Email already registered"
  - ✅ Form does not submit

#### Test Case 1.1.5: Email Format Validation
- **Steps**:
  1. Enter invalid email: `invalid-email`
  2. Try to submit
- **Expected Result**:
  - ✅ Email validation error displayed
  - ✅ Form does not submit

#### Test Case 1.1.6: Required Field Validation
- **Steps**:
  1. Leave required fields empty
  2. Try to submit form
- **Expected Result**:
  - ✅ Validation errors shown for empty fields
  - ✅ Form does not submit

### 1.2 User Login

#### Test Case 1.2.1: Successful Login
- **Steps**:
  1. Navigate to `http://localhost:3000/login`
  2. Enter credentials:
     - Email: `user@demo.com`
     - Password: `UserDemo123!`
  3. Click "Sign In"
- **Expected Result**:
  - ✅ Login successful
  - ✅ Redirected to dashboard
  - ✅ Access token cookie set (HTTP-only)
  - ✅ Refresh token cookie set (HTTP-only)
  - ✅ User session created in database

#### Test Case 1.2.2: Invalid Credentials
- **Steps**:
  1. Enter wrong password: `WrongPassword123!`
  2. Try to login
- **Expected Result**:
  - ✅ Error message: "Invalid credentials" (generic message)
  - ✅ No specific information about which field is wrong
  - ✅ Failed login attempt logged in audit logs

#### Test Case 1.2.3: Non-existent Email
- **Steps**:
  1. Enter non-existent email: `nonexistent@example.com`
  2. Enter any password
- **Expected Result**:
  - ✅ Error message: "Invalid credentials"
  - ✅ Same generic error (prevents email enumeration)

#### Test Case 1.2.4: Disabled Account Login
- **Steps**:
  1. Disable a user account (as admin)
  2. Try to login with that account
- **Expected Result**:
  - ✅ Error message: "Account is disabled"
  - ✅ Login attempt blocked

#### Test Case 1.2.5: OAuth-Only Account Password Login
- **Steps**:
  1. Create account via OAuth (Google/GitHub)
  2. Try to login with email/password
- **Expected Result**:
  - ✅ Error message: "This account uses OAuth login. Please sign in with your OAuth provider."

### 1.3 Password Reset Flow

#### Test Case 1.3.1: Request Password Reset
- **Steps**:
  1. Navigate to `http://localhost:3000/forgot-password`
  2. Enter registered email: `user@demo.com`
  3. Click "Send Reset Link"
- **Expected Result**:
  - ✅ Success message: "Password reset email sent"
  - ✅ Password reset email received (check inbox)
  - ✅ Reset token generated in database
  - ✅ Reset token expires in 1 hour

#### Test Case 1.3.2: Reset Password with Valid Token
- **Steps**:
  1. Click reset link from email
  2. Enter new password: `NewSecurePass123!`
  3. Confirm new password
  4. Click "Reset Password"
- **Expected Result**:
  - ✅ Password reset successful
  - ✅ Can login with new password
  - ✅ Old password no longer works
  - ✅ Reset token marked as used

#### Test Case 1.3.3: Reset Password with Expired Token
- **Steps**:
  1. Wait for reset token to expire (>1 hour)
  2. Try to use expired reset link
- **Expected Result**:
  - ✅ Error message: "Invalid or expired reset token"
  - ✅ Must request new reset link

#### Test Case 1.3.4: Reset Password with Used Token
- **Steps**:
  1. Use a reset token to reset password
  2. Try to use same token again
- **Expected Result**:
  - ✅ Error message: "This reset token has already been used"
  - ✅ Must request new reset link

#### Test Case 1.3.5: Reset Password - Weak Password Rejected
- **Steps**:
  1. Use valid reset token
  2. Enter weak password: `123456`
- **Expected Result**:
  - ✅ Password strength validation enforced
  - ✅ Error message about password strength
  - ✅ Password not reset

### 1.4 Logout

#### Test Case 1.4.1: Successful Logout
- **Steps**:
  1. Login to application
  2. Click "Logout" button
- **Expected Result**:
  - ✅ Logged out successfully
  - ✅ Redirected to login page
  - ✅ Cookies cleared
  - ✅ Session deleted from database
  - ✅ Cannot access protected routes

#### Test Case 1.4.2: Access Protected Route After Logout
- **Steps**:
  1. Logout from application
  2. Try to access `/dashboard` directly
- **Expected Result**:
  - ✅ Redirected to login page
  - ✅ Cannot access protected content

---

## 2. User Profile Management

### 2.1 View Profile

#### Test Case 2.1.1: View Own Profile
- **Steps**:
  1. Login as regular user
  2. Navigate to Profile page
- **Expected Result**:
  - ✅ Profile information displayed:
    - Email address
    - Name
    - Role
    - Account creation date
    - Profile picture (if uploaded)

### 2.2 Update Profile

#### Test Case 2.2.1: Update Name
- **Steps**:
  1. Go to Profile → Edit
  2. Change name to "Updated Name"
  3. Save changes
- **Expected Result**:
  - ✅ Name updated successfully
  - ✅ Success message displayed
  - ✅ Updated name visible on profile
  - ✅ Change logged in audit logs

#### Test Case 2.2.2: Update Email (if allowed)
- **Steps**:
  1. Try to change email address
  2. Save changes
- **Expected Result**:
  - ✅ Email update handled according to feature flag
  - ✅ Email verification required if email changed
  - ✅ Old email notified (if feature enabled)

### 2.3 Change Password

#### Test Case 2.3.1: Change Password Successfully
- **Steps**:
  1. Go to Profile → Security → Change Password
  2. Enter:
     - Current password: `UserDemo123!`
     - New password: `NewSecurePass456!`
     - Confirm new password
  3. Click "Change Password"
- **Expected Result**:
  - ✅ Password changed successfully
  - ✅ Success message displayed
  - ✅ Logged out automatically (security)
  - ✅ Can login with new password
  - ✅ Old password no longer works

#### Test Case 2.3.2: Change Password - Wrong Current Password
- **Steps**:
  1. Enter wrong current password
  2. Try to change password
- **Expected Result**:
  - ✅ Error message: "Current password is incorrect"
  - ✅ Password not changed

#### Test Case 2.3.3: Change Password - Weak New Password
- **Steps**:
  1. Enter weak new password: `123456`
- **Expected Result**:
  - ✅ Password strength validation enforced
  - ✅ Error message about password strength
  - ✅ Password not changed

---

## 3. Multi-Factor Authentication (MFA)

### 3.1 TOTP MFA Setup

#### Test Case 3.1.1: Enable TOTP MFA
- **Steps**:
  1. Go to Profile → Security → MFA Settings
  2. Click "Enable TOTP"
  3. Scan QR code with authenticator app (Google Authenticator, Authy)
  4. Enter verification code from app
  5. Click "Verify and Enable"
- **Expected Result**:
  - ✅ TOTP MFA enabled successfully
  - ✅ Backup codes displayed (10 codes)
  - ✅ Option to download/print backup codes
  - ✅ QR code displayed correctly
  - ✅ Manual entry code shown (if QR scan fails)

#### Test Case 3.1.2: Enable TOTP - Invalid Code
- **Steps**:
  1. Start TOTP setup
  2. Enter wrong verification code: `000000`
- **Expected Result**:
  - ✅ Error message: "Invalid verification code"
  - ✅ MFA not enabled
  - ✅ Can retry with correct code

### 3.2 Login with MFA

#### Test Case 3.2.1: Login with TOTP MFA
- **Steps**:
  1. Login with MFA-enabled account
  2. Enter email and password
  3. Enter TOTP code from authenticator app
- **Expected Result**:
  - ✅ MFA prompt displayed after password verification
  - ✅ Login successful after valid MFA code
  - ✅ Redirected to dashboard
  - ✅ Invalid MFA code shows error

#### Test Case 3.2.2: Login with Backup Code
- **Steps**:
  1. Login with MFA-enabled account
  2. Use one of the backup codes instead of TOTP
- **Expected Result**:
  - ✅ Login successful with backup code
  - ✅ Backup code marked as used
  - ✅ Backup code cannot be reused

### 3.3 Email MFA

#### Test Case 3.3.1: Enable Email MFA
- **Steps**:
  1. Go to Profile → Security → MFA Settings
  2. Click "Enable Email MFA"
  3. Verify email address
- **Expected Result**:
  - ✅ Email MFA enabled
  - ✅ Confirmation message displayed

#### Test Case 3.3.2: Login with Email MFA
- **Steps**:
  1. Login with Email MFA-enabled account
  2. Enter email and password
  3. Check email for OTP code
  4. Enter OTP code
- **Expected Result**:
  - ✅ OTP email sent
  - ✅ OTP code received in email
  - ✅ Login successful after valid OTP
  - ✅ OTP expires after set time (e.g., 10 minutes)

### 3.4 Disable MFA

#### Test Case 3.4.1: Disable TOTP MFA
- **Steps**:
  1. Go to MFA Settings
  2. Click "Disable MFA"
  3. Confirm action
- **Expected Result**:
  - ✅ MFA disabled successfully
  - ✅ No MFA required on next login
  - ✅ Change logged in audit logs

---

## 4. OAuth Authentication

### 4.1 Google OAuth

#### Test Case 4.1.1: Google OAuth Login - New User
- **Steps**:
  1. Navigate to login page
  2. Click "Sign in with Google"
  3. Complete Google OAuth flow
  4. Authorize application
- **Expected Result**:
  - ✅ Redirected to Google sign-in
  - ✅ After authorization, account created automatically
  - ✅ Logged in automatically
  - ✅ Redirected to dashboard
  - ✅ User email, name, and profile picture saved

#### Test Case 4.1.2: Google OAuth Login - Existing User
- **Steps**:
  1. Click "Sign in with Google"
  2. Use Google account that was previously linked
- **Expected Result**:
  - ✅ Logged in successfully
  - ✅ Existing account used (not duplicate created)
  - ✅ Redirected to dashboard

#### Test Case 4.1.3: Google OAuth - Deny Access
- **Steps**:
  1. Click "Sign in with Google"
  2. Deny authorization on Google's consent screen
- **Expected Result**:
  - ✅ Redirected back to login page
  - ✅ Error message displayed
  - ✅ No account created

### 4.2 GitHub OAuth

#### Test Case 4.2.1: GitHub OAuth Login - New User
- **Steps**:
  1. Click "Sign in with GitHub"
  2. Complete GitHub OAuth flow
  3. Authorize application
- **Expected Result**:
  - ✅ Redirected to GitHub sign-in
  - ✅ Account created automatically after authorization
  - ✅ Logged in automatically
  - ✅ User information saved

#### Test Case 4.2.2: GitHub OAuth - Existing User
- **Steps**:
  1. Click "Sign in with GitHub"
  2. Use previously linked GitHub account
- **Expected Result**:
  - ✅ Logged in successfully
  - ✅ Uses existing account

### 4.3 Microsoft OAuth

#### Test Case 4.3.1: Microsoft OAuth Login
- **Steps**:
  1. Click "Sign in with Microsoft"
  2. Complete Microsoft OAuth flow
- **Expected Result**:
  - ✅ Redirected to Microsoft sign-in
  - ✅ Account created or logged in
  - ✅ User information saved

### 4.4 OAuth Account Linking

#### Test Case 4.4.1: Link OAuth to Existing Account
- **Steps**:
  1. Login with email/password
  2. Go to Profile → Security → Connected Accounts
  3. Click "Link Google Account"
  4. Complete OAuth flow
- **Expected Result**:
  - ✅ OAuth account linked successfully
  - ✅ Can now login with either method
  - ✅ Both methods shown as connected

---

## 5. Payment Processing

### 5.1 Create Payment

#### Test Case 5.1.1: Create Payment Intent
- **Steps**:
  1. Go to Payment page
  2. Enter payment details:
     - Amount: $10.00
     - Description: "Test Payment"
     - Currency: USD
  3. Click "Create Payment"
- **Expected Result**:
  - ✅ Payment intent created
  - ✅ Payment ID generated
  - ✅ Payment status: PENDING
  - ✅ Payment appears in payment history

#### Test Case 5.1.2: Complete Payment - Stripe Success
- **Steps**:
  1. Create payment intent
  2. Use Stripe test card: `4242 4242 4242 4242`
  3. Complete payment form
  4. Submit payment
- **Expected Result**:
  - ✅ Payment processed successfully
  - ✅ Payment status: SUCCEEDED
  - ✅ Payment confirmation email sent
  - ✅ Payment appears in history with success status

#### Test Case 5.1.3: Payment Declined
- **Steps**:
  1. Create payment intent
  2. Use decline card: `4000 0000 0000 0002`
  3. Submit payment
- **Expected Result**:
  - ✅ Payment declined
  - ✅ Payment status: FAILED
  - ✅ Error message displayed
  - ✅ Payment appears in history with failed status

### 5.2 Payment History

#### Test Case 5.2.1: View Payment History
- **Steps**:
  1. Go to Payment History page
- **Expected Result**:
  - ✅ All user payments listed
  - ✅ Payment details visible:
    - Amount
    - Status
    - Date
    - Description
    - Payment provider
  - ✅ Pagination works (if many payments)

#### Test Case 5.2.2: Filter Payments by Status
- **Steps**:
  1. Go to Payment History
  2. Filter by status: "SUCCEEDED"
- **Expected Result**:
  - ✅ Only successful payments shown
  - ✅ Filter applies correctly

### 5.3 Payment Refund (Admin)

#### Test Case 5.3.1: Process Refund
- **Steps**:
  1. Login as admin
  2. Go to Admin → Payments
  3. Select a successful payment
  4. Click "Refund"
  5. Enter refund amount
  6. Confirm refund
- **Expected Result**:
  - ✅ Refund processed successfully
  - ✅ Payment status: REFUNDED
  - ✅ Refund amount recorded
  - ✅ Refund notification sent to user

### 5.4 Payment Webhooks

#### Test Case 5.4.1: Stripe Webhook Processing
- **Steps**:
  1. Process a payment
  2. Simulate webhook from Stripe (or use Stripe CLI)
- **Expected Result**:
  - ✅ Webhook received and verified
  - ✅ Payment status updated automatically
  - ✅ Webhook logged in database
  - ✅ Payment state synchronized

---

## 6. Notifications System

### 6.1 In-App Notifications

#### Test Case 6.1.1: View Notifications
- **Steps**:
  1. Click notification bell icon
  2. View notifications list
- **Expected Result**:
  - ✅ Notifications dropdown opens
  - ✅ All notifications listed
  - ✅ Unread notifications highlighted
  - ✅ Notification count badge shows unread count

#### Test Case 6.1.2: Mark Notification as Read
- **Steps**:
  1. Click on a notification
- **Expected Result**:
  - ✅ Notification marked as read
  - ✅ Unread count decreases
  - ✅ Notification no longer highlighted

#### Test Case 6.1.3: Mark All as Read
- **Steps**:
  1. Click "Mark all as read" button
- **Expected Result**:
  - ✅ All notifications marked as read
  - ✅ Unread count becomes 0
  - ✅ No notifications highlighted

#### Test Case 6.1.4: Notification Types
- **Steps**:
  1. Trigger different notification types:
     - Payment confirmation
     - Password reset
     - MFA setup
     - Profile update
- **Expected Result**:
  - ✅ All notification types displayed correctly
  - ✅ Icons and colors differentiate types
  - ✅ Notification messages clear and informative

### 6.2 Notification Preferences

#### Test Case 6.2.1: Update Notification Preferences
- **Steps**:
  1. Go to Settings → Notifications
  2. Toggle notification preferences:
     - Email notifications: ON/OFF
     - In-app notifications: ON/OFF
     - SMS notifications: ON/OFF (if enabled)
  3. Save preferences
- **Expected Result**:
  - ✅ Preferences saved successfully
  - ✅ Changes take effect immediately
  - ✅ Future notifications respect preferences

### 6.3 Email Notifications

#### Test Case 6.3.1: Receive Email Notification
- **Steps**:
  1. Enable email notifications in preferences
  2. Trigger an event (e.g., password reset, payment)
- **Expected Result**:
  - ✅ Email notification received
  - ✅ Email contains relevant information
  - ✅ Email template renders correctly
  - ✅ Links in email work correctly

---

## 7. GDPR Compliance

### 7.1 Data Export

#### Test Case 7.1.1: Request Data Export
- **Steps**:
  1. Go to Profile → GDPR Settings → Data Export
  2. Click "Request Data Export"
  3. Confirm request
- **Expected Result**:
  - ✅ Export request created
  - ✅ Status: PENDING or PROCESSING
  - ✅ Confirmation message displayed
  - ✅ Export processing starts

#### Test Case 7.1.2: Download Exported Data
- **Steps**:
  1. Wait for export to complete
  2. Check export status
  3. Click download link (if available)
- **Expected Result**:
  - ✅ Export status: COMPLETED
  - ✅ Download link provided
  - ✅ Downloaded file contains all user data:
    - Profile information
    - Payment history
    - Notification history
    - Audit logs (if applicable)
  - ✅ Data in readable format (JSON/CSV)

### 7.2 Data Deletion

#### Test Case 7.2.1: Request Account Deletion
- **Steps**:
  1. Go to Profile → GDPR Settings → Data Deletion
  2. Click "Request Account Deletion"
  3. Select deletion type: SOFT or HARD
  4. Enter reason (optional)
  5. Confirm deletion
- **Expected Result**:
  - ✅ Deletion request created
  - ✅ Status: PENDING
  - ✅ Confirmation email sent
  - ✅ Deletion scheduled (if SOFT) or immediate (if HARD)

#### Test Case 7.2.2: Confirm Deletion via Email
- **Steps**:
  1. Request account deletion
  2. Check email for confirmation link
  3. Click confirmation link
- **Expected Result**:
  - ✅ Deletion confirmed
  - ✅ Status: CONFIRMED or PROCESSING
  - ✅ Account deletion process continues

### 7.3 Consent Management

#### Test Case 7.3.1: View Consent Records
- **Steps**:
  1. Go to Profile → GDPR Settings → Consent Management
- **Expected Result**:
  - ✅ All consent types listed:
    - Marketing emails
    - Analytics
    - Third-party sharing
    - Cookies
    - Terms of service
    - Privacy policy
  - ✅ Current consent status displayed

#### Test Case 7.3.2: Update Consents
- **Steps**:
  1. Toggle consent preferences
  2. Save changes
- **Expected Result**:
  - ✅ Consents updated successfully
  - ✅ Changes logged with timestamp
  - ✅ IP address and user agent recorded
  - ✅ Consent version tracked

---

## 8. Admin Panel

### 8.1 Admin Dashboard

#### Test Case 8.1.1: Access Admin Dashboard
- **Steps**:
  1. Login as admin user
  2. Navigate to Admin → Dashboard
- **Expected Result**:
  - ✅ Admin dashboard loads
  - ✅ Statistics displayed:
    - Total users
    - Active sessions
    - Total payments
    - System health
  - ✅ Recent activity feed visible

#### Test Case 8.1.2: Dashboard Statistics Accuracy
- **Steps**:
  1. View dashboard statistics
  2. Verify numbers match actual data
- **Expected Result**:
  - ✅ Statistics are accurate
  - ✅ Numbers update in real-time (or on refresh)
  - ✅ All metrics displayed correctly

### 8.2 User Management

#### Test Case 8.2.1: View User List
- **Steps**:
  1. Go to Admin → Users
- **Expected Result**:
  - ✅ All users listed
  - ✅ User information displayed:
    - Email
    - Name
    - Role
    - Status (Active/Inactive)
    - Created date
  - ✅ Pagination works (if many users)

#### Test Case 8.2.2: Search Users
- **Steps**:
  1. Use search bar to search for user
  2. Enter email or name
- **Expected Result**:
  - ✅ Search filters users correctly
  - ✅ Results update as you type
  - ✅ Search is case-insensitive

#### Test Case 8.2.3: Filter Users by Role
- **Steps**:
  1. Filter users by role: ADMIN
- **Expected Result**:
  - ✅ Only ADMIN users shown
  - ✅ Filter persists on page refresh

#### Test Case 8.2.4: Edit User
- **Steps**:
  1. Click on a user
  2. Edit user details (name, email, role)
  3. Save changes
- **Expected Result**:
  - ✅ User updated successfully
  - ✅ Changes reflected immediately
  - ✅ Change logged in audit logs

#### Test Case 8.2.5: Deactivate User
- **Steps**:
  1. Select a user
  2. Click "Deactivate"
  3. Confirm action
- **Expected Result**:
  - ✅ User account deactivated
  - ✅ User cannot login
  - ✅ User status shows "Inactive"
  - ✅ Change logged in audit logs

#### Test Case 8.2.6: Change User Role (Super Admin Only)
- **Steps**:
  1. Login as SUPER_ADMIN
  2. Change user role from USER to ADMIN
- **Expected Result**:
  - ✅ Role changed successfully
  - ✅ User now has admin permissions
  - ✅ Change logged in audit logs
  - ✅ Regular ADMIN cannot change roles

### 8.3 Audit Logs

#### Test Case 8.3.1: View Audit Logs
- **Steps**:
  1. Go to Admin → Audit Logs
- **Expected Result**:
  - ✅ All audit log entries displayed
  - ✅ Log information shown:
    - User (if applicable)
    - Action
    - Resource
    - Timestamp
    - IP address
    - User agent

#### Test Case 8.3.2: Filter Audit Logs
- **Steps**:
  1. Filter by:
     - User
     - Action type
     - Date range
- **Expected Result**:
  - ✅ Filters apply correctly
  - ✅ Results update based on filters

#### Test Case 8.3.3: View Audit Log Details
- **Steps**:
  1. Click on an audit log entry
- **Expected Result**:
  - ✅ Detailed log information displayed
  - ✅ All metadata visible
  - ✅ JSON details formatted correctly

### 8.4 Feature Flags

#### Test Case 8.4.1: View Feature Flags
- **Steps**:
  1. Go to Admin → Feature Flags
- **Expected Result**:
  - ✅ All feature flags listed
  - ✅ Current status shown (Enabled/Disabled)
  - ✅ Description displayed for each flag

#### Test Case 8.4.2: Toggle Feature Flag
- **Steps**:
  1. Toggle a feature flag (e.g., ENABLE_REGISTRATION)
  2. Save changes
- **Expected Result**:
  - ✅ Feature flag toggled
  - ✅ Changes take effect immediately
  - ✅ Feature behavior changes accordingly
  - ✅ Change logged in audit logs

#### Test Case 8.4.3: Create New Feature Flag
- **Steps**:
  1. Click "Create Feature Flag"
  2. Enter:
    - Key: `FEATURE_NEW_FEATURE`
    - Description: "Enable new feature"
    - Status: Enabled/Disabled
  3. Save
- **Expected Result**:
  - ✅ Feature flag created
  - ✅ Appears in list
  - ✅ Can be toggled on/off

### 8.5 Payment Management

#### Test Case 8.5.1: View All Payments
- **Steps**:
  1. Go to Admin → Payments
- **Expected Result**:
  - ✅ All payments from all users listed
  - ✅ Payment details visible
  - ✅ Pagination works

#### Test Case 8.5.2: Filter Payments
- **Steps**:
  1. Filter payments by:
     - User
     - Status
     - Payment provider
     - Date range
- **Expected Result**:
  - ✅ Filters apply correctly
  - ✅ Results update based on filters

#### Test Case 8.5.3: Process Refund
- **Steps**:
  1. Select a successful payment
  2. Click "Refund"
  3. Enter refund amount (full or partial)
  4. Confirm refund
- **Expected Result**:
  - ✅ Refund processed
  - ✅ Payment status updated
  - ✅ Refund amount recorded
  - ✅ User notified

### 8.6 Newsletter Management

#### Test Case 8.6.1: Create Newsletter
- **Steps**:
  1. Go to Admin → Newsletters
  2. Click "Create Newsletter"
  3. Fill in:
    - Title
    - Subject
    - Content (HTML)
  4. Save as DRAFT
- **Expected Result**:
  - ✅ Newsletter created
  - ✅ Status: DRAFT
  - ✅ Can be edited later

#### Test Case 8.6.2: Schedule Newsletter
- **Steps**:
  1. Create newsletter
  2. Set scheduled date/time
  3. Change status to SCHEDULED
- **Expected Result**:
  - ✅ Newsletter scheduled
  - ✅ Status: SCHEDULED
  - ✅ Will be sent at scheduled time

#### Test Case 8.6.3: Send Newsletter
- **Steps**:
  1. Create newsletter
  2. Click "Send Now"
- **Expected Result**:
  - ✅ Newsletter sent to all subscribers
  - ✅ Status: SENT
  - ✅ Sent count recorded
  - ✅ Statistics tracked (opened, clicked)

---

## 9. Responsive Design

### 9.1 Mobile View (375px)

#### Test Case 9.1.1: Mobile Dashboard
- **Steps**:
  1. Resize browser to 375px width (or use mobile device)
  2. View dashboard
- **Expected Result**:
  - ✅ Layout adapts to mobile
  - ✅ All content accessible
  - ✅ Navigation menu works (hamburger menu)
  - ✅ No horizontal scrolling
  - ✅ Text readable without zooming

#### Test Case 9.1.2: Mobile Forms
- **Steps**:
  1. Test registration/login forms on mobile
- **Expected Result**:
  - ✅ Forms usable on mobile
  - ✅ Input fields properly sized
  - ✅ Buttons accessible
  - ✅ Keyboard doesn't cover inputs
  - ✅ Submit buttons visible

#### Test Case 9.1.3: Mobile Navigation
- **Steps**:
  1. Open mobile menu
  2. Navigate through all pages
- **Expected Result**:
  - ✅ Menu opens/closes smoothly
  - ✅ All pages accessible
  - ✅ Menu doesn't block content
  - ✅ Active page highlighted

### 9.2 Tablet View (768px)

#### Test Case 9.2.1: Tablet Layout
- **Steps**:
  1. Resize browser to 768px width
  2. Test key features
- **Expected Result**:
  - ✅ Layout optimized for tablet
  - ✅ Two-column layouts work well
  - ✅ All features accessible
  - ✅ Touch targets appropriate size

### 9.3 Desktop View (1920px+)

#### Test Case 9.3.1: Desktop Layout
- **Steps**:
  1. View on full desktop width
  2. Test all features
- **Expected Result**:
  - ✅ Optimal layout displayed
  - ✅ All features visible
  - ✅ No wasted space
  - ✅ Proper use of screen real estate

---

## 10. Browser Compatibility

### 10.1 Chrome

#### Test Case 10.1.1: Chrome Testing
- **Steps**:
  1. Open application in Chrome (latest version)
  2. Test key features:
     - Login/Registration
     - Dashboard
     - Payments
     - Admin panel
- **Expected Result**:
  - ✅ All features work correctly
  - ✅ No console errors
  - ✅ Styling renders correctly

### 10.2 Firefox

#### Test Case 10.2.1: Firefox Testing
- **Steps**:
  1. Test in Firefox (latest version)
  2. Test key features
- **Expected Result**:
  - ✅ All features work correctly
  - ✅ No compatibility issues

### 10.3 Safari

#### Test Case 10.3.1: Safari Testing
- **Steps**:
  1. Test in Safari (latest version)
  2. Test key features
- **Expected Result**:
  - ✅ All features work correctly
  - ✅ No Safari-specific issues

### 10.4 Edge

#### Test Case 10.4.1: Edge Testing
- **Steps**:
  1. Test in Edge (latest version)
  2. Test key features
- **Expected Result**:
  - ✅ All features work correctly
  - ✅ No Edge-specific issues

---

## 11. Security Testing

### 11.1 Authentication Security

#### Test Case 11.1.1: Protected Routes Without Auth
- **Steps**:
  1. Logout (or use incognito mode)
  2. Try to access `/dashboard` directly
- **Expected Result**:
  - ✅ Redirected to login page
  - ✅ Cannot access protected content
  - ✅ No data exposed

#### Test Case 11.1.2: Token Expiration
- **Steps**:
  1. Login to application
  2. Wait for access token to expire (or manually expire)
  3. Try to make API request
- **Expected Result**:
  - ✅ Token refresh attempted automatically
  - ✅ If refresh fails, redirected to login
  - ✅ No data loss during refresh

#### Test Case 11.1.3: Invalid Token Handling
- **Steps**:
  1. Manually modify access token cookie
  2. Try to access protected route
- **Expected Result**:
  - ✅ Invalid token rejected
  - ✅ Error handled gracefully
  - ✅ Redirected to login

### 11.2 Authorization Security

#### Test Case 11.2.1: Regular User Accessing Admin Routes
- **Steps**:
  1. Login as regular user
  2. Try to access `/admin/dashboard` directly
- **Expected Result**:
  - ✅ Access denied (403 Forbidden)
  - ✅ Error message displayed
  - ✅ Redirected to user dashboard

#### Test Case 11.2.2: User Accessing Another User's Data
- **Steps**:
  1. Login as User A
  2. Try to access User B's profile/data via API
- **Expected Result**:
  - ✅ Access denied
  - ✅ Only own data accessible

### 11.3 Input Validation Security

#### Test Case 11.3.1: SQL Injection Attempt
- **Steps**:
  1. In any form, enter SQL injection: `'; DROP TABLE users; --`
  2. Submit form
- **Expected Result**:
  - ✅ Input sanitized
  - ✅ No SQL executed
  - ✅ Error handled gracefully
  - ✅ Data remains safe

#### Test Case 11.3.2: XSS Attempt
- **Steps**:
  1. In any input field, enter: `<script>alert('XSS')</script>`
  2. Submit and view result
- **Expected Result**:
  - ✅ Script tags sanitized/escaped
  - ✅ No scripts executed
  - ✅ Content displayed safely

#### Test Case 11.3.3: CSRF Protection
- **Steps**:
  1. Try to submit form without valid CSRF token (if implemented)
- **Expected Result**:
  - ✅ Request rejected
  - ✅ CSRF error displayed

---

## 12. Error Handling

### 12.1 Form Validation Errors

#### Test Case 12.1.1: Invalid Form Input
- **Steps**:
  1. Submit forms with invalid data
- **Expected Result**:
  - ✅ Clear error messages displayed
  - ✅ Errors shown inline with fields
  - ✅ Form doesn't submit
  - ✅ User can correct errors easily

### 12.2 Network Errors

#### Test Case 12.2.1: Offline Handling
- **Steps**:
  1. Disconnect network
  2. Try to use application
- **Expected Result**:
  - ✅ Error message displayed: "Network error" or "Offline"
  - ✅ Graceful degradation
  - ✅ Can retry when online

#### Test Case 12.2.2: API Timeout
- **Steps**:
  1. Slow down network (DevTools → Network → Throttling)
  2. Make API request
- **Expected Result**:
  - ✅ Timeout handled gracefully
  - ✅ Error message displayed
  - ✅ Can retry request

### 12.3 Server Errors

#### Test Case 12.3.1: 500 Error Handling
- **Steps**:
  1. Trigger server error (if possible through testing)
- **Expected Result**:
  - ✅ User-friendly error message displayed
  - ✅ No technical details exposed to user
  - ✅ Error logged on server
  - ✅ User can contact support

#### Test Case 12.3.2: 404 Error Handling
- **Steps**:
  1. Navigate to non-existent page: `/non-existent-page`
- **Expected Result**:
  - ✅ 404 page displayed
  - ✅ Option to return to homepage
  - ✅ Helpful error message

---

## 13. Performance Testing

### 13.1 Page Load Times

#### Test Case 13.1.1: Dashboard Load Time
- **Steps**:
  1. Measure time to load dashboard
- **Expected Result**:
  - ✅ Dashboard loads in < 2 seconds
  - ✅ Images optimized and lazy-loaded
  - ✅ No blocking resources

#### Test Case 13.1.2: API Response Times
- **Steps**:
  1. Monitor API response times in DevTools
- **Expected Result**:
  - ✅ API responses in < 500ms for most requests
  - ✅ Database queries optimized
  - ✅ No unnecessary data loaded

### 13.2 Large Dataset Handling

#### Test Case 13.2.1: Large User List
- **Steps**:
  1. Create many users (100+)
  2. View user list in admin panel
- **Expected Result**:
  - ✅ Pagination works correctly
  - ✅ Page loads quickly
  - ✅ No performance degradation

---

## Test Results Template

### Test Execution Summary

**Date**: _______________  
**Tester**: _______________  
**Application Version**: _______________  
**Browser**: _______________  
**Device**: _______________

### Feature Test Results

| Feature Category | Total Tests | Passed | Failed | Skipped | Notes |
|-----------------|-------------|--------|--------|---------|-------|
| Authentication & Security | | | | | |
| User Profile Management | | | | | |
| Multi-Factor Authentication | | | | | |
| OAuth Authentication | | | | | |
| Payment Processing | | | | | |
| Notifications System | | | | | |
| GDPR Compliance | | | | | |
| Admin Panel | | | | | |
| Responsive Design | | | | | |
| Browser Compatibility | | | | | |
| Security Testing | | | | | |
| Error Handling | | | | | |
| Performance Testing | | | | | |

### Overall Results

- **Total Test Cases**: _______
- **Passed**: _______
- **Failed**: _______
- **Skipped**: _______
- **Pass Rate**: _______%

### Critical Issues Found

1. **Issue**: [Description]
   - **Severity**: Critical / High / Medium / Low
   - **Feature**: [Feature name]
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]
   - **Screenshots**: [If applicable]

### Minor Issues Found

1. **Issue**: [Description]
   - **Type**: Bug / UI Issue / Enhancement
   - **Description**: [Details]

### Browser Compatibility Results

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | | ✅ / ❌ | |
| Firefox | | ✅ / ❌ | |
| Safari | | ✅ / ❌ | |
| Edge | | ✅ / ❌ | |

### Responsive Design Results

| Device Type | Resolution | Status | Notes |
|-------------|------------|--------|-------|
| Mobile | 375px | ✅ / ❌ | |
| Tablet | 768px | ✅ / ❌ | |
| Desktop | 1920px+ | ✅ / ❌ | |

### Performance Metrics

- **Average Page Load Time**: _______ seconds
- **Average API Response Time**: _______ milliseconds
- **Time to Interactive**: _______ seconds

### Final Sign-Off

- [ ] All critical features tested
- [ ] All browsers tested
- [ ] Responsive design verified
- [ ] Security checks completed
- [ ] Performance acceptable
- [ ] All critical bugs fixed
- [ ] Documentation reviewed

**Status**: ✅ Ready for Production / ⚠️ Issues Found / ❌ Not Ready

**Sign-off**: _______________  
**Date**: _______________

---

## Testing Tips

1. **Use Different Accounts**: Test with both admin and regular user accounts
2. **Test Edge Cases**: Don't just test happy paths, test error scenarios
3. **Check Browser Console**: Look for JavaScript errors during testing
4. **Check Network Tab**: Monitor API calls and responses
5. **Test on Real Devices**: Don't just rely on browser responsive mode
6. **Take Screenshots**: Document issues with screenshots
7. **Test Data Persistence**: Verify data is saved correctly after operations
8. **Test Concurrency**: Test what happens when multiple users perform actions simultaneously

---

## Additional Test Scenarios

### Newsletter Subscription

- [ ] Subscribe to newsletter
- [ ] Unsubscribe from newsletter
- [ ] Receive newsletter emails
- [ ] Update newsletter preferences

### Session Management

- [ ] Multiple sessions handling
- [ ] Session timeout
- [ ] Concurrent logins from different devices

### Rate Limiting

- [ ] Rate limiting on login attempts
- [ ] Rate limiting on API requests
- [ ] Rate limit reset behavior

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Next Review**: [Date]
