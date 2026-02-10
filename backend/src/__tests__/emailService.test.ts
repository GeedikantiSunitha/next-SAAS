/**
 * Email Service Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 */

import * as emailService from '../services/emailService';
import { Resend } from 'resend';

// Mock Resend
jest.mock('resend');

describe('Email Service', () => {
  const originalEnv = process.env.RESEND_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set a valid API key for tests
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    // Restore original env
    process.env.RESEND_API_KEY = originalEnv;
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendWelcomeEmail({
        to: 'user@example.com',
        name: 'John Doe',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Welcome'),
        })
      );
    });

    it('should use default name if not provided', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendWelcomeEmail({
        to: 'user@example.com',
      });

      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error if Resend fails', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Resend API error'));
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await expect(
        emailService.sendWelcomeEmail({
          to: 'user@example.com',
          name: 'John Doe',
        })
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with token', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendVerificationEmail({
        to: 'user@example.com',
        name: 'John Doe',
        token: 'verification-token-123',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Verify'),
        })
      );
    });

    it('should include verification URL in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendVerificationEmail({
        to: 'user@example.com',
        name: 'John',
        token: 'token123',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('token123');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with token', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        name: 'John Doe',
        token: 'reset-token-123',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Reset'),
        })
      );
    });

    it('should include reset URL in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        name: 'John',
        token: 'reset123',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('reset123');
    });
  });

  describe('sendNotificationEmail', () => {
    it('should send custom notification email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendNotificationEmail({
        to: 'user@example.com',
        subject: 'Test Notification',
        title: 'Important Update',
        message: 'This is a test message',
        name: 'John',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Notification',
        })
      );
    });

    it('should support action button in notification', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendNotificationEmail({
        to: 'user@example.com',
        subject: 'Test',
        title: 'Test',
        message: 'Message',
        name: 'John',
        actionUrl: 'https://example.com',
        actionText: 'Click Here',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('https://example.com');
      expect(callArgs.html).toContain('Click Here');
    });
  });

  describe('renderTemplate', () => {
    it('should render template with data', () => {
      const html = emailService.renderTemplate('welcome', {
        name: 'John',
        email: 'john@example.com',
        appName: 'TestApp',
        year: 2025,
      });

      expect(html).toContain('John');
      expect(html).toContain('j***@example.com'); // Email should be masked
      expect(html).toContain('TestApp');
    });

    it('should escape HTML in user input', () => {
      const html = emailService.renderTemplate('notification', {
        name: '<script>alert("xss")</script>',
        message: '<img src=x onerror=alert(1)>',
        appName: 'TestApp',
        title: 'Test',
        year: 2025,
      });

      expect(html).not.toContain('<script>alert');
      expect(html).not.toContain('onerror=alert'); // Should not have executable XSS
      expect(html).toContain('&lt;'); // Should be escaped
      expect(html).toContain('&gt;'); // Should be escaped
    });

    it('should throw error for invalid template', () => {
      expect(() => {
        emailService.renderTemplate('non-existent', {});
      }).toThrow();
    });
  });

  /**
   * GDPR Email Templates (TDD)
   * Following TDD: Write tests FIRST, then implement
   */
  describe('sendDataExportReadyEmail', () => {
    it('should send data export ready email with download link', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendDataExportReadyEmail({
        to: 'user@example.com',
        name: 'John Doe',
        downloadUrl: 'https://example.com/download/data-export-123.zip',
        expiresAt: new Date('2026-02-01'),
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Data Export Ready'),
        })
      );
    });

    it('should include download URL in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendDataExportReadyEmail({
        to: 'user@example.com',
        name: 'John',
        downloadUrl: 'https://example.com/download/data-export-123.zip',
        expiresAt: new Date('2026-02-01'),
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('https://example.com/download/data-export-123.zip');
    });

    it('should include expiration date in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      const expiresAt = new Date('2026-02-01');
      await emailService.sendDataExportReadyEmail({
        to: 'user@example.com',
        name: 'John',
        downloadUrl: 'https://example.com/download/data.zip',
        expiresAt,
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('7 days'); // Should mention expiration period
    });

    it('should use default name if not provided', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendDataExportReadyEmail({
        to: 'user@example.com',
        downloadUrl: 'https://example.com/download/data.zip',
        expiresAt: new Date('2026-02-01'),
      });

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('sendDataDeletionRequestConfirmationEmail', () => {
    it('should send data deletion request confirmation email (7.2)', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendDataDeletionRequestConfirmationEmail({
        to: 'user@example.com',
        name: 'John Doe',
        confirmationLink: 'http://localhost:3000/gdpr?confirmDeletion=abc123',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Confirm your data deletion'),
        })
      );
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toMatch(/Confirm.*Deletion|confirmation|confirm/i);
    });
  });

  describe('sendDataDeletionConfirmationEmail', () => {
    it('should send data deletion confirmation email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendDataDeletionConfirmationEmail({
        to: 'user@example.com',
        name: 'John Doe',
        deletedAt: new Date('2026-01-20'),
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Account Deleted'),
        })
      );
    });

    it('should include deletion date in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      const deletedAt = new Date('2026-01-20');
      await emailService.sendDataDeletionConfirmationEmail({
        to: 'user@example.com',
        name: 'John',
        deletedAt,
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toMatch(/January 20, 2026|2026-01-20/); // Should include date
    });

    it('should list what data was deleted', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendDataDeletionConfirmationEmail({
        to: 'user@example.com',
        name: 'John',
        deletedAt: new Date('2026-01-20'),
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('account'); // Should mention account deletion
      expect(callArgs.html).toContain('personal data'); // Should mention data deletion
    });

    it('should use default name if not provided', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendDataDeletionConfirmationEmail({
        to: 'user@example.com',
        deletedAt: new Date('2026-01-20'),
      });

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('sendConsentUpdateEmail', () => {
    it('should send consent update confirmation email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendConsentUpdateEmail({
        to: 'user@example.com',
        name: 'John Doe',
        consents: {
          analytics: true,
          marketing: false,
          functional: true,
        },
        updatedAt: new Date('2026-01-20'),
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Privacy Preferences Updated'),
        })
      );
    });

    it('should list consent preferences in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendConsentUpdateEmail({
        to: 'user@example.com',
        name: 'John',
        consents: {
          analytics: true,
          marketing: false,
          functional: true,
        },
        updatedAt: new Date('2026-01-20'),
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('Analytics'); // Should list analytics
      expect(callArgs.html).toContain('Marketing'); // Should list marketing
      expect(callArgs.html).toContain('Functional'); // Should list functional
    });

    it('should show consent status (enabled/disabled)', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendConsentUpdateEmail({
        to: 'user@example.com',
        name: 'John',
        consents: {
          analytics: true,
          marketing: false,
          functional: true,
        },
        updatedAt: new Date('2026-01-20'),
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toMatch(/enabled|accepted|✓/i); // Should show enabled status
      expect(callArgs.html).toMatch(/disabled|rejected|✗/i); // Should show disabled status
    });

    it('should include link to manage preferences', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendConsentUpdateEmail({
        to: 'user@example.com',
        name: 'John',
        consents: {
          analytics: true,
          marketing: false,
          functional: true,
        },
        updatedAt: new Date('2026-01-20'),
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('/gdpr'); // Should link to GDPR settings
    });

    it('should use default name if not provided', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendConsentUpdateEmail({
        to: 'user@example.com',
        consents: {
          analytics: true,
          marketing: false,
          functional: true,
        },
        updatedAt: new Date('2026-01-20'),
      });

      expect(mockSend).toHaveBeenCalled();
    });
  });
});

