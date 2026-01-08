/**
 * MFA TOTP Service Tests - QR Code Quality (TDD)
 * 
 * Tests to verify TOTP QR code generation includes proper format,
 * size, and metadata for authenticator apps.
 */

import { setupTotp } from '../../services/mfaService';
import { prisma } from '../../config/database';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import config from '../../config';

// Mock dependencies
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  mfaMethod: {
    upsert: jest.fn(),
  },
  mfaBackupCode: {
    updateMany: jest.fn(),
    createMany: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('speakeasy');
jest.mock('qrcode');
jest.mock('../../services/auditService', () => ({
  createAuditLog: jest.fn(),
}));

describe('MFA TOTP - QR Code Quality', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (mockPrisma.mfaMethod.upsert as jest.Mock).mockResolvedValue({
      id: 'mfa-123',
      userId: mockUser.id,
      method: 'TOTP',
      secret: 'JBSWY3DPEHPK3PXP',
      isEnabled: false,
    });
    (mockPrisma.mfaBackupCode.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    (mockPrisma.mfaBackupCode.createMany as jest.Mock).mockResolvedValue({ count: 8 });
  });

  it('should generate QR code with proper size (512x512)', async () => {
    const mockSecret = {
      base32: 'JBSWY3DPEHPK3PXP',
      otpauth_url: 'otpauth://totp/App:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=App',
    };

    (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,...');

    await setupTotp(mockUser.id);

    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
    );
  });

  it('should include issuer in otpauth_url when otpauth_url is missing', async () => {
    const mockSecret = {
      base32: 'JBSWY3DPEHPK3PXP',
      otpauth_url: undefined, // Simulate missing otpauth_url
    };

    (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,...');

    await setupTotp(mockUser.id);

    // Verify otpauth_url includes issuer
    const qrCodeCall = (QRCode.toDataURL as jest.Mock).mock.calls[0][0];
    expect(qrCodeCall).toContain('otpauth://totp/');
    expect(qrCodeCall).toContain('issuer=');
    expect(qrCodeCall).toContain(encodeURIComponent(config.appName));
  });

  it('should include account name (email) in otpauth_url', async () => {
    const mockSecret = {
      base32: 'JBSWY3DPEHPK3PXP',
      otpauth_url: undefined,
    };

    (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,...');

    await setupTotp(mockUser.id);

    const qrCodeCall = (QRCode.toDataURL as jest.Mock).mock.calls[0][0];
    expect(qrCodeCall).toContain(encodeURIComponent(mockUser.email));
  });

  it('should generate QR code with proper format for authenticator apps', async () => {
    const mockSecret = {
      base32: 'JBSWY3DPEHPK3PXP',
      otpauth_url: `otpauth://totp/${encodeURIComponent(config.appName)}:${encodeURIComponent(mockUser.email)}?secret=JBSWY3DPEHPK3PXP&issuer=${encodeURIComponent(config.appName)}`,
    };

    (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,...');

    const result = await setupTotp(mockUser.id);

    expect(result.qrCodeUrl).toBeDefined();
    expect(result.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.secret).toBe(mockSecret.base32);
  });
});
