/**
 * MFA Email Setup Service Tests (TDD)
 * 
 * Tests to verify Email MFA setup automatically sends OTP.
 */

import { prisma } from '../../config/database';
import * as mfaService from '../../services/mfaService';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    mfaMethod: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('resend');
jest.mock('../../services/emailService', () => ({
  renderTemplate: jest.fn(() => '<html>OTP: {{otp}}</html>'),
}));
jest.mock('../../services/auditService', () => ({
  createAuditLog: jest.fn(),
}));

// Spy on sendEmailOtp
const sendEmailOtpSpy = jest.spyOn(mfaService, 'sendEmailOtp');

describe('MFA Email Setup - Auto-send OTP', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset spy implementation but keep the spy attached
    sendEmailOtpSpy.mockReset();
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.mfaMethod.upsert as jest.Mock).mockResolvedValue({
      id: 'mfa-123',
      userId: mockUser.id,
      method: 'EMAIL',
      isEnabled: false,
    });
    (prisma.mfaMethod.findUnique as jest.Mock).mockResolvedValue({
      id: 'mfa-123',
      userId: mockUser.id,
      method: 'EMAIL',
      isEnabled: false,
    });
  });

  afterAll(() => {
    // Only restore once after all tests complete
    sendEmailOtpSpy.mockRestore();
  });

  it('should automatically call sendEmailOtp after creating Email MFA method', async () => {
    // Mock sendEmailOtp to succeed
    sendEmailOtpSpy.mockResolvedValue({ success: true, otp: '123456' });
    process.env.RESEND_API_KEY = 'test-key';
    process.env.FROM_EMAIL = 'test@example.com';

    const result = await mfaService.setupEmailMfa(mockUser.id);

    // Verify MFA method was created
    expect(prisma.mfaMethod.upsert).toHaveBeenCalled();
    
    // Verify sendEmailOtp was called automatically
    expect(sendEmailOtpSpy).toHaveBeenCalledWith(mockUser.id);
    expect(result.method).toBe('EMAIL');
  });

  it('should handle email sending errors gracefully during setup', async () => {
    // Mock sendEmailOtp to fail
    sendEmailOtpSpy.mockRejectedValue(new Error('Email sending failed'));

    // Setup should still succeed even if email sending fails
    const result = await mfaService.setupEmailMfa(mockUser.id);

    expect(result.method).toBe('EMAIL');
    // MFA method should still be created
    expect(prisma.mfaMethod.upsert).toHaveBeenCalled();
    // sendEmailOtp should have been attempted
    expect(sendEmailOtpSpy).toHaveBeenCalledWith(mockUser.id);
  });
});
