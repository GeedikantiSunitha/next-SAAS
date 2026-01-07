# NextSaaS - Manual Testing Checklist

**Purpose**: Comprehensive manual testing checklist for CodeCanyon submission  
**Last Updated**: January 2025

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
- [ ] Issues documented
- [ ] Ready for CodeCanyon submission

**Tester**: _______________  
**Date**: _______________  
**Status**: ✅ Ready / ⚠️ Issues Found

---

**Last Updated**: January 2025
