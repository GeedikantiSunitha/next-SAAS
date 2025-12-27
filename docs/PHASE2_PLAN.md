# Phase 2 Implementation Plan

## Overview

Phase 2 adds essential business features on top of the Phase 1 foundation.

**Duration**: 1-2 weeks  
**Testing Strategy**: Test after EACH module (learned from Phase 1!)

---

## 📋 Phase 2 Modules

### Module 1: Email Notifications (Resend) ⏱️ 2-3 days

**Priority**: HIGH  
**Why**: Almost every app needs email (verification, password reset, notifications)

#### Features
- Resend API integration
- Email template system (Handlebars)
- Template management (welcome, verify, password reset, notification)
- Email queue (optional - async sending)
- Email service abstraction (can switch providers)

#### Files to Create
```
backend/src/
├── services/
│   └── emailService.ts        # Email sending logic
├── templates/
│   └── emails/
│       ├── welcome.hbs        # Welcome email template
│       ├── verify.hbs         # Email verification template
│       ├── reset.hbs          # Password reset template
│       └── notification.hbs   # Generic notification
├── config/
│   └── email.ts               # Email configuration
└── __tests__/
    └── emailService.test.ts   # Email tests
```

#### Testing Checklist
- [ ] Test Resend API integration
- [ ] Test template rendering
- [ ] Test email sending (with mock)
- [ ] Test error handling
- [ ] Run full test suite

---

### Module 2: Payment Gateway Abstraction ⏱️ 3-4 days

**Priority**: HIGH  
**Why**: You specifically need Stripe, Razorpay, Cashfree

#### Features
- Unified payment interface
- Multiple provider support (Stripe, Razorpay, Cashfree)
- Provider switching via config
- Webhook handling for each provider
- Payment status tracking
- Subscription support (basic)

#### Architecture
```typescript
// Abstract interface that all providers implement
interface PaymentProvider {
  createPayment(amount, currency, metadata)
  createSubscription(planId, customerId)
  handleWebhook(payload, signature)
  refund(paymentId, amount)
}

// Implementations
class StripeProvider implements PaymentProvider { ... }
class RazorpayProvider implements PaymentProvider { ... }
class CashfreeProvider implements PaymentProvider { ... }
```

#### Files to Create
```
backend/src/
├── services/
│   └── payment/
│       ├── PaymentProvider.ts       # Abstract interface
│       ├── StripeProvider.ts        # Stripe implementation
│       ├── RazorpayProvider.ts      # Razorpay implementation
│       ├── CashfreeProvider.ts      # Cashfree implementation
│       └── PaymentService.ts        # Main service
├── routes/
│   └── payment.ts                   # Payment routes
├── models/
│   └── payment.ts                   # Payment models (Prisma)
└── __tests__/
    └── payment.test.ts              # Payment tests
```

#### Prisma Schema Updates
```prisma
model Payment {
  id          String   @id @default(uuid())
  userId      String
  amount      Decimal
  currency    String
  provider    String   // stripe, razorpay, cashfree
  providerId  String   // External payment ID
  status      PaymentStatus
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
  CANCELLED
}
```

#### Testing Checklist
- [ ] Test Stripe integration
- [ ] Test Razorpay integration
- [ ] Test Cashfree integration
- [ ] Test provider switching
- [ ] Test webhook handling
- [ ] Test payment status tracking
- [ ] Run full test suite

---

### Module 3: Enhanced RBAC & Permissions ⏱️ 2 days

**Priority**: MEDIUM  
**Why**: Basic auth exists, need fine-grained permissions

#### Features
- Resource-level permissions
- Permission checking middleware
- JSON/YAML-based permission config
- Role hierarchy (super_admin > admin > manager > user)

#### Files to Create
```
backend/src/
├── config/
│   └── permissions.ts           # Permission definitions
├── middleware/
│   └── permissions.ts           # Permission middleware
├── services/
│   └── permissionService.ts     # Permission logic
└── __tests__/
    └── permissions.test.ts      # Permission tests
```

#### Permission Structure
```typescript
// config/permissions.ts
export const permissions = {
  users: {
    view: ['user', 'admin', 'super_admin'],
    create: ['admin', 'super_admin'],
    update: ['admin', 'super_admin'],
    delete: ['super_admin'],
  },
  payments: {
    view: ['user', 'admin', 'super_admin'],
    create: ['user', 'admin', 'super_admin'],
    refund: ['admin', 'super_admin'],
  },
  // ... more resources
};
```

#### Testing Checklist
- [ ] Test permission checking
- [ ] Test role hierarchy
- [ ] Test resource-level permissions
- [ ] Test unauthorized access
- [ ] Run full test suite

---

### Module 4: File Uploads (Optional) ⏱️ 1-2 days

**Priority**: LOW  
**Why**: Not all apps need it, but useful to have

#### Features
- S3 integration
- Local storage fallback
- File upload endpoints
- Size/format validation
- Signed URLs

#### Files to Create
```
backend/src/
├── services/
│   └── storageService.ts        # Storage abstraction
├── routes/
│   └── upload.ts                # Upload routes
└── __tests__/
    └── storage.test.ts          # Storage tests
```

#### Testing Checklist
- [ ] Test file upload
- [ ] Test validation
- [ ] Test S3 integration
- [ ] Test signed URLs
- [ ] Run full test suite

---

## 🎯 Implementation Order

### Week 1
**Days 1-2**: Email Notifications
- Set up Resend
- Create email service
- Create templates
- Test thoroughly ✅

**Days 3-5**: Payment Gateway (Part 1)
- Create abstract interface
- Implement Stripe provider
- Test Stripe integration ✅

### Week 2
**Days 1-2**: Payment Gateway (Part 2)
- Implement Razorpay provider
- Implement Cashfree provider
- Test all providers ✅

**Days 3-4**: RBAC & Permissions
- Implement permission system
- Test thoroughly ✅

**Day 5**: File Uploads (if time permits)
- Implement storage service
- Test ✅

---

## 🚨 Critical: Lessons from Phase 1

### DO's ✅
1. **Test after EACH module** - Don't wait until the end
2. **Run `npm run build` frequently** - Catch TypeScript errors early
3. **Use `_` for unused params** - Avoid TypeScript errors
4. **Split early returns** - Avoid return type errors
5. **Test on clean environment** - Ensure setup works

### DON'Ts ❌
1. **Don't build everything then test** - Test incrementally
2. **Don't assume defaults** - Document all assumptions
3. **Don't ignore TypeScript errors** - Fix them immediately
4. **Don't skip documentation** - Document as you build

---

## 📝 Testing Strategy

### After Each Module
```bash
# 1. Build check
npm run build

# 2. Run tests
npm test

# 3. Run linter
npm run lint

# 4. Manual testing
npm run dev
curl http://localhost:3001/api/...
```

### Before Moving to Next Module
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Manual testing complete

---

## 🔧 Setup Requirements

### Environment Variables to Add
```env
# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com

# Payments - Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Payments - Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Payments - Cashfree
CASHFREE_APP_ID=...
CASHFREE_SECRET_KEY=...
CASHFREE_ENV=TEST  # or PROD

# Storage (Optional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket
```

### Dependencies to Install
```bash
# Email
npm install resend handlebars

# Payments
npm install stripe razorpay cashfree-pg

# File Upload (Optional)
npm install @aws-sdk/client-s3 multer
npm install -D @types/multer
```

---

## 📊 Success Metrics

Phase 2 is complete when:

- [ ] **Email service** works with Resend
- [ ] **3 payment providers** integrated and working
- [ ] **Permission system** enforces access control
- [ ] **All tests passing** (aim for 80%+ coverage)
- [ ] **Documentation** complete for each module
- [ ] **No TypeScript errors**
- [ ] **No linting errors**
- [ ] **Tested in real scenario**

---

## 🚀 Let's Start!

**First Module**: Email Notifications (Resend)

Ready to begin? I'll:
1. Install dependencies
2. Create email service
3. Create email templates
4. Add tests
5. Test thoroughly ✅

Then move to payments, testing after each step.

**Estimated completion**: 1-2 weeks with proper testing

