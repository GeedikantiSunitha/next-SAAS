# NextSaaS - Manual Testing Checklist

**Purpose**: Comprehensive manual testing checklist for CodeCanyon submission  
**Last Updated**: February 2025

---

## How to Use This Checklist

1. **Start Application**: Ensure both backend and frontend are running
2. **Use Demo Credentials**: Login with demo accounts from `DEMO_CREDENTIALS.md`
3. **Test Each Feature**: Go through each item systematically
4. **Mark Complete**: Check off items as you test them
5. **Document Issues**: Note any bugs or issues found

---

## ✅ Authentication Features

### Registration
- [ ] **Valid Registration**
  - Navigate to `/register`
  - Enter valid email, password, name
  - Submit form
  - **Expected**: User created, auto-logged in, redirected to dashboard

- [ ] **Password Strength Validation**
  - Try weak password (e.g., "123456")
  - **Expected**: Error message, password rejected
  - Try strong password (e.g., "SecurePass123!")
  - **Expected**: Password accepted

- [ ] **Email Uniqueness**
  - Try registering with existing email
  - **Expected**: Error "Email already registered"

- [ ] **Form Validation**
  - Submit empty form
  - **Expected**: Validation errors shown
  - Try invalid email format
  - **Expected**: Email validation error

### Login
- [ ] **Valid Login**
  - Navigate to `/login`
  - Enter valid credentials
  - Submit form
  - **Expected**: Logged in, redirected to dashboard

- [ ] **Invalid Credentials**
  - Enter wrong password
  - **Expected**: Error "Invalid credentials"

- [ ] **Disabled Account**
  - Try login with disabled account
  - **Expected**: Error "Account is disabled"

- [ ] **OAuth Account Login**
  - Try password login for OAuth-only account
  - **Expected**: Error directing to OAuth login

### OAuth Login
- [ ] **Google OAuth**
  - Click "Sign in with Google"
  - Complete OAuth flow
  - **Expected**: Logged in, account created if first time

- [ ] **GitHub OAuth**
  - Click "Sign in with GitHub"
  - Complete OAuth flow
  - **Expected**: Logged in, account created if first time

- [ ] **Microsoft OAuth**
  - Click "Sign in with Microsoft"
  - Complete OAuth flow
  - **Expected**: Logged in, account created if first time

### Multi-Factor Authentication (MFA)
- [ ] **Setup TOTP MFA**
  - Go to Profile → Security
  - Click "Enable MFA"
  - Scan QR code with authenticator app
  - Enter verification code
  - **Expected**: MFA enabled, backup codes shown

- [ ] **Login with MFA**
  - Login with MFA-enabled account
  - Enter MFA code
  - **Expected**: Logged in successfully

- [ ] **Email MFA**
  - Enable Email MFA
  - Login and enter email OTP
  - **Expected**: Logged in successfully

### Password Reset
- [ ] **Request Password Reset**
  - Click "Forgot Password"
  - Enter email address
  - **Expected**: Reset email sent

- [ ] **Reset Password**
  - Click reset link in email
  - Enter new password
  - **Expected**: Password reset, can login with new password

---

## ✅ User Features

### Profile Management
- [ ] **View Profile**
  - Navigate to Profile
  - **Expected**: See user information

- [ ] **Update Profile**
  - Change name
  - Update email (if allowed)
  - Save changes
  - **Expected**: Profile updated, confirmation shown

- [ ] **Change Password**
  - Go to Security settings
  - Enter current password, new password
  - **Expected**: Password changed, logged out

### Dashboard
- [ ] **User Dashboard**
  - Login as regular user
  - View dashboard
  - **Expected**: Dashboard loads, shows user-specific content

- [ ] **Navigation**
  - Click through all menu items
  - **Expected**: All pages load correctly

---

## ✅ Admin Features

### Admin Dashboard
- [ ] **Access Admin Panel**
  - Login as admin
  - Navigate to Admin → Dashboard
  - **Expected**: Admin dashboard loads with statistics

- [ ] **Statistics Display**
  - Check user count
  - Check payment statistics
  - Check system health
  - **Expected**: All statistics display correctly

### User Management
- [ ] **View Users**
  - Go to Admin → Users
  - **Expected**: User list displays

- [ ] **Search Users**
  - Use search functionality
  - **Expected**: Search filters users correctly

- [ ] **Edit User**
  - Click on user
  - Edit user details
  - Save changes
  - **Expected**: User updated successfully

- [ ] **Deactivate User**
  - Deactivate a user account
  - **Expected**: User cannot login

- [ ] **Delete User**
  - Delete a user (with confirmation)
  - **Expected**: User deleted, removed from list

### Audit Logs
- [ ] **View Audit Logs**
  - Go to Admin → Audit Logs
  - **Expected**: Audit log entries display

- [ ] **Filter Audit Logs**
  - Filter by user, action, date
  - **Expected**: Filters work correctly

- [ ] **Export Audit Logs**
  - Export logs (if feature exists)
  - **Expected**: Logs exported successfully

### Feature Flags
- [ ] **View Feature Flags**
  - Go to Admin → Feature Flags
  - **Expected**: Feature flags list displays

- [ ] **Toggle Feature Flags**
  - Enable/disable a feature flag
  - **Expected**: Flag toggled, changes take effect

### Payment Management
- [ ] **View Payments**
  - Go to Admin → Payments
  - **Expected**: Payment list displays

- [ ] **Filter Payments**
  - Filter by status, user, date
  - **Expected**: Filters work correctly

- [ ] **View Payment Details**
  - Click on payment
  - **Expected**: Payment details shown

---

## ✅ Payment Features

### Create Payment
- [ ] **Initiate Payment**
  - Go to Payment page
  - Enter payment details
  - **Expected**: Payment intent created

- [ ] **Complete Payment**
  - Complete payment flow
  - **Expected**: Payment processed successfully

- [ ] **Payment History**
  - View payment history
  - **Expected**: All payments listed

### Payment Providers
- [ ] **Stripe Payment**
  - Test Stripe payment flow
  - **Expected**: Payment processes via Stripe

- [ ] **Razorpay Payment** (if configured)
  - Test Razorpay payment flow
  - **Expected**: Payment processes via Razorpay

---

## ✅ Notification Features

### In-App Notifications
- [ ] **View Notifications**
  - Click notification bell
  - **Expected**: Notifications list displays

- [ ] **Mark as Read**
  - Click on notification
  - **Expected**: Notification marked as read

- [ ] **Mark All as Read**
  - Use "Mark all as read" button
  - **Expected**: All notifications marked as read

### Notification Preferences
- [ ] **Configure Preferences**
  - Go to Notification settings
  - Toggle preferences
  - **Expected**: Preferences saved

---

## ✅ GDPR Features

### Data Export
- [ ] **Request Data Export**
  - Go to GDPR settings
  - Request data export
  - **Expected**: Export generated, download link provided

### Data Deletion
- [ ] **Request Account Deletion**
  - Go to GDPR settings
  - Request account deletion
  - **Expected**: Account deletion process initiated

---

## 🌐 Browser Compatibility

### Chrome
- [ ] **Test in Chrome**
  - Open application in Chrome
  - Test key features
  - **Expected**: All features work correctly

### Firefox
- [ ] **Test in Firefox**
  - Open application in Firefox
  - Test key features
  - **Expected**: All features work correctly

### Safari
- [ ] **Test in Safari**
  - Open application in Safari
  - Test key features
  - **Expected**: All features work correctly

### Edge
- [ ] **Test in Edge**
  - Open application in Edge
  - Test key features
  - **Expected**: All features work correctly

---

## 📱 Responsive Design

### Mobile (375px)
- [ ] **Mobile Dashboard**
  - Resize browser to 375px width
  - View dashboard
  - **Expected**: Layout adapts, all features accessible

- [ ] **Mobile Login**
  - Test login on mobile view
  - **Expected**: Form is usable, buttons accessible

- [ ] **Mobile Navigation**
  - Test navigation menu on mobile
  - **Expected**: Mobile menu works, all pages accessible

### Tablet (768px)
- [ ] **Tablet View**
  - Resize browser to 768px width
  - Test key features
  - **Expected**: Layout adapts appropriately

### Desktop (1920px)
- [ ] **Desktop View**
  - Test on full desktop width
  - **Expected**: Optimal layout, all features visible

---

## ⚠️ Error Handling

### Invalid Inputs
- [ ] **Form Validation**
  - Submit forms with invalid data
  - **Expected**: Clear error messages shown

- [ ] **API Validation**
  - Send invalid API requests
  - **Expected**: Proper error responses

### Network Errors
- [ ] **Offline Handling**
  - Disconnect network
  - Try to use application
  - **Expected**: Error message shown, graceful handling

### Server Errors
- [ ] **500 Errors**
  - Trigger server error (if possible)
  - **Expected**: User-friendly error message

---

## 🔒 Security Testing

### Authentication
- [ ] **Protected Routes**
  - Try accessing protected route without login
  - **Expected**: Redirected to login

- [ ] **Token Expiration**
  - Wait for token to expire
  - Try to use application
  - **Expected**: Token refreshed or re-login required

### Authorization
- [ ] **Admin Routes**
  - Try accessing admin routes as regular user
  - **Expected**: Access denied (403)

- [ ] **User Data Access**
  - Try accessing another user's data
  - **Expected**: Access denied

### Input Validation
- [ ] **SQL Injection Attempt**
  - Try SQL injection in forms
  - **Expected**: Input sanitized, no SQL executed

- [ ] **XSS Attempt**
  - Try XSS in input fields
  - **Expected**: Input sanitized, no scripts executed

---

## 🌍 World-Class Compliance (Completed Items Only)

*Manual tests for features marked COMPLETE in `docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md`. Phases 4–6 and incomplete items (e.g. SLA, Security Policy, Database/Field Encryption) are not included.*

### Phase 1: Legal Foundation (COMPLETE)

#### Legal Pages
- [ ] **Privacy Policy**
  - Navigate to `/legal/privacy` (or footer link)
  - **Expected**: Privacy Policy page loads with controller identity, data collected, legal basis, retention, user rights, DPO/complaint info

- [ ] **Terms of Service**
  - Navigate to `/legal/terms`
  - **Expected**: Terms of Service page loads with service description, user obligations, AUP, termination, liability, governing law

- [ ] **Cookie Policy**
  - Navigate to `/legal/cookies`
  - **Expected**: Cookie Policy page loads with cookie categories (essential, analytics, marketing, functional) and management instructions

- [ ] **Acceptable Use Policy**
  - Navigate to `/legal/acceptable-use`
  - **Expected**: AUP page loads with prohibited activities, suspension policy, reporting mechanisms

- [ ] **ICO Registration (UK)**
  - Check footer on any public/legal page
  - **Expected**: ICO registration number displayed (e.g. "Registered with ICO: …")

#### Policy Acceptance (Registration)
- [ ] **ToS/Privacy Acceptance on Register**
  - Register a new user; ensure ToS/Privacy checkboxes (or equivalent) are present
  - Submit without accepting
  - **Expected**: Validation error
  - Accept and submit
  - **Expected**: User created; acceptance recorded (check DB or audit if needed)

#### Cookie Consent Banner & Preference Center
- [ ] **Banner on First Visit**
  - Use incognito or clear `cookie_consent` (and relevant cookies)
  - Load app
  - **Expected**: Cookie consent banner appears

- [ ] **Accept All**
  - Click "Accept All"
  - **Expected**: Banner dismisses; preferences saved (localStorage/backend if logged in)

- [ ] **Reject All**
  - Clear consent and reload; click "Reject All"
  - **Expected**: Banner dismisses; non-essential categories off

- [ ] **Customize / Preference Center**
  - Open preference center (e.g. "Customize" or footer "Cookie preferences")
  - Toggle analytics/marketing/functional
  - Save
  - **Expected**: Preferences saved; banner does not reappear on reload (until version change)

- [ ] **Consent Persistence**
  - After saving consent, close and reopen app (same browser)
  - **Expected**: Banner does not show; previously chosen preferences apply

#### DPA (Data Processing Agreement)
- [ ] **DPA Available on Request**
  - Confirm via docs or support flow that DPA template is available on request for B2B
  - **Expected**: Documented (e.g. in DEMO_CREDENTIALS or README) or contact path provided

---

### Phase 2: Enhanced GDPR Compliance (COMPLETE)

#### Data Retention (Admin)
- [ ] **Admin Data Retention Page**
  - Login as Admin/Super Admin → Admin → Data Retention (or equivalent)
  - **Expected**: Retention page loads; policies or summary visible

- [ ] **Manual Retention Enforcement**
  - Trigger manual "Enforce" (or equivalent) if available
  - **Expected**: No crash; success or result message; audit log entry if applicable

- [ ] **Legal Hold (if UI present)**
  - Place legal hold on a test user (Admin → Users → user → Legal hold)
  - **Expected**: Legal hold set; user excluded from retention purge
  - Release legal hold
  - **Expected**: Legal hold cleared

#### Breach Notification / Security Incidents (Admin)
- [ ] **Security Incidents List**
  - Admin → Security Incidents (or Breach / Incidents)
  - **Expected**: List of incidents (or empty state) loads

- [ ] **Report Incident**
  - Create new incident: type, severity, title, description, mark as personal data breach if option exists
  - **Expected**: Incident created; 72-hour countdown shown if personal data breach

- [ ] **72-Hour Countdown**
  - Open an incident marked as personal data breach
  - **Expected**: Deadline or hours remaining displayed

- [ ] **Notify Affected Users**
  - On an incident with affected users, use "Notify affected users"
  - **Expected**: Action completes; notifications sent (check email/logs if possible)

- [ ] **Report to ICO**
  - Use "Report to ICO" (or equivalent) for a breach incident
  - **Expected**: Action completes; confirmation or audit trail (full ICO submission may be manual)

#### Consent Version Management (Admin)
- [ ] **Consent Versions List / by Type**
  - Admin → Consent Versions (or similar)
  - **Expected**: List or per-type view of consent versions

- [ ] **Create Consent Version**
  - Create a new version for a consent type (e.g. COOKIES, ANALYTICS)
  - **Expected**: Version created; appears in list

- [ ] **Active Version / Users Needing Re-consent**
  - View active version for a type
  - **Expected**: Active version shown or 404 when none
  - View "users needing reconsent" (if available)
  - **Expected**: List or count of users who need to re-consent

#### Privacy Center (User)
- [ ] **Privacy Center Access**
  - As logged-in user, open Privacy Center (menu or `/privacy-center` / equivalent)
  - **Expected**: Privacy dashboard loads

- [ ] **Data Overview**
  - **Expected**: Summary of data held (e.g. profile, consents, exports)

- [ ] **Consent Management**
  - **Expected**: View/update consent by category (e.g. marketing, analytics)

- [ ] **Data Export**
  - Request data export from Privacy Center
  - **Expected**: Export requested; download link or email when ready

- [ ] **Data Deletion**
  - Request account/data deletion from Privacy Center
  - **Expected**: Deletion flow starts; confirmation email if implemented

- [ ] **Cookie Preferences**
  - Open cookie preferences from Privacy Center
  - **Expected**: Same preference center as banner; save works

- [ ] **Connected Accounts (if shown)**
  - **Expected**: OAuth-linked accounts visible and revocable if implemented

---

### Phase 3: Security Hardening – Completed Items Only

*Excludes: Database encryption at rest (3.1), Field-level PII encryption (3.2). Includes: Security Monitoring (3.3), Security Testing / Vulnerability Scanner (3.4).*

#### Security Monitoring Dashboard (Admin)
- [ ] **Admin Security Dashboard**
  - Admin → Security (or Security Dashboard)
  - **Expected**: Security dashboard with metrics, recent events, or threat summary

- [ ] **Security Event Timeline**
  - Open security events / timeline view
  - **Expected**: List of security events (logins, failures, rate limits, etc.) with time and details

- [ ] **Threat Indicators**
  - Open threat indicators or risk summary
  - **Expected**: Indicators (e.g. failed logins, blocked IPs) visible

- [ ] **IP Blocklist (if present)**
  - View or add blocklist entry
  - **Expected**: Blocklist manageable; blocked IPs cannot access as expected

#### Vulnerability Scanner (Admin)
- [ ] **Vulnerability Scanner UI**
  - Admin → Vulnerability Scanner (or Security → Scans)
  - **Expected**: Scan management UI loads

- [ ] **Run Scan**
  - Start a scan (e.g. OWASP, QUICK, or FULL)
  - **Expected**: Scan starts; progress or status shown

- [ ] **View Scan Results**
  - After scan completes, open results/report
  - **Expected**: Findings list or summary; severity/category visible; export (e.g. CSV) if implemented

- [ ] **OWASP / Compliance**
  - Run scan and review results
  - **Expected**: OWASP-related checks (e.g. injection, XSS, CSRF) reflected in results where implemented

---

## 📊 Test Results Summary

### Features Tested
- Total Features: ___
- Passed: ___
- Failed: ___
- Issues Found: ___

### Browser Compatibility
- Chrome: ✅ / ❌
- Firefox: ✅ / ❌
- Safari: ✅ / ❌
- Edge: ✅ / ❌

### Responsive Design
- Mobile: ✅ / ❌
- Tablet: ✅ / ❌
- Desktop: ✅ / ❌

### Security
- Authentication: ✅ / ❌
- Authorization: ✅ / ❌
- Input Validation: ✅ / ❌

### World-Class Compliance (Completed Items)
- Phase 1 Legal Foundation: ✅ / ❌
- Phase 2 Enhanced GDPR: ✅ / ❌
- Phase 3 Security Monitoring & Vulnerability Scanner: ✅ / ❌

---

## 🐛 Issues Found

Document any issues found during testing:

1. **Issue**: [Description]
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]
   - **Severity**: [High/Medium/Low]

---

## ✅ Sign-Off

- [ ] All critical features tested
- [ ] All browsers tested
- [ ] Responsive design verified
- [ ] Security checks completed
- [ ] World-Class Compliance (completed items) tested per roadmap
- [ ] Issues documented
- [ ] Ready for CodeCanyon submission

**Tester**: _______________  
**Date**: _______________  
**Status**: ✅ Ready / ⚠️ Issues Found

---

**Last Updated**: February 2025  
**Compliance section**: Manual tests for completed items only from `docs/WORLD_CLASS_COMPLIANCE_ROADMAP.md` (Phases 1–3 completed items; Phases 4–6 and incomplete items excluded).
