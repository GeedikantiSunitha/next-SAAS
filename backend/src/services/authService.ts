import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import config from '../config';
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from '../utils/errors';
import { shouldRejectPassword, checkPasswordStrength } from '../utils/passwordStrength';
import { sendPasswordResetEmail } from './emailService';
import logger from '../utils/logger';

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate access and refresh tokens
 */
export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  const refreshToken = jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new user account
 * 
 * @description
 * Creates a new user account with email/password authentication. Validates
 * email uniqueness, password strength, and creates audit logs. This is the
 * core user registration function used by the registration endpoint.
 * 
 * @param {string} email - User's email address (must be unique)
 * @param {string} password - User's password (must meet strength requirements)
 * @param {string} [name] - User's full name (optional)
 * @param {string} [ipAddress] - User's IP address for audit logging
 * @param {string} [userAgent] - User's browser/device info for audit logging
 * 
 * @returns {Promise<Object>} User object (without password)
 * @returns {Object.id} User's unique ID
 * @returns {Object.email} User's email address
 * @returns {Object.name} User's name
 * @returns {Object.role} User's role (default: USER)
 * 
 * @throws {ForbiddenError} If registration is disabled via feature flag
 * @throws {ConflictError} If email is already registered
 * @throws {ValidationError} If password doesn't meet strength requirements
 * 
 * @example
 * ```typescript
 * const user = await register(
 *   'user@example.com',
 *   'SecurePass123!',
 *   'John Doe',
 *   '192.168.1.1',
 *   'Mozilla/5.0...'
 * );
 * ```
 */
export const register = async (
  email: string,
  password: string,
  name?: string,
  ipAddress?: string,
  userAgent?: string
) => {
  // Check if registration is enabled via feature flag
  // Allows admins to temporarily disable registration
  if (!config.features.registration) {
    throw new ForbiddenError('Registration is currently disabled');
  }

  // Check if user already exists (email must be unique)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Check password strength (reject WEAK and FAIR passwords)
  // Only STRONG and VERY_STRONG passwords are accepted
  if (shouldRejectPassword(password)) {
    const strengthResult = checkPasswordStrength(password);
    throw new ValidationError(
      `Password is too weak. ${strengthResult.feedback.join(' ')}`
    );
  }

  // Hash password using bcrypt (12 rounds for security/performance balance)
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Log audit trail
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'users',
      resourceId: user.id,
      ipAddress,
      userAgent,
    },
  });

  logger.info('User registered', { userId: user.id, email: user.email });

  return user;
};

/**
 * Authenticate user with email and password
 * 
 * @description
 * Validates user credentials and returns user information. Handles various
 * edge cases including disabled accounts, OAuth-only accounts, and invalid
 * credentials. Creates audit logs for security tracking.
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password (plain text, will be hashed and compared)
 * @param {string} [ipAddress] - User's IP address for audit logging
 * @param {string} [userAgent] - User's browser/device info for audit logging
 * 
 * @returns {Promise<Object>} User object (without password)
 * 
 * @throws {UnauthorizedError} If credentials are invalid, account is disabled,
 *                             or account uses OAuth login
 * 
 * @example
 * ```typescript
 * const user = await login(
 *   'user@example.com',
 *   'SecurePass123!',
 *   '192.168.1.1',
 *   'Mozilla/5.0...'
 * );
 * ```
 */
export const login = async (
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
) => {
  // Find user by email (case-insensitive lookup handled by Prisma)
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Generic error message to prevent email enumeration attacks
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if user account is active (admins can disable accounts)
  if (!user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // OAuth users don't have passwords - they must use OAuth login
  // This prevents password-based login attempts on OAuth-only accounts
  if (!user.password) {
    throw new UnauthorizedError('This account uses OAuth login. Please sign in with your OAuth provider.');
  }

  // Verify password using bcrypt comparison (timing-safe)
  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    // Log failed login attempt
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'users',
        resourceId: user.id,
        ipAddress,
        userAgent,
      },
    });

    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if user has MFA enabled
  const enabledMfaMethods = await prisma.mfaMethod.findMany({
    where: {
      userId: user.id,
      isEnabled: true,
    },
    orderBy: { isPrimary: 'desc' },
  });

  // If MFA is enabled, return requiresMfa flag instead of tokens
  if (enabledMfaMethods.length > 0) {
    const primaryMethod = enabledMfaMethods.find((m) => m.isPrimary) || enabledMfaMethods[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      requiresMfa: true,
      mfaMethod: primaryMethod.method,
      // Don't return tokens yet - need MFA verification first
    };
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Save refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  // Log successful login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'users',
      resourceId: user.id,
      ipAddress,
      userAgent,
    },
  });

  logger.info('User logged in', { userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  // Verify refresh token
  try {
    jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Check if session exists and is valid
  const session = await prisma.session.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  if (!session.user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Generate new access token
  const accessToken = jwt.sign(
    { userId: session.userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  return { accessToken };
};

/**
 * Logout user (delete session)
 */
export const logout = async (refreshToken: string) => {
  // Delete session
  await prisma.session.delete({
    where: { token: refreshToken },
  });

  logger.info('User logged out');
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

// Import ForbiddenError for registration check
import { ForbiddenError } from '../utils/errors';

/**
 * Request password reset
 * Generates a reset token and sends email
 */
export const forgotPassword = async (email: string) => {
  // Check if password reset is enabled
  if (!config.features.passwordReset) {
    throw new ForbiddenError('Password reset is currently disabled');
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
    },
  });

  // Security: Always return success to prevent email enumeration
  // Only send email if user exists and is active
  if (user && user.isActive) {
    // Delete any existing unused reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Create password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name || undefined,
        token: resetToken,
      });

      logger.info('Password reset email sent', {
        userId: user.id,
        email: user.email,
      });
    } catch (error: any) {
      logger.error('Failed to send password reset email', {
        userId: user.id,
        email: user.email,
        error: error.message,
      });
      // Don't throw - still return success to user
    }
  }

  // Always return success (security: prevent email enumeration)
  return {
    message: 'If an account exists with this email, you will receive password reset instructions.',
  };
};

/**
 * Reset password using token
 */
export const resetPassword = async (token: string, newPassword: string) => {
  // Check if password reset is enabled
  if (!config.features.passwordReset) {
    throw new ForbiddenError('Password reset is currently disabled');
  }

  // Check password strength (reject WEAK and FAIR)
  if (shouldRejectPassword(newPassword)) {
    const strengthResult = checkPasswordStrength(newPassword);
    throw new ValidationError(
      `Password is too weak. ${strengthResult.feedback.join(' ')}`
    );
  }

  // Find password reset record
  const passwordReset = await prisma.passwordReset.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      },
    },
  });

  // Check if token exists
  if (!passwordReset) {
    throw new ValidationError('Invalid or expired reset token');
  }

  // Check if token is already used
  if (passwordReset.used) {
    throw new ValidationError('This reset token has already been used');
  }

  // Check if token is expired
  if (passwordReset.expiresAt < new Date()) {
    throw new ValidationError('Invalid or expired reset token');
  }

  // Check if user is active
  if (!passwordReset.user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user password
  await prisma.user.update({
    where: { id: passwordReset.userId },
    data: { password: hashedPassword },
  });

  // Mark reset token as used
  await prisma.passwordReset.update({
    where: { id: passwordReset.id },
    data: { used: true },
  });

  // Log audit trail
  await prisma.auditLog.create({
    data: {
      userId: passwordReset.userId,
      action: 'PASSWORD_RESET',
      resource: 'users',
      resourceId: passwordReset.userId,
    },
  });

  logger.info('Password reset successful', {
    userId: passwordReset.userId,
    email: passwordReset.user.email,
  });

  return {
    message: 'Password reset successfully. You can now login with your new password.',
  };
};

