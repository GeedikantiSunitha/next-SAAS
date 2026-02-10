# Task: Fix #7 — Admin Refund UI

**Date:** February 2025  
**Source:** MANUAL_TEST_ROUND4_REVIEW_AND_FIX_PLAN.md (5.3.1, 8.5.3)  
**Rules:** AI_RULES.md, TDD_WORKFLOW.md

## What we're building

- **Backend:** Admin-only refund endpoint so admins can process refunds from the admin payments list.  
  - New: `refundPaymentAsAdmin(paymentId, adminUserId, { amount?, reason })` in paymentService (skips ownership check).  
  - New: `POST /api/admin/payments/:id/refund` in admin routes.
- **Frontend:** Refund action in Admin Payments UI.  
  - New: `adminApi.refundPayment(id, { amount?, reason })`.  
  - Update: AdminPayments table — add Actions column with Refund button (for succeeded/completed payments, not already full refund).

## Files to create/modify

1. **backend/src/services/paymentService.ts** — Add `refundPaymentAsAdmin` (same logic as refundPayment but no userId ownership check).
2. **backend/src/routes/admin.ts** — Add `POST /payments/:id/refund` handler calling `refundPaymentAsAdmin`.
3. **backend/src/__tests__/routes/admin.refund.test.ts** — New: admin refund route tests (admin 200, non-admin 403, not found 404, not eligible 400).
4. **frontend/src/api/admin.ts** — Add `refundPayment(id, body)`.
5. **frontend/src/pages/admin/AdminPayments.tsx** — Add Actions column with Refund button; optional confirm dialog; invalidate list on success.

## Tests (TDD — write first)

1. **Backend:** Admin refund route: admin POST → 200 and refund in body; non-admin → 403; payment not found → 404; payment not eligible → 400.
2. **Frontend (optional):** AdminPayments shows Refund for eligible payments; click calls API and invalidates list.

## Success criteria

- [x] All existing tests still pass.
- [x] New admin refund tests pass.
- [x] Admin can refund any user's payment from Admin → Payments.
- [x] 5.3.1 Process Refund and 8.5.3 covered; plan doc updated.

## Risks / notes

- Refund route uses existing provider (Stripe etc.); tests mock provider or service to avoid real API calls.
- No schema changes; no new DB tables.
