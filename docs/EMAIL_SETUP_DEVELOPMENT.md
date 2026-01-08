# Email Setup for Development/Testing (Template Use)

This guide explains how to set up email functionality for **development and testing** of the NextSaaS template **without requiring a domain**.

---

## ✅ Quick Start (No Domain Required)

For template testing and development, you can use Resend's test domain which **doesn't require domain verification**.

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com) (free account works)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy the key (starts with `re_...`)

### 2. Configure Environment Variables

Add to `backend/.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev
```

**Note**: `onboarding@resend.dev` is Resend's test domain - no verification needed!

### 3. Test Email Setup

Run the test script:

```bash
cd backend
npm run test:email
```

This will send a test email to `delivered@resend.dev` (Resend's test inbox).

### 4. View Test Emails

- Go to [Resend Emails](https://resend.com/emails)
- You'll see all emails sent to `delivered@resend.dev`
- Perfect for testing without setting up a domain!

---

## 📧 How It Works

### Test Emails (No Domain Required)

- **From**: `onboarding@resend.dev` (Resend's test domain)
- **To**: `delivered@resend.dev` (Resend's test inbox)
- **Status**: ✅ Works immediately, no setup needed
- **Use Case**: Perfect for template testing and development

### Real Email Addresses

When sending to real email addresses (e.g., `user@gmail.com`):

**Option 1: Use Test Domain (Limited)**
- `onboarding@resend.dev` → Real addresses
- ⚠️ May have restrictions or rate limits
- ⚠️ Emails may go to spam
- ✅ Works for basic testing

**Option 2: Verify Domain (Recommended for Production)**
- Verify your domain in Resend dashboard
- Update `FROM_EMAIL` to use your domain
- ✅ Better deliverability
- ✅ Professional appearance
- ✅ No rate limits

---

## 🧪 Testing Email Functionality

### Test 1: Verify API Key Works

```bash
cd backend
npm run test:email
```

**Expected Result:**
```
✅ SUCCESS! Email sent successfully!
📬 Email Details:
   Email ID: abc123...
   To: delivered@resend.dev
```

### Test 2: Test with Real Email Address

```bash
cd backend
npm run test:email your-email@example.com
```

**What This Tests:**
- If API key is valid ✅
- If domain verification is needed ⚠️
- If emails can be sent to real addresses

**If It Fails:**
- Error will indicate if domain verification is needed
- For template testing, use `delivered@resend.dev` instead

### Test 3: Test Password Reset Flow

1. Start the backend: `npm run dev`
2. Go to frontend: `http://localhost:3000`
3. Click "Forgot Password"
4. Enter `delivered@resend.dev` as email
5. Check [Resend Emails](https://resend.com/emails) for the reset link

---

## 🎯 Template Development Workflow

### For Template Testing (Recommended)

1. **Use Test Email Address**: `delivered@resend.dev`
   - No domain setup required
   - Works immediately
   - View emails in Resend dashboard

2. **Configure .env**:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   FROM_EMAIL=onboarding@resend.dev
   ```

3. **Test All Email Features**:
   - Registration emails → Use `delivered@resend.dev`
   - Password reset → Use `delivered@resend.dev`
   - MFA OTP → Use `delivered@resend.dev`
   - All emails appear in Resend dashboard

### For Production/Real Users

1. **Verify Domain**:
   - Go to [Resend Domains](https://resend.com/domains)
   - Add your domain (e.g., `yourdomain.com`)
   - Follow DNS setup instructions (SPF, DKIM)

2. **Update .env**:
   ```env
   FROM_EMAIL=noreply@yourdomain.com
   ```

3. **Test**:
   ```bash
   npm run test:email user@real-email.com
   ```

---

## ❓ FAQ

### Q: Do I need a domain to test the template?

**A**: No! Use `delivered@resend.dev` as the test email address. No domain setup needed.

### Q: Can I send to real email addresses without domain verification?

**A**: You can try, but:
- May have rate limits
- Emails may go to spam
- Not recommended for production

### Q: How do I view test emails?

**A**: Go to [Resend Emails](https://resend.com/emails) - all emails sent to `delivered@resend.dev` appear there.

### Q: The template isn't sending emails to real addresses. Why?

**A**: For real addresses, you need to verify your domain. For template testing, use `delivered@resend.dev`.

### Q: Is `onboarding@resend.dev` free?

**A**: Yes! Resend's test domain is free and perfect for development/testing.

---

## 🔍 Troubleshooting

### Email Not Sending

1. **Check API Key**:
   ```bash
   npm run test:email
   ```
   If this fails, your API key is invalid.

2. **Check Logs**:
   Look for errors in backend logs:
   ```
   Failed to send email
   ```

3. **Check Resend Dashboard**:
   - Go to [Resend Emails](https://resend.com/emails)
   - Check if email was sent
   - Check for any error messages

### Emails Going to Spam

- This is normal for test domain (`onboarding@resend.dev`)
- For production, verify your domain for better deliverability

### Domain Verification Errors

- For template testing: Use `delivered@resend.dev` (no domain needed)
- For production: Verify domain in Resend dashboard

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Keys](https://resend.com/api-keys)
- [Resend Domains](https://resend.com/domains)
- [Resend Emails (Test Inbox)](https://resend.com/emails)

---

## ✅ Summary

**For Template Development/Testing:**
- ✅ Use `onboarding@resend.dev` as FROM_EMAIL
- ✅ Use `delivered@resend.dev` as test recipient
- ✅ No domain setup required
- ✅ View emails in Resend dashboard

**For Production:**
- ⚠️ Verify your domain in Resend
- ⚠️ Update FROM_EMAIL to use your domain
- ✅ Better deliverability and professional appearance

---

**The template is designed to work out of the box for testing without any domain setup!** 🎉
