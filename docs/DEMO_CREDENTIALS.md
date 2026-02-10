# NextSaaS - Demo Credentials

**⚠️ IMPORTANT: These credentials are for DEMO purposes only!**

---

## ⚠️ Security Warning

**DO NOT use these credentials in production!**

- These are demo/test credentials
- Change all passwords before deploying to production
- Never use demo credentials with real user data
- Always use strong, unique passwords in production

---

## Demo Accounts (Login screen)

These three accounts are shown on the **Login** page and can be created by running `npm run seed:demo-users` in the backend (idempotent; does not delete existing users).

| Role         | Email                     | Password          |
|-------------|---------------------------|-------------------|
| **User**    | `demo@example.com`       | `DemoUser123!`    |
| **Admin**   | `demo-admin@example.com` | `DemoAdmin123!`   |
| **Super Admin** | `demo-superadmin@example.com` | `DemoSuperAdmin123!` |

- **User**: Dashboard, profile, payments, notifications.
- **Admin**: Admin dashboard, user management, payments, feature flags, audit logs.
- **Super Admin**: Full access including system settings and retention.

---

## Other demo accounts (seed:demo)

If you run `npm run seed:demo` instead, you get:

**Admin (SUPER_ADMIN)**: `admin@demo.com` / `AdminDemo123!`  
**User**: `user@demo.com` / `UserDemo123!`

---

## Demo Environment

**Demo URL**: [To be configured when demo is deployed]

**Environment**: Development/Staging

**Database**: Demo database with sample data

---

## Test Payment Credentials

### Stripe Test Mode

**Test Card Numbers**:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

**Test Details**:
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **ZIP**: Any 5 digits (e.g., `12345`)

**Note**: These are Stripe test cards. No real charges will be made.

---

### Razorpay Test Mode

**Test Card**:
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: `123`
- **Expiry**: Any future date

**Note**: Razorpay test mode credentials. No real charges.

---

## Data deletion / confirmation emails (Resend)

When using Resend with the default sandbox sender (`FROM_EMAIL=onboarding@resend.dev`), Resend **only delivers** to:

- The email address of your Resend account (the one you signed up with), or  
- The test address: `delivered@resend.dev`

So **demo users like `demo@example.com` will not receive** data-deletion confirmation emails (or other transactional emails) until you either:

1. **Use the dev override (easiest)**: In `backend/.env`, set **`GDPR_CONFIRMATION_EMAIL_OVERRIDE`** to an address Resend allows:
   - Your **Resend account email** (the one you use to log in at resend.com), or  
   - **`delivered@resend.dev`** (Resend’s test inbox).
   Then request deletion as any user (e.g. `demo@example.com`); the confirmation email will be **sent to the override address**. Check that inbox and click the link to confirm. Do **not** set this in production.
2. **Test with an allowed recipient**: Create or use a user whose email is your Resend account email or `delivered@resend.dev` (e.g. register with that email, or temporarily change a demo user’s email in the DB for testing).
3. **Use a verified domain**: In [Resend](https://resend.com), verify your own domain and set `FROM_EMAIL` to an address on that domain (e.g. `noreply@yourdomain.com`). Then you can send to any address.

If the confirmation email fails, the backend logs a warning with the Resend error; check the terminal where the backend is running for the exact message.

**Email notifications (6.3.1):** The app sends email notifications for password reset success, profile updates, payment initiated, and payment successful (in addition to in-app notifications). User preference “Receive notifications via email” (Notifications / Profile) is respected. The same Resend sandbox limits apply: in development with `onboarding@resend.dev`, emails only deliver to your Resend account email or `delivered@resend.dev`. Set `GDPR_CONFIRMATION_EMAIL_OVERRIDE` to receive deletion confirmations; notification emails use the user’s email, so use a user with an allowed address to test.

---

## If login returns "Invalid credentials" or 401

When **encryption is on** (`ENCRYPTION_ENABLED=true`), the backend looks up users by **emailHash**, not plain email. Demo users must have `emailHash` set.

1. **Re-run the demo-users seed** (safe, idempotent):
   ```bash
   cd backend && npm run seed:demo-users
   ```
2. **Restart the backend** so it picks up any code changes.
3. For full end-to-end auth flow and troubleshooting, see **project_documentation/05-api-reference/AUTHENTICATION.md** → "End-to-End Auth Flow (Implementation Reference)" and "Quick Troubleshooting".

---

## Creating / ensuring demo users

### Option 1: Only ensure User, Admin, Super Admin (recommended for testing)

Does **not** delete existing users. Safe to run on any database.

```bash
cd backend
npm run seed:demo-users
```

This creates or updates the three accounts shown on the Login page and prints total user count and counts by role.

**Admin → Feature Flags:** Demo users seed does **not** create feature flags. To have flags to toggle in Admin → Feature Flags, run (safe to re-run):

```bash
cd backend && npm run seed:feature-flags
```

Then open Admin Panel → Feature Flags and refresh; the empty state on that page also shows this command.

### Option 2: Full seed (wipes users)

**Warning**: Deletes all users and recreates seed data.

```bash
cd backend
npm run seed
```

Creates admin@example.com, superadmin@example.com, user1@example.com–user5@example.com (see seed output for passwords).

### Option 3: Demo data (upsert admin + user + sample data)

```bash
cd backend
npm run seed:demo
```

Creates/updates admin@demo.com (SUPER_ADMIN) and user@demo.com (USER) plus sample notifications and payments.

### Manual Creation

1. **Register via UI**:
   - Go to registration page
   - Create account with your email
   - Use strong password

2. **Promote to Admin** (if needed):
   - Login as existing admin
   - Go to Admin → Users
   - Edit user role to ADMIN or SUPER_ADMIN

---

## Demo Data

The demo environment includes:

- **Users**: Sample users with different roles
- **Payments**: Sample payment transactions
- **Notifications**: Sample notifications
- **Audit Logs**: Sample audit log entries

**Note**: Demo data is reset periodically. Don't rely on it for testing.

---

## Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Remove demo users
- [ ] Configure production database
- [ ] Set up production email service
- [ ] Configure production payment providers
- [ ] Set up SSL/HTTPS
- [ ] Configure production OAuth apps
- [ ] Review security settings
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

---

## Support

For questions about demo credentials or setup:

- See [INSTALLATION.md](./INSTALLATION.md) for setup instructions
- See [FAQ.md](./FAQ.md) for common questions
- See [USER_GUIDE.md](./USER_GUIDE.md) for user guide

---

**⚠️ Remember**: These are demo credentials only. Never use in production!

**Last Updated**: February 2026
