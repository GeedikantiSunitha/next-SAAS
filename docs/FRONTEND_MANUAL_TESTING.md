# Frontend Manual Testing Guide

**Date**: December 23, 2025  
**Status**: Ready for Manual Testing  
**Version**: 1.2.0

---

## 🚀 Quick Start: Running the Application

### Prerequisites
- Node.js 18+ installed
- Backend server running on port 3001
- Database configured and running

### Step 1: Start Backend Server
```bash
cd backend
npm install  # If not already done
npm run dev
```
**Expected**: Server should start on `http://localhost:3001`

### Step 2: Start Frontend Development Server
```bash
cd frontend
npm install  # If not already done
npm run dev
```
**Expected**: Frontend should start on `http://localhost:3000`

### Step 3: Open Browser
Navigate to: `http://localhost:3000`

---

## 📋 Testing Overview

This manual testing guide covers **all three phases** of the template:


-> to start with i think we should create a landing page, a standard SaaS product landing page. we can add/enhance that later, we should have menu bar at the top, which should take users to login/register/forgot password page and there should be a button there to come back to the home page. we can add footer as well these header and footer should be consistent across all pages 


### ✅ Phase 1: Authentication & Core Features (8 tests)
- User Registration (with password strength validation)
- User Login
- Protected Routes
- User Logout
- Form Validation
- Error Handling
- Session Persistence
- Responsive Design

### ✅ Phase 2: Advanced Features (7 tests)
- Profile Management
- Edit Profile Information
- Change Password (with password strength validation)
- Toast Notifications
- Loading States
- React Query Integration
- Error Boundary

### ✅ Phase 3: Production Readiness (6 tests)
- Password Strength Validation (Registration)
- Password Strength Validation (Password Change)
- API Versioning
- Feature Flags
- Confirmation Dialogs
- Idempotency

**Total**: 21 comprehensive test scenarios covering all features

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

## 📊 Test Results Template

Use this template to track your manual testing:

```markdown
## Manual Test Results - [Date]

### Phase 1: Authentication & Core Features

#### Test 1.1: User Registration
- [ ] Valid registration: ✅ / ❌
- [ ] Invalid email: ✅ / ❌
- [ ] Weak password: ✅ / ❌
- [ ] Fair password (rejected): ✅ / ❌
- [ ] Good password (accepted): ✅ / ❌
- [ ] Strong password (accepted): ✅ / ❌
- [ ] Password strength indicator: ✅ / ❌
- [ ] Duplicate email: ✅ / ❌
- **Notes**: 

#### Test 1.2: User Login
- [ ] Valid login: ✅ / ❌
- [ ] Invalid credentials: ✅ / ❌
- [ ] Form validation: ✅ / ❌
- **Notes**: 

#### Test 1.3: Protected Routes
- [ ] Unauthenticated redirect: ✅ / ❌
- [ ] Authenticated access: ✅ / ❌
- **Notes**: 

#### Test 1.4: User Logout
- [ ] Logout works: ✅ / ❌
- [ ] Cookies cleared: ✅ / ❌
- **Notes**: 

#### Test 1.5: Form Validation
- [ ] Login validation: ✅ / ❌
- [ ] Register validation: ✅ / ❌
- [ ] Password strength validation: ✅ / ❌
- **Notes**: 

#### Test 1.6: Error Handling
- [ ] Error messages display: ✅ / ❌
- [ ] Network errors handled: ✅ / ❌
- **Notes**: 

#### Test 1.7: Session Persistence
- [ ] Page refresh: ✅ / ❌
- [ ] Browser restart: ✅ / ❌
- **Notes**: 

#### Test 1.8: Responsive Design
- [ ] Mobile: ✅ / ❌
- [ ] Tablet: ✅ / ❌
- [ ] Desktop: ✅ / ❌
- **Notes**: 

### Phase 2: Advanced Features

#### Test 2.1: Profile Management
- [ ] Profile page loads: ✅ / ❌
- [ ] Loading skeleton: ✅ / ❌
- **Notes**: 

#### Test 2.2: Edit Profile
- [ ] Update name: ✅ / ❌
- [ ] Update email: ✅ / ❌
- [ ] Success toast: ✅ / ❌
- [ ] Error handling: ✅ / ❌
- **Notes**: 

#### Test 2.3: Change Password
- [ ] Password change works: ✅ / ❌
- [ ] Password strength indicator: ✅ / ❌
- [ ] Weak password rejected: ✅ / ❌
- [ ] Fair password rejected: ✅ / ❌
- [ ] Good password accepted: ✅ / ❌
- [ ] Success toast: ✅ / ❌
- **Notes**: 

#### Test 2.4: Toast Notifications
- [ ] Success toasts: ✅ / ❌
- [ ] Error toasts: ✅ / ❌
- [ ] Auto-dismiss: ✅ / ❌
- **Notes**: 

#### Test 2.5: Loading States
- [ ] Skeleton loaders: ✅ / ❌
- [ ] Loading buttons: ✅ / ❌
- **Notes**: 

#### Test 2.6: React Query
- [ ] Data caching: ✅ / ❌
- [ ] Cache invalidation: ✅ / ❌
- **Notes**: 

#### Test 2.7: Error Boundary
- [ ] Error caught: ✅ / ❌
- [ ] Fallback UI: ✅ / ❌
- [ ] Try Again button: ✅ / ❌
- **Notes**: 

### Phase 3: Production Readiness

#### Test 3.1: Password Strength (Registration)
- [ ] WEAK indicator: ✅ / ❌
- [ ] FAIR indicator: ✅ / ❌
- [ ] GOOD indicator: ✅ / ❌
- [ ] STRONG indicator: ✅ / ❌
- [ ] Real-time updates: ✅ / ❌
- **Notes**: 

#### Test 3.2: Password Strength (Password Change)
- [ ] All strength levels: ✅ / ❌
- [ ] Real-time updates: ✅ / ❌
- **Notes**: 

#### Test 3.3: API Versioning
- [ ] API requests work: ✅ / ❌
- [ ] Version headers: ✅ / ❌
- **Notes**: 

#### Test 3.4: Feature Flags
- [ ] Flags configurable: ✅ / ❌
- [ ] Features respect flags: ✅ / ❌
- **Notes**: 

#### Test 3.5: Confirmation Dialogs
- [ ] Dialog appears: ✅ / ❌
- [ ] Confirm works: ✅ / ❌
- [ ] Cancel works: ✅ / ❌
- **Notes**: 

#### Test 3.6: Idempotency
- [ ] Duplicate prevention: ✅ / ❌
- **Notes**: 

## Overall Status: [ ] All Pass / [ ] Issues Found

## Issues Found:
1. [Issue description]
2. [Issue description]
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

1. **Use Unique Emails**: Always use unique emails (e.g., `test-${Date.now()}@example.com`) to avoid conflicts
2. **Check Browser Console**: Open DevTools (F12) to see any errors
3. **Check Network Tab**: Monitor API calls in Network tab
4. **Check Cookies**: DevTools > Application > Cookies - verify HTTP-only cookies are set
5. **Test Password Strength**: Try different password combinations to see strength levels
6. **Test Edge Cases**: Try empty forms, very long inputs, special characters
7. **Test Error Scenarios**: Disconnect backend, use invalid data, etc.
8. **Test Toast Notifications**: Perform actions that trigger success/error toasts
9. **Test Loading States**: Observe skeleton loaders and loading buttons
10. **Test Responsive Design**: Use DevTools device toolbar to test different screen sizes

---

## ✅ Completion Criteria

All tests should pass before considering the template production-ready:

### Phase 1: Authentication & Core
- [ ] All 8 test suites pass
- [ ] Password strength validation works
- [ ] Cookie-based authentication works

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

### General
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All UI elements functional
- [ ] Responsive design works
- [ ] Error handling works correctly
- [ ] All features tested manually

---

## 🔗 Related Documentation

- **[FRONTEND_STATUS.md](./FRONTEND_STATUS.md)** - Complete implementation status
- **[PHASE3_TEMPLATE_PLAN.md](./PHASE3_TEMPLATE_PLAN.md)** - Phase 3 implementation plan
- **[ISSUES_LOG.md](./ISSUES_LOG.md)** - Known issues and resolutions

---

**Last Updated**: December 23, 2025  
**Version**: 1.2.0  
**Status**: All Phases Complete - Template Ready for Production Use

