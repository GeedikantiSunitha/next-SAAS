# Scripts Directory

This directory contains utility scripts for the NextSaaS backend.

## Available Scripts

### `test-email-resend.ts`

Tests if the Resend API key is valid by sending a test email to Resend's test inbox.

**Usage:**

Test with Resend's test inbox (recommended for template testing):
```bash
cd backend
npm run test:email
```

Test with a real email address:
```bash
cd backend
npm run test:email your-email@example.com
```

Or directly:
```bash
cd backend
npx tsx scripts/test-email-resend.ts
npx tsx scripts/test-email-resend.ts your-email@example.com
```

**What it does:**
1. Loads `RESEND_API_KEY` and `FROM_EMAIL` from `.env`
2. Sends a test email to `delivered@resend.dev` (Resend's test inbox)
3. Reports if the API key is valid or if there are any errors

**What it helps diagnose:**
- ✅ If API key is valid → Email will be sent successfully
- ❌ If API key is invalid → You'll see an error message
- ⚠️ If domain verification is needed → Email works to test inbox but not to real addresses

**Expected Results:**

**Success (API Key Valid):**
```
✅ SUCCESS! Email sent successfully!
📬 Email Details:
   Email ID: abc123...
   To: delivered@resend.dev
   From: onboarding@resend.dev
```

**Error (API Key Invalid):**
```
❌ ERROR: Resend API returned an error:
   Invalid API key
```

**Notes:**
- Test emails to `delivered@resend.dev` work with `onboarding@resend.dev` (no domain verification needed)
- For real email addresses, you need to verify your domain in Resend dashboard
- Check your Resend dashboard: https://resend.com/domains
