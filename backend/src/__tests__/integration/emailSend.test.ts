/**
 * Email Send Integration Test
 * 
 * This test actually sends an email using the configured Resend API key
 * to verify the email service is working correctly.
 * 
 * Note: This test requires RESEND_API_KEY to be configured in .env
 */

import * as emailService from '../../services/emailService';
import config from '../../config';

describe('Email Send Integration Test', () => {
  // Skip if API key not configured
  const apiKey = process.env.RESEND_API_KEY || config.email.apiKey;
  const isConfigured = !!(
    apiKey &&
    apiKey !== 'your-resend-api-key-here' &&
    apiKey.startsWith('re_')
  );

  beforeAll(() => {
    if (!isConfigured) {
      console.warn('⚠️  RESEND_API_KEY not configured, skipping email integration test');
    }
  });

  it('should send password reset email with real Resend API', async () => {
    if (!isConfigured) {
      console.log('Skipping test - RESEND_API_KEY not configured');
      return;
    }

    // Use a test email address - Resend test domain works for testing
    const testEmail = process.env.TEST_EMAIL || 'delivered@resend.dev';
    const testToken = 'test-reset-token-123456789';

    console.log(`📧 Attempting to send test email to: ${testEmail}`);

    try {
      const result = await emailService.sendPasswordResetEmail({
        to: testEmail,
        name: 'Test User',
        token: testToken,
      });

      // Verify result
      expect(result).toBeDefined();
      
      // Resend API returns { data: { id: ... } } or { id: 'mock-email-id' }
      const emailId = 'data' in result && result.data ? result.data.id : (result as any).id;
      expect(emailId).toBeDefined();
      expect(emailId).not.toBe('mock-email-id');

      console.log(`✅ Email sent successfully! Email ID: ${emailId}`);
      console.log(`📬 Check ${testEmail} for the password reset email`);
    } catch (error: any) {
      console.error('❌ Failed to send email:', error.message);
      throw error;
    }
  }, 30000); // 30 second timeout for API call

  it('should verify email configuration in health check', () => {
    expect(isConfigured).toBe(true);
    expect(config.email.apiKey).toBeTruthy();
    expect(config.email.fromEmail).toBeTruthy();
    console.log(`✅ Email configured - From: ${config.email.fromEmail}`);
  });
});
