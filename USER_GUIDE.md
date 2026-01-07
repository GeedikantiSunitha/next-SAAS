# NextSaaS - User Guide

**Version**: 1.0.0  
**Last Updated**: January 2025

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Authentication](#2-authentication)
3. [User Management](#3-user-management)
4. [Profile Management](#4-profile-management)
5. [Admin Features](#5-admin-features)
6. [Payments](#6-payments)
7. [Notifications](#7-notifications)
8. [Settings](#8-settings)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Getting Started

### 1.1 What is NextSaaS?

NextSaaS is a production-ready SaaS application template that provides:

- **Complete Authentication System** - Registration, login, OAuth, and MFA
- **User Management** - Profile management, password reset, account settings
- **Admin Panel** - User management, audit logs, feature flags, system settings
- **Payment Processing** - Stripe, Razorpay, and Cashfree integration
- **Notifications** - Email and in-app notifications
- **GDPR Compliance** - Data export, deletion, and consent management
- **RBAC** - Role-based access control with permissions

### 1.2 Prerequisites

Before using NextSaaS, ensure you have:

- **Node.js** 18.0.0 or higher
- **PostgreSQL** 14.0 or higher
- **npm** or **yarn** package manager
- **Resend API Key** (for email functionality) - Get from [resend.com](https://resend.com)

### 1.3 Quick Start

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Set Up Database**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npx prisma migrate dev
   ```

3. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api-docs

For detailed installation instructions, see [INSTALLATION.md](./INSTALLATION.md).

---

## 2. Authentication

NextSaaS provides multiple authentication methods to suit different user preferences and security requirements.

### 2.1 Registration

**Step 1**: Navigate to the registration page
- Go to `http://localhost:3000/register`
- Or click "Sign Up" on the landing page

**Step 2**: Fill in the registration form
- **Email**: Your email address (must be unique)
- **Password**: Must meet requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Name**: Your full name (optional)

**Step 3**: Submit the form
- Click "Register" button
- You'll be automatically logged in after successful registration
- You'll receive a welcome email (if email is configured)

**Example**:
```
Email: user@example.com
Password: SecurePass123!
Name: John Doe
```

**Note**: Password strength is validated in real-time. Weak passwords will be rejected.

### 2.2 Login

**Step 1**: Navigate to the login page
- Go to `http://localhost:3000/login`
- Or click "Sign In" on the landing page

**Step 2**: Enter credentials
- **Email**: Your registered email address
- **Password**: Your password

**Step 3**: Submit the form
- Click "Login" button
- If MFA is enabled, you'll be prompted for MFA code
- Otherwise, you'll be redirected to the dashboard

**Troubleshooting**:
- **Invalid credentials**: Check email and password
- **Account disabled**: Contact administrator
- **OAuth account**: Use OAuth login instead

### 2.3 OAuth Login

NextSaaS supports OAuth login with Google, GitHub, and Microsoft.

**Step 1**: Click OAuth provider button
- On the login page, click "Sign in with Google", "Sign in with GitHub", or "Sign in with Microsoft"

**Step 2**: Authorize the application
- You'll be redirected to the OAuth provider
- Sign in with your OAuth account
- Authorize NextSaaS to access your account

**Step 3**: Complete login
- You'll be redirected back to NextSaaS
- You'll be automatically logged in
- If this is your first OAuth login, an account will be created

**Configuration**:
- OAuth must be configured in `backend/.env`
- See [INSTALLATION.md](./INSTALLATION.md) for setup instructions

### 2.4 Multi-Factor Authentication (MFA)

MFA adds an extra layer of security to your account.

#### Setup TOTP MFA

**Step 1**: Go to Profile Settings
- Navigate to Profile → Security
- Click "Enable MFA"

**Step 2**: Scan QR Code
- Use an authenticator app (Google Authenticator, Authy, etc.)
- Scan the QR code displayed
- Enter the 6-digit code to verify

**Step 3**: Save Backup Codes
- Backup codes are displayed
- Save them in a secure location
- You'll need them if you lose access to your authenticator

#### Setup Email MFA

**Step 1**: Go to Profile Settings
- Navigate to Profile → Security
- Click "Enable Email MFA"

**Step 2**: Verify Email
- An OTP will be sent to your email
- Enter the OTP to verify

**Step 3**: Complete Setup
- Email MFA is now enabled
- You'll receive OTP codes via email for login

#### Login with MFA

**Step 1**: Login normally
- Enter email and password
- Click "Login"

**Step 2**: Enter MFA Code
- If TOTP: Enter 6-digit code from authenticator app
- If Email: Enter OTP sent to your email

**Step 3**: Complete Login
- You'll be logged in after successful MFA verification

### 2.5 Password Reset

**Step 1**: Click "Forgot Password"
- On the login page, click "Forgot Password?"

**Step 2**: Enter Email
- Enter your registered email address
- Click "Send Reset Link"

**Step 3**: Check Email
- You'll receive a password reset email
- Click the reset link in the email

**Step 4**: Reset Password
- Enter your new password
- Confirm the new password
- Click "Reset Password"

**Step 5**: Login
- Login with your new password

**Note**: Reset links expire after 1 hour. Request a new link if expired.

---

## 3. User Management

### 3.1 Viewing Your Profile

**Step 1**: Navigate to Profile
- Click your profile icon in the top right
- Select "Profile" from the dropdown

**Step 2**: View Profile Information
- See your email, name, role, and account status
- View account creation date
- See last login information

### 3.2 Updating Your Profile

**Step 1**: Go to Profile Settings
- Navigate to Profile → Edit

**Step 2**: Update Information
- Change your name
- Update email (requires verification)
- Click "Save Changes"

**Step 3**: Verify Changes
- If email changed, verify the new email
- Check your email for verification link

### 3.3 Changing Password

**Step 1**: Go to Security Settings
- Navigate to Profile → Security
- Click "Change Password"

**Step 2**: Enter Current Password
- Enter your current password
- Enter new password (must meet requirements)
- Confirm new password

**Step 3**: Save Changes
- Click "Update Password"
- You'll be logged out and need to login again

---

## 4. Profile Management

### 4.1 Profile Settings

Access your profile settings from the dashboard:

**Step 1**: Click Profile Icon
- Top right corner of the dashboard
- Select "Profile" or "Settings"

**Step 2**: Navigate Settings
- **General**: Name, email, preferences
- **Security**: Password, MFA, sessions
- **Notifications**: Email preferences, in-app notifications
- **Privacy**: GDPR settings, data export

### 4.2 Notification Preferences

**Step 1**: Go to Notification Settings
- Navigate to Profile → Notifications

**Step 2**: Configure Preferences
- **Email Notifications**: Enable/disable email notifications
- **In-App Notifications**: Enable/disable in-app notifications
- **Notification Types**: Configure which events trigger notifications

**Step 3**: Save Preferences
- Click "Save Changes"
- Your preferences are updated immediately

### 4.3 Session Management

**Step 1**: Go to Security Settings
- Navigate to Profile → Security → Sessions

**Step 2**: View Active Sessions
- See all devices where you're logged in
- View session details (IP address, location, last activity)

**Step 3**: Manage Sessions
- **Logout from Device**: End a specific session
- **Logout from All Devices**: End all sessions except current

---

## 5. Admin Features

Admin features are available to users with `ADMIN` or `SUPER_ADMIN` roles.

### 5.1 Dashboard

**Step 1**: Access Admin Dashboard
- Click "Admin" in the navigation menu
- Or navigate to `/admin/dashboard`

**Step 2**: View Statistics
- **Users**: Total users, new users, active users
- **Payments**: Total revenue, pending payments, completed payments
- **System**: Health status, error rates, performance metrics

**Step 3**: Quick Actions
- Access common admin tasks
- View recent activity
- Monitor system health

### 5.2 User Management

**Step 1**: Go to User Management
- Navigate to Admin → Users

**Step 2**: View Users
- See list of all users
- Filter by role, status, or search by email/name
- Sort by various criteria

**Step 3**: Manage Users
- **View User**: Click on user to see details
- **Edit User**: Update user information, role, or status
- **Deactivate User**: Disable user account
- **Delete User**: Permanently delete user (requires confirmation)

**Step 4**: Create User
- Click "Create User" button
- Fill in user details
- Set initial role and status
- User will receive welcome email

### 5.3 Audit Logs

**Step 1**: Go to Audit Logs
- Navigate to Admin → Audit Logs

**Step 2**: View Logs
- See all system actions and events
- Filter by user, action, resource, or date range
- Search for specific events

**Step 3**: Analyze Activity
- View user activity patterns
- Monitor security events
- Track system changes
- Export logs for compliance

**Example Audit Events**:
- User registration
- Login attempts
- Password changes
- Role changes
- Payment transactions
- Data exports/deletions

### 5.4 Feature Flags

**Step 1**: Go to Feature Flags
- Navigate to Admin → Feature Flags

**Step 2**: View Feature Flags
- See all available feature flags
- View current status (enabled/disabled)
- See which users/groups are affected

**Step 3**: Manage Feature Flags
- **Enable/Disable**: Toggle feature flags
- **Configure**: Set feature flag values
- **Test**: Test feature flags before enabling

**Common Feature Flags**:
- `ENABLE_REGISTRATION`: Control user registration
- `ENABLE_PASSWORD_RESET`: Control password reset
- `ENABLE_EMAIL_VERIFICATION`: Control email verification
- Custom feature flags for your application

### 5.5 Payment Management

**Step 1**: Go to Payment Management
- Navigate to Admin → Payments

**Step 2**: View Payments
- See all payment transactions
- Filter by status, provider, user, or date range
- View payment details

**Step 3**: Manage Payments
- **View Payment**: See payment details and status
- **Refund Payment**: Process refunds
- **Capture Payment**: Capture pending payments
- **Export**: Export payment data for accounting

---

## 6. Payments

NextSaaS supports multiple payment providers: Stripe, Razorpay, and Cashfree.

### 6.1 Making a Payment

**Step 1**: Go to Payment Page
- Navigate to Settings → Payments
- Or access payment from checkout flow

**Step 2**: Enter Payment Details
- **Amount**: Payment amount
- **Currency**: Select currency (USD, INR, etc.)
- **Description**: Payment description (optional)

**Step 3**: Select Payment Method
- Choose payment method (card, bank transfer, etc.)
- Enter payment details securely

**Step 4**: Complete Payment
- Review payment details
- Click "Pay" or "Confirm Payment"
- Payment is processed securely

**Step 5**: Confirmation
- You'll receive payment confirmation
- Payment appears in your payment history
- Receipt is sent to your email

### 6.2 Payment History

**Step 1**: Go to Payment History
- Navigate to Settings → Payments → History

**Step 2**: View Payments
- See all your payment transactions
- Filter by status, date, or amount
- View payment details

**Step 3**: Payment Details
- **Status**: Pending, Completed, Failed, Refunded
- **Amount**: Payment amount and currency
- **Date**: Payment date and time
- **Provider**: Payment provider used
- **Receipt**: Download payment receipt

### 6.3 Payment Methods

**Supported Providers**:
- **Stripe**: Credit/debit cards, Apple Pay, Google Pay
- **Razorpay**: Cards, UPI, Net Banking, Wallets (India)
- **Cashfree**: Cards, UPI, Net Banking (India)

**Configuration**:
- Payment providers are configured in `backend/.env`
- See [INSTALLATION.md](./INSTALLATION.md) for setup

---

## 7. Notifications

NextSaaS provides both email and in-app notifications.

### 7.1 In-App Notifications

**Step 1**: View Notifications
- Click the notification bell icon in the top right
- Or navigate to Notifications page

**Step 2**: Read Notifications
- See all your notifications
- Filter by type (Info, Warning, Error, Success)
- Mark notifications as read

**Step 3**: Manage Notifications
- **Mark as Read**: Click notification to mark as read
- **Mark All as Read**: Mark all notifications as read
- **Delete**: Remove notification

### 7.2 Email Notifications

**Step 1**: Configure Email Preferences
- Navigate to Profile → Notifications → Email

**Step 2**: Enable/Disable Notifications
- Toggle email notifications on/off
- Configure which events trigger emails

**Step 3**: Receive Notifications
- Check your email for notifications
- Notifications are sent for:
  - Welcome emails
  - Password reset
  - Payment confirmations
  - Security alerts
  - System updates

### 7.3 Notification Types

**Available Notification Types**:
- **INFO**: General information
- **SUCCESS**: Success messages
- **WARNING**: Warning messages
- **ERROR**: Error messages

**Notification Channels**:
- **EMAIL**: Email notifications
- **IN_APP**: In-app notifications
- **SMS**: SMS notifications (if configured)

---

## 8. Settings

### 8.1 General Settings

**Step 1**: Go to Settings
- Navigate to Profile → Settings

**Step 2**: Configure Settings
- **Language**: Select preferred language
- **Timezone**: Set your timezone
- **Theme**: Light/Dark mode (if available)

**Step 3**: Save Settings
- Click "Save Changes"
- Settings are applied immediately

### 8.2 Security Settings

**Step 1**: Go to Security Settings
- Navigate to Profile → Security

**Step 2**: Configure Security
- **Password**: Change password
- **MFA**: Enable/disable MFA
- **Sessions**: Manage active sessions
- **API Keys**: Manage API keys (if applicable)

**Step 3**: Save Changes
- Security settings are saved immediately
- Some changes may require re-authentication

### 8.3 Privacy Settings

**Step 1**: Go to Privacy Settings
- Navigate to Profile → Privacy

**Step 2**: GDPR Options
- **Data Export**: Request your data export
- **Data Deletion**: Request account deletion
- **Consent Management**: Manage data consent

**Step 3**: Submit Requests
- Data export: Download your data
- Data deletion: Permanently delete your account
- Consent: Update your consent preferences

---

## 9. Troubleshooting

### 9.1 Common Issues

#### Cannot Login

**Problem**: Unable to login with correct credentials

**Solutions**:
1. Check if account is active (contact admin if disabled)
2. Verify email and password are correct
3. Try password reset if password forgotten
4. Check if OAuth account (use OAuth login)
5. Clear browser cookies and try again

#### Password Reset Not Working

**Problem**: Not receiving password reset email

**Solutions**:
1. Check spam/junk folder
2. Verify email address is correct
3. Wait a few minutes (emails may be delayed)
4. Check email service configuration
5. Contact support if issue persists

#### Payment Failed

**Problem**: Payment transaction failed

**Solutions**:
1. Check payment method is valid
2. Verify sufficient funds/balance
3. Check payment provider status
4. Try different payment method
5. Contact support with payment ID

#### MFA Not Working

**Problem**: Cannot complete MFA verification

**Solutions**:
1. Check time sync on authenticator app
2. Use backup codes if available
3. Request new MFA setup
4. Contact admin to reset MFA

### 9.2 Getting Help

**Support Resources**:
- **Documentation**: See [INSTALLATION.md](./INSTALLATION.md) and [README.md](./README.md)
- **API Documentation**: http://localhost:3001/api-docs
- **FAQ**: See [FAQ.md](./FAQ.md)
- **Issues**: Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

**Contact Support**:
- For CodeCanyon buyers: Contact through CodeCanyon support
- For issues: Check documentation first
- For bugs: Report through appropriate channels

### 9.3 Error Messages

**Common Error Messages**:

- **"Invalid credentials"**: Email or password is incorrect
- **"Account disabled"**: Account has been deactivated
- **"Email already registered"**: Email is already in use
- **"Password too weak"**: Password doesn't meet requirements
- **"Payment failed"**: Payment transaction failed
- **"Unauthorized"**: Not logged in or insufficient permissions

---

## Additional Resources

- [Installation Guide](./INSTALLATION.md) - Complete setup instructions
- [API Documentation](./docs/API_DOCUMENTATION.md) - API reference
- [FAQ](./FAQ.md) - Frequently asked questions
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Common issues and solutions

---

**Last Updated**: January 2025  
**Version**: 1.0.0
