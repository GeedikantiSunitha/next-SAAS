# Frontend Manual Testing Guide

**Date**: January 6, 2025  
**Status**: Ready for Manual Testing  
**Version**: 2.0.0

**Recent Updates** (January 2025):
- ✅ Enhanced OAuth testing (Google & GitHub with complete flow)
- ✅ Added database migration testing steps
- ✅ Added seed data script testing
- ✅ Added production Dockerfile testing
- ✅ Updated OAuth configuration verification

---

## 🚀 Quick Start: Running the Application

### Prerequisites
- **Node.js 18+** installed
- **PostgreSQL** installed and running
- **Resend API Key** (for email functionality) - Get from [resend.com](https://resend.com)
- **Git** (for cloning if needed)

### Step 1: Database Setup

1. **Create PostgreSQL Database**:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE nextsaas_db;

# Exit psql
\q
```

2. **Configure Database Connection**:
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL` in `backend/.env`:
     ```env
     DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/nextsaas_db
     ```

3. **Run Database Migrations**:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

**Expected**: Database tables created successfully

### Step 2: Backend Configuration

1. **Configure Environment Variables** (`backend/.env`):
```env
# Database
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/nextsaas_db

# JWT Secrets (generate secure random strings, minimum 32 characters)
JWT_SECRET=your-secure-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long

# Email (Get from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_NAME=NextSaaS

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# OAuth (Optional - for OAuth testing)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Payment Providers (Optional - for payment testing)
PAYMENT_PROVIDER=STRIPE  # or RAZORPAY or CASHFREE
STRIPE_SECRET_KEY=sk_test_xxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

2. **Install Backend Dependencies**:
```bash
cd backend
npm install
```

3. **Start Backend Server**:
```bash
npm run dev
```
**Expected**: Server should start on `http://localhost:3001`
- You should see: "Server running on port 3001"
- Check `http://localhost:3001/api/health` - should return `{"status":"ok"}`

### Step 3: Frontend Configuration

1. **Configure Environment Variables** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

2. **Install Frontend Dependencies**:
```bash
cd frontend
npm install
```

3. **Start Frontend Development Server**:
```bash
npm run dev
```
**Expected**: Frontend should start on `http://localhost:3000`
- You should see: "Local: http://localhost:3000"

### Step 4: Open Browser and Verify

1. Navigate to: `http://localhost:3000`
2. You should see the **Landing Page**
3. Check browser console (F12) - should have no errors
4. Check Network tab - API calls should go to `http://localhost:3001/api`

### Troubleshooting Setup

**Database Connection Issues**:
- Verify PostgreSQL is running: `pg_isready` or `psql -U postgres`
- Check `DATABASE_URL` format in `.env`
- Ensure database exists: `psql -U postgres -l` (list databases)

**Backend Won't Start**:
- Check port 3001 is not in use: `lsof -i :3001`
- Verify all environment variables are set
- Check backend logs for errors

**Frontend Won't Start**:
- Check port 3000 is not in use: `lsof -i :3000`
- Verify `VITE_API_BASE_URL` is correct
- Clear cache: `rm -rf node_modules/.vite`

**CORS Errors**:
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- Check backend CORS configuration

---

## 📋 Testing Overview

This comprehensive manual testing guide covers **ALL features** of the NextSaaS application:

### ✅ Core Features
- Landing Page
- Authentication (Register, Login, Logout)
- Forgot Password & Reset Password
- OAuth Authentication (Google, GitHub, Microsoft)
- Multi-Factor Authentication (MFA)
- Profile Management
- Password Change

### ✅ Admin Panel Features
- Admin Dashboard
- User Management
- Audit Logs
- Feature Flags Management
- Payment Management
- System Settings

### ✅ Advanced Features
- Notifications System
- RBAC (Role-Based Access Control)
- GDPR Compliance (Data Export, Deletion, Consents)
- Payment Processing
- Feature Flags (User-facing)
- Audit Logging
- Newsletter System
- Health & Metrics Monitoring
- Observability & Alerting

### ✅ Infrastructure & DevOps (NEW - January 2025)
- Database Migration Workflow
- Seed Data Script for Development/Testing
- Production Dockerfile
- OAuth Configuration Verification (Google & GitHub)

### ✅ UI/UX Features
- Toast Notifications
- Loading States
- Error Boundaries
- Form Validation
- Responsive Design
- Session Persistence

**Total**: 90+ comprehensive test scenarios covering all functionality (including all features, infrastructure, and monitoring)

---

## 📋 Manual Testing Checklist

### ✅ Phase 1: Authentication & Core Features (COMPLETE)

#### Test 1.1: User Registration
**Objective**: Verify new users can register successfully

**Steps**:
1. Navigate to `http://localhost:3000/register`

2. Fill in the registration form:
   - **Name** (Optional): "Test User"
   - **Email**: `test-${Date.now()}@example.com` (use unique email)
   - **Password**: `Password123!` (must meet requirements)
3. Click "Register" button

-> PASS - I am able to regsiter 


**Expected Results**:
- ✅ Form validates password requirements (8+ chars, uppercase, lowercase, number, special character)
- ✅ **Password Strength Indicator** appears below password field as you type
- ✅ Strength indicator shows: WEAK, FAIR, GOOD, or STRONG
- ✅ Visual progress bar changes color based on strength
- ✅ Feedback messages show what's missing (e.g., "Add uppercase letters")
- ✅ After successful registration, user is automatically logged in
- ✅ User is redirected to `/dashboard`
- ✅ User information is displayed on dashboard
- ✅ Access token is stored in HTTP-only cookies (not localStorage)

**Test Cases**:
- [ ] Valid registration with all fields
- [ ] Valid registration without name (optional field)
- [ ] Invalid email format (should show validation error)
- [ ] Weak password (should show validation error and WEAK strength indicator)
- [ ] Fair password (8-9 chars with all types) - should show FAIR and be rejected
- [ ] Good password (10-12 chars) - should show GOOD and be accepted
- [ ] Strong password (13+ chars) - should show STRONG and be accepted
- [ ] Password strength indicator updates in real-time as you type
- [ ] Common passwords (e.g., "Password123!") are detected and flagged
- [ ] Duplicate email (should show "Email already registered" error)
- [ ] Network error handling (disconnect backend, try to register)

---

#### Test 1.2: User Login
**Objective**: Verify existing users can log in

**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Fill in login form:
   - **Email**: Use email from Test 1.1
   - **Password**: `Password123!`
3. Click "Login" button

**Expected Results**:
- ✅ Form validates email format
- ✅ After successful login, user is redirected to `/dashboard`
- ✅ User information is displayed correctly
- ✅ Access token is stored in HTTP-only cookies (not localStorage)
- ✅ Toast notification may appear for success (if implemented)

**Test Cases**:
- [ ] Valid credentials login
- [ ] Invalid email format (should show validation error)
- [ ] Invalid credentials (should show "Invalid credentials" error)
- [ ] Empty password (should show "Password is required" error)
- [ ] Already authenticated user visiting `/login` (should redirect to dashboard)

-> PASS

---

#### Test 1.3: Protected Routes
**Objective**: Verify authentication-protected routes work correctly

**Steps**:
1. **Without Authentication**:
   - Open incognito/private window
   - Navigate to `http://localhost:3000/dashboard`
   - Expected: Should redirect to `/login`

2. **With Authentication**:
   - Log in first (Test 1.2)
   - Navigate to `http://localhost:3000/dashboard`
   - Expected: Should show dashboard

**Test Cases**:
- [ ] Unauthenticated access to `/dashboard` redirects to `/login`
- [ ] Authenticated access to `/dashboard` shows dashboard
- [ ] Authenticated access to `/login` redirects to `/dashboard`
- [ ] Authenticated access to `/register` redirects to `/dashboard`
- [ ] Root path `/` redirects to `/dashboard` (if authenticated) or `/login` (if not)

---

#### Test 1.4: User Logout
**Objective**: Verify users can log out successfully

**Steps**:
1. Log in (Test 1.2)
2. On dashboard, click "Logout" button
3. Verify logout behavior

**Expected Results**:
- ✅ User is logged out
- ✅ Redirected to `/login`
- ✅ Access token cookies are cleared
- ✅ Cannot access `/dashboard` without logging in again

**Test Cases**:
- [ ] Logout button works
- [ ] Cookies cleared (check DevTools > Application > Cookies)
- [ ] Redirect to login page
- [ ] Protected routes inaccessible after logout

-> PASS

---

#### Test 1.5: Form Validation
**Objective**: Verify client-side form validation works

**Login Form Validation**:
1. Navigate to `/login`
2. Try to submit with:
   - Invalid email: `invalid-email` → Should show "Invalid email address"
   - Empty password: Leave password empty → Should show "Password is required"
   - Valid email but empty password → Should show validation error

**Registration Form Validation**:
1. Navigate to `/register`
2. Try to submit with:
   - Invalid email: `invalid-email` → Should show "Invalid email address"
   - Weak password: `weak` → Should show password requirements and WEAK strength
   - Password without uppercase: `password123!` → Should show error and WEAK strength
   - Password without number: `Password!` → Should show error and WEAK strength
   - Password without lowercase: `PASSWORD123!` → Should show error and WEAK strength
   - Password without special char: `Password123` → Should show error and WEAK strength
   - Fair password (8-9 chars): `Passw0rd!` → Should show FAIR strength and be rejected
   - Good password (10-12 chars): `Password123!` → Should show GOOD strength and be accepted
   - Strong password (13+ chars): `VeryStrongPassword123!` → Should show STRONG strength

**Expected Results**:
- ✅ Validation errors appear immediately after submit attempt
- ✅ Errors are displayed below input fields
- ✅ Form does not submit when validation fails
- ✅ Error messages are clear and helpful

**Test Cases**:
- [ ] Email validation on login form
- [ ] Password required validation on login form
- [ ] Email validation on register form
- [ ] Password strength validation on register form
- [ ] All validation errors display correctly

-> PASS

---

#### Test 1.6: Error Handling
**Objective**: Verify error messages display correctly

**Steps**:
1. **Invalid Login Credentials**:
   - Navigate to `/login`
   - Enter non-existent email: `nonexistent@example.com`
   - Enter any password
   - Click "Login"
   - Expected: Red error message "Invalid credentials"

2. **Duplicate Registration**:
   - Register a user (Test 1.1)
   - Log out
   - Try to register again with same email
   - Expected: Red error message "Email already registered"

3. **Network Error**:
   - Stop backend server
   - Try to login
   - Expected: Appropriate error message

**Expected Results**:
- ✅ Error messages appear in red alert box
- ✅ Error messages are user-friendly
- ✅ Errors don't break the UI
- ✅ User can retry after error

**Test Cases**:
- [ ] Invalid credentials error displays
- [ ] Duplicate email error displays
- [ ] Network error handles gracefully
- [ ] Error messages are clear and actionable

---

#### Test 1.7: Session Persistence
**Objective**: Verify user stays logged in across page refreshes

**Steps**:
1. Log in (Test 1.2)
2. Verify on dashboard
3. Refresh the page (F5 or Cmd+R)
4. Check if still logged in

**Expected Results**:
- ✅ User remains logged in after page refresh
- ✅ Dashboard still accessible
- ✅ User information still displayed
- ✅ Cookies persist (HTTP-only cookies remain after refresh)

**Test Cases**:
- [ ] Session persists on page refresh
- [ ] Session persists on browser restart (if token valid)
- [ ] Invalid/expired token redirects to login

---

#### Test 1.8: Responsive Design
**Objective**: Verify UI works on different screen sizes

**Steps**:
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

**Expected Results**:
- ✅ Forms are usable on mobile
- ✅ Buttons are clickable on touch devices
- ✅ Text is readable on all sizes
- ✅ Layout adapts to screen size

**Test Cases**:
- [ ] Mobile view (375px) - forms usable
- [ ] Tablet view (768px) - layout adapts
- [ ] Desktop view (1920px) - optimal layout

---

### ✅ Phase 2: Advanced Features (COMPLETE)

#### Test 2.1: User Profile Management
**Objective**: Verify users can view and edit their profile

**Steps**:
1. Log in (Test 1.2)
2. Navigate to `/profile`
3. Verify profile page loads with user information

-> these is no way i ca go  to profile page ? from dashboard. unless i put the link in browser i cant access it. 

**Expected Results**:
- ✅ Profile page displays current user information
- ✅ Name and email fields are pre-filled
- ✅ Loading skeleton appears while data loads
- ✅ Toast notification may appear for errors (if any)

**Test Cases**:
- [ ] Profile page loads successfully
- [ ] User information displays correctly
- [ ] Loading skeleton appears during data fetch
- [ ] Error handling works (stop backend, refresh page)

---

#### Test 2.2: Edit Profile Information
**Objective**: Verify users can update their name and email

**Steps**:
1. Navigate to `/profile`
2. In "Profile Information" section:
   - Update **Name**: Change to "Updated Name"
   - Update **Email**: Change to `updated-${Date.now()}@example.com`
3. Click "Save Profile" button
4. Verify changes are saved

**Expected Results**:
- ✅ Form validates email format
- ✅ Loading button shows "Saving..." state
- ✅ Toast notification appears: "Profile updated successfully"
- ✅ Updated information displays immediately
- ✅ Changes persist after page refresh

**Test Cases**:
- [ ] Update name only
- [ ] Update email only
- [ ] Update both name and email
- [ ] Invalid email format (should show validation error)
- [ ] Duplicate email (should show error)
- [ ] No changes (should show "No changes to save" message)
- [ ] Loading state during save
- [ ] Success toast notification
- [ ] Error toast notification on failure

---

#### Test 2.3: Change Password
**Objective**: Verify users can change their password

**Steps**:
1. Navigate to `/profile`
2. In "Change Password" section:
   - Enter **Current Password**: Your current password
   - Enter **New Password**: `NewPassword123!`
3. Click "Change Password" button
4. Verify password is changed

**Expected Results**:
- ✅ **Password Strength Indicator** appears below new password field
- ✅ Strength indicator updates in real-time as you type
- ✅ Form validates password requirements
- ✅ Loading button shows "Changing..." state
- ✅ Toast notification appears: "Password changed successfully"
- ✅ Can log in with new password after logout

**Test Cases**:
- [ ] Change password with correct current password
- [ ] Weak new password (WEAK strength) - should be rejected
- [ ] Fair new password (FAIR strength) - should be rejected
- [ ] Good new password (GOOD strength) - should be accepted
- [ ] Strong new password (STRONG strength) - should be accepted
- [ ] Password strength indicator shows real-time feedback
- [ ] Incorrect current password (should show error)
- [ ] New password same as current (should show error)
- [ ] Loading state during password change
- [ ] Success toast notification
- [ ] Can login with new password after logout

---

#### Test 2.4: Advanced UI Components - Toast Notifications
**Objective**: Verify toast notifications work correctly

**Steps**:
1. Perform actions that trigger toasts:
   - Update profile (Test 2.2)
   - Change password (Test 2.3)
   - Any error scenarios

**Expected Results**:
- ✅ Toast appears in bottom-right corner (or configured position)
- ✅ Toast shows success message (green) or error message (red)
- ✅ Toast auto-dismisses after a few seconds
- ✅ Multiple toasts stack vertically
- ✅ Toast can be manually dismissed (X button)

**Test Cases**:
- [ ] Success toast appears on profile update
- [ ] Success toast appears on password change
- [ ] Error toast appears on validation errors
- [ ] Error toast appears on network errors
- [ ] Toast auto-dismisses
- [ ] Toast can be manually dismissed
- [ ] Multiple toasts stack correctly

---

#### Test 2.5: Advanced UI Components - Loading States
**Objective**: Verify loading states work correctly

**Steps**:
1. Navigate to `/profile`
2. Observe loading states:
   - Initial page load (skeleton loaders)
   - Form submission (loading buttons)

**Expected Results**:
- ✅ Skeleton loaders appear during initial data fetch
- ✅ Loading buttons show spinner and disabled state
- ✅ Loading states prevent duplicate submissions

**Test Cases**:
- [ ] Skeleton loaders on profile page initial load
- [ ] Loading button on profile update
- [ ] Loading button on password change
- [ ] Buttons disabled during loading
- [ ] Loading states prevent duplicate clicks

---

#### Test 2.6: React Query Integration
**Objective**: Verify React Query caching and data fetching works

**Steps**:
1. Navigate to `/profile`
2. Wait for data to load
3. Navigate away and back to `/profile`
4. Check Network tab in DevTools

**Expected Results**:
- ✅ Data loads from cache on second visit (no API call)
- ✅ Data is fresh and up-to-date
- ✅ Automatic refetching works correctly

**Test Cases**:
- [ ] Profile data cached after first load
- [ ] No duplicate API calls on navigation
- [ ] Data updates after mutations
- [ ] Cache invalidation works correctly

---

#### Test 2.7: Error Boundary
**Objective**: Verify error boundary catches and displays errors

**Steps**:
1. Open browser DevTools Console
2. Navigate to any page
3. Manually trigger an error (if possible) or wait for a real error
4. Verify error boundary displays

**Expected Results**:
- ✅ Error boundary catches JavaScript errors
- ✅ Fallback UI displays with error message
- ✅ "Try Again" button resets error state
- ✅ Error is logged to console

**Test Cases**:
- [ ] Error boundary catches render errors
- [ ] Fallback UI displays correctly
- [ ] "Try Again" button works
- [ ] Error logged to console
- [ ] Application doesn't crash completely

---

### ✅ Phase 3: Production Readiness Features (COMPLETE)

#### Test 3.1: Password Strength Validation (Registration)
**Objective**: Verify password strength indicator works on registration

**Steps**:
1. Navigate to `/register`
2. Type different passwords in the password field
3. Observe the password strength indicator

**Expected Results**:
- ✅ Strength indicator appears below password field
- ✅ Shows WEAK, FAIR, GOOD, or STRONG
- ✅ Progress bar changes color (red → orange → yellow → green)
- ✅ Feedback messages show what's missing
- ✅ Updates in real-time as you type

**Test Cases**:
- [ ] Empty password - no indicator shown
- [ ] Weak password (< 8 chars) - shows WEAK (red, 25%)
- [ ] Fair password (8-9 chars, all types) - shows FAIR (orange, 50%) and is rejected
- [ ] Good password (10-12 chars) - shows GOOD (yellow, 75%) and is accepted
- [ ] Strong password (13+ chars) - shows STRONG (green, 100%) and is accepted
- [ ] Common passwords detected and flagged
- [ ] Feedback messages appear for missing requirements
- [ ] Real-time updates as you type

---

#### Test 3.2: Password Strength Validation (Password Change)
**Objective**: Verify password strength indicator works on password change

**Steps**:
1. Navigate to `/profile`
2. Scroll to "Change Password" section
3. Type different passwords in the new password field
4. Observe the password strength indicator

**Expected Results**:
- ✅ Strength indicator appears below new password field
- ✅ Same behavior as registration form
- ✅ WEAK and FAIR passwords are rejected
- ✅ GOOD and STRONG passwords are accepted

**Test Cases**:
- [ ] Empty password - no indicator shown
- [ ] Weak password - shows WEAK and is rejected
- [ ] Fair password - shows FAIR and is rejected
- [ ] Good password - shows GOOD and is accepted
- [ ] Strong password - shows STRONG and is accepted
- [ ] Real-time updates as you type

---

#### Test 3.3: API Versioning (Backend - Optional Frontend Test)
**Objective**: Verify API versioning works (if frontend sends version headers)

**Steps**:
1. Open browser DevTools > Network tab
2. Perform any API action (login, register, profile update)
3. Check request headers

**Expected Results**:
- ✅ API requests work correctly
- ✅ Response headers may include `API-Version: v1`
- ✅ Backend defaults to v1 if no version specified

**Test Cases**:
- [ ] API calls work without version header (defaults to v1)
- [ ] Response includes API-Version header
- [ ] Backward compatibility maintained

---

#### Test 3.4: Feature Flags (Backend - Optional Frontend Test)
**Objective**: Verify feature flags can be checked (if UI uses them)

**Steps**:
1. Check if any UI elements are controlled by feature flags
2. Verify features can be toggled via environment variables

**Expected Results**:
- ✅ Features can be enabled/disabled via backend config
- ✅ Frontend respects feature flag status (if implemented)

**Test Cases**:
- [ ] Feature flags can be configured
- [ ] Features respect flag status
- [ ] Default behavior when flags not set

---

#### Test 3.5: Product Safeguards - Confirmation Dialogs
**Objective**: Verify confirmation dialogs prevent accidental actions

**Note**: Confirmation dialogs are implemented but may not be integrated into all destructive actions yet. Test when integrated.

**Expected Results** (when integrated):
- ✅ Confirmation dialog appears before destructive actions
- ✅ User must explicitly confirm action
- ✅ Cancel button dismisses dialog without action
- ✅ Destructive variant shows warning icon
- ✅ Loading state during confirmation

**Test Cases** (when integrated):
- [ ] Confirmation dialog appears for delete actions
- [ ] Confirmation dialog appears for destructive updates
- [ ] Cancel button works correctly
- [ ] Confirm button executes action
- [ ] Loading state during action
- [ ] Destructive variant styling

---

#### Test 3.6: Idempotency (Backend - Optional Frontend Test)
**Objective**: Verify idempotency prevents duplicate operations

**Note**: Idempotency is a backend feature. Frontend can send `Idempotency-Key` header if needed.

**Steps** (if frontend implements idempotency keys):
1. Perform an action that sends idempotency key
2. Repeat the same action with same key
3. Verify duplicate is prevented

**Expected Results**:
- ✅ Duplicate requests with same key return cached response
- ✅ No duplicate operations executed

**Test Cases** (if implemented):
- [ ] Idempotency key can be sent in headers
- [ ] Duplicate requests are handled correctly
- [ ] Cached responses returned for duplicates

---

### ✅ Phase 4: Landing Page & Navigation

#### Test 4.1: Landing Page
**Objective**: Verify landing page displays correctly and navigation works

**Steps**:
1. Navigate to `http://localhost:3000/`
2. Verify landing page elements

**Expected Results**:
- ✅ Landing page loads successfully
- ✅ Header/navigation bar is visible at top
- ✅ Footer is visible at bottom
- ✅ Navigation links work: Login, Register, Forgot Password
- ✅ "Home" or logo button returns to landing page
- ✅ Header and footer are consistent across all pages
- ✅ Page is responsive on mobile/tablet/desktop

**Test Cases**:
- [ ] Landing page loads without errors
- [ ] Header navigation links work
- [ ] Footer displays correctly
- [ ] Navigation to Login page works
- [ ] Navigation to Register page works
- [ ] Navigation to Forgot Password page works
- [ ] Return to home page works
- [ ] Responsive design works on all screen sizes

---

### ✅ Phase 5: Password Recovery

#### Test 5.1: Forgot Password
**Objective**: Verify users can request password reset

**Steps**:
1. Navigate to `http://localhost:3000/forgot-password`
2. Enter a registered email address
3. Click "Send Reset Link" button
4. Check email inbox for reset link

**Expected Results**:
- ✅ Form validates email format
- ✅ Loading state shows during request
- ✅ Success message appears: "Password reset link sent to your email"
- ✅ Email is received with reset link
- ✅ Reset link contains token
- ✅ Error message shows for non-existent email (optional - for security)

**Test Cases**:
- [ ] Valid email sends reset link
- [ ] Invalid email format shows validation error
- [ ] Non-existent email handled gracefully (may or may not show error for security)
- [ ] Loading state during request
- [ ] Success toast notification
- [ ] Email received with reset link
- [ ] Reset link is clickable and contains token

---

#### Test 5.2: Reset Password
**Objective**: Verify users can reset password using reset link

**Steps**:
1. Click reset link from email (or navigate to `/reset-password?token=TOKEN`)
2. Enter new password: `NewPassword123!`
3. Confirm new password
4. Click "Reset Password" button
5. Try logging in with new password

**Expected Results**:
- ✅ Password strength indicator appears
- ✅ Shows WEAK, FAIR, GOOD, or STRONG
- ✅ Form validates password requirements
- ✅ Confirm password must match
- ✅ Loading state during reset
- ✅ Success message: "Password reset successfully"
- ✅ Redirects to login page
- ✅ Can login with new password
- ✅ Cannot login with old password

**Test Cases**:
- [ ] Valid reset token works
- [ ] Invalid/expired token shows error
- [ ] Password strength validation works
- [ ] Weak password rejected
- [ ] Fair password rejected
- [ ] Good password accepted
- [ ] Strong password accepted
- [ ] Password confirmation must match
- [ ] Success toast notification
- [ ] Redirect to login page
- [ ] Can login with new password
- [ ] Old password no longer works

---

### ✅ Phase 6: OAuth Authentication

#### Test 6.1: OAuth Configuration Verification
**Objective**: Verify OAuth is properly configured before testing

**Prerequisites**: 
- Backend `.env` must have OAuth credentials configured
- Frontend `.env` must have OAuth client IDs configured

**Steps**:
1. **Check Backend Configuration** (`backend/.env`):
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

2. **Check Frontend Configuration** (`frontend/.env`):
   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_GITHUB_CLIENT_ID=your-github-client-id
   ```

3. **Verify OAuth Buttons Are Visible**:
   - Navigate to `/login` or `/register`
   - Check that Google and GitHub OAuth buttons are visible
   - Note: Microsoft OAuth button is commented out (coming soon)

**Expected Results**:
- ✅ OAuth buttons visible on login page
- ✅ OAuth buttons visible on register page
- ✅ Buttons show "Google" and "GitHub" labels
- ✅ Buttons are clickable (not disabled)
- ✅ If OAuth not configured, clicking button shows error toast

**Test Cases**:
- [ ] OAuth buttons visible on login page
- [ ] OAuth buttons visible on register page
- [ ] Google button clickable
- [ ] GitHub button clickable
- [ ] Error toast appears if OAuth not configured
- [ ] Buttons disabled during loading state

---

#### Test 6.2: OAuth Login (Google) - Complete Flow
**Objective**: Verify Google OAuth login works end-to-end

**Prerequisites**: 
- Google OAuth must be configured in both backend and frontend `.env` files
- Google OAuth app must have redirect URI configured: `http://localhost:3000/oauth/google/callback`

**Steps**:
1. Navigate to `/login`
2. Verify "Sign in with Google" button is visible
3. Click "Sign in with Google" button
4. **Expected Redirect**: Should redirect to Google OAuth consent screen
   - URL should contain `accounts.google.com`
   - Should show Google login/consent page
5. Complete Google authentication:
   - Sign in with Google account
   - Grant permissions if prompted
6. **Expected Redirect**: Should redirect back to `/oauth/google/callback`
7. **Expected Behavior**: 
   - Callback page processes OAuth token
   - User is authenticated
   - Redirects to `/dashboard`
8. Verify login success:
   - User is on dashboard
   - User information is displayed
   - Session cookies are set

**Expected Results**:
- ✅ OAuth button visible and clickable
- ✅ Clicking button redirects to Google OAuth page
- ✅ Google consent screen appears
- ✅ After consent, redirects to callback URL
- ✅ Callback processes token correctly
- ✅ User is logged in automatically
- ✅ Redirects to dashboard
- ✅ User information displayed
- ✅ HTTP-only cookies set (accessToken, refreshToken)
- ✅ Session persists across page refreshes

**Test Cases**:
- [ ] Google OAuth button visible
- [ ] Button click redirects to Google
- [ ] Google consent screen appears
- [ ] Can sign in with Google account
- [ ] Can grant permissions
- [ ] Redirects to callback URL after consent
- [ ] Callback processes token
- [ ] User logged in automatically
- [ ] Redirects to dashboard
- [ ] User information displayed
- [ ] Cookies set correctly
- [ ] Session persists

**Error Scenarios**:
- [ ] If OAuth not configured: Error toast appears
- [ ] If user cancels: Redirects back to login with error
- [ ] If invalid token: Error message displayed
- [ ] If callback error: Error toast appears

---

#### Test 6.3: OAuth Login (GitHub) - Complete Flow
**Objective**: Verify GitHub OAuth login works end-to-end

**Prerequisites**: 
- GitHub OAuth must be configured in both backend and frontend `.env` files
- GitHub OAuth app must have redirect URI configured: `http://localhost:3000/oauth/github/callback`

**Steps**:
1. Navigate to `/login`
2. Verify "Sign in with GitHub" button is visible
3. Click "Sign in with GitHub" button
4. **Expected Redirect**: Should redirect to GitHub OAuth authorization page
   - URL should contain `github.com/login/oauth/authorize`
   - Should show GitHub authorization page
5. Complete GitHub authentication:
   - Sign in with GitHub account (if not already signed in)
   - Authorize application if prompted
6. **Expected Redirect**: Should redirect back to `/oauth/github/callback?code=AUTHORIZATION_CODE`
7. **Expected Behavior**: 
   - Callback page processes authorization code
   - Backend exchanges code for access token
   - User is authenticated
   - Redirects to `/dashboard`
8. Verify login success:
   - User is on dashboard
   - User information is displayed
   - Session cookies are set

**Expected Results**:
- ✅ OAuth button visible and clickable
- ✅ Clicking button redirects to GitHub OAuth page
- ✅ GitHub authorization screen appears
- ✅ After authorization, redirects to callback URL with code
- ✅ Callback exchanges code for token
- ✅ User is logged in automatically
- ✅ Redirects to dashboard
- ✅ User information displayed
- ✅ HTTP-only cookies set
- ✅ Session persists

**Test Cases**:
- [ ] GitHub OAuth button visible
- [ ] Button click redirects to GitHub
- [ ] GitHub authorization screen appears
- [ ] Can sign in with GitHub account
- [ ] Can authorize application
- [ ] Redirects to callback URL with code
- [ ] Callback exchanges code for token
- [ ] User logged in automatically
- [ ] Redirects to dashboard
- [ ] User information displayed
- [ ] Cookies set correctly
- [ ] Session persists

**Error Scenarios**:
- [ ] If OAuth not configured: Error toast appears
- [ ] If user cancels: Redirects back to login with error
- [ ] If invalid code: Error message displayed
- [ ] If exchange fails: Error toast appears

---

#### Test 6.4: OAuth Registration Flow
**Objective**: Verify users can register using OAuth

**Steps**:
1. Navigate to `/register`
2. Click OAuth button (Google or GitHub)
3. Complete OAuth flow
4. **Expected Behavior**:
   - If email doesn't exist: Creates new user account
   - If email exists: Logs in existing user
   - Redirects to dashboard

**Expected Results**:
- ✅ OAuth registration works
- ✅ New user account created if email doesn't exist
- ✅ Existing user logged in if email exists
- ✅ User redirected to dashboard
- ✅ User information displayed

**Test Cases**:
- [ ] OAuth registration with new email creates account
- [ ] OAuth registration with existing email logs in
- [ ] User redirected to dashboard
- [ ] User information displayed correctly

---

#### Test 6.5: OAuth Callback Error Handling
**Objective**: Verify OAuth callback error handling works

**Steps**:
1. Navigate to `/oauth/google/callback#error=access_denied`
2. Verify error handling

**Expected Results**:
- ✅ Error message displayed
- ✅ User redirected to login page
- ✅ Error toast appears (if implemented)
- ✅ Error doesn't break the application

**Test Cases**:
- [ ] Access denied error handled
- [ ] Invalid state error handled
- [ ] Missing token/code error handled
- [ ] User redirected to login on error
- [ ] Error message is user-friendly

---

#### Test 6.6: OAuth Button Loading States
**Objective**: Verify OAuth buttons show loading states correctly

**Steps**:
1. Navigate to `/login`
2. Click an OAuth button
3. Observe button state during redirect

**Expected Results**:
- ✅ Button shows loading state when clicked
- ✅ Button is disabled during loading
- ✅ Other buttons may be disabled during loading
- ✅ Loading state clears after redirect

**Test Cases**:
- [ ] Button shows loading spinner when clicked
- [ ] Button disabled during loading
- [ ] Loading state clears after redirect
- [ ] Multiple clicks prevented during loading

---

### ✅ Phase 7: Multi-Factor Authentication (MFA) - COMPREHENSIVE

#### Test 7.1: Setup TOTP MFA - Complete Flow
**Objective**: Verify users can setup TOTP-based MFA with QR code and backup codes

**Prerequisites**: 
- User must be logged in
- Authenticator app installed (Google Authenticator, Authy, Microsoft Authenticator)

**Steps**:
1. **Log in as a user**
2. **Call Setup TOTP API** (or use UI if available):
   ```bash
   POST /api/auth/mfa/setup/totp
   Authorization: Cookie with accessToken
   ```
3. **Verify Response**:
   - Response should contain:
     - `secret`: Base32 secret key
     - `qrCodeUrl`: Data URL for QR code image
     - `backupCodes`: Array of backup codes (e.g., ["ABC123", "DEF456", ...])
4. **Display QR Code**:
   - QR code should be displayed as an image
   - QR code should be scannable with authenticator app
5. **Scan QR Code**:
   - Open authenticator app
   - Scan QR code
   - Verify account appears in app
6. **Get Verification Code**:
   - Get 6-digit code from authenticator app
7. **Enable MFA**:
   ```bash
   POST /api/auth/mfa/enable
   {
     "method": "TOTP",
     "code": "123456"  // Code from authenticator app
   }
   ```
8. **Verify MFA Enabled**:
   ```bash
   GET /api/auth/mfa/methods
   ```
   - Should return: `{ "methods": ["TOTP"] }`

**Expected Results**:
- ✅ Setup endpoint returns secret, QR code URL, and backup codes
- ✅ QR code is displayed correctly (base64 data URL)
- ✅ QR code is scannable with authenticator app
- ✅ Secret key is provided (can be manually entered if QR scan fails)
- ✅ Backup codes are generated (typically 8-10 codes)
- ✅ Backup codes are unique and secure
- ✅ Verification code input works
- ✅ Valid TOTP code enables MFA
- ✅ Invalid code shows error
- ✅ MFA enabled successfully
- ✅ MFA methods endpoint shows TOTP as enabled
- ✅ Backup codes are saved and can be used later

**Test Cases**:
- [ ] Setup TOTP endpoint accessible (requires authentication)
- [ ] QR code URL is valid base64 data URL
- [ ] QR code can be scanned with authenticator app
- [ ] Secret key can be manually entered in authenticator
- [ ] Backup codes generated (8-10 codes)
- [ ] Backup codes are unique
- [ ] Verification code from authenticator works
- [ ] Invalid verification code rejected
- [ ] Expired verification code rejected (if applicable)
- [ ] MFA enabled successfully
- [ ] MFA methods endpoint shows TOTP enabled
- [ ] Can verify MFA code after enabling
- [ ] Backup codes saved correctly

**API Endpoints Used**:
- `POST /api/auth/mfa/setup/totp` - Setup TOTP MFA
- `POST /api/auth/mfa/enable` - Enable MFA after verification
- `GET /api/auth/mfa/methods` - Get enabled MFA methods

---

#### Test 7.2: Setup Email MFA - Complete Flow
**Objective**: Verify users can setup Email-based MFA

**Prerequisites**: 
- User must be logged in
- Email service configured (Resend API key)

**Steps**:
1. **Log in as a user**
2. **Call Setup Email MFA API**:
   ```bash
   POST /api/auth/mfa/setup/email
   Authorization: Cookie with accessToken
   ```
3. **Verify Response**:
   - Response should indicate OTP sent to email
4. **Check Email**:
   - Open email inbox
   - Find OTP email from application
   - Note the 6-digit OTP code
5. **Enable Email MFA**:
   ```bash
   POST /api/auth/mfa/enable
   {
     "method": "EMAIL",
     "code": "123456"  // OTP from email
   }
   ```
6. **Verify MFA Enabled**:
   ```bash
   GET /api/auth/mfa/methods
   ```
   - Should return: `{ "methods": ["EMAIL"] }` or `{ "methods": ["TOTP", "EMAIL"] }` if both enabled

**Expected Results**:
- ✅ Setup endpoint initiates email OTP
- ✅ OTP email is received
- ✅ OTP is 6 digits
- ✅ OTP email contains clear instructions
- ✅ Valid OTP enables Email MFA
- ✅ Invalid OTP rejected
- ✅ Expired OTP rejected (OTP expires after a few minutes)
- ✅ MFA enabled successfully
- ✅ Can use Email MFA for login

**Test Cases**:
- [ ] Setup Email MFA endpoint accessible
- [ ] OTP email received
- [ ] OTP is 6 digits
- [ ] Valid OTP enables Email MFA
- [ ] Invalid OTP rejected
- [ ] Expired OTP rejected (wait 5+ minutes)
- [ ] MFA enabled successfully
- [ ] MFA methods endpoint shows EMAIL enabled
- [ ] Can send new OTP if needed

**API Endpoints Used**:
- `POST /api/auth/mfa/setup/email` - Setup Email MFA
- `POST /api/auth/mfa/send-email-otp` - Send new email OTP
- `POST /api/auth/mfa/enable` - Enable Email MFA
- `GET /api/auth/mfa/methods` - Get enabled MFA methods

---

#### Test 7.3: Login with MFA Enabled - Complete Flow
**Objective**: Verify login requires MFA code when MFA is enabled

**Prerequisites**: 
- User has MFA enabled (TOTP or Email)
- Authenticator app set up (for TOTP) or email access (for Email MFA)

**Steps**:
1. **Enable MFA for a user** (Test 7.1 or 7.2)
2. **Log out** (if logged in)
3. **Attempt Login**:
   ```bash
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "Password123!"
   }
   ```
4. **Verify Response**:
   - Response should contain:
     - `requiresMfa: true`
     - `mfaMethod: "TOTP"` or `"EMAIL"`
     - Temporary login token set as cookie
5. **Get MFA Code**:
   - **For TOTP**: Get code from authenticator app
   - **For Email**: Check email for OTP (or call `POST /api/auth/mfa/send-email-otp` first)
6. **Complete Login with MFA**:
   ```bash
   POST /api/auth/login/mfa
   {
     "code": "123456",
     "method": "TOTP",  // or "EMAIL"
     "isBackupCode": false  // true if using backup code
   }
   ```
7. **Verify Login Success**:
   - Should receive access token and refresh token cookies
   - Should be redirected to dashboard (if using frontend)

**Expected Results**:
- ✅ Login with password returns `requiresMfa: true`
- ✅ Temporary login token is set as cookie
- ✅ MFA method is indicated (TOTP or EMAIL)
- ✅ Can get TOTP code from authenticator app
- ✅ Can get Email OTP from email
- ✅ Valid MFA code completes login
- ✅ Access token and refresh token cookies set
- ✅ User redirected to dashboard
- ✅ Invalid MFA code shows error
- ✅ Expired temporary token requires re-login
- ✅ Can use backup code instead of TOTP/Email code

**Test Cases**:
- [ ] Login with MFA enabled returns requiresMfa flag
- [ ] Temporary login token set as cookie
- [ ] MFA method indicated correctly
- [ ] Can get TOTP code from authenticator
- [ ] Can get Email OTP from email
- [ ] Valid TOTP code completes login
- [ ] Valid Email OTP completes login
- [ ] Invalid code shows error
- [ ] Expired temporary token requires re-login
- [ ] Backup code works for login
- [ ] Used backup code cannot be reused
- [ ] Login completes successfully with MFA
- [ ] Access and refresh tokens set correctly

**Error Scenarios**:
- [ ] Invalid MFA code: Returns 401 error
- [ ] Expired temporary token: Returns 401, must login again
- [ ] Missing temporary token: Returns 401 error
- [ ] Wrong MFA method: Returns 400 validation error

**API Endpoints Used**:
- `POST /api/auth/login` - Initial login (returns requiresMfa if enabled)
- `POST /api/auth/login/mfa` - Complete login with MFA code
- `POST /api/auth/mfa/send-email-otp` - Request new email OTP (if needed)

---

#### Test 7.4: MFA Backup Codes Management
**Objective**: Verify backup codes can be generated, verified, and used

**Prerequisites**: 
- User has TOTP MFA enabled
- User is logged in

**Steps**:
1. **Generate New Backup Codes**:
   ```bash
   POST /api/auth/mfa/backup-codes
   Authorization: Cookie with accessToken
   ```
2. **Verify Response**:
   - Should return array of backup codes (e.g., 8-10 codes)
   - Codes should be unique
3. **Save Backup Codes Securely**:
   - Copy codes to secure location
   - Note: Old backup codes are invalidated when new ones are generated
4. **Verify Backup Code** (Optional - for testing):
   ```bash
   POST /api/auth/mfa/verify-backup
   {
     "code": "ABC123"  // One of the backup codes
   }
   ```
5. **Use Backup Code for Login**:
   - Log out
   - Login with email/password
   - Use backup code instead of TOTP code:
     ```bash
     POST /api/auth/login/mfa
     {
       "code": "ABC123",
       "method": "TOTP",
       "isBackupCode": true
     }
     ```

**Expected Results**:
- ✅ Can generate new backup codes
- ✅ Backup codes are unique
- ✅ Backup codes are secure (random, not predictable)
- ✅ Old backup codes invalidated when new ones generated
- ✅ Can verify backup code validity
- ✅ Can use backup code for login
- ✅ Used backup code cannot be reused
- ✅ Invalid backup code rejected

**Test Cases**:
- [ ] Generate backup codes endpoint accessible
- [ ] Backup codes generated (8-10 codes)
- [ ] Backup codes are unique
- [ ] Backup codes are secure format
- [ ] Can verify backup code validity
- [ ] Valid backup code returns `valid: true`
- [ ] Invalid backup code returns `valid: false`
- [ ] Can use backup code for login
- [ ] Used backup code cannot be reused
- [ ] Old backup codes invalidated after generating new ones

**API Endpoints Used**:
- `POST /api/auth/mfa/backup-codes` - Generate new backup codes
- `POST /api/auth/mfa/verify-backup` - Verify backup code validity
- `POST /api/auth/login/mfa` - Use backup code for login

---

#### Test 7.5: Disable MFA
**Objective**: Verify users can disable MFA methods

**Prerequisites**: 
- User has MFA enabled (TOTP or Email)
- User is logged in

**Steps**:
1. **Get Current MFA Methods**:
   ```bash
   GET /api/auth/mfa/methods
   ```
   - Should show enabled methods
2. **Disable TOTP MFA** (if enabled):
   ```bash
   POST /api/auth/mfa/disable
   {
     "method": "TOTP"
   }
   ```
3. **Disable Email MFA** (if enabled):
   ```bash
   POST /api/auth/mfa/disable
   {
     "method": "EMAIL"
   }
   ```
4. **Verify MFA Disabled**:
   ```bash
   GET /api/auth/mfa/methods
   ```
   - Should return empty array or no enabled methods
5. **Test Login Without MFA**:
   - Log out
   - Login with email/password
   - Should NOT require MFA code
   - Should login directly

**Expected Results**:
- ✅ Can disable TOTP MFA
- ✅ Can disable Email MFA
- ✅ MFA methods endpoint shows no enabled methods after disabling
- ✅ Login no longer requires MFA code
- ✅ Can disable individual methods (if multiple enabled)
- ✅ Success message appears after disabling

**Test Cases**:
- [ ] Disable TOTP MFA works
- [ ] Disable Email MFA works
- [ ] MFA methods endpoint shows no methods after disabling
- [ ] Login no longer requires MFA
- [ ] Can disable one method while keeping another enabled
- [ ] Success message appears
- [ ] Audit log created for MFA disable

**API Endpoints Used**:
- `GET /api/auth/mfa/methods` - Get enabled MFA methods
- `POST /api/auth/mfa/disable` - Disable MFA method

---

#### Test 7.6: Verify MFA Code (Without Login)
**Objective**: Verify MFA code can be verified for testing purposes

**Prerequisites**: 
- User has MFA enabled
- User is logged in

**Steps**:
1. **Get MFA Code**:
   - For TOTP: Get code from authenticator app
   - For Email: Get OTP from email (or request new one)
2. **Verify MFA Code**:
   ```bash
   POST /api/auth/mfa/verify
   {
     "method": "TOTP",  // or "EMAIL"
     "code": "123456"
   }
   ```
3. **Verify Response**:
   - Should return `{ "valid": true }` for valid code
   - Should return `{ "valid": false }` for invalid code

**Expected Results**:
- ✅ Can verify TOTP code
- ✅ Can verify Email OTP code
- ✅ Valid code returns `valid: true`
- ✅ Invalid code returns `valid: false`
- ✅ Expired code returns `valid: false`

**Test Cases**:
- [ ] Verify TOTP code works
- [ ] Verify Email OTP code works
- [ ] Valid code returns valid: true
- [ ] Invalid code returns valid: false
- [ ] Expired code returns valid: false

**API Endpoints Used**:
- `POST /api/auth/mfa/verify` - Verify MFA code
- `POST /api/auth/mfa/send-email-otp` - Request new email OTP (if needed)

---

### ✅ Phase 8: Admin Panel Features

#### Test 8.1: Admin Dashboard Access & Statistics
**Objective**: Verify admin dashboard is accessible only to admins and shows real statistics

**Prerequisites**: 
- Admin or SUPER_ADMIN user account
- Some test data in database (users, sessions, audit logs)

**Steps**:
1. **Test Regular User Access**:
   - Log in as regular user (USER role)
   - Try to access `/api/admin/dashboard`
   - Should return 403 Forbidden

2. **Test Admin Access**:
   - Log in as admin user (ADMIN or SUPER_ADMIN role)
   - Access dashboard:
     ```bash
     GET /api/admin/dashboard
     Authorization: Cookie with accessToken
     ```

3. **Verify Dashboard Statistics**:
   - Response should contain:
     ```json
     {
       "success": true,
       "data": {
         "stats": {
           "totalUsers": 10,
           "activeSessions": 5,
           "recentActivity": [...],
           "systemHealth": {
             "status": "ok",
             "database": "connected",
             "timestamp": "..."
           }
         }
       }
     }
     ```

4. **Verify Statistics Accuracy**:
   - `totalUsers`: Should match actual user count in database
   - `activeSessions`: Should show sessions that haven't expired
   - `recentActivity`: Should show last 10 audit log entries
   - `systemHealth`: Should show system status

**Expected Results**:
- ✅ Regular users cannot access admin routes (403 Forbidden)
- ✅ Admin users can access admin dashboard
- ✅ Dashboard shows real-time statistics (not stub data)
- ✅ Total users count is accurate
- ✅ Active sessions count is accurate
- ✅ Recent activity shows latest audit logs
- ✅ System health shows database connection status
- ✅ Statistics update in real-time

**Test Cases**:
- [ ] Regular user cannot access admin routes (403 error)
- [ ] Admin user can access dashboard
- [ ] SUPER_ADMIN user can access dashboard
- [ ] Dashboard displays total users count
- [ ] Dashboard displays active sessions count
- [ ] Dashboard displays recent activity (last 10 audit logs)
- [ ] Dashboard displays system health status
- [ ] Statistics are accurate (match database)
- [ ] Recent activity shows user email if available
- [ ] System health shows database connection status

**API Endpoint Used**:
- `GET /api/admin/dashboard` - Get dashboard statistics

---

#### Test 8.2: User Management (Admin)
**Objective**: Verify admins can manage users

**Steps**:
1. Log in as admin
2. Navigate to `/admin/users`
3. View user list
4. Test user management features

**Expected Results**:
- ✅ User list displays with pagination
- ✅ Search functionality works
- ✅ Filters work (role, status, etc.)
- ✅ Can view user details
- ✅ Can create new user
- ✅ Can edit user (name, email, role, status)
- ✅ Can delete user (with confirmation)
- ✅ Can view user sessions
- ✅ Can revoke user sessions
- ✅ Can view user activity log

**Test Cases**:
- [ ] User list loads with pagination
- [ ] Search users by email/name
- [ ] Filter by role (USER, ADMIN, SUPER_ADMIN)
- [ ] Filter by status (active/inactive)
- [ ] View user details
- [ ] Create new user
- [ ] Edit user information
- [ ] Change user role
- [ ] Activate/deactivate user
- [ ] Delete user (with confirmation)
- [ ] View user sessions
- [ ] Revoke user session
- [ ] View user activity log

---

#### Test 8.3: Audit Logs (Admin)
**Objective**: Verify admins can view and export audit logs

**Steps**:
1. Navigate to `/admin/audit-logs`
2. View audit logs
3. Test filtering and export

**Expected Results**:
- ✅ Audit logs list displays
- ✅ Pagination works
- ✅ Filters work (user, action, resource, date range)
- ✅ Can view log details
- ✅ Can export logs (CSV, JSON)
- ✅ Logs show user actions, timestamps, IP addresses

**Test Cases**:
- [ ] Audit logs list loads
- [ ] Pagination works
- [ ] Filter by user
- [ ] Filter by action type
- [ ] Filter by resource
- [ ] Filter by date range
- [ ] View log details
- [ ] Export to CSV
- [ ] Export to JSON
- [ ] Logs show correct information

---

#### Test 8.4: Feature Flags Management (Admin)
**Objective**: Verify admins can manage feature flags

**Steps**:
1. Navigate to `/admin/feature-flags`
2. View feature flags list
3. Toggle feature flags

**Expected Results**:
- ✅ Feature flags list displays
- ✅ Shows flag name, description, status
- ✅ Can toggle flag on/off
- ✅ Changes take effect immediately
- ✅ Audit log created for changes

**Test Cases**:
- [ ] Feature flags list loads
- [ ] Toggle flag on
- [ ] Toggle flag off
- [ ] Changes saved successfully
- [ ] Audit log created
- [ ] Frontend respects flag changes

---

#### Test 8.5: Payment Management (Admin)
**Objective**: Verify admins can view and manage payments

**Steps**:
1. Navigate to `/admin/payments`
2. View payments list
3. Test payment management features

**Expected Results**:
- ✅ Payments list displays with filters
- ✅ Can filter by user, status, date range
- ✅ Can view payment details
- ✅ Can process refunds
- ✅ Can view subscriptions
- ✅ Revenue analytics displayed

**Test Cases**:
- [ ] Payments list loads
- [ ] Filter by user
- [ ] Filter by status
- [ ] Filter by date range
- [ ] View payment details
- [ ] Process refund (full)
- [ ] Process refund (partial)
- [ ] View subscriptions
- [ ] Revenue analytics display

---

#### Test 8.6: System Settings (Admin)
**Objective**: Verify admins can manage system settings

**Steps**:
1. Navigate to `/admin/settings`
2. View system settings
3. Update settings

**Expected Results**:
- ✅ Settings page displays
- ✅ Can view application settings
- ✅ Can update settings
- ✅ Changes saved successfully
- ✅ Email templates can be managed (if available)
- ✅ Maintenance mode can be toggled (if available)

**Test Cases**:
- [ ] Settings page loads
- [ ] View current settings
- [ ] Update general settings
- [ ] Update email settings
- [ ] Update payment settings
- [ ] Save changes
- [ ] Changes persist

---

### ✅ Phase 9: Notifications System

#### Test 9.1: View Notifications
**Objective**: Verify users can view their notifications

**Steps**:
1. Log in as a user
2. Navigate to notifications (if available in UI) or use API
3. View notifications list

**Expected Results**:
- ✅ Notifications list displays
- ✅ Shows unread/read status
- ✅ Can filter by unread only
- ✅ Pagination works
- ✅ Notifications show type, title, message, timestamp

**Test Cases**:
- [ ] Notifications list loads
- [ ] Unread notifications highlighted
- [ ] Filter unread only works
- [ ] Pagination works
- [ ] Notification details visible

---

#### Test 9.2: Mark Notifications as Read
**Objective**: Verify users can mark notifications as read

**Steps**:
1. View notifications
2. Click on a notification or "Mark as Read"
3. Verify notification is marked as read

**Expected Results**:
- ✅ Can mark individual notification as read
- ✅ Can mark all notifications as read
- ✅ Unread count updates
- ✅ Visual indicator changes

**Test Cases**:
- [ ] Mark single notification as read
- [ ] Mark all notifications as read
- [ ] Unread count updates
- [ ] Visual indicator changes

---

#### Test 9.3: Delete Notifications
**Objective**: Verify users can delete notifications

**Steps**:
1. View notifications
2. Delete a notification
3. Verify notification is removed

**Expected Results**:
- ✅ Can delete individual notification
- ✅ Notification removed from list
- ✅ Confirmation may appear (if implemented)

**Test Cases**:
- [ ] Delete notification works
- [ ] Notification removed from list
- [ ] List updates correctly

---

#### Test 9.4: Notification Preferences
**Objective**: Verify users can manage notification preferences

**Steps**:
1. Navigate to notification preferences (if available)
2. Update preferences (email, in-app, SMS)

**Expected Results**:
- ✅ Preferences page displays
- ✅ Can toggle email notifications
- ✅ Can toggle in-app notifications
- ✅ Can toggle SMS notifications (if available)
- ✅ Changes saved successfully

**Test Cases**:
- [ ] Preferences page accessible
- [ ] Toggle email notifications
- [ ] Toggle in-app notifications
- [ ] Toggle SMS notifications
- [ ] Changes saved

---

### ✅ Phase 10: RBAC (Role-Based Access Control)

#### Test 10.1: Check User Role
**Objective**: Verify users can check their role

**Steps**:
1. Log in as a user
2. Check role information (via API or UI if available)

**Expected Results**:
- ✅ Can view own role (USER, ADMIN, SUPER_ADMIN)
- ✅ Can view permissions
- ✅ Role hierarchy displayed correctly

**Test Cases**:
- [ ] View own role
- [ ] View permissions
- [ ] Role hierarchy correct

---

#### Test 10.2: Role-Based Access
**Objective**: Verify role-based access control works

**Steps**:
1. Log in as USER role
2. Try to access admin features
3. Log in as ADMIN role
4. Try to access admin features
5. Log in as SUPER_ADMIN role
6. Try to access all features

**Expected Results**:
- ✅ USER cannot access admin features
- ✅ ADMIN can access admin features
- ✅ SUPER_ADMIN can access all features
- ✅ Role checks work correctly

**Test Cases**:
- [ ] USER role restrictions work
- [ ] ADMIN role access works
- [ ] SUPER_ADMIN role access works
- [ ] Unauthorized access blocked

---

#### Test 10.3: Update User Role (Super Admin)
**Objective**: Verify super admins can update user roles

**Steps**:
1. Log in as SUPER_ADMIN
2. Navigate to user management
3. Change a user's role
4. Verify role change

**Expected Results**:
- ✅ Can change user role to USER, ADMIN, or SUPER_ADMIN
- ✅ Role change saved
- ✅ User permissions update immediately
- ✅ Audit log created

**Test Cases**:
- [ ] Change role to USER
- [ ] Change role to ADMIN
- [ ] Change role to SUPER_ADMIN
- [ ] Role change saved
- [ ] Permissions update
- [ ] Audit log created

---

### ✅ Phase 11: GDPR Compliance

#### Test 11.1: Data Export Request
**Objective**: Verify users can request data export

**Steps**:
1. Log in as a user
2. Navigate to GDPR/data export (if available in UI) or use API
3. Request data export
4. Download exported data

**Expected Results**:
- ✅ Can request data export
- ✅ Export includes all user data
- ✅ Export file generated (JSON or CSV)
- ✅ Download link provided
- ✅ Export expires after 7 days

**Test Cases**:
- [ ] Request data export
- [ ] Export generated successfully
- [ ] Export includes user data
- [ ] Download link works
- [ ] Export file format correct

---

#### Test 11.2: Data Deletion Request
**Objective**: Verify users can request data deletion

**Steps**:
1. Request data deletion
2. Check email for confirmation link
3. Confirm deletion
4. Verify data is deleted

**Expected Results**:
- ✅ Can request data deletion
- ✅ Confirmation email sent
- ✅ Can choose soft or hard deletion
- ✅ After confirmation, data deleted
- ✅ User account deactivated/deleted

**Test Cases**:
- [ ] Request soft deletion
- [ ] Request hard deletion
- [ ] Confirmation email received
- [ ] Confirm deletion works
- [ ] Data deleted successfully
- [ ] Account deactivated/deleted

---

#### Test 11.3: Consent Management
**Objective**: Verify users can manage consents

**Steps**:
1. View consent preferences
2. Grant consent (marketing, analytics, etc.)
3. Revoke consent
4. Verify consent status

**Expected Results**:
- ✅ Can view current consents
- ✅ Can grant consent
- ✅ Can revoke consent
- ✅ Consent status tracked
- ✅ Timestamps recorded

**Test Cases**:
- [ ] View consents
- [ ] Grant marketing consent
- [ ] Grant analytics consent
- [ ] Revoke consent
- [ ] Consent status updates
- [ ] Timestamps correct

---

### ✅ Phase 12: Payment Processing

#### Test 12.1: Create Payment
**Objective**: Verify users can create payments

**Steps**:
1. Log in as a user
2. Create a payment (if UI available) or use API
3. Complete payment flow

**Expected Results**:
- ✅ Can create payment intent
- ✅ Payment amount and currency specified
- ✅ Payment provider selected (Stripe, Razorpay, Cashfree)
- ✅ Payment status tracked
- ✅ Payment details saved

**Test Cases**:
- [ ] Create payment intent
- [ ] Specify amount and currency
- [ ] Select payment provider
- [ ] Payment status updates
- [ ] Payment details saved

---

#### Test 12.2: View Payment History
**Objective**: Verify users can view payment history

**Steps**:
1. View payment history (if UI available)
2. Test filtering and pagination

**Expected Results**:
- ✅ Payment history displays
- ✅ Shows payment details (amount, status, date)
- ✅ Can filter by status
- ✅ Pagination works

**Test Cases**:
- [ ] Payment history loads
- [ ] Payment details visible
- [ ] Filter by status works
- [ ] Pagination works

---

#### Test 12.3: Payment Refund
**Objective**: Verify payments can be refunded

**Steps**:
1. View a completed payment
2. Process refund (full or partial)
3. Verify refund status

**Expected Results**:
- ✅ Can process full refund
- ✅ Can process partial refund
- ✅ Refund status tracked
- ✅ Payment status updates to REFUNDED or PARTIALLY_REFUNDED

**Test Cases**:
- [ ] Process full refund
- [ ] Process partial refund
- [ ] Refund status updates
- [ ] Payment status updates

---

### ✅ Phase 14: Newsletter System (NEW)

#### Test 14.1: Subscribe to Newsletter
**Objective**: Verify users can subscribe to newsletter

**Prerequisites**: 
- Newsletter system configured
- Email service configured

**Steps**:
1. **Subscribe as Public User** (no authentication):
   ```bash
   POST /api/newsletter/subscribe
   {
     "email": "user@example.com"
   }
   ```

2. **Subscribe as Authenticated User**:
   - Log in first
   - Subscribe:
     ```bash
     POST /api/newsletter/subscribe
     Authorization: Cookie with accessToken
     {
       "email": "user@example.com"
     }
     ```

3. **Verify Subscription**:
   - Should return success message
   - Email should be added to newsletter subscriptions
   - User should receive confirmation email (if configured)

**Expected Results**:
- ✅ Can subscribe without authentication
- ✅ Can subscribe with authentication
- ✅ Email validation works
- ✅ Duplicate subscription handled gracefully
- ✅ Success message appears
- ✅ Confirmation email sent (if configured)

**Test Cases**:
- [ ] Public user can subscribe
- [ ] Authenticated user can subscribe
- [ ] Invalid email format rejected
- [ ] Duplicate subscription handled
- [ ] Success message appears
- [ ] Confirmation email received

**API Endpoint Used**:
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

---

#### Test 14.2: Unsubscribe from Newsletter
**Objective**: Verify users can unsubscribe from newsletter

**Steps**:
1. **Unsubscribe via Email**:
   - Click unsubscribe link from newsletter email
   - Or use API:
     ```bash
     DELETE /api/newsletter/unsubscribe?email=user@example.com&token=UNSUBSCRIBE_TOKEN
     ```

2. **Verify Unsubscription**:
   - Should return success message
   - Email should be removed from subscriptions
   - User should not receive future newsletters

**Expected Results**:
- ✅ Unsubscribe link works
- ✅ Unsubscribe token validated
- ✅ Email removed from subscriptions
- ✅ Success message appears
- ✅ User no longer receives newsletters

**Test Cases**:
- [ ] Unsubscribe link works
- [ ] Invalid token rejected
- [ ] Email removed from subscriptions
- [ ] Success message appears

**API Endpoint Used**:
- `DELETE /api/newsletter/unsubscribe` - Unsubscribe from newsletter

---

#### Test 14.3: Admin Newsletter Management
**Objective**: Verify admins can manage newsletters

**Prerequisites**: 
- Admin or SUPER_ADMIN user
- Newsletter system configured

**Steps**:
1. **Create Newsletter** (Admin):
   ```bash
   POST /api/newsletter
   Authorization: Cookie with accessToken (Admin)
   {
     "subject": "Monthly Update",
     "content": "Newsletter content here...",
     "status": "DRAFT"
   }
   ```

2. **List Newsletters**:
   ```bash
   GET /api/newsletter
   Authorization: Cookie with accessToken (Admin)
   ```

3. **Update Newsletter**:
   ```bash
   PUT /api/newsletter/:id
   Authorization: Cookie with accessToken (Admin)
   {
     "subject": "Updated Subject",
     "content": "Updated content..."
   }
   ```

4. **Send Newsletter**:
   ```bash
   POST /api/newsletter/:id/send
   Authorization: Cookie with accessToken (Admin)
   ```

5. **Schedule Newsletter**:
   ```bash
   POST /api/newsletter/:id/schedule
   Authorization: Cookie with accessToken (Admin)
   {
     "scheduledAt": "2025-01-15T10:00:00Z"
   }
   ```

6. **Get Newsletter Subscriptions**:
   ```bash
   GET /api/newsletter/subscriptions
   Authorization: Cookie with accessToken (Admin)
   ```

**Expected Results**:
- ✅ Admins can create newsletters
- ✅ Admins can list newsletters
- ✅ Admins can update newsletters
- ✅ Admins can send newsletters
- ✅ Admins can schedule newsletters
- ✅ Admins can view subscriptions
- ✅ Regular users cannot access admin endpoints

**Test Cases**:
- [ ] Create newsletter works
- [ ] List newsletters works
- [ ] Update newsletter works
- [ ] Send newsletter works
- [ ] Schedule newsletter works
- [ ] View subscriptions works
- [ ] Regular users cannot access (403 error)

**API Endpoints Used**:
- `POST /api/newsletter` - Create newsletter (Admin)
- `GET /api/newsletter` - List newsletters (Admin)
- `GET /api/newsletter/:id` - Get newsletter by ID (Admin)
- `PUT /api/newsletter/:id` - Update newsletter (Admin)
- `POST /api/newsletter/:id/send` - Send newsletter (Admin)
- `POST /api/newsletter/:id/schedule` - Schedule newsletter (Admin)
- `GET /api/newsletter/subscriptions` - Get subscriptions (Admin)

---

### ✅ Phase 15: Health & Metrics (NEW)

#### Test 15.1: Health Check Endpoint
**Objective**: Verify health check endpoint works correctly

**Steps**:
1. **Check Basic Health**:
   ```bash
   GET /api/health
   ```

2. **Verify Response**:
   - Should return:
     ```json
     {
       "status": "healthy",
       "timestamp": "2025-01-06T...",
       "database": "healthy",
       "email": "configured" or "not configured"
     }
     ```

3. **Test Database Connection**:
   - Health endpoint should check database connection
   - Should show "healthy" if connected
   - Should show "unhealthy" if database is down

4. **Test Email Configuration**:
   - Should show "configured" if Resend API key is set
   - Should show "not configured" if missing

**Expected Results**:
- ✅ Health endpoint accessible without authentication
- ✅ Returns status, timestamp, database status
- ✅ Database connection checked
- ✅ Email configuration checked
- ✅ Returns 200 if healthy
- ✅ Returns 503 if unhealthy

**Test Cases**:
- [ ] Health endpoint accessible
- [ ] Returns correct status format
- [ ] Database status accurate
- [ ] Email configuration status accurate
- [ ] Returns 200 when healthy
- [ ] Returns 503 when unhealthy (if database down)

**API Endpoint Used**:
- `GET /api/health` - Health check endpoint

---

#### Test 15.2: System Metrics (Admin)
**Objective**: Verify admins can view system metrics

**Prerequisites**: 
- Admin or SUPER_ADMIN user

**Steps**:
1. **Get System Metrics**:
   ```bash
   GET /api/admin/metrics/system
   Authorization: Cookie with accessToken (Admin)
   ```

2. **Get Database Metrics**:
   ```bash
   GET /api/admin/metrics/database
   Authorization: Cookie with accessToken (Admin)
   ```

3. **Get API Metrics**:
   ```bash
   GET /api/admin/metrics/api
   Authorization: Cookie with accessToken (Admin)
   ```

**Expected Results**:
- ✅ Admins can view system metrics
- ✅ System metrics show CPU, memory, uptime
- ✅ Database metrics show connection pool, query stats
- ✅ API metrics show request counts, response times
- ✅ Regular users cannot access (403 error)

**Test Cases**:
- [ ] System metrics accessible (Admin)
- [ ] Database metrics accessible (Admin)
- [ ] API metrics accessible (Admin)
- [ ] Metrics show relevant information
- [ ] Regular users cannot access (403 error)

**API Endpoints Used**:
- `GET /api/admin/metrics/system` - Get system metrics (Admin)
- `GET /api/admin/metrics/database` - Get database metrics (Admin)
- `GET /api/admin/metrics/api` - Get API metrics (Admin)

---

### ✅ Phase 16: Observability & Monitoring (NEW)

#### Test 16.1: Alert Rules Check (Admin)
**Objective**: Verify admins can check alert rules and current alerts

**Prerequisites**: 
- Admin or SUPER_ADMIN user

**Steps**:
1. **Check Alerts**:
   ```bash
   GET /api/observability/alerts/check
   Authorization: Cookie with accessToken (Admin)
   ```

2. **Get Alert Rules**:
   ```bash
   GET /api/observability/alerts/rules
   Authorization: Cookie with accessToken (Admin)
   ```

3. **Verify Response**:
   - Should return current alerts (if any)
   - Should return alert rules configuration

**Expected Results**:
- ✅ Admins can check alerts
- ✅ Alert rules are returned
- ✅ Current alerts are shown (if any)
- ✅ Regular users cannot access (403 error)

**Test Cases**:
- [ ] Check alerts endpoint accessible (Admin)
- [ ] Get alert rules endpoint accessible (Admin)
- [ ] Alerts returned correctly
- [ ] Alert rules returned correctly
- [ ] Regular users cannot access (403 error)

**API Endpoints Used**:
- `GET /api/observability/alerts/check` - Check alerts (Admin)
- `GET /api/observability/alerts/rules` - Get alert rules (Admin)

---

#### Test 16.2: Metrics Verification (Admin)
**Objective**: Verify admins can verify metrics endpoints

**Prerequisites**: 
- Admin or SUPER_ADMIN user

**Steps**:
1. **Verify Metrics Endpoint**:
   ```bash
   GET /api/observability/metrics/verify
   Authorization: Cookie with accessToken (Admin)
   ```

2. **Verify Metrics Format**:
   ```bash
   GET /api/observability/metrics/verify/format
   Authorization: Cookie with accessToken (Admin)
   ```

3. **Verify Metrics Content**:
   ```bash
   GET /api/observability/metrics/verify/content
   Authorization: Cookie with accessToken (Admin)
   ```

**Expected Results**:
- ✅ Admins can verify metrics endpoints
- ✅ Metrics format verification works
- ✅ Metrics content verification works
- ✅ Regular users cannot access (403 error)

**Test Cases**:
- [ ] Verify metrics endpoint accessible (Admin)
- [ ] Verify format endpoint accessible (Admin)
- [ ] Verify content endpoint accessible (Admin)
- [ ] Verification results returned correctly
- [ ] Regular users cannot access (403 error)

**API Endpoints Used**:
- `GET /api/observability/metrics/verify` - Verify metrics (Admin)
- `GET /api/observability/metrics/verify/format` - Verify metrics format (Admin)
- `GET /api/observability/metrics/verify/content` - Verify metrics content (Admin)

---

## 📊 Test Results Template

Use this template to track your manual testing. Copy and fill out for each testing session:

```markdown
## Manual Test Results - [Date] - [Tester Name]

### Phase 1: Authentication & Core Features
[Include all Phase 1 tests from above]

### Phase 2: Advanced Features
[Include all Phase 2 tests from above]

### Phase 3: Production Readiness
[Include all Phase 3 tests from above]

### Phase 4: Landing Page & Navigation
#### Test 4.1: Landing Page
- [ ] Landing page loads: ✅ / ❌
- [ ] Header navigation works: ✅ / ❌
- [ ] Footer displays: ✅ / ❌
- [ ] Navigation links work: ✅ / ❌
- **Notes**: 

### Phase 5: Password Recovery
#### Test 5.1: Forgot Password
- [ ] Request reset link: ✅ / ❌
- [ ] Email received: ✅ / ❌
- [ ] Reset link works: ✅ / ❌
- **Notes**: 

#### Test 5.2: Reset Password
- [ ] Reset password works: ✅ / ❌
- [ ] Password strength validation: ✅ / ❌
- [ ] Can login with new password: ✅ / ❌
- **Notes**: 

### Phase 6: OAuth Authentication
#### Test 6.1: Google OAuth
- [ ] OAuth button visible: ✅ / ❌
- [ ] OAuth flow works: ✅ / ❌
- [ ] Login successful: ✅ / ❌
- **Notes**: 

#### Test 6.2: GitHub OAuth
- [ ] OAuth button visible: ✅ / ❌
- [ ] OAuth flow works: ✅ / ❌
- [ ] Login successful: ✅ / ❌
- **Notes**: 

#### Test 6.3: Microsoft OAuth
- [ ] OAuth button visible: ✅ / ❌
- [ ] OAuth flow works: ✅ / ❌
- [ ] Login successful: ✅ / ❌
- **Notes**: 

### Phase 7: Multi-Factor Authentication
#### Test 7.1: Setup TOTP MFA
- [ ] QR code displays: ✅ / ❌
- [ ] Backup codes generated: ✅ / ❌
- [ ] MFA enabled: ✅ / ❌
- **Notes**: 

#### Test 7.2: Login with MFA
- [ ] MFA code prompt appears: ✅ / ❌
- [ ] Valid code works: ✅ / ❌
- [ ] Backup code works: ✅ / ❌
- **Notes**: 

#### Test 7.3: Setup Email MFA
- [ ] Email MFA setup works: ✅ / ❌
- [ ] OTP received: ✅ / ❌
- [ ] MFA enabled: ✅ / ❌
- **Notes**: 

#### Test 7.4: Disable MFA
- [ ] Disable MFA works: ✅ / ❌
- [ ] Login no longer requires MFA: ✅ / ❌
- **Notes**: 

### Phase 8: Admin Panel Features
#### Test 8.1: Admin Dashboard Access & Statistics
- [ ] Regular user cannot access (403): ✅ / ❌
- [ ] Admin user can access: ✅ / ❌
- [ ] Dashboard shows total users: ✅ / ❌
- [ ] Dashboard shows active sessions: ✅ / ❌
- [ ] Dashboard shows recent activity: ✅ / ❌
- [ ] Dashboard shows system health: ✅ / ❌
- [ ] Statistics are accurate: ✅ / ❌
- **Notes**: 

#### Test 8.2: User Management
- [ ] User list loads: ✅ / ❌
- [ ] Search works: ✅ / ❌
- [ ] Create user: ✅ / ❌
- [ ] Edit user: ✅ / ❌
- [ ] Delete user: ✅ / ❌
- **Notes**: 

#### Test 8.3: Audit Logs
- [ ] Audit logs load: ✅ / ❌
- [ ] Filters work: ✅ / ❌
- [ ] Export works: ✅ / ❌
- **Notes**: 

#### Test 8.4: Feature Flags
- [ ] Feature flags list loads: ✅ / ❌
- [ ] Toggle works: ✅ / ❌
- [ ] Changes saved: ✅ / ❌
- **Notes**: 

#### Test 8.5: Payment Management
- [ ] Payments list loads: ✅ / ❌
- [ ] Filters work: ✅ / ❌
- [ ] Refund works: ✅ / ❌
- **Notes**: 

#### Test 8.6: System Settings
- [ ] Settings page loads: ✅ / ❌
- [ ] Update settings works: ✅ / ❌
- [ ] Changes saved: ✅ / ❌
- **Notes**: 

### Phase 9: Notifications System
#### Test 9.1: View Notifications
- [ ] Notifications list loads: ✅ / ❌
- [ ] Unread/read status visible: ✅ / ❌
- **Notes**: 

#### Test 9.2: Mark as Read
- [ ] Mark single as read: ✅ / ❌
- [ ] Mark all as read: ✅ / ❌
- **Notes**: 

#### Test 9.3: Delete Notifications
- [ ] Delete notification works: ✅ / ❌
- **Notes**: 

#### Test 9.4: Notification Preferences
- [ ] Preferences page accessible: ✅ / ❌
- [ ] Update preferences works: ✅ / ❌
- **Notes**: 

### Phase 10: RBAC
#### Test 10.1: Check User Role
- [ ] View own role: ✅ / ❌
- [ ] View permissions: ✅ / ❌
- **Notes**: 

#### Test 10.2: Role-Based Access
- [ ] USER restrictions work: ✅ / ❌
- [ ] ADMIN access works: ✅ / ❌
- [ ] SUPER_ADMIN access works: ✅ / ❌
- **Notes**: 

#### Test 10.3: Update User Role
- [ ] Change role works: ✅ / ❌
- [ ] Permissions update: ✅ / ❌
- **Notes**: 

### Phase 11: GDPR Compliance
#### Test 11.1: Data Export
- [ ] Request export works: ✅ / ❌
- [ ] Export generated: ✅ / ❌
- [ ] Download works: ✅ / ❌
- **Notes**: 

#### Test 11.2: Data Deletion
- [ ] Request deletion works: ✅ / ❌
- [ ] Confirmation email received: ✅ / ❌
- [ ] Data deleted: ✅ / ❌
- **Notes**: 

#### Test 11.3: Consent Management
- [ ] View consents: ✅ / ❌
- [ ] Grant consent: ✅ / ❌
- [ ] Revoke consent: ✅ / ❌
- **Notes**: 

### Phase 12: Payment Processing
#### Test 12.1: Create Payment
- [ ] Create payment works: ✅ / ❌
- [ ] Payment status tracked: ✅ / ❌
- **Notes**: 

#### Test 12.2: View Payment History
- [ ] Payment history loads: ✅ / ❌
- [ ] Filters work: ✅ / ❌
- **Notes**: 

#### Test 12.3: Payment Refund
- [ ] Full refund works: ✅ / ❌
- [ ] Partial refund works: ✅ / ❌
- **Notes**: 

## Overall Status: [ ] All Pass / [ ] Issues Found

## Summary
- **Total Tests**: [X] / [Total]
- **Passed**: [X]
- **Failed**: [X]
- **Skipped**: [X] (if any)

## Issues Found:
1. [Issue description]
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**: 
   - **Expected**: 
   - **Actual**: 
   - **Screenshots**: (if applicable)

2. [Issue description]
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**: 
   - **Expected**: 
   - **Actual**: 

## Recommendations:
- [Recommendation 1]
- [Recommendation 2]
```

---

## 🐛 Common Issues & Troubleshooting

### Issue: CORS Errors
**Symptoms**: Browser console shows CORS errors
**Solution**: 
- Verify backend CORS is configured for `http://localhost:3000`
- Check backend `.env` file has correct `FRONTEND_URL`

### Issue: "Network Error" or "Request failed"
**Symptoms**: API calls fail
**Solution**:
- Verify backend is running on port 3001
- Check `frontend/.env` has correct `VITE_API_BASE_URL`
- Check browser Network tab for actual error

### Issue: "Invalid credentials" but credentials are correct
**Symptoms**: Login fails with valid credentials
**Solution**:
- Check if user exists in database
- Verify password hasn't been changed
- Check backend logs for actual error

### Issue: Form validation not showing
**Symptoms**: Can submit invalid forms
**Solution**:
- Check browser console for errors
- Verify form is using react-hook-form correctly
- Check if validation schema is correct

### Issue: Redirect loops
**Symptoms**: Page keeps redirecting
**Solution**:
- Clear cookies: DevTools > Application > Cookies > Delete all
- Check if token is valid
- Verify `isAuthenticated` logic in AuthContext

### Issue: Password Strength Indicator Not Showing
**Symptoms**: Password strength indicator doesn't appear
**Solution**:
- Verify you're typing in the password field
- Check browser console for errors
- Ensure password field has focus

### Issue: Toast Notifications Not Appearing
**Symptoms**: No toast notifications show
**Solution**:
- Check if Toaster component is in App.tsx
- Verify toast hook is being used correctly
- Check browser console for errors

### Issue: Profile Data Not Loading
**Symptoms**: Profile page shows loading forever
**Solution**:
- Check Network tab for API call status
- Verify backend is running
- Check React Query cache in DevTools
- Verify authentication cookies are present

---

## 📝 Notes for Testers

### Test User Setup

**Create Test Users with Different Roles**:

1. **Regular User (USER role)**:
   - Register via `/register` page
   - Use email: `user-${Date.now()}@test.com`
   - Password: `TestUser123!`

2. **Admin User (ADMIN role)**:
   - Register a user first
   - Update role in database:
     ```sql
     UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com';
     ```
   - Or use admin service to create admin user

3. **Super Admin User (SUPER_ADMIN role)**:
   - Register a user first
   - Update role in database:
     ```sql
     UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'superadmin@test.com';
     ```

### Testing Tips

1. **Use Unique Emails**: Always use unique emails (e.g., `test-${Date.now()}@example.com`) to avoid conflicts

2. **Check Browser Console**: Open DevTools (F12) to see any errors
   - Console tab: JavaScript errors
   - Network tab: API call status
   - Application tab: Cookies, LocalStorage

3. **Check Network Tab**: Monitor API calls in Network tab
   - Verify request/response status codes
   - Check request payloads
   - Verify response data

4. **Check Cookies**: DevTools > Application > Cookies
   - Verify HTTP-only cookies are set (`accessToken`, `refreshToken`)
   - Cookies should have `HttpOnly` flag
   - Cookies should have `SameSite` attribute

5. **Test Password Strength**: Try different password combinations:
   - Weak: `weak` (too short)
   - Fair: `Passw0rd!` (8-9 chars, all types)
   - Good: `Password123!` (10-12 chars)
   - Strong: `VeryStrongPassword123!` (13+ chars)

6. **Test Edge Cases**:
   - Empty forms
   - Very long inputs (1000+ characters)
   - Special characters in inputs
   - SQL injection attempts (should be sanitized)
   - XSS attempts (should be sanitized)

7. **Test Error Scenarios**:
   - Disconnect backend (stop server)
   - Use invalid data
   - Use expired tokens
   - Use invalid tokens

8. **Test Toast Notifications**: Perform actions that trigger success/error toasts
   - Profile update → Success toast
   - Password change → Success toast
   - Invalid login → Error toast

9. **Test Loading States**: Observe skeleton loaders and loading buttons
   - Profile page initial load
   - Form submissions
   - API calls

10. **Test Responsive Design**: Use DevTools device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
    - Mobile: 375px, 414px
    - Tablet: 768px, 1024px
    - Desktop: 1920px, 2560px

11. **Access Profile Page**: 
    - Currently, profile page can be accessed by navigating to `/profile` directly in the browser
    - Or add a link in the dashboard/header for easier access

12. **Admin Panel Access**:
    - Only users with ADMIN or SUPER_ADMIN role can access `/admin/*` routes
    - Regular users will be redirected or see an error

13. **OAuth Testing**:
    - OAuth requires proper configuration in backend `.env`
    - Test with actual OAuth provider accounts
    - OAuth buttons may show "Not Implemented" message if not fully configured

14. **MFA Testing**:
    - Use Google Authenticator or Authy app for TOTP
    - Test with real email for Email MFA
    - Save backup codes when setting up MFA

15. **Payment Testing**:
    - Use test API keys for payment providers
    - Test with small amounts
    - Verify webhook handling (if testing webhooks)

16. **Database Migration Testing** (NEW):
    - Always backup database before migrations in production
    - Test migrations locally first
    - Review generated SQL before applying
    - Use `npx prisma migrate status` to check migration status
    - Use `npm run seed` to populate test data

17. **Seed Data Script Testing** (NEW):
    - Run `npm run seed` in backend directory
    - Verify test users created in database
    - Use Prisma Studio to view seeded data: `npm run prisma:studio`
    - Test login with seed user credentials
    - Seed script can be run multiple times (cleans existing data first)

18. **Docker Testing** (NEW):
    - Build image: `docker build -t nextsaas-backend:latest .`
    - Run container with required environment variables
    - Test health endpoint: `curl http://localhost:3001/api/health`
    - Check container logs: `docker logs <container-name>`
    - Verify health check is working

---

## ✅ Completion Criteria

All tests should pass before considering the template production-ready:

### Phase 1: Authentication & Core
- [ ] All 8 test suites pass
- [ ] Password strength validation works
- [ ] Cookie-based authentication works
- [ ] Form validation works
- [ ] Error handling works
- [ ] Session persistence works
- [ ] Responsive design works

### Phase 2: Advanced Features
- [ ] Profile management works
- [ ] Toast notifications work
- [ ] Loading states work
- [ ] React Query caching works
- [ ] Error boundary works

### Phase 3: Production Readiness
- [ ] Password strength indicators work on all forms
- [ ] API versioning works (backend)
- [ ] Feature flags work (if UI uses them)
- [ ] Confirmation dialogs work (when integrated)

### Phase 4: Landing Page & Navigation
- [ ] Landing page displays correctly
- [ ] Header and footer consistent across pages
- [ ] Navigation links work

### Phase 5: Password Recovery
- [ ] Forgot password flow works
- [ ] Reset password flow works
- [ ] Email delivery works

### Phase 6: OAuth Authentication
- [ ] Google OAuth works (if configured)
- [ ] GitHub OAuth works (if configured)
- [ ] Microsoft OAuth works (if configured)

### Phase 7: Multi-Factor Authentication
- [ ] TOTP MFA setup works
- [ ] Email MFA setup works
- [ ] MFA login flow works
- [ ] MFA disable works

### Phase 8: Admin Panel
- [ ] Admin dashboard accessible
- [ ] User management works
- [ ] Audit logs viewable and exportable
- [ ] Feature flags manageable
- [ ] Payment management works
- [ ] System settings manageable

### Phase 9: Notifications
- [ ] Notifications viewable
- [ ] Mark as read works
- [ ] Delete notifications works
- [ ] Preferences manageable

### Phase 10: RBAC
- [ ] Role checks work
- [ ] Role-based access control works
- [ ] Role updates work (super admin)

### Phase 11: GDPR Compliance
- [ ] Data export works
- [ ] Data deletion works
- [ ] Consent management works

### Phase 12: Payment Processing
- [ ] Payment creation works
- [ ] Payment history viewable
- [ ] Refunds processable

### General
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All UI elements functional
- [ ] Responsive design works on all screen sizes
- [ ] Error handling works correctly
- [ ] All features tested manually
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance acceptable (page load < 3s)

---

## 🔗 Related Documentation

- **[FRONTEND_STATUS.md](./FRONTEND_STATUS.md)** - Complete implementation status
- **[PHASE3_TEMPLATE_PLAN.md](./PHASE3_TEMPLATE_PLAN.md)** - Phase 3 implementation plan
- **[ISSUES_LOG.md](./ISSUES_LOG.md)** - Known issues and resolutions

---

## 🗺️ Quick Reference

### Test User Credentials (Create these for testing)
- **Regular User**: Register via `/register`
- **Admin User**: Register, then update role to `ADMIN` in database
- **Super Admin**: Register, then update role to `SUPER_ADMIN` in database

### Key URLs
- **Landing Page**: `http://localhost:3000/`
- **Login**: `http://localhost:3000/login`
- **Register**: `http://localhost:3000/register`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Profile**: `http://localhost:3000/profile`
- **Admin Dashboard**: `http://localhost:3000/admin/dashboard`
- **Backend API**: `http://localhost:3001/api`

### Common Test Passwords
- **Weak**: `weak` (rejected)
- **Fair**: `Passw0rd!` (rejected - 8-9 chars)
- **Good**: `Password123!` (accepted - 10-12 chars)
- **Strong**: `VeryStrongPassword123!` (accepted - 13+ chars)

### Test Checklist Summary
- ✅ **90+ test scenarios** covering all features
- ✅ **16 phases** of testing (including Newsletter, Health/Metrics, Observability)
- ✅ **Complete setup guide** included
- ✅ **Troubleshooting section** for common issues
- ✅ **Test results template** for tracking
- ✅ **All implemented features** covered comprehensively

---

---

## ✅ Phase 13: Database Migration & Seed Data (NEW - January 2025)

### Test 13.1: Database Migration Workflow
**Objective**: Verify database migrations can be run successfully

**Prerequisites**: 
- PostgreSQL database created
- `DATABASE_URL` configured in `backend/.env`

**Steps**:
1. **Check Current Migration Status**:
   ```bash
   cd backend
   npx prisma migrate status
   ```
   - Should show all migrations applied or pending

2. **Create a New Migration** (if schema changed):
   ```bash
   # After modifying backend/prisma/schema.prisma
   npm run prisma:migrate
   # Enter migration name when prompted (e.g., "add_user_avatar_field")
   ```

3. **Verify Migration Created**:
   - Check `backend/prisma/migrations/` directory
   - New migration folder should be created with timestamp
   - Migration SQL file should exist

4. **Apply Migration**:
   ```bash
   npm run prisma:migrate
   # Or for production:
   npx prisma migrate deploy
   ```

5. **Verify Migration Applied**:
   ```bash
   npx prisma migrate status
   # Should show all migrations as applied
   ```

**Expected Results**:
- ✅ Migration status command works
- ✅ New migrations can be created
- ✅ Migrations apply successfully
- ✅ Database schema updated correctly
- ✅ No data loss during migration

**Test Cases**:
- [ ] Check migration status works
- [ ] Create new migration works
- [ ] Migration SQL generated correctly
- [ ] Apply migration works
- [ ] Database schema updated
- [ ] Existing data preserved
- [ ] Migration rollback works (if needed)

**Production Migration Testing**:
- [ ] Backup database before migration
- [ ] Review migration SQL before applying
- [ ] Apply migration in production
- [ ] Verify migration status after applying
- [ ] Test application functionality after migration

---

### Test 13.2: Seed Data Script
**Objective**: Verify seed data script creates test data correctly

**Prerequisites**: 
- Database migrations applied
- `DATABASE_URL` configured

**Steps**:
1. **Run Seed Script**:
   ```bash
   cd backend
   npm run seed
   ```

2. **Verify Seed Output**:
   - Should see progress messages
   - Should see "Seed completed successfully!"
   - Should see test credentials printed

3. **Verify Test Users Created**:
   - Check database or use Prisma Studio:
     ```bash
     npm run prisma:studio
     ```
   - Navigate to Users table
   - Verify test users exist:
     - `admin@example.com` (ADMIN role)
     - `superadmin@example.com` (SUPER_ADMIN role)
     - `user1@example.com` through `user5@example.com` (USER role)
     - `oauth.google@example.com` (OAuth user)

4. **Test Login with Seed Users**:
   - Navigate to `/login`
   - Try logging in with:
     - Email: `admin@example.com`, Password: `Admin123!`
     - Email: `user1@example.com`, Password: `User1123!`

5. **Verify Test Data**:
   - Check sessions table (should have test sessions)
   - Check audit_logs table (should have test audit logs)

**Expected Results**:
- ✅ Seed script runs without errors
- ✅ All test users created
- ✅ Test sessions created
- ✅ Test audit logs created
- ✅ Can login with seed user credentials
- ✅ Test credentials printed to console

**Test Cases**:
- [ ] Seed script runs successfully
- [ ] Admin user created (admin@example.com)
- [ ] Super admin user created (superadmin@example.com)
- [ ] Regular users created (user1-5@example.com)
- [ ] OAuth user created (oauth.google@example.com)
- [ ] Test sessions created
- [ ] Test audit logs created
- [ ] Can login with admin credentials
- [ ] Can login with regular user credentials
- [ ] Test credentials printed correctly

**Seed Script Test Credentials**:
```
Admin:
  Email: admin@example.com
  Password: Admin123!

Super Admin:
  Email: superadmin@example.com
  Password: SuperAdmin123!

Regular Users:
  User 1: user1@example.com / User1123!
  User 2: user2@example.com / User2123!
  User 3: user3@example.com / User3123!
  User 4: user4@example.com / User4123!
  User 5: user5@example.com / User5123!

OAuth User:
  Email: oauth.google@example.com
  Provider: Google
```

**Reset Database and Re-seed**:
```bash
# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset
# This will:
# 1. Drop database
# 2. Create new database
# 3. Apply all migrations
# 4. Run seed script automatically
```

---

### Test 13.3: Production Dockerfile Testing
**Objective**: Verify production Dockerfile builds and runs correctly

**Prerequisites**: 
- Docker installed
- Backend code ready

**Steps**:
1. **Build Docker Image**:
   ```bash
   cd backend
   docker build -t nextsaas-backend:latest .
   ```

2. **Verify Build Success**:
   - Should complete without errors
   - Image should be created
   - Check image size (should be optimized)

3. **Run Docker Container**:
   ```bash
   docker run -d \
     --name nextsaas-backend-test \
     -p 3001:3001 \
     -e DATABASE_URL="postgresql://user:password@host:port/database" \
     -e JWT_SECRET="your-jwt-secret-minimum-32-characters" \
     -e JWT_REFRESH_SECRET="your-refresh-secret-minimum-32-characters" \
     -e NODE_ENV=production \
     nextsaas-backend:latest
   ```

4. **Verify Container Running**:
   ```bash
   docker ps
   # Should show container running
   ```

5. **Check Container Logs**:
   ```bash
   docker logs nextsaas-backend-test
   # Should show server started successfully
   ```

6. **Test Health Endpoint**:
   ```bash
   curl http://localhost:3001/api/health
   # Should return: {"status":"ok",...}
   ```

7. **Verify Health Check**:
   ```bash
   docker inspect nextsaas-backend-test | grep Health
   # Should show health check status
   ```

8. **Stop and Remove Container**:
   ```bash
   docker stop nextsaas-backend-test
   docker rm nextsaas-backend-test
   ```

**Expected Results**:
- ✅ Docker image builds successfully
- ✅ Image is optimized (multi-stage build)
- ✅ Container runs without errors
- ✅ Server starts successfully
- ✅ Health endpoint responds
- ✅ Health check works
- ✅ Container logs show proper startup
- ✅ Non-root user configured
- ✅ OpenSSL installed for Prisma

**Test Cases**:
- [ ] Docker image builds successfully
- [ ] Build completes without errors
- [ ] Image size is reasonable (optimized)
- [ ] Container runs with environment variables
- [ ] Server starts successfully
- [ ] Health endpoint responds
- [ ] Health check configured
- [ ] Container logs show proper messages
- [ ] Non-root user works
- [ ] Prisma connections work
- [ ] Can stop and remove container

**Docker Compose Testing** (Optional):
```yaml
# docker-compose.yml example
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
```

**Test Docker Compose**:
```bash
docker-compose up -d
docker-compose ps
docker-compose logs backend
docker-compose down
```

---

## 📊 Updated Test Results Template

Add these new phases to your test results:

```markdown
### Phase 13: Database Migration & Seed Data
#### Test 13.1: Database Migration Workflow
- [ ] Check migration status works: ✅ / ❌
- [ ] Create new migration works: ✅ / ❌
- [ ] Apply migration works: ✅ / ❌
- [ ] Database schema updated: ✅ / ❌
- **Notes**: 

#### Test 13.2: Seed Data Script
- [ ] Seed script runs successfully: ✅ / ❌
- [ ] Test users created: ✅ / ❌
- [ ] Can login with seed credentials: ✅ / ❌
- [ ] Test data verified: ✅ / ❌
- **Notes**: 

#### Test 13.3: Production Dockerfile
- [ ] Docker image builds: ✅ / ❌
- [ ] Container runs successfully: ✅ / ❌
- [ ] Health endpoint works: ✅ / ❌
- [ ] Health check configured: ✅ / ❌
- **Notes**: 
```

---

---

## 📝 Document Update History

### Version 2.1.0 (January 6, 2025) - Comprehensive Feature Coverage

**Major Additions**:

1. **Enhanced MFA Testing (Phase 7)**:
   - ✅ Complete TOTP MFA setup flow with QR code, secret key, and backup codes
   - ✅ Complete Email MFA setup flow with OTP delivery
   - ✅ Comprehensive login with MFA flow (TOTP, Email, Backup codes)
   - ✅ Backup codes management (generate, verify, use)
   - ✅ MFA disable functionality
   - ✅ MFA code verification without login
   - ✅ All API endpoints documented with examples
   - ✅ Error scenarios and edge cases covered

2. **Enhanced Password Reset Testing (Phase 5)**:
   - ✅ Complete forgot password flow with email delivery
   - ✅ Complete reset password flow with token validation
   - ✅ Password strength validation (WEAK, FAIR, GOOD, STRONG)
   - ✅ Token expiration and reuse prevention
   - ✅ All API endpoints documented
   - ✅ Security considerations (non-existent email handling)

3. **Enhanced Admin Dashboard Testing (Phase 8)**:
   - ✅ Real-time statistics verification (not stub data)
   - ✅ Total users, active sessions, recent activity, system health
   - ✅ Statistics accuracy verification
   - ✅ Role-based access control testing

4. **Enhanced OAuth Testing (Phase 6)**:
   - ✅ Complete Google OAuth flow with redirect verification
   - ✅ Complete GitHub OAuth flow with code exchange
   - ✅ OAuth configuration verification
   - ✅ OAuth registration flow
   - ✅ Error handling scenarios

5. **New Infrastructure Testing (Phase 13)**:
   - ✅ Database migration workflow testing
   - ✅ Seed data script testing
   - ✅ Production Dockerfile testing

**Total Test Scenarios**: 80+ (up from 60+)

**New Test Cases Added**: 30+ comprehensive test cases

**API Endpoints Documented**: 50+ endpoints with examples

---

**Last Updated**: January 6, 2025  
**Version**: 2.1.0  
**Status**: Comprehensive Manual Testing Guide - All Features Covered (Including MFA, Password Reset, OAuth, Admin Dashboard, Migrations, Seed Data, Docker)

