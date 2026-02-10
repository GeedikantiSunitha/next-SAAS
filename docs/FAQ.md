# NextSaaS - Frequently Asked Questions (FAQ)

**Version**: 1.0.0  
**Last Updated**: January 2025

---

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Features](#features)
4. [Troubleshooting](#troubleshooting)
5. [Support](#support)

---

## Installation

### Q: How do I set up the database?

**A**: Follow these steps:

1. **Install PostgreSQL** (if not already installed)
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:14`

2. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE nextsaas_db;
   \q
   ```

3. **Configure Connection**
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL`:
     ```env
     DATABASE_URL=postgresql://username:password@localhost:5432/nextsaas_db
     ```

4. **Run Migrations**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

For detailed instructions, see [INSTALLATION.md](./INSTALLATION.md).

---

### Q: What are the system requirements?

**A**: NextSaaS requires:

- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 14.0 or higher
- **npm**: 9.0.0 or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux

**Recommended**:
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for application, additional for database
- **CPU**: Modern multi-core processor

---

### Q: How do I install dependencies?

**A**: Use the convenience script:

```bash
npm run install:all
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Q: How do I start the application?

**A**: Start backend and frontend separately:

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

Then access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

---

## Configuration

### Q: How do I configure OAuth?

**A**: Follow these steps for each provider:

**Google OAuth**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3001/api/auth/oauth/google/callback`
4. Copy Client ID and Secret to `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
5. Add Client ID to `frontend/.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id
   ```

**GitHub OAuth**:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL: `http://localhost:3001/api/auth/oauth/github/callback`
4. Copy Client ID and Secret to `backend/.env`:
   ```env
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```
5. Add Client ID to `frontend/.env`:
   ```env
   VITE_GITHUB_CLIENT_ID=your-client-id
   ```

**Microsoft OAuth**:
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register new application
3. Add redirect URI: `http://localhost:3001/api/auth/oauth/microsoft/callback`
4. Copy Client ID and Secret to `backend/.env`:
   ```env
   MICROSOFT_CLIENT_ID=your-client-id
   MICROSOFT_CLIENT_SECRET=your-client-secret
   ```
5. Add Client ID to `frontend/.env`:
   ```env
   VITE_MICROSOFT_CLIENT_ID=your-client-id
   ```

For production, update redirect URIs to your production domain.

---

### Q: How do I set up payments?

**A**: Configure your payment provider:

**Stripe**:
1. Sign up at [stripe.com](https://stripe.com)
2. Get API keys from [Dashboard](https://dashboard.stripe.com/apikeys)
3. Add to `backend/.env`:
   ```env
   PAYMENT_PROVIDER=STRIPE
   STRIPE_API_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
4. Add publishable key to `frontend/.env`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```

**Razorpay**:
1. Sign up at [razorpay.com](https://razorpay.com)
2. Get API keys from [Dashboard](https://dashboard.razorpay.com/app/keys)
3. Add to `backend/.env`:
   ```env
   PAYMENT_PROVIDER=RAZORPAY
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxx
   RAZORPAY_WEBHOOK_SECRET=xxx
   ```

**Cashfree**:
1. Sign up at [cashfree.com](https://cashfree.com)
2. Get API credentials from [Dashboard](https://www.cashfree.com/developers/api/credentials)
3. Add to `backend/.env`:
   ```env
   PAYMENT_PROVIDER=CASHFREE
   CASHFREE_APP_ID=xxx
   CASHFREE_SECRET_KEY=xxx
   CASHFREE_MODE=test
   ```

See [INSTALLATION.md](./INSTALLATION.md) for more details.

---

### Q: How do I configure email?

**A**: Use Resend for email functionality:

1. **Sign up** at [resend.com](https://resend.com)
2. **Get API Key** from dashboard
3. **Add to `backend/.env`**:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com
   APP_NAME=NextSaaS
   ```
4. **Verify Domain** (for production):
   - Add DNS records in Resend dashboard
   - Verify domain ownership

**Note**: For development, you can use Resend's test mode or configure a different email service.

---

### Q: How do I generate JWT secrets?

**A**: Generate secure random strings:

**Using OpenSSL**:
```bash
openssl rand -base64 32
```

**Using Node.js**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Add to `backend/.env`**:
```env
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
```

**Important**: 
- Secrets must be at least 32 characters
- Use different secrets for production
- Never commit secrets to version control

---

## Features

### Q: How does authentication work?

**A**: NextSaaS uses JWT (JSON Web Tokens) for authentication:

1. **Login**: User provides email/password
2. **Token Generation**: Server generates access token (15 min) and refresh token (30 days)
3. **Cookie Storage**: Tokens stored as HTTP-only cookies (prevents XSS)
4. **Token Refresh**: Access token refreshed automatically using refresh token
5. **Logout**: Tokens invalidated and cookies cleared

**Security Features**:
- HTTP-only cookies (XSS protection)
- Secure cookies in production (HTTPS only)
- Token expiration
- Refresh token rotation
- Session management

See [USER_GUIDE.md](./USER_GUIDE.md) for detailed authentication guide.

---

### Q: How does MFA work?

**A**: Multi-Factor Authentication adds an extra security layer:

**TOTP (Time-based One-Time Password)**:
1. User enables MFA in profile settings
2. QR code is generated
3. User scans QR code with authenticator app (Google Authenticator, Authy)
4. User enters 6-digit code to verify
5. Backup codes are provided

**Email OTP**:
1. User enables Email MFA
2. OTP is sent to user's email
3. User enters OTP to verify
4. Email MFA is enabled

**Login Flow**:
1. User enters email/password
2. If MFA enabled, temporary token is issued
3. User enters MFA code
4. Full authentication tokens are issued

See [USER_GUIDE.md](./USER_GUIDE.md) for MFA setup instructions.

---

### Q: How do payments work?

**A**: NextSaaS supports multiple payment providers:

**Payment Flow**:
1. User initiates payment
2. Payment intent created with provider
3. Client secret returned to frontend
4. User completes payment on frontend
5. Payment captured/confirmed
6. Payment status updated in database

**Supported Providers**:
- **Stripe**: Credit/debit cards, Apple Pay, Google Pay
- **Razorpay**: Cards, UPI, Net Banking (India)
- **Cashfree**: Cards, UPI, Net Banking (India)

**Payment States**:
- **PENDING**: Payment created, awaiting completion
- **SUCCEEDED**: Payment completed successfully
- **FAILED**: Payment failed
- **REFUNDED**: Payment refunded

See [USER_GUIDE.md](./USER_GUIDE.md) for payment guide.

---

### Q: How does RBAC work?

**A**: Role-Based Access Control (RBAC) manages permissions:

**Roles**:
- **USER**: Standard user (default)
- **ADMIN**: Administrator (can manage users, view audit logs)
- **SUPER_ADMIN**: Super administrator (full system access)

**Permissions**:
- Permissions are checked at route level
- Middleware validates user role
- Admin endpoints require ADMIN or SUPER_ADMIN role

**Usage**:
```typescript
// In route handler
router.get('/admin/users', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), handler);
```

See [USER_GUIDE.md](./USER_GUIDE.md) for admin features.

---

## Troubleshooting

### Q: Database connection error - what should I do?

**A**: Check these common issues:

1. **PostgreSQL not running**:
   ```bash
   # Check if PostgreSQL is running
   pg_isready
   # Or
   psql -U postgres -c "SELECT 1"
   ```

2. **Wrong connection string**:
   - Verify `DATABASE_URL` in `backend/.env`
   - Format: `postgresql://username:password@host:port/database`
   - Check username, password, host, port, database name

3. **Database doesn't exist**:
   ```bash
   psql -U postgres
   CREATE DATABASE nextsaas_db;
   ```

4. **Firewall/Network issues**:
   - Check if PostgreSQL port (5432) is accessible
   - Verify network connectivity

See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for more solutions.

---

### Q: JWT secret error - "must be at least 32 characters"

**A**: Generate a longer secret:

```bash
# Generate 32+ character secret
openssl rand -base64 32
```

Update `backend/.env`:
```env
JWT_SECRET=your-generated-secret-here-minimum-32-characters
JWT_REFRESH_SECRET=your-generated-refresh-secret-here-minimum-32-characters
```

Restart the backend server.

---

### Q: Port already in use error

**A**: Change the port or kill the process:

**Option 1 - Change Port**:
```env
# In backend/.env
PORT=3002
```

**Option 2 - Kill Process**:
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

---

### Q: Email not sending

**A**: Check these:

1. **Resend API Key**:
   - Verify `RESEND_API_KEY` is set in `backend/.env`
   - Check Resend dashboard for API key status

2. **From Email**:
   - Verify `FROM_EMAIL` is set
   - For production, verify domain in Resend

3. **Check Logs**:
   ```bash
   # Check backend logs
   tail -f backend/logs/*.log
   ```

4. **Test Email**:
   - Use Resend's test mode
   - Check Resend dashboard for delivery status

---

### Q: OAuth login not working

**A**: Verify configuration:

1. **Check Environment Variables**:
   - Backend: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - Frontend: `VITE_GOOGLE_CLIENT_ID`

2. **Verify Redirect URI**:
   - Must match exactly in OAuth provider settings
   - Format: `http://localhost:3001/api/auth/oauth/{provider}/callback`

3. **Check OAuth Provider Settings**:
   - Verify Client ID and Secret are correct
   - Check redirect URI is authorized
   - Verify OAuth app is active

4. **Check Browser Console**:
   - Look for CORS errors
   - Check network requests

---

### Q: Payment not working

**A**: Troubleshoot payment issues:

1. **Check Provider Configuration**:
   - Verify `PAYMENT_PROVIDER` is set correctly
   - Check API keys are valid
   - Use test keys for development

2. **Check Frontend Configuration**:
   - Verify publishable key is set
   - Check Stripe/Razorpay scripts are loaded

3. **Check Provider Status**:
   - Verify payment provider is operational
   - Check provider dashboard for errors

4. **Check Logs**:
   - Review payment service logs
   - Check for error messages

---

## Support

### Q: How do I get support?

**A**: Use these resources:

1. **Documentation**:
   - [INSTALLATION.md](./INSTALLATION.md) - Setup guide
   - [USER_GUIDE.md](./USER_GUIDE.md) - User guide
   - [README.md](./README.md) - Project overview
   - [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues

2. **API Documentation**:
   - Swagger UI: http://localhost:3001/api-docs
   - [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

3. **CodeCanyon Support**:
   - Contact through CodeCanyon support system
   - Include error messages and logs
   - Describe steps to reproduce

4. **Check Logs**:
   - Backend logs: `backend/logs/`
   - Browser console for frontend errors
   - Network tab for API errors

---

### Q: How do I report a bug?

**A**: When reporting bugs, include:

1. **Description**: What happened vs. what you expected
2. **Steps to Reproduce**: Detailed steps to trigger the bug
3. **Environment**:
   - Node.js version
   - Operating system
   - Browser (if frontend issue)
4. **Error Messages**: Copy full error messages
5. **Logs**: Relevant log entries
6. **Screenshots**: If applicable

---

### Q: How do I request a feature?

**A**: Feature requests can be submitted through:

1. **CodeCanyon Support**: Contact through CodeCanyon
2. **Documentation**: Check if feature already exists
3. **Customization**: Many features can be customized
   - See [README.md](./README.md) for customization guide

---

### Q: How do I customize the application?

**A**: NextSaaS is designed to be customizable:

1. **Branding**:
   - Update `APP_NAME` in environment variables
   - Customize frontend components
   - Update logo and colors

2. **Features**:
   - Enable/disable via feature flags
   - Modify business logic in services
   - Add custom routes

3. **Styling**:
   - Tailwind CSS for frontend
   - Customize theme in `tailwind.config.ts`
   - Modify components in `frontend/src/components/`

4. **Database**:
   - Add custom tables via Prisma
   - Extend existing models
   - Add migrations

See [README.md](./README.md) for more customization options.

---

### Q: How do I deploy to production?

**A**: See deployment guides:

- [DEPLOYMENT_BACKEND.md](./docs/DEPLOYMENT_BACKEND.md) - Backend deployment
- [DEPLOYMENT_FRONTEND.md](./docs/DEPLOYMENT_FRONTEND.md) - Frontend deployment

**Key Steps**:
1. Set up production database
2. Configure environment variables
3. Build application
4. Deploy to hosting provider
5. Set up SSL/HTTPS
6. Configure domain and DNS

---

## Additional Resources

- [Installation Guide](./INSTALLATION.md) - Complete setup instructions
- [User Guide](./USER_GUIDE.md) - Comprehensive user guide
- [API Documentation](./docs/API_DOCUMENTATION.md) - API reference
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Common issues and solutions

---

**Last Updated**: January 2025  
**Version**: 1.0.0
