/**
 * MFA Service
 * 
 * Multi-Factor Authentication service for TOTP and Email OTP
 */

import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { renderTemplate } from './emailService';
import { Resend } from 'resend';
import { createAuditLog } from './auditService';
import logger from '../utils/logger';
import config from '../config';

// Store email OTPs temporarily (in production, use Redis)
const emailOtpStore = new Map<string, { otp: string; expiresAt: number }>();

/**
 * Setup TOTP MFA
 * Generates secret and QR code
 */
export const setupTotp = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${config.appName} (${user.email})`,
    length: 32,
  });

  // Generate QR code URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = await generateBackupCodes(userId);

  // Create or update MFA method
  await prisma.mfaMethod.upsert({
    where: {
      userId_method: {
        userId,
        method: 'TOTP',
      },
    },
    create: {
      userId,
      method: 'TOTP',
      secret: secret.base32,
      isEnabled: false,
      isPrimary: false,
    },
    update: {
      secret: secret.base32,
      isEnabled: false, // Reset to false when setting up again
    },
  });

  await createAuditLog({
    userId,
    action: 'MFA_TOTP_SETUP',
    resource: 'mfa_methods',
  });

  logger.info('TOTP MFA setup initiated', { userId });

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  };
};

/**
 * Verify TOTP code
 */
export const verifyTotp = async (userId: string, token: string): Promise<boolean> => {
  const mfaMethod = await prisma.mfaMethod.findUnique({
    where: {
      userId_method: {
        userId,
        method: 'TOTP',
      },
    },
  });

  if (!mfaMethod || !mfaMethod.secret) {
    throw new ValidationError('TOTP is not set up for this user');
  }

  const verified = speakeasy.totp.verify({
    secret: mfaMethod.secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });

  if (verified) {
    await createAuditLog({
      userId,
      action: 'MFA_TOTP_VERIFIED',
      resource: 'mfa_methods',
    });
  } else {
    await createAuditLog({
      userId,
      action: 'MFA_TOTP_VERIFICATION_FAILED',
      resource: 'mfa_methods',
    });
  }

  return verified;
};

/**
 * Enable MFA method after verification
 */
export const enableMfa = async (
  userId: string,
  method: 'TOTP' | 'EMAIL',
  verificationCode: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  let isValid = false;

  if (method === 'TOTP') {
    isValid = await verifyTotp(userId, verificationCode);
  } else if (method === 'EMAIL') {
    isValid = await verifyEmailOtp(userId, verificationCode);
  }

  if (!isValid) {
    throw new ValidationError('Invalid verification code');
  }

  // Enable the MFA method
  await prisma.mfaMethod.update({
    where: {
      userId_method: {
        userId,
        method,
      },
    },
    data: {
      isEnabled: true,
      isPrimary: true, // Set as primary if it's the first enabled method
    },
  });

  // If this is the first enabled method, set it as primary
  const enabledMethods = await prisma.mfaMethod.findMany({
    where: {
      userId,
      isEnabled: true,
    },
  });

  if (enabledMethods.length === 1) {
    await prisma.mfaMethod.update({
      where: {
        userId_method: {
          userId,
          method,
        },
      },
      data: {
        isPrimary: true,
      },
    });
  }

  await createAuditLog({
    userId,
    action: 'MFA_ENABLED',
    resource: 'mfa_methods',
    details: { method },
  });

  logger.info('MFA enabled', { userId, method });
};

/**
 * Disable MFA method
 */
export const disableMfa = async (userId: string, method: 'TOTP' | 'EMAIL') => {
  const mfaMethod = await prisma.mfaMethod.findUnique({
    where: {
      userId_method: {
        userId,
        method,
      },
    },
  });

  if (!mfaMethod) {
    throw new NotFoundError('MFA method not found');
  }

  await prisma.mfaMethod.update({
    where: {
      userId_method: {
        userId,
        method,
      },
    },
    data: {
      isEnabled: false,
      isPrimary: false,
    },
  });

  await createAuditLog({
    userId,
    action: 'MFA_DISABLED',
    resource: 'mfa_methods',
    details: { method },
  });

  logger.info('MFA disabled', { userId, method });
};

/**
 * Generate backup codes
 */
export const generateBackupCodes = async (userId: string): Promise<string[]> => {
  // Invalidate old backup codes
  await prisma.mfaBackupCode.updateMany({
    where: {
      userId,
      used: false,
    },
    data: {
      used: true,
      usedAt: new Date(),
    },
  });

  // Generate 10 backup codes
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = generateBackupCode();
    codes.push(code);

    await prisma.mfaBackupCode.create({
      data: {
        userId,
        code,
        used: false,
      },
    });
  }

  await createAuditLog({
    userId,
    action: 'MFA_BACKUP_CODES_GENERATED',
    resource: 'mfa_backup_codes',
  });

  return codes;
};

/**
 * Generate a single backup code
 */
const generateBackupCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Verify backup code
 */
export const verifyBackupCode = async (userId: string, code: string): Promise<boolean> => {
  const backupCode = await prisma.mfaBackupCode.findUnique({
    where: { code },
  });

  if (!backupCode || backupCode.userId !== userId || backupCode.used) {
    return false;
  }

  // Mark as used
  await prisma.mfaBackupCode.update({
    where: { id: backupCode.id },
    data: {
      used: true,
      usedAt: new Date(),
    },
  });

  await createAuditLog({
    userId,
    action: 'MFA_BACKUP_CODE_USED',
    resource: 'mfa_backup_codes',
  });

  return true;
};

/**
 * Get user's MFA methods
 */
export const getMfaMethods = async (userId: string) => {
  const methods = await prisma.mfaMethod.findMany({
    where: { userId },
    select: {
      id: true,
      method: true,
      isEnabled: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      // Don't return secret
    },
    orderBy: { createdAt: 'asc' },
  });

  return methods;
};

/**
 * Setup Email MFA
 */
export const setupEmailMfa = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Create or update email MFA method
  const mfaMethod = await prisma.mfaMethod.upsert({
    where: {
      userId_method: {
        userId,
        method: 'EMAIL',
      },
    },
    create: {
      userId,
      method: 'EMAIL',
      isEnabled: false,
      isPrimary: false,
    },
    update: {
      isEnabled: false, // Reset to false when setting up again
    },
  });

  await createAuditLog({
    userId,
    action: 'MFA_EMAIL_SETUP',
    resource: 'mfa_methods',
  });

  logger.info('Email MFA setup initiated', { userId });

  return {
    method: mfaMethod.method,
    isEnabled: mfaMethod.isEnabled,
  };
};

/**
 * Send Email OTP
 */
export const sendEmailOtp = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const mfaMethod = await prisma.mfaMethod.findUnique({
    where: {
      userId_method: {
        userId,
        method: 'EMAIL',
      },
    },
  });

  if (!mfaMethod) {
    throw new ValidationError('Email MFA is not set up for this user');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP (in production, use Redis)
  emailOtpStore.set(`${userId}:${mfaMethod.id}`, { otp, expiresAt });

  // Send email
  try {
    const html = renderTemplate('mfa-otp', {
      otp,
      expiresIn: '10 minutes',
    });

    // Use Resend directly (similar to emailService pattern)
    const apiKey = process.env.RESEND_API_KEY || config.email.apiKey;
    
    if (!apiKey || apiKey === 'your-resend-api-key-here') {
      logger.warn('Email not sent - Resend not configured', {
        to: user.email,
        subject: 'Your MFA Verification Code',
      });
    } else {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: config.email.fromEmail,
        to: user.email,
        subject: 'Your MFA Verification Code',
        html,
      });

      if ('error' in result && result.error) {
        throw new Error(result.error.message);
      }

      logger.info('MFA email sent', { userId, email: user.email });
    }
  } catch (error: any) {
    logger.error('Failed to send MFA email', { userId, error: error.message });
    throw new ValidationError('Failed to send verification email');
  }

  await createAuditLog({
    userId,
    action: 'MFA_EMAIL_OTP_SENT',
    resource: 'mfa_methods',
  });

  logger.info('Email OTP sent', { userId });

  return {
    success: true,
    otp, // Return for testing - in production, don't return OTP
  };
};

/**
 * Verify Email OTP
 */
export const verifyEmailOtp = async (userId: string, otp: string): Promise<boolean> => {
  const mfaMethod = await prisma.mfaMethod.findUnique({
    where: {
      userId_method: {
        userId,
        method: 'EMAIL',
      },
    },
  });

  if (!mfaMethod) {
    throw new ValidationError('Email MFA is not set up for this user');
  }

  const key = `${userId}:${mfaMethod.id}`;
  const stored = emailOtpStore.get(key);

  if (!stored) {
    return false;
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    emailOtpStore.delete(key);
    return false;
  }

  // Verify OTP
  if (stored.otp !== otp) {
    return false;
  }

  // Remove OTP after successful verification
  emailOtpStore.delete(key);

  await createAuditLog({
    userId,
    action: 'MFA_EMAIL_OTP_VERIFIED',
    resource: 'mfa_methods',
  });

  return true;
};

