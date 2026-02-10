# Manual Testing Round 4 – Review and Fix Plan

**Source**: `tests/manual_testing/manual testing - 4`  
**Date**: February 2025  
**Tester**: VAP (Round 4)

This document classifies all FAIL items from the latest manual test run and provides a prioritized fix plan. Items already resolved in previous rounds are marked; new or recurring failures are planned for fix. For resolution details and issue history, see `ISSUES_LOG.md`.

---

## Recommended order (fix 1 by 1)

| # | Fix | Phase | Status | Why this order |
|---|-----|--------|--------|----------------|
| 1 | Payment: amount validation + no crash | 1 | **Done** | Unblocks 5.1, 5.1.2, 5.1.3, 5.2, 5.2.2, 5.3, 5.3.1, 5.4, 8.5.x. Single root cause (Stripe/amount). |
| 2 | MFA TOTP verification field | 1 | **Pending** (now in scope) | Unblocks 3.1.1, 3.1.2 (user can complete TOTP setup). See assessment §5. |
| 3 | Disable MFA in UI | 1 | **Pending** (now in scope) | Quick check/fix; 3.4. See assessment §6. |
| 4 | Password reset | 1 | **Done** | Verify 1.3.x; may already work. |
| 5 | Backup codes (copy + login) | 2 | Pending | 3.1.1, 3.2.2. |
| 6 | Email MFA | 2 | Pending | 3.3, 3.3.2. |
| 7 | Admin refund UI | 2 | **Done** | 5.3.1, 8.5.3. |
| 8 | GDPR download link | 2 | **Done** | 7.1.2. |
| 9 | Admin role change (Super Admin) | 2 | **Done** | 8.2.6. |
| 10 | CSRF protection | 2 | **Done** | 11.3.3. |
| 11 | Email notifications | 2 | **Done** | 6.3.1. |
| 12 | Microsoft OAuth | 2 | **Deferred** (won’t do) | 4.3.1 – intentionally not implementing. |
| 13 | Email format validation | 3 | **Done** | 1.1.5. |
| 14 | Feature flags seed | 3 | **Done** | 8.4.x. |
| 15 | Data deletion email | 3 | **Done** | 7.2. |
| 16 | Newsletter UI | 3 | **Done** | 8.6. |
| 17 | Network/offline + timeout | 3 | **Done** | 12.2.x. |

**Progress:** [x] 1, 4, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17. **Now in scope:** 2, 3, 5, 6. Update the **Status** column to "Done" when you complete each fix.

---

### Next up: Fix #5 — Backup codes (copy + login)

*(Fix #13 — Email format validation: **complete**. Fix #14 — Feature flags seed: **complete**. Run `npm run seed:feature-flags` in backend; empty state on Admin → Feature Flags shows the command. Fix #15 — Data deletion email: **complete**. Fix #16 — Newsletter UI: **complete**. Newsletters added to Admin sidebar. Fix #17 — Network/offline + timeout: **complete**. NetworkErrorBanner + client timeout; E2E tests in `tests/e2e/error-handling-network.focused.spec.ts`.)*

**Next pending:** Fix #5 — Backup codes (copy + login). Also in scope: #2 TOTP verification field, #3 Disable MFA, #6 Email MFA. See table and assessment below.

---

## System Assessment – Pending Items & Email (No Code Changes)

*Assessment date: February 2025. Purpose: identify what remains, why emails may “not go”, and what to fix for pending items.*

### 1. Pending vs done (from table)

| Status   | Items |
|----------|--------|
| **Pending** | **#5** Backup codes (copy + login), **#6** Email MFA |
| **Now considered** | **#2** MFA TOTP verification field, **#3** Disable MFA in UI (previously skipped) |
| **Deferred** | #12 Microsoft OAuth |
| **Done** | 1, 4, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17 |

**Actionable fixes:** #2, #3, #5, #6 (all MFA-related). #2 and #3 are now in scope.

---

### 2. Why the tester said “emails were not going”

**Conclusion: Not a missing feature – it’s Resend sandbox recipient limits.**

- **Backend:** `RESEND_API_KEY` is set in `backend/.env`. `FROM_EMAIL=onboarding@resend.dev` → Resend **sandbox**.
- **Resend sandbox rule:** With `onboarding@resend.dev`, Resend **only delivers to**:
  1. The email address of the **Resend account** (the one used to sign up at resend.com), or  
  2. `delivered@resend.dev`.
- **Demo users** (e.g. `demo@example.com`, `user@demo.com`) are **not** in that allowlist, so:
  - Password reset, Email MFA OTP, in-app→email notifications (6.3.1), and data-deletion confirmation (7.2) are **sent by the app** but **not delivered** by Resend to those addresses.
- **Data deletion:** `GDPR_CONFIRMATION_EMAIL_OVERRIDE=vapmail16@gmail.com` is set. The app sends the confirmation **to** that address. Delivery only works if `vapmail16@gmail.com` is the **Resend account email**; otherwise sandbox can still block it.
- **Docs:** `docs/DEMO_CREDENTIALS.md` already explains sandbox limits and options (override, use allowed address, or verify domain).

**What to do for manual testing (no code):**

1. Use a user whose email is the **Resend account email** or **`delivered@resend.dev`** for: password reset, Email MFA, notifications (6.3.1), data deletion (7.2).  
2. Or verify a domain in Resend and set `FROM_EMAIL` to that domain so any recipient can receive.  
3. Check backend logs when “email not received” – Resend errors and sandbox hints are logged (e.g. in `gdprService`, `emailService`).

No backend bug identified for “emails not going”; behavior matches Resend sandbox.

---

### 3. Fix #5 – Backup codes (copy + login)

**Intended behavior:**  
- TOTP setup shows backup codes; “Copy Backup Codes” copies them to clipboard.  
- Login with MFA allows “Use Backup Code” and accepting an 8-digit backup code.

**Findings:**

- **Copy:** In `frontend/src/components/TotpSetupModal.tsx`, “Copy Backup Codes” calls `handleCopyBackupCodes`, which uses **state** `backupCodes`. That state is **never** set from the API response; it’s only reset to `[]` when the modal closes. The codes shown on screen come from `setupData.backupCodes`. So when the user clicks copy, `navigator.clipboard.writeText(backupCodes.join('\n'))` copies an **empty string**.  
  - **Fix (when coding):** Copy `setupData?.backupCodes` (e.g. in `handleCopyBackupCodes` use `(setupData?.backupCodes ?? backupCodes).join('\n')` or set state from `setupData.backupCodes` when setup succeeds).

- **Login with backup code:**  
  - **Backend:** Auth flow supports `isBackupCode` and backup code verification (e.g. `auth` routes, MFA verification).  
  - **Frontend:** `Login.tsx` uses `MfaVerification` with `showBackupCodeOption={true}`; user can switch to “Use Backup Code” and enter 8 digits.  
  - So backup-code **login** path appears implemented. Remaining risk: copy is broken, so testers may not have valid codes to paste; fixing copy should unblock manual verification.

**Summary for #5:** Fix “Copy Backup Codes” to use `setupData.backupCodes` (or equivalent). Re-test backup-code login after copy works.

---

### 4. Fix #6 – Email MFA

**Intended behavior:**  
- User enables Email MFA; backend sends OTP to user’s email; user enters OTP and MFA is enabled.  
- Login with Email MFA: after password, user gets OTP by email and enters it.

**Findings:**

- **Backend:**  
  - `mfaService.sendEmailOtp(userId)` sends OTP via Resend to `user.email` (template `mfa-otp`).  
  - When `RESEND_API_KEY` is missing or test mode, it logs and does not send; in dev with key set, it sends.  
  - Same **Resend sandbox** rule: delivery only to Resend account email or `delivered@resend.dev`. So for `demo@example.com` the OTP email is **not delivered** in sandbox.

- **Frontend:**  
  - `EmailMfaSetupModal` and MFA hooks exist; enable flow and “send code to email” + verification code input are present.  
  - If backend returns `emailConfigured: false` (or similar), frontend shows a clear message (e.g. use TOTP or contact admin).  
  - So the main blocker for **manual** “Email MFA not working” is again **recipient** (sandbox), not missing UI or API.

**What to do:**

1. **For manual test:** Enable and test Email MFA with a user whose email is the Resend account email or `delivered@resend.dev`.  
2. **Optional (when coding):** Ensure backend returns a clear “email not configured” or “sandbox – use allowed email” style flag when Resend is sandbox, and that frontend shows it so testers know why they don’t get the OTP.

**Summary for #6:** Code path for Email MFA (send OTP, enable, login) is present. “Emails not going” is due to Resend sandbox; no code fix required for delivery except testing with an allowed recipient (or verified domain).

---

### 5. Fix #2 – MFA TOTP verification field (now considered)

**Tester report:** “No field to enter verification code; copy backup codes not functional.”  
**Test cases:** 3.1.1 (Enable TOTP MFA), 3.1.2 (Enable TOTP – Invalid Code).

**Intended behavior:**
- User opens TOTP setup → sees QR code, secret, backup codes, **and** a 6-digit verification code input.
- User enters code from authenticator app and clicks **“Verify & Enable”** → MFA is enabled.

**Findings:**

- **Code:** In `frontend/src/components/TotpSetupModal.tsx` the verification **field and button exist**:
  - Label: “Enter verification code from your app”.
  - Input: `id="verification-code"`, `maxLength={6}`, numeric.
  - Footer button: “Verify & Enable” (shown when `step === 'setup' && setupTotpMutation.isSuccess`).
  - `handleVerify()` sends `{ method: 'TOTP', code: verificationCode }` via `enableMfaMutation`.
- **Why the tester may not have seen them:**
  1. **Scroll / viewport:** Modal content is long (instructions, QR, secret, backup codes, then verification input). On smaller screens or without scrolling, the verification input and footer “Verify & Enable” can be **below the fold**. The modal has `max-w-2xl` and no explicit scroll; the content area may not scroll, so the verify section might be hidden.
  2. **Setup never succeeds:** If `setupTotpMutation` fails (e.g. API error, network), only the error block is shown and the verification input is inside `setupTotpMutation.isSuccess && setupData`, so it never appears.
  3. **Copy bug (#5):** “Copy backup codes” uses wrong state (empty), so testers may assume the flow is broken and stop before reaching the verify step.

**What to do (when coding):**
1. **Ensure verification is visible:** Make the modal body scrollable (e.g. `overflow-y-auto` with max-height) so the verification input and “Verify & Enable” are reachable without relying on viewport height. Optionally scroll the verification input into view when setup succeeds.
2. **Improve error visibility:** When `setupTotpMutation.isError`, show the error clearly and keep a retry or “Try again” so the user can get back to the verify step after fixing (e.g. network).
3. **Re-test after #5:** Fix backup-codes copy (#5) so testers can complete the flow and confirm the verification field and button work end-to-end.

**Summary for #2:** Field and button are implemented; likely issues are **scroll/visibility** (verify section below the fold) and/or **setup failing** before success. Add scroll to modal content and optionally scroll-into-view for the verify section; verify after #5 is fixed.

---

### 6. Fix #3 – Disable MFA in UI (now considered)

**Tester report:** “No option to disable MFA in UI.”  
**Test case:** 3.4 (Disable MFA).

**Intended behavior:**
- When TOTP or Email MFA is **enabled**, the user sees an **“Enabled”** state and a **“Disable”** button.
- Clicking “Disable” opens a confirmation dialog; confirming disables that MFA method.

**Findings:**

- **Code:** In `frontend/src/components/MfaSettings.tsx`:
  - `totpMethod = methods?.find((m) => m.method === 'TOTP')`, `emailMethod = methods?.find((m) => m.method === 'EMAIL')`.
  - When `totpMethod?.isEnabled` (or `emailMethod?.isEnabled`), the UI shows “Enabled” and a **“Disable”** button; `handleDisable('TOTP')` / `handleDisable('EMAIL')` opens `ConfirmDialog` and calls `disableMfaMutation.mutate(methodToDisable)`.
  - So **“Disable” is conditional on `methods` from the API and `isEnabled === true`.**
- **Why the tester may not have seen it:**
  1. **MFA never enabled:** If the user never completed TOTP verify (#2) or Email MFA (#6), `methods` would not include an enabled method (or backend would return `isEnabled: false`), so the Disable button never appears. Fixing #2 and #5 (and testing #6 with allowed email) unblocks this.
  2. **API shape:** If `GET /api/auth/mfa/methods` returns methods without `isEnabled: true` after a successful enable (e.g. backend not updating or returning the right shape), the frontend would show “Setup TOTP” / “Setup Email MFA” instead of “Enabled” + “Disable”. Worth verifying the backend response after enable.
  3. **Section visibility:** “Disable” is in the same card as “Authenticator App (TOTP)” and “Email Verification”; no separate hidden section. If the page loads and methods are correct, Disable is visible.

**What to do (when coding):**
1. **Verify API:** After enabling TOTP (or Email MFA), call `GET /api/auth/mfa/methods` and confirm the relevant method has `isEnabled: true`. If not, fix backend so enable flow persists and returns the correct state.
2. **Manual test:** Enable MFA (after fixing #2/#5 so TOTP enable works, or use Email MFA with allowed email), then reload MFA settings page and confirm “Enabled” and “Disable” appear; click Disable and confirm dialog and success.
3. **No extra UI change needed** for “Disable” visibility if the API is correct; the component already shows Disable when `totpMethod?.isEnabled` or `emailMethod?.isEnabled`.

**Summary for #3:** Disable button and confirm dialog are implemented. Visibility depends on **MFA being enabled** (so #2/#5/#6 must work) and **API returning `isEnabled: true`**. Verify backend MFA methods response after enable; then re-test Disable flow manually.

---

### 7. Auto-test / checks you can run (no code changes)

- **Backend:**  
  - `cd backend && npm run test` (or run `gdprService.test`, `emailService.test`, `mfaService.test`, `auth.test`) – confirms email/MFA logic and that tests pass (e.g. with mocks or test env).  
  - In dev, trigger password reset or data deletion and watch backend logs for Resend response; sandbox rejections will show in logs.

- **Frontend:**  
  - `cd frontend && npm run test` – run MFA-related tests (e.g. `TotpSetupModal`, `MfaVerification`, `BackupCodesManagement`, `MfaSettings`, `EmailMfaSetupModal`) to catch regressions.  
  - Manually: open TOTP setup, complete setup until backup codes are visible, click “Copy Backup Codes”, paste elsewhere – currently pastes nothing (confirms copy bug).

- **Email delivery:**  
  - No automated test can “prove” delivery to arbitrary addresses in sandbox. Use a user with Resend account email or `delivered@resend.dev` and run: password reset, Email MFA enable, data deletion request, and trigger a notification (e.g. profile update) with “email notifications” on – all should deliver.

---

### 8. Summary – what we need to do for remaining items (including #2 and #3)

| Item | Action |
|------|--------|
| **Emails “not going”** | **No code change.** Use Resend-allowed recipient (or verified domain) and document in DEMO_CREDENTIALS (already done). |
| **#5 Backup codes** | **Code change:** Fix “Copy Backup Codes” in `TotpSetupModal` to use `setupData?.backupCodes` (or set state from it). Then re-test backup-code login. |
| **#6 Email MFA** | **No code change for delivery.** Optionally improve “email not configured / sandbox” messaging. Manual test with allowed email. |
| **#2 TOTP verification field** | **Code/UX:** Ensure TOTP setup modal body is scrollable so verification input and “Verify & Enable” are visible; optionally scroll verification into view on success. Improve error visibility/retry. Re-test after #5. |
| **#3 Disable MFA** | **Verify:** Confirm `GET /api/auth/mfa/methods` returns `isEnabled: true` after enable. No extra UI change if API is correct; re-test Disable flow after #2/#5 (and #6 if testing Email MFA). |

---

*#2 and #3 are now in scope; assessment above covers what to verify and fix for each.*

---

## Demo roles, payments, and refunds

### Where to process a refund

1. Log in as **Admin** (`demo-admin@example.com`) or **Super Admin** (`demo-superadmin@example.com`).
2. Open **Admin Panel** (sidebar or `/admin`).
3. Go to **Payments** (sidebar link or `/admin/payments`).
4. The **Recent Payments** table lists **all users’ payments** (not only the current admin’s).
5. For any payment with status **succeeded** or **completed**, a **Refund** button appears in the **Actions** column. Click it, confirm, and the refund is processed via the payment provider.

If you don’t see a payment: ensure you’re on **Admin → Payments** and check pagination (e.g. “Next”); the API returns all payments with no filter by payer. If the list is still empty, check the browser Network tab for `GET /api/admin/payments` and the response body.

### Who can see payments and approve refunds

| Role          | Access to Admin Panel | Sees all users’ payments | Can use Refund button |
|---------------|------------------------|---------------------------|------------------------|
| **User**      | No                     | No (only own payments on /payments) | No  |
| **Admin**     | Yes                    | Yes                       | Yes |
| **Super Admin** | Yes                  | Yes                       | Yes |

**Admin** and **Super Admin** use the same **Admin → Payments** list and the same **Refund** action; both can approve refunds for any user’s succeeded/completed payment.

**Demo payments and refunds:** Payments created by the demo seed (e.g. `providerPaymentId: pi_demo_001`) are not real Stripe PaymentIntents. Refund on such a payment returns **400** with a clear message. To test full refund end-to-end, create a payment via Stripe Checkout (test or live) then use Admin → Payments → Refund.

### Role capabilities (USER vs ADMIN vs SUPER_ADMIN)

| Capability | User | Admin | Super Admin |
|------------|------|--------|-------------|
| Dashboard, profile, own payments, notifications | ✅ | ✅ | ✅ |
| Admin Panel (Dashboard, Users, Audit Logs, Feature Flags, **Payments**, Settings, etc.) | ❌ | ✅ | ✅ |
| View **all** users’ payments and process refunds | ❌ | ✅ | ✅ |
| Create/edit/delete users, toggle active | ❌ | ✅ | ✅ |
| **Change another user’s role** (e.g. USER → ADMIN) | ❌ | ❌ | ✅ only |
| Change own role | ❌ | ❌ | ❌ |
| System Settings (Admin → Settings) | ❌ | ✅ | ✅ |

So: **User** = normal app user. **Admin** = full admin (users, payments, refunds, settings, etc.) but **cannot** change roles. **Super Admin** = same as Admin **plus** the ability to change other users’ roles (e.g. promote to ADMIN).

---

## Classification Summary

| Category | Count | Priority | Notes |
|----------|--------|----------|--------|
| **A. Auth & Validation** | 2 areas | CRITICAL / MEDIUM | Email validation; Password reset flow |
| **B. MFA (TOTP / Email / Disable)** | 7 test cases | CRITICAL | Verification field missing; backup copy broken; Email MFA/OTP; Disable MFA |
| **C. OAuth** | 1 | Deferred | Microsoft OAuth – not implementing |
| **D. Payment (Stripe / UI crash)** | 8+ areas | CRITICAL | Page crash on 0/empty amount; History crash; Refund UI; Webhooks blocked |
| **E. Notifications** | 1 | HIGH | Email notifications not received |
| **F. GDPR** | 2 | HIGH | Download link not visible; Deletion email not received |
| **G. Admin** | 6+ areas | HIGH / MEDIUM | Role change UI; Feature flags seed; Payment admin; Newsletter |
| **H. Security** | 1 | HIGH | CSRF not implemented |
| **I. Error handling** | 2 | MEDIUM | Offline / API timeout (may already be fixed) |

---

## Category A: Authentication & Validation

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **1.1.5** Email Format Validation | **PASS** | Backend 400 for invalid email; frontend Zod + onBlur reject `invalid-email` | — | Done (Fix #13). Backend: validators.email; frontend: z.string().email(); tests in auth.test.ts, Login.test.tsx, Register.test.tsx. |
| **1.3** Password Reset Flow | **PASS** | Verified working 100%; 1.3.1–1.3.3, 1.3.5 pass | — | Complete (Fix #4). |

---

## Category B: MFA (TOTP, Email MFA, Disable)

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **3.1.1** Enable TOTP MFA | FAIL | No field to enter verification code; copy backup codes not functional | CRITICAL | Add verification code input + "Verify and Enable" in TOTP setup UI; fix "Copy backup codes" (single/copy-all). |
| **3.1.2** Enable TOTP – Invalid Code | FAIL | No field; cannot test invalid code | CRITICAL | Same as 3.1.1 (unblocked by verification field). |
| **3.2** Login with MFA | FAIL | — | HIGH | Ensure MFA step and TOTP/backup inputs appear after password (see MANUAL-005). |
| **3.2.2** Login with Backup Code | FAIL | — | HIGH | Verify backup code path in login flow and API. |
| **3.3** Email MFA | FAIL | Verification code not sent to email; cannot enable Email MFA | HIGH | Check email transport and "Email MFA" code-send path; show clear error if email not configured. |
| **3.3.2** Login with Email MFA | FAIL | — | HIGH | Depends on Email MFA enable + OTP delivery. |
| **3.4** Disable MFA | FAIL | No option to disable MFA in UI | CRITICAL | Ensure "Disable MFA" is visible when MFA is on (see MANUAL-005); fix conditional rendering if needed. |

---

## Category C: OAuth

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **4.3.1** Microsoft OAuth | Deferred | Won’t implement | — | Intentionally deferred; not in scope. |

---

## Category D: Payment (Stripe IntegrationError / Page Crash)

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **5.1** Create Payment | FAIL | Payment page fails when amount is 0 or empty; IntegrationError – amount must be > 0 | CRITICAL | Validate amount > 0 (and non-empty) before calling Stripe; show validation error in UI; prevent submission. |
| **5.1.2** Complete Payment – Stripe Success | FAIL | Page crashed | CRITICAL | Fix crash (likely same as 5.1 or uncaught Stripe error); add error boundary and user-facing message. |
| **5.1.3** Payment Declined | FAIL | Page crashes with Stripe IntegrationError; unable to check | CRITICAL | Handle Stripe errors (decline, integration) without crashing; show "Payment declined" or generic error. |
| **5.2** Payment History | FAIL | History page crashes with Stripe IntegrationError when clicking History | CRITICAL | Isolate Stripe usage on History (read-only list); fix API/error handling so History loads without creating intent. |
| **5.2.2** Filter Payments by Status | FAIL | Blocked by History crash | HIGH | Unblock after 5.2 fixed. |
| **5.3** Payment Refund (Admin) | FAIL | No payments found | HIGH | Ensure admin payments API and list work; "No payments" may be data/seed; refund UI per MANUAL-003. |
| **5.3.1** Process Refund | **PASS** | Refund action added in admin payments list | — | Complete (Fix #7). |
| **5.4** Payment Webhooks | FAIL | Blocked – payment creation not fully functional; webhook not configured | HIGH | After 5.1–5.2 stable: configure Stripe webhook endpoint and verify signature handling. |

---

## Category E: Notifications

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **6.3.1** Receive Email Notification | **PASS** | — | HIGH | Done (Fix #11). Backend now sends EMAIL channel for password reset success, profile updated, payment initiated, payment successful (in addition to IN_APP); respects user preference emailEnabled. Resend sandbox limits apply (see DEMO_CREDENTIALS). |

---

## Category F: GDPR

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **7.1.2** Download Exported Data | **PASS** | Download button visible when COMPLETED; credentialed fetch for cross-origin | — | Done (Fix #8). See "Solutions implemented" §6. |
| **7.2** Data Deletion | **PASS** | Confirmation email sent when user requests deletion (link to confirm) | — | Done (Fix #15). sendDataDeletionRequestConfirmationEmail + template data-deletion-request-confirmation.hbs; gdprService.requestDataDeletion calls it; link: frontendUrl/gdpr?confirmDeletion=token. |

---

## Category G: Admin Panel

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **8.2.6** Change User Role (Super Admin) | **PASS** | Only Super Admin can change role; Admin sees read-only role | — | Done (Fix #9). See "Solutions implemented" §5. |
| **8.4** Feature Flags | **PASS** (after seed) | No feature flags in environment; cannot validate | MEDIUM | Done (Fix #14). Run `cd backend && npm run seed:feature-flags`; empty state shows command. |
| **8.4.2** Toggle Feature Flag | **PASS** (after seed) | No flags to toggle | MEDIUM | Same as 8.4. |
| **8.4.3** Create New Feature Flag | **PASS** (after seed) | No flags; create flow not tested | MEDIUM | Verify create flow once flags exist. |
| **8.5** Payment Management | FAIL | Payment page crashed; no subscriptions/data | CRITICAL | Same root cause as 5.2 (Stripe/API); fix so admin payments list loads without crash. |
| **8.5.1–8.5.3** View/Filter/Refund | FAIL | Blocked by crash | HIGH | After 8.5 fixed: verify list, filters, refund. |
| **8.6** Newsletter Management | **PASS** | Not available / NOT IMPLEMENTED | MEDIUM | Done (Fix #16). Newsletters link added to Admin sidebar; route `/admin/newsletters` and page exist. |

---

## Category H: Security

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **11.3.3** CSRF Protection | **PASS** | CSRF protection not implemented | HIGH | Done (Fix #10). Double-submit cookie: backend middleware validates X-CSRF-Token header against cookie on POST/PUT/PATCH/DELETE; GET /api/csrf-token returns token; frontend sends token on state-changing requests. Disabled when NODE_ENV=test. Unit tests: backend/src/__tests__/middleware/csrf.test.ts. |

---

## Category I: Error Handling (Network / Timeout)

| Test Case | Status | Tester Note | Classification | Fix Plan |
|-----------|--------|-------------|-----------------|----------|
| **12.2.1** Offline Handling | **PASS** | — | MEDIUM | Done (Fix #17). NetworkErrorBanner shows "You are offline" on browser offline; E2E: `tests/e2e/error-handling-network.focused.spec.ts`. |
| **12.2.2** API Timeout | **PASS** | — | MEDIUM | Done (Fix #17). Client timeout (VITE_API_TIMEOUT, default 10s); banner shows "Request timeout"; page does not crash. |

---

## Prioritized Fix Plan (Round 4)

### Phase 1 – Critical (unblock payment and MFA)

1. **Payment amount validation** – Validate amount > 0 and non-empty before Stripe; prevent page crash (5.1, 5.1.2, 5.1.3).
2. **Payment / History crash** – Fix Stripe IntegrationError handling so Payment and History pages never crash (5.2, 8.5).
3. **MFA TOTP verification field** – Add verification code input and "Verify and Enable" in TOTP setup (3.1.1, 3.1.2).
4. **Disable MFA in UI** – Ensure "Disable MFA" is visible and works when MFA is enabled (3.4).
5. **Password reset** – Confirm flow end-to-end; fix regression if any (1.3).

### Phase 2 – High

6. **Backup codes** – Fix "Copy backup codes" and backup-code login (3.1.1, 3.2.2).
7. **Email MFA** – Fix OTP send and enable flow; then login with Email MFA (3.3, 3.3.2).
8. **Admin refund UI** – Add Refund action for payments (5.3.1, 8.5.3).
9. **GDPR download link** – Show visible "Download" when export is COMPLETED (7.1.2).
10. **Admin role change** – Add Super Admin role change in user edit UI (8.2.6).
11. **CSRF** – Implement and verify CSRF protection (11.3.3).
12. **Email notifications** – Verify sending and preferences (6.3.1).
13. **Microsoft OAuth** – Deferred; not implementing (4.3.1).

### Phase 3 – Medium

14. **Email format validation** – Re-verify and fix if regressed (1.1.5).
15. **Feature flags seed** – Seed flags and document; verify toggle/create (8.4, 8.4.2, 8.4.3).
16. **Data deletion email** – Confirm deletion confirmation email (7.2).
17. **Newsletter UI** – Expose or implement (8.6).
18. **Network/offline and timeout** – Confirm MANUAL-016 behaviour (12.2.1, 12.2.2).

---

## Solutions implemented (reference for future fixes)

When the same issues come back, use this section to see what was done and where so you can re-apply or fix regressions.

### 1. Login "Invalid credentials" with demo users (encryption on)

**Symptom:** POST `/api/auth/login` returns 401 "Invalid credentials" with correct demo password. GET `/api/auth/me` returns 401 when not logged in (expected).

**Root cause:** With `ENCRYPTION_ENABLED=true`, the backend looks up users by **emailHash**, not plain email. Demo users must have `emailHash` set; if another seed or DB change overwrote users without `emailHash`, login fails.

**Solution:**

- **Auth service** uses explicit email lookup when encryption is on: `findUserByEncryptedEmail(prisma, email)` from `backend/src/middleware/encryptionMiddleware.ts` for **login**, **register** (existing-user check), and **forgot-password** (find user). Do **not** replace these with raw `prisma.user.findUnique({ where: { email } })` or login will fail.
- **Demo users:** Run `cd backend && npm run seed:demo-users` to set `emailHash` and passwords. Re-run after any DB reset or seed that recreates users without `emailHash`.
- **Docs:** `project_documentation/05-api-reference/AUTHENTICATION.md` → "End-to-End Auth Flow" and "Quick Troubleshooting"; `docs/DEMO_CREDENTIALS.md` → "If login returns Invalid credentials".

**Files:** `backend/src/services/authService.ts` (import `findUserByEncryptedEmail`, use it in login/register/forgot-password); `backend/prisma/seed.demo-users.ts` (sets `emailHash`).

---

### 2. Refund: "Nothing happens" or "Internal server error"

**Symptom:** Click Refund → OK; no feedback, or toast "Refund failed - Internal server error".

**Root cause:** (a) No success/error toasts so user sees nothing; (b) backend returns 500 when refund fails (e.g. demo payment has fake `providerPaymentId`, Stripe returns error).

**Solution:**

- **Frontend:** Show toasts: on success "Refund processed", on error show `err.response?.data?.error` or message. Disable Refund button while `refundMutation.isPending`. File: `frontend/src/pages/admin/AdminPayments.tsx` (useToast, onSuccess/onError).
- **Backend:** Validate `providerPaymentId` exists before calling provider; if missing, return 400 with message like "Payment has no provider payment ID (e.g. demo or manual record)." Catch provider (Stripe) errors and return 400 with provider message instead of 500. File: `backend/src/services/paymentService.ts` → `refundPaymentAsAdmin`: check `payment.providerPaymentId`; in catch, if not AppError throw `new AppError(error?.message ?? '...', 400)`.
- **Demo payments:** Refund on seed payments (e.g. `pi_demo_001`) will always return 400; use Stripe Checkout (test/live) for a real payment to test full refund.

**Files:** `frontend/src/pages/admin/AdminPayments.tsx`; `backend/src/services/paymentService.ts`.

---

### 3. GitHub OAuth error (e.g. redirect_uri_mismatch, exchange fails)

**Symptom:** After GitHub redirect, "OAuth Error" or "Failed to exchange GitHub code".

**Root cause:** Token exchange must send the same **redirect_uri** as the authorize step. Frontend uses `${origin}/oauth/github/callback`; backend was not sending `redirect_uri` when exchanging the code.

**Solution:** In `backend/src/routes/auth.ts`, POST `/oauth/github/exchange`: send `redirect_uri: ${config.frontendUrl}/oauth/github/callback` in the body when calling `https://github.com/login/oauth/access_token`. Ensure GitHub OAuth app callback URL matches (e.g. `http://localhost:3000/oauth/github/callback`). Return GitHub `error` / `error_description` in API response so the UI can show the real message.

**Files:** `backend/src/routes/auth.ts` (github exchange handler).

---

### 4. OAuth "Invalid auth state" / "Authentication failed" but user is logged in

**Symptom:** After GitHub/Google callback, error toast "Invalid OAuth state" or "Authentication failed", then user ends up logged in anyway.

**Root cause:** The callback `useEffect` runs twice (e.g. React StrictMode or double mount). First run: reads code/state, clears `sessionStorage` (e.g. `github_oauth_state`), exchanges code, logs in. Second run: stored state already cleared, so `state !== storedState` → throw "Invalid OAuth state" → show error toast even though first run succeeded.

**Solution:** Run the callback logic only once with a ref. In `frontend/src/pages/OAuthCallback.tsx`: add `const hasRunRef = useRef(false);` and at the start of the effect do `if (hasRunRef.current) return; hasRunRef.current = true;` before calling `handleCallback()`.

**Files:** `frontend/src/pages/OAuthCallback.tsx`.

---

### 5. GDPR download link not visible (7.1.2)

**Symptom:** No visible download link on Data Export page when export status is COMPLETED.

**Root cause:** (a) Backend had no GET `/api/gdpr/exports/:id/download` route, so the stored `downloadUrl` returned 404 when clicked. (b) Frontend used `<a href={downloadUrl}>` with a relative path; when API is on a different origin (e.g. frontend 3000, API 3001), the link went to the frontend origin and cookies were not sent for cross-origin. (c) Operator precedence bug: PENDING/PROCESSING message used `||` without parentheses so the message could show incorrectly.

**Solution:**

- **Backend:** Add `getExportDataForDownload(requestId, userId)` in `backend/src/services/gdprService.ts`: find request, validate ownership (403 if not owner), status COMPLETED (400 if not), not expired (410 if expired). Build export JSON (same structure as generateDataExport) and return string. Add GET `/api/gdpr/exports/:id/download` in `backend/src/routes/gdpr.ts`: call service, set `Content-Type: application/json` and `Content-Disposition: attachment; filename="data-export-{id}.json"`, send JSON.
- **Frontend:** In `frontend/src/components/gdpr/DataExport.tsx`: (1) Use a **Button** that triggers download via `fetch(url, { credentials: 'include' })` so cookies are sent when API is on another origin; build full URL with `apiBaseUrl` (VITE_API_BASE_URL) + `downloadUrl`. (2) Add `data-testid="export-download-section"` for the COMPLETED download block. (3) Fix PENDING/PROCESSING conditional: `(latestExport.status === 'PENDING' || latestExport.status === 'PROCESSING')`. (4) In Export History, show a Download button for each COMPLETED export.
- **Tests:** Backend: `backend/src/__tests__/routes/gdpr.export.download.test.ts` (401, 404, 403, 410, 400, 200). Frontend: update DataExport test to expect button (not link) and `export-download-section`.

**Files:** `backend/src/services/gdprService.ts` (getExportDataForDownload); `backend/src/routes/gdpr.ts` (GET exports/:id/download); `frontend/src/components/gdpr/DataExport.tsx`; `backend/src/__tests__/routes/gdpr.export.download.test.ts`; `frontend/src/__tests__/components/DataExport.test.tsx`.

**Where to test 7.1.2 (GDPR download) manually:**  
- **Option A (GDPR Settings – recommended for download button):** Log in → go to **http://localhost:3000/gdpr** (or Profile → GDPR / Cookie settings). Use the **Data Export** section; when an export is **COMPLETED**, click the **Download** button (credentialed fetch). Export History also has a Download button per completed export.  
- **Option B (Privacy Center):** Log in → **Dashboard** → **Privacy Center** (or **http://localhost:3000/privacy-center**) → click the **Data Export** tab in the left nav. Request an export; when **COMPLETED**, use the Download control there.

---

### 6. Admin can edit users and change role (should be Super Admin only)

**Symptom:** Logged in as **Admin** (not Super Admin); can change another user’s role in Edit User modal. Per requirements, only **Super Admin** may change roles.

**Root cause:** Backend already restricted role change on update (only SUPER_ADMIN); frontend showed role dropdown to all admins and sent `role` in update. Create user did not restrict role on backend.

**Solution:**

- **Frontend:** In `frontend/src/pages/admin/AdminUsers.tsx`: get current user with `useAuth()`, set `canChangeRole = currentUser?.role === 'SUPER_ADMIN'`. Pass `canChangeRole` to Create and Edit modals. When `!canChangeRole`: hide role dropdown, show read-only text "User (only Super Admin can set role)" or "{user.role} (only Super Admin can change role)". On Edit submit, omit `role` from payload when `!canChangeRole`. Create modal: when `!canChangeRole` default to USER and don’t show role dropdown.
- **Backend:** `backend/src/services/adminUserService.ts`: In **updateUser**, role change already gated by SUPER_ADMIN. In **createUser**, if `data.role` is ADMIN or SUPER_ADMIN, require admin is SUPER_ADMIN else throw `ForbiddenError('Only SUPER_ADMIN can create users with Admin or Super Admin role')`.

**Files:** `frontend/src/pages/admin/AdminUsers.tsx` (useAuth, canChangeRole, CreateUserModal, EditUserModal); `backend/src/services/adminUserService.ts` (createUser role check).

---

### 7. Email format validation (1.1.5)

**Symptom:** System accepts invalid email `invalid-email` and form submits.

**Root cause:** Backend and frontend already had validation (validators.email, z.string().email()); manual test may have hit a regression or different path. Tests were strengthened to lock in behaviour.

**Solution:** Backend: `validators.email` (express-validator `.isEmail()`) on login and register returns 400 for invalid format. Frontend: Login and Register use `z.string().email('Invalid email address')` and `mode: 'onBlur'`; invalid email shows error and does not submit. Tests: `backend/src/__tests__/auth.test.ts` — "should reject invalid email format (1.1.5)" for register and "should reject invalid email format on login (1.1.5)" for login; frontend Login.test.tsx and Register.test.tsx already have "should validate email format" with `invalid-email`.

**Files:** `backend/src/middleware/validation.ts` (validators.email); `backend/src/routes/auth.ts` (validate on login/register); `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx` (zod schema); `backend/src/__tests__/auth.test.ts`.

---

### 8. Data deletion email (7.2)

**Symptom:** Confirmation email not received when user requests data deletion.

**Root cause:** `gdprService.requestDataDeletion` created the deletion request and returned a confirmation URL but did **not** send an email. The email service had `sendDataDeletionConfirmationEmail` (sent *after* deletion is executed) but no email for the *request* (link to confirm).

**Solution:** Added `sendDataDeletionRequestConfirmationEmail` in `backend/src/services/emailService.ts` (params: to, name?, confirmationLink). New template `backend/src/templates/emails/data-deletion-request-confirmation.hbs` with subject "Confirm your data deletion request" and a "Confirm Deletion" button/link. In `gdprService.requestDataDeletion`: after creating the deletion request, load user (email, name), build `confirmationLink = frontendUrl/gdpr?confirmDeletion={token}`, call `sendDataDeletionRequestConfirmationEmail`. If email fails, log and continue (request is still created). Tests: `gdprService.test.ts` — "should send confirmation email when deletion is requested (7.2)"; `emailService.test.ts` — "should send data deletion request confirmation email (7.2)".

**Files:** `backend/src/services/emailService.ts` (sendDataDeletionRequestConfirmationEmail); `backend/src/templates/emails/data-deletion-request-confirmation.hbs`; `backend/src/services/gdprService.ts` (requestDataDeletion); `backend/src/__tests__/gdprService.test.ts`; `backend/src/__tests__/emailService.test.ts`.

---

## Mapping to Existing Issues (ISSUES_LOG.md)

- **1.1.5** → MANUAL-010 (email validation) – verify no regression.
- **1.3** → MANUAL-002 (password reset) – verify no regression.
- **3.x MFA** → MANUAL-005 (MFA) – verification field and disable still to fix.
- **4.3** → Microsoft OAuth – deferred (won’t implement).
- **5.x Payment** → MANUAL-003 (payment UI) – new: amount validation and crash handling.
- **7.1.2, 7.2** → MANUAL-004 (GDPR) – download link visibility and deletion email.
- **8.2.6** → New: role change UI.
- **8.4** → MANUAL-012 (feature flags) – seed and empty state.
- **8.5** → Same as payment crash (5.2).
- **11.3.3** → MANUAL-009 (CSRF) – implementation still required.
- **12.2** → MANUAL-016 (network errors) – verify implementation.

---

## Recommended Next Steps

1. **Reproduce** – Run app with Stripe test mode; reproduce payment page crash (0/empty amount) and History crash.
2. **TDD** – Add/update E2E or unit tests for: amount validation, payment/History error handling, MFA verification field, disable MFA visibility.
3. **Fix in order** – Phase 1 first (payment + MFA), then Phase 2, then Phase 3.
4. **Re-test** – Re-run manual test cases from "manual testing - 4" after each phase.
5. **Update ISSUES_LOG** – For each fix: add or update issue entry in `ISSUES_LOG.md` with root cause and resolution (per project rules).
