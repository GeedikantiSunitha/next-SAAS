/**
 * MFA Email Setup Service Tests (TDD)
 * 
 * Tests to verify Email MFA setup automatically sends OTP.
 */

import { prisma } from '../../config/database';

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

// Mock sendEmailOtp to verify it's called
jest.mock('../../services/mfaService', () => {
  const actual = jest.requireActual('../../services/mfaService');
  return {
    ...actual,
    sendEmailOtp: jest.fn(),
  };
});

describe('MFA Email Setup - Auto-send OTP', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should automatically call sendEmailOtp after creating Email MFA method', async () => {
    const mfaService = require('../../services/mfaService');
    const { setupEmailMfa, sendEmailOtp } = mfaService;
    
    // Mock sendEmailOtp to succeed
    (sendEmailOtp as jest.Mock).mockResolvedValue({ success: true, otp: '123456' });
    process.env.RESEND_API_KEY = 'test-key';
    process.env.FROM_EMAIL = 'test@example.com';

    const result = await setupEmailMfa(mockUser.id);

    // Verify MFA method was created
    expect(prisma.mfaMethod.upsert).toHaveBeenCalled();
    
    // Verify sendEmailOtp was called automatically
    expect(sendEmailOtp).toHaveBeenCalledWith(mockUser.id);
    expect(result.method).toBe('EMAIL');
  });

  it('should handle email sending errors gracefully during setup', async () => {
    const mfaService = require('../../services/mfaService');
    const { setupEmailMfa, sendEmailOtp } = mfaService;
    
    // Mock sendEmailOtp to fail
    (sendEmailOtp as jest.Mock).mockRejectedValue(new Error('Email sending failed'));

    // Setup should still succeed even if email sending fails
    const result = await setupEmailMfa(mockUser.id);

    expect(result.method).toBe('EMAIL');
    // MFA method should still be created
    expect(prisma.mfaMethod.upsert).toHaveBeenCalled();
    // sendEmailOtp should have been attempted
    expect(sendEmailOtp).toHaveBeenCalledWith(mockUser.id);
  });
});
