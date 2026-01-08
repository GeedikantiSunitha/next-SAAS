/**
 * Test Email Sending with Resend
 * 
 * This script tests if the Resend API key is valid by sending a test email
 * to Resend's test inbox (delivered@resend.dev).
 * 
 * Usage:
 *   cd backend
 *   npx tsx scripts/test-email-resend.ts
 * 
 * This will help diagnose:
 * - If API key is valid
 * - If domain verification is the issue
 * - If emails are being sent successfully
 */

import dotenv from 'dotenv';
import { Resend } from 'resend';
import path from 'path';

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Get API key and FROM_EMAIL from environment
const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

console.log('='.repeat(60));
console.log('Resend Email Test');
console.log('='.repeat(60));
console.log('');

// Check if API key is set
if (!apiKey) {
  console.error('❌ ERROR: RESEND_API_KEY is not set in .env file');
  console.log('');
  console.log('Please add RESEND_API_KEY to your backend/.env file:');
  console.log('RESEND_API_KEY=re_xxxxxxxxxxxxx');
  process.exit(1);
}

// Check if API key looks valid (starts with 're_')
if (!apiKey.startsWith('re_')) {
  console.warn('⚠️  WARNING: API key does not start with "re_"');
  console.log(`   Current key starts with: "${apiKey.substring(0, 5)}..."`);
  console.log('');
}

console.log('📋 Configuration:');
console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`   From Email: ${fromEmail}`);
console.log(`   Test Email: delivered@resend.dev`);
console.log('');

// Initialize Resend client
const resend = new Resend(apiKey);

// Wrap in async function to support top-level await
(async () => {
  console.log('📧 Sending test email...');
  console.log('');

  try {
  const result = await resend.emails.send({
    from: fromEmail,
    to: 'delivered@resend.dev',
    subject: 'Test Email from NextSaaS - API Key Verification',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .success {
              color: #10b981;
              font-weight: bold;
            }
            .info {
              background-color: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 12px;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Test Email Successful!</h1>
          </div>
          <div class="content">
            <p>This is a test email from <strong>NextSaaS</strong> to verify that your Resend API key is working correctly.</p>
            
            <div class="info">
              <strong>Test Details:</strong><br>
              • API Key: Valid ✅<br>
              • From Email: ${fromEmail}<br>
              • Sent At: ${new Date().toISOString()}<br>
              • Test Type: API Key Verification
            </div>
            
            <p class="success">If you received this email, your Resend API key is valid and working!</p>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>If you received this email → Your API key is valid ✅</li>
              <li>If you're not receiving emails to real addresses → You need to verify your domain in Resend dashboard</li>
              <li>If this email failed → Check your API key in Resend dashboard</li>
            </ul>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #6b7280;">
              This is an automated test email. You can safely ignore it.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Test Email from NextSaaS - API Key Verification

This is a test email to verify that your Resend API key is working correctly.

Test Details:
• API Key: Valid ✅
• From Email: ${fromEmail}
• Sent At: ${new Date().toISOString()}
• Test Type: API Key Verification

If you received this email, your Resend API key is valid and working!

Next Steps:
- If you received this email → Your API key is valid ✅
- If you're not receiving emails to real addresses → You need to verify your domain in Resend dashboard
- If this email failed → Check your API key in Resend dashboard

This is an automated test email. You can safely ignore it.
    `,
  });

  // Check if there's an error in the result
  if ('error' in result && result.error) {
    console.error('❌ ERROR: Resend API returned an error:');
    console.error(`   ${result.error.message}`);
    console.log('');
    
    // Provide helpful error messages
    if (result.error.message.includes('Invalid API key') || result.error.message.includes('Unauthorized')) {
      console.log('💡 This means your API key is invalid or expired.');
      console.log('   Please check your API key in the Resend dashboard:');
      console.log('   https://resend.com/api-keys');
    } else if (result.error.message.includes('domain') || result.error.message.includes('Domain')) {
      console.log('💡 This might be a domain verification issue.');
      console.log('   For test emails to delivered@resend.dev, you can use onboarding@resend.dev');
      console.log('   For real emails, you need to verify your domain in Resend.');
    } else {
      console.log('💡 Check the Resend dashboard for more details:');
      console.log('   https://resend.com/emails');
    }
    
    process.exit(1);
  }

  // Success!
  if ('data' in result && result.data) {
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('');
    console.log('📬 Email Details:');
    console.log(`   Email ID: ${result.data.id}`);
    console.log(`   To: delivered@resend.dev`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Subject: Test Email from NextSaaS - API Key Verification`);
    console.log('');
    console.log('🎉 Your Resend API key is valid and working!');
    console.log('');
    console.log('📋 What this means:');
    console.log('   ✅ Your API key is correct');
    console.log('   ✅ Resend API is accepting your requests');
    console.log('   ✅ Email sending functionality is working');
    console.log('');
    console.log('⚠️  Important Notes:');
    console.log('   • Test emails to delivered@resend.dev work with onboarding@resend.dev');
    console.log('   • For real email addresses, you need to verify your domain in Resend');
    console.log('   • Go to https://resend.com/domains to verify your domain');
    console.log('   • Once verified, update FROM_EMAIL in .env to use your domain');
    console.log('');
    console.log('🔍 If you\'re still not receiving emails to real addresses:');
    console.log('   1. Check spam/junk folder');
    console.log('   2. Verify your domain in Resend dashboard');
    console.log('   3. Check Resend dashboard for delivery status');
    console.log('   4. Check backend logs for any errors');
    console.log('');
  } else {
    console.error('❌ Unexpected response from Resend API');
    console.error('   Response:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
} catch (error: any) {
  console.error('❌ ERROR: Failed to send test email');
  console.error('');
  console.error('Error details:');
  console.error(`   Message: ${error.message}`);
  if (error.stack) {
    console.error(`   Stack: ${error.stack}`);
  }
  console.log('');
  console.log('💡 Troubleshooting:');
  console.log('   1. Check if RESEND_API_KEY is correct in .env');
  console.log('   2. Verify API key in Resend dashboard: https://resend.com/api-keys');
  console.log('   3. Check your internet connection');
    console.log('   4. Check Resend service status: https://status.resend.com');
    process.exit(1);
  }
})();
