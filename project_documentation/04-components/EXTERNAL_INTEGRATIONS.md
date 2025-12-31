# External Integrations
## NextSaaS - Third-Party Services and APIs

**Last Updated:** December 23, 2025  
**Version:** 2.0.0

---

## Overview

This document describes all external services and APIs integrated into NextSaaS, including setup, configuration, and usage.

---

## Email Service Integration

### Resend

**Purpose**: Transactional email delivery

**Package**: `resend` (v6.6.0)

**Setup**:
1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Verify sending domain
4. Add to `.env`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com
   ```

**Usage**:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.FROM_EMAIL,
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome!</h1>',
});
```

**Features**:
- Transactional emails
- Email templates
- Delivery tracking
- Bounce handling

**Service Location**: `backend/src/services/emailService.ts`

**Templates**: `backend/src/templates/emails/`

---

## Payment Gateway Integrations

### Stripe

**Purpose**: Payment processing (primary provider)

**Package**: `stripe` (v20.0.0)

**Setup**:
1. Sign up at [stripe.com](https://stripe.com)
2. Get API keys (test and live)
3. Add to `.env`:
   ```env
   STRIPE_API_KEY=sk_test_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

**Usage**:
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_API_KEY);

const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000, // $10.00
  currency: 'usd',
});
```

**Features**:
- Payment intents
- Webhooks
- Refunds
- Subscriptions
- Customer management

**Provider Location**: `backend/src/providers/StripeProvider.ts`

**Webhook Endpoint**: `/api/payments/webhook/stripe`

---

### Razorpay

**Purpose**: Payment processing (India-focused)

**Package**: `razorpay` (v2.9.6)

**Setup**:
1. Sign up at [razorpay.com](https://razorpay.com)
2. Get Key ID and Key Secret
3. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxx
   ```

**Usage**:
```typescript
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const order = await razorpay.orders.create({
  amount: 1000, // ₹10.00
  currency: 'INR',
});
```

**Features**:
- Payment gateway
- Webhooks
- Refunds
- Subscriptions
- UPI, Netbanking, Wallets

**Provider Location**: `backend/src/providers/RazorpayProvider.ts`

**Webhook Endpoint**: `/api/payments/webhook/razorpay`

---

### Cashfree

**Purpose**: Payment processing (India-focused)

**Package**: `cashfree-sdk` (v5.1.0)

**Setup**:
1. Sign up at [cashfree.com](https://cashfree.com)
2. Get App ID and Secret Key
3. Add to `.env`:
   ```env
   CASHFREE_APP_ID=xxxxxxxxxxxxx
   CASHFREE_SECRET_KEY=xxxxxxxxxxxxx
   CASHFREE_MODE=sandbox # or production
   CASHFREE_WEBHOOK_SECRET=xxxxxxxxxxxxx
   ```

**Usage**:
```typescript
import { Cashfree } from 'cashfree-sdk';

const cashfree = new Cashfree({
  appId: process.env.CASHFREE_APP_ID,
  secretKey: process.env.CASHFREE_SECRET_KEY,
  mode: process.env.CASHFREE_MODE,
});

const order = await cashfree.pg.orders.create({
  order_amount: 1000, // ₹10.00
  order_currency: 'INR',
});
```

**Features**:
- Payment gateway
- Webhooks
- Refunds
- UPI, Netbanking, Wallets

**Provider Location**: `backend/src/providers/CashfreeProvider.ts`

**Webhook Endpoint**: `/api/payments/webhook/cashfree`

---

## Payment Provider Factory

**Location**: `backend/src/providers/PaymentProviderFactory.ts`

**Purpose**: Unified payment provider interface

**Pattern**: Factory + Singleton

**Usage**:
```typescript
import { PaymentProviderFactory } from './providers/PaymentProviderFactory';

const provider = PaymentProviderFactory.getProvider();

const payment = await provider.createPayment({
  amount: 1000,
  currency: 'USD',
  userId: 'user-id',
});
```

**Configuration**:
```env
PAYMENT_PROVIDER=STRIPE # or RAZORPAY, CASHFREE
```

**Interface**:
```typescript
interface IPaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentIntent>;
  capturePayment(params: CapturePaymentParams): Promise<PaymentIntent>;
  refundPayment(params: RefundPaymentParams): Promise<RefundResult>;
  verifyWebhook(event: any, signature: string): boolean;
}
```

---

## OAuth Integrations

### Google OAuth

**Purpose**: Google authentication

**Package**: `passport-google-oauth20` (via Passport.js)

**Setup**:
1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxx
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/oauth/google/callback
   ```

**Usage**:
```typescript
// OAuth flow handled by Passport.js
// Frontend redirects to: /api/auth/oauth/google
// Callback: /api/auth/oauth/google/callback
```

**Service Location**: `backend/src/services/oauthService.ts`

---

### GitHub OAuth

**Purpose**: GitHub authentication

**Package**: `passport-github2` (via Passport.js)

**Setup**:
1. Create OAuth App in [GitHub Settings](https://github.com/settings/developers)
2. Add to `.env`:
   ```env
   GITHUB_CLIENT_ID=xxxxxxxxxxxxx
   GITHUB_CLIENT_SECRET=xxxxxxxxxxxxx
   GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/oauth/github/callback
   ```

**Usage**:
```typescript
// OAuth flow handled by Passport.js
// Frontend redirects to: /api/auth/oauth/github
// Callback: /api/auth/oauth/github/callback
```

**Service Location**: `backend/src/services/oauthService.ts`

---

### Microsoft OAuth

**Purpose**: Microsoft authentication

**Package**: `passport-microsoft` (via Passport.js)

**Setup**:
1. Register app in [Azure Portal](https://portal.azure.com)
2. Add to `.env`:
   ```env
   MICROSOFT_CLIENT_ID=xxxxxxxxxxxxx
   MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxx
   MICROSOFT_CALLBACK_URL=http://localhost:3001/api/auth/oauth/microsoft/callback
   ```

**Usage**:
```typescript
// OAuth flow handled by Passport.js
// Frontend redirects to: /api/auth/oauth/microsoft
// Callback: /api/auth/oauth/microsoft/callback
```

**Service Location**: `backend/src/services/oauthService.ts`

---

## Error Tracking Integration

### Sentry

**Purpose**: Error tracking and monitoring

**Package**: `@sentry/node` (v10.32.1)

**Setup**:
1. Sign up at [sentry.io](https://sentry.io)
2. Create project
3. Get DSN
4. Add to `.env`:
   ```env
   SENTRY_DSN=https://xxxxxxxxxxxxx@xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxxxxxxxx
   SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

**Usage**:
```typescript
// Auto-initialized in app.ts if SENTRY_DSN is set
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
});
```

**Features**:
- Error tracking
- Performance monitoring
- Release tracking
- User context

**Initialization**: `backend/src/app.ts`

---

## Monitoring Integration

### Prometheus

**Purpose**: Metrics collection

**Package**: `prom-client` (v15.1.3)

**Setup**:
- No external service required
- Metrics exposed at `/api/metrics`

**Usage**:
```typescript
import { register, Counter, Histogram } from 'prom-client';

const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
});
```

**Features**:
- Request count metrics
- Request duration metrics
- Error count metrics
- Database metrics

**Metrics Endpoint**: `/api/metrics`

**Middleware**: `backend/src/middleware/metrics.ts`

---

## Database Integration

### PostgreSQL

**Purpose**: Primary database

**Driver**: Prisma ORM

**Setup**:
1. Install PostgreSQL
2. Create database
3. Add to `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/nextsaas
   ```

**Features**:
- ACID compliance
- Connection pooling
- Migrations
- Type-safe queries

**ORM**: Prisma (`@prisma/client`)

**Schema**: `backend/prisma/schema.prisma`

---

## Integration Patterns

### 1. Environment-Based Configuration

**Pattern**: All integrations configured via environment variables

**Example**:
```env
# Email
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@example.com

# Payments
PAYMENT_PROVIDER=STRIPE
STRIPE_API_KEY=sk_test_xxx

# OAuth
GOOGLE_CLIENT_ID=xxx
GITHUB_CLIENT_ID=xxx

# Monitoring
SENTRY_DSN=https://xxx
```

---

### 2. Provider Abstraction

**Pattern**: Unified interface for multiple providers

**Example**: Payment providers
```typescript
interface IPaymentProvider {
  createPayment(params): Promise<PaymentIntent>;
  // All providers implement same interface
}
```

---

### 3. Graceful Degradation

**Pattern**: System works without optional integrations

**Example**: Email service
```typescript
if (!process.env.RESEND_API_KEY) {
  logger.warn('Resend API key not configured, emails will not be sent');
  // System continues to work
}
```

---

### 4. Error Handling

**Pattern**: All integrations handle errors gracefully

**Example**:
```typescript
try {
  await sendEmail(params);
} catch (error) {
  logger.error('Email sending failed', { error });
  // Don't crash the application
}
```

---

## Webhook Handling

### Payment Webhooks

**Endpoints**:
- `/api/payments/webhook/stripe`
- `/api/payments/webhook/razorpay`
- `/api/payments/webhook/cashfree`

**Security**:
- Signature verification
- Idempotency handling
- Event logging

**Processing**:
1. Verify webhook signature
2. Parse webhook event
3. Update payment status
4. Log webhook event
5. Return 200 OK

---

## Integration Testing

### Mocking External Services

**Approach**: Mock external API calls in tests

**Example**:
```typescript
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    },
  })),
}));
```

---

## Integration Checklist

### Required Integrations

- ✅ **PostgreSQL**: Database
- ✅ **Resend**: Email delivery
- ✅ **Payment Provider**: Stripe/Razorpay/Cashfree (at least one)

### Optional Integrations

- ⏳ **Sentry**: Error tracking (optional)
- ⏳ **OAuth Providers**: Google/GitHub/Microsoft (optional)
- ⏳ **Prometheus**: Metrics (optional, but recommended)

---

## Security Considerations

### 1. API Keys

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for dev/staging/production

### 2. Webhook Security

- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement idempotency
- Log all webhook events

### 3. OAuth Security

- Use secure callback URLs
- Validate OAuth tokens
- Store OAuth data securely
- Handle OAuth errors gracefully

---

## Integration Best Practices

### 1. Configuration Management

- Use environment variables
- Document all required variables
- Provide `.env.example` file
- Validate configuration on startup

### 2. Error Handling

- Handle all integration errors
- Log errors appropriately
- Don't crash on integration failures
- Provide fallback behavior

### 3. Testing

- Mock external services in tests
- Test error scenarios
- Test webhook handling
- Test OAuth flows

### 4. Monitoring

- Monitor integration health
- Track API usage
- Alert on failures
- Monitor rate limits

---

## Integration Status

### Implemented

- ✅ Resend (Email)
- ✅ Stripe (Payments)
- ✅ Razorpay (Payments)
- ✅ Cashfree (Payments)
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ Microsoft OAuth
- ✅ Sentry (Error Tracking)
- ✅ Prometheus (Metrics)

### Future Integrations

- ⏳ SMS Provider (Twilio, etc.)
- ⏳ File Storage (S3, Cloudinary)
- ⏳ Analytics (Segment, Mixpanel)
- ⏳ Background Jobs (BullMQ, etc.)

---

**Last Updated**: December 23, 2025  
**Version**: 2.0.0
