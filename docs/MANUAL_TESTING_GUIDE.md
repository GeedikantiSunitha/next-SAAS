# NextSaaS - Manual Testing Guide

**Purpose**: Complete manual testing guide for all features in the NextSaaS application.  
**Last Updated**: February 2026  
**Version**: 1.0

---

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [Public Pages](#2-public-pages)
3. [Authentication](#3-authentication)
4. [User Dashboard & Profile](#4-user-dashboard--profile)
5. [User Settings](#5-user-settings)
6. [Admin Panel](#6-admin-panel)
7. [Legal & Policy Pages](#7-legal--policy-pages)
8. [Error Handling & Edge Cases](#8-error-handling--edge-cases)
9. [Test Results Checklist](#9-test-results-checklist)

---

## 1. Prerequisites & Setup

### 1.1 Required Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `demo-superadmin@example.com` | `DemoSuperAdmin123!` |
| Admin | `demo-admin@example.com` | `DemoAdmin123!` |
| User | `demo@example.com` | `DemoUser123!` |

**Note**: Run `npm run seed:demo-users` in the backend folder to create these accounts.

### 1.2 URLs

- **Frontend**: http://localhost:3000  
- **Backend API**: http://localhost:3001  
- **API Documentation**: http://localhost:3001/api-docs  

### 1.3 Start Application

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 1.4 Seed Data (if needed)

```bash
cd backend
npm run seed:demo-users      # Demo user accounts
npm run seed:feature-flags   # Feature flags for Admin panel
```

### 1.5 Stripe Test Cards (for payment testing)

| Card | Number | Purpose |
|------|--------|---------|
| Success | `4242 4242 4242 4242` | Successful payment |
| Decline | `4000 0000 0000 0002` | Declined payment |
| 3D Secure | `4000 0025 0000 3155` | 3DS authentication |
| CVV | Any 3 digits | e.g., `123` |
| Expiry | Any future date | e.g., `12/30` |
| ZIP | Any 5 digits | e.g., `12345` |

---

## 2. Public Pages

### 2.1 Landing Page (`/`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| L1 | Page loads | Navigate to http://localhost:3000 | Landing page displays with branding, CTAs |
| L2 | Login link | Click "Login" or "Sign In" | Redirects to /login |
| L3 | Register link | Click "Register" or "Sign Up" | Redirects to /register |
| L4 | Footer links | Click Privacy, Terms, Cookie Policy links | Navigates to respective legal pages |

### 2.2 Legal & Policy Pages (Public)

| # | Test Case | URL | Steps | Expected Result |
|---|-----------|-----|-------|-----------------|
| LP1 | Privacy Policy | `/privacy-policy` | Navigate to page | Content loads; no errors |
| LP2 | Terms of Service | `/terms` | Navigate to page | Content loads; no errors |
| LP3 | Cookie Policy | `/cookie-policy` | Navigate to page | Content loads; no errors |
| LP4 | Acceptable Use | `/acceptable-use` | Navigate to page | Content loads; no errors |
| LP5 | Data Processing Agreement | `/dpa` | Navigate to page | Content loads; no errors |
| LP6 | Security Policy | `/security` | Navigate to page | Content loads; no errors |
| LP7 | Accessibility Statement | `/accessibility` | Navigate to page | Content loads; no errors |

---

## 3. Authentication

### 3.1 Registration (`/register`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| R1 | Successful registration | Enter email, name (optional), password, confirm; Submit | Account created; auto-login; redirect to dashboard |
| R2 | Name optional | Register with empty name field (if allowed) | Registration succeeds |
| R3 | Weak password | Enter password `123456` | Validation error; form blocked |
| R4 | Strong password | Enter `SecurePass123!` | Password strength indicator shows strong; form accepts |
| R5 | Duplicate email | Register with existing email | Error: "Email already registered" |
| R6 | Invalid email | Enter `invalid-email` | Validation error |
| R7 | Registration disabled (feature flag) | If registration flag OFF: navigate to /register | Form hidden or disabled message |

### 3.2 Login (`/login`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| LN1 | Successful login | Enter valid email & password; Submit | Redirect to dashboard; session created |
| LN2 | Invalid credentials | Enter wrong password | Error: "Invalid credentials" |
| LN3 | Non-existent email | Enter unknown email | Same generic error (no email enumeration) |
| LN4 | Demo login buttons | Click demo account (User, Admin, Super Admin) | Fields auto-filled; submit to login |
| LN5 | Forgot Password link | Click "Forgot Password?" | Navigate to /forgot-password (if flag enabled) |
| LN6 | Register link | Click "Sign up" | Navigate to /register |
| LN7 | OAuth - Google | Click "Sign in with Google" | Redirect to Google; after auth, account created/login |
| LN8 | OAuth - GitHub | Click "Sign in with GitHub" | Same as Google |
| LN9 | Disabled account | Login with deactivated account | Error: "Account is disabled" |

### 3.3 Forgot Password (`/forgot-password`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| FP1 | Request reset | Enter registered email; Submit | Success message; email sent (check inbox/spam) |
| FP2 | Non-existent email | Enter unknown email | Same generic message (no enumeration) |
| FP3 | Feature flag off | If password_reset flag OFF: visit page | Disabled message or redirect |

### 3.4 Reset Password (`/reset-password`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| RP1 | Reset with valid token | Click link from email; enter new password; Submit | Password updated; can login with new password |
| RP2 | Expired token | Use link after expiry | Error: "Invalid or expired reset token" |
| RP3 | Used token | Reuse same reset link | Error: token already used |

### 3.5 Logout

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| LO1 | Logout | Click Logout (header or sidebar) | Redirect to login; cookies cleared; session invalid |
| LO2 | Access after logout | Try /dashboard after logout | Redirect to /login |
| LO3 | CSRF cleared | Verify CSRF token cleared on logout | No stale token issues on next login |

---

## 4. User Dashboard & Profile

### 4.1 Dashboard (`/dashboard`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| D1 | Dashboard loads | Login; view dashboard | Dashboard displays; no errors |
| D2 | Dashboard stats | Check statistics (if shown) | Stats load correctly |
| D3 | Navigation links | Click Profile, Notifications, Payments, etc. | Navigate to correct pages |

### 4.2 Profile (`/profile`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| P1 | View profile | Go to Profile | Name, email, role displayed |
| P2 | Update name | Edit name; Save | Name updated; success message |
| P3 | Update email | Edit email (if allowed); Save | Email updated; verification if required |
| P4 | Change password | Enter current + new password; Submit | Success; can login with new password |
| P5 | Change password - wrong current | Enter wrong current password | Error: "Current password is incorrect" |
| P6 | Change password - weak new | Enter weak new password | Validation error |
| P7 | Change password (flag off) | If password_reset OFF: refresh Profile | Change Password section hidden |

### 4.3 MFA Settings (Profile → MFA)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| M1 | Enable TOTP | Click Enable TOTP; scan QR; enter code | MFA enabled; backup codes shown |
| M2 | TOTP modal | Verify QR, manual entry, verify button | Modal displays correctly |
| M3 | Login with TOTP | Logout; login; enter TOTP code | Login succeeds |
| M4 | Enable Email MFA | Click Enable Email MFA; verify | Email MFA enabled |
| M5 | Login with Email MFA | Login; receive OTP; enter code | Login succeeds |
| M6 | Disable MFA | Disable MFA; confirm | MFA disabled; login with password only |

### 4.4 Connected Accounts (Profile)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| CA1 | Link Google | Click Link Google; complete OAuth | Account linked; shown as connected |
| CA2 | Link GitHub | Same for GitHub | Account linked |
| CA3 | View connected | Check Connected Accounts section | Shows linked providers |

### 4.5 Accessibility Settings (Profile)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| AX1 | View settings | Expand Accessibility Settings | Options displayed |
| AX2 | Toggle options | Change preferences; save | Preferences saved |

---

## 5. User Settings

### 5.1 Notifications (`/notifications`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| N1 | View list | Go to Notifications | List loads; types displayed |
| N2 | Mark as read | Click notification | Marked read |
| N3 | Delete notification | Delete a notification | Removed from list |
| N4 | Empty state | If no notifications | Empty message shown |

### 5.2 Newsletter Settings (`/newsletter`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| NS1 | Subscribe | Toggle subscription ON | Subscribed; success message |
| NS2 | Unsubscribe | Toggle OFF | Unsubscribed |
| NS3 | Preferences | Update preferences (if any) | Saved correctly |

### 5.3 Privacy Center (`/privacy-center`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| PC1 | View page | Navigate to Privacy Center | Page loads; sections visible |
| PC2 | Cookie preferences | Update cookie consent | Preferences saved |
| PC3 | Access log | View access log (if present) | Log displayed |

### 5.4 GDPR Settings (`/gdpr` or `/gdpr-settings`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| G1 | View page | Navigate to GDPR Settings | Export, Deletion, Consent sections visible |
| G2 | Export data | Request data export | Export initiated; download or email |
| G3 | Request deletion | Request account deletion | Request created; confirmation |
| G4 | Consent management | Update consents | Changes saved |

### 5.5 Payments (`/payments`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| Pay1 | View payment history | Go to Payments | Past payments listed |
| Pay2 | Initiate checkout | Start checkout (e.g., subscribe) | Redirect to Stripe (if configured) |
| Pay3 | Currency display | Check amounts | Currency shown correctly |
| Pay4 | Payment success | Complete test payment; return | /payments/success shows success |

### 5.6 Cookie Consent Banner

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| CC1 | First visit | Clear cookies; load app | Cookie banner appears |
| CC2 | Accept | Click Accept | Banner dismissed; preferences saved |
| CC3 | Customize | Click Customize (if available) | Options shown; can save |

### 5.7 Network Error Banner

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| NE1 | Offline | Disconnect network; perform action | Network error banner; Retry button |
| NE2 | Retry | Restore network; click Retry | Request retried; banner dismisses |
| NE3 | API timeout | Throttle network; trigger API call | Timeout handled gracefully |

---

## 6. Admin Panel

**Requires**: Admin or Super Admin role

### 6.1 Admin Dashboard (`/admin/dashboard`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| AD1 | Access | Login as admin; go to Admin → Dashboard | Dashboard loads; stats displayed |
| AD2 | Stats accuracy | Verify user count, payments, etc. | Numbers match or reasonable |
| AD3 | User access denied | Login as USER; try /admin/dashboard | 403 or redirect to user dashboard |

### 6.2 Users (`/admin/users`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| AU1 | View list | Admin → Users | All users listed |
| AU2 | Search | Search by email or name | Results filter correctly |
| AU3 | Filter by role | Filter Role: Admin, User, etc. | Only matching users shown |
| AU4 | Filter persistence | Set filters; go to another page; return | Filters persist (or reset gracefully) |
| AU5 | Create user | Click Create User; fill form; Submit | User created; appears in list |
| AU6 | Create admin (Super Admin only) | As Super Admin: create user with role Admin | Admin user created |
| AU7 | Edit user | Edit name, email; Save | Changes saved |
| AU8 | Deactivate user | Deactivate a user | User inactive; cannot login |
| AU9 | Change role (Super Admin only) | As Super Admin: change user role | Role updated |

### 6.3 Audit Logs (`/admin/audit-logs`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| AL1 | View logs | Admin → Audit Logs | Log entries listed |
| AL2 | Filter | Filter by user, action, date | Results filtered correctly |
| AL3 | View details | Click log entry | Details displayed |

### 6.4 Feature Flags (`/admin/feature-flags`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| FF1 | View flags | Admin → Feature Flags | Flags listed (or seed message) |
| FF2 | Seed flags | Run `npm run seed:feature-flags`; refresh | Flags appear |
| FF3 | Toggle flag | Toggle password_reset OFF | Toggle succeeds |
| FF4 | UI reflects flag | Toggle OFF; refresh Login/Profile | Forgot link hidden; Change Password hidden |
| FF5 | Create flag (if UI exists) | Create new flag | Flag created; can toggle |

### 6.5 Payments (`/admin/payments`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| AP1 | View payments | Admin → Payments | All payments listed |
| AP2 | Filter | Filter by user, status, date | Results filtered |
| AP3 | Refund | Select successful payment; Refund | Refund processed; status updated |
| AP4 | Refund partial | Partial refund | Amount refunded correctly |

### 6.6 Data Deletions (`/admin/data-deletions`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| DD1 | View list | Admin → Data Deletions | Pending deletions listed |
| DD2 | Process (if applicable) | Approve/reject deletion | Status updated |

### 6.7 Data Retention (`/admin/data-retention`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| DR1 | View policies | Admin → Data Retention | Policies displayed |
| DR2 | Update retention | Change retention period (if allowed) | Saved correctly |

### 6.8 Security Dashboard (`/admin/security`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| SD1 | View dashboard | Admin → Security Dashboard | Security metrics displayed |

### 6.9 Security Incidents (`/admin/security-incidents`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| SI1 | View incidents | Admin → Security Incidents | Incidents listed |
| SI2 | Filter/view details | Filter or click incident | Details shown |

### 6.10 Security Testing (`/admin/security-testing`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| ST1 | Access page | Admin → Security Testing | Vulnerability scanner / tools loaded |
| ST2 | Run scan (if available) | Execute scan | Results or status displayed |

### 6.11 Newsletters (`/admin/newsletters`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| AN1 | View list | Admin → Newsletters | Newsletters listed |
| AN2 | Create newsletter | Create; Title, Subject, Content | Saved (Draft or Published) |
| AN3 | Edit newsletter | Edit existing | Changes saved |
| AN4 | Schedule (if supported) | Set schedule | Status updated |

### 6.12 Settings (`/admin/settings`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| AS1 | View settings | Admin → Settings | Settings form displayed |
| AS2 | Update settings | Change values; Save | Saved correctly |

---

## 7. Legal & Policy Pages

Covered in [2.2 Legal & Policy Pages](#22-legal--policy-pages-public). All public legal pages should load without errors.

---

## 8. Error Handling & Edge Cases

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| E1 | 404 page | Navigate to /non-existent-path | 404 page; link to home |
| E2 | Protected route (logged out) | Access /dashboard without login | Redirect to /login |
| E3 | Admin route (non-admin) | Login as USER; access /admin/users | 403 or redirect |
| E4 | Invalid token | Manually corrupt cookie; make request | Redirect to login |
| E5 | Form validation | Submit empty required fields | Inline errors; form not submitted |
| E6 | API error | Backend down; perform action | Error message; graceful handling |
| E7 | Skip to content | Tab to "Skip to content" link; activate | Focus moves to main content |

---

## 9. Test Results Checklist

### Test Execution Summary

**Date**: _______________  
**Tester**: _______________  
**Build**: _______________  
**Browser**: _______________

### Results by Section

| Section | Total | Pass | Fail | Skip | Notes |
|---------|-------|------|------|------|-------|
| 1. Prerequisites | | | | | |
| 2. Public Pages | 11 | | | | |
| 3. Authentication | 30 | | | | |
| 4. Dashboard & Profile | 23 | | | | |
| 5. User Settings | 22 | | | | |
| 6. Admin Panel | 37 | | | | |
| 7. Legal Pages | 7 | | | | |
| 8. Error Handling | 7 | | | | |
| **Total** | **~137** | | | | |

### Critical Issues

1. _______________________________________
2. _______________________________________

### Sign-off

- [ ] All critical paths tested
- [ ] Admin features verified (as admin)
- [ ] User features verified (as user)
- [ ] Error handling verified
- [ ] Feature flags verified (if applicable)

**Status**: ✅ Pass / ⚠️ Issues Found / ❌ Blocked  
**Tester**: _______________
