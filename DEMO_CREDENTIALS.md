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

## Demo Accounts

### Admin Account

**Email**: `admin@demo.com`  
**Password**: `AdminDemo123!`  
**Role**: `SUPER_ADMIN`

**Access**:
- Full admin dashboard
- User management
- Audit logs
- Feature flags
- Payment management
- System settings

---

### Regular User Account

**Email**: `user@demo.com`  
**Password**: `UserDemo123!`  
**Role**: `USER`

**Access**:
- User dashboard
- Profile management
- Payment history
- Notifications
- Settings

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

## Creating Your Own Demo Users

### Using Seed Script

```bash
cd backend
npm run seed
```

This will create demo users with the credentials above.

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

**Last Updated**: January 2025
