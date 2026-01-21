/**
 * Validation Utilities
 *
 * Provides comprehensive validation functions for the application.
 * These replace dangerous non-null assertions and provide meaningful error messages.
 */

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly statusCode: number = 400;
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Validate that a value is not null, undefined, or empty
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string,
  customMessage?: string
): T {
  if (value === null || value === undefined) {
    throw new ValidationError(customMessage || `${fieldName} is required`, fieldName);
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    throw new ValidationError(customMessage || `${fieldName} is required`, fieldName);
  }

  return value;
}

/**
 * Validate email format
 */
export function validateEmail(email: string | null | undefined): string {
  if (!email) {
    throw new ValidationError('Email is required', 'email');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  return email;
}

/**
 * Validate UUID format
 */
export function validateUUID(value: string | null | undefined, fieldName: string = 'id'): string {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }

  return value;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends object>(
  value: any,
  enumType: T,
  fieldName: string
): T[keyof T] {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  const validValues = Object.values(enumType);
  if (!validValues.includes(value)) {
    throw new ValidationError(
      `Invalid ${fieldName} value. Must be one of: ${validValues.join(', ')}`,
      fieldName
    );
  }

  return value;
}

/**
 * Validate array is not empty
 */
export function validateArrayNotEmpty<T>(
  value: T[] | null | undefined,
  fieldName: string
): T[] {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }

  if (value.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }

  return value;
}

/**
 * Validate date string format
 */
export function validateDateString(
  value: string | null | undefined,
  fieldName: string
): string {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid date format for ${fieldName}`, fieldName);
  }

  return value;
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(
  value: number | null | undefined,
  fieldName: string
): number {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a number`, fieldName);
  }

  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`, fieldName);
  }

  return value;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string | null | undefined,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): string {
  const validated = validateRequired(value, fieldName);

  if (minLength !== undefined && validated.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters long`,
      fieldName
    );
  }

  if (maxLength !== undefined && validated.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must not exceed ${maxLength} characters`,
      fieldName
    );
  }

  return validated;
}

/**
 * Batch validation - validates multiple fields at once
 */
export interface ValidationRule<T> {
  field: keyof T;
  validate: (value: any) => any;
}

export function validateObject<T>(
  obj: Partial<T>,
  rules: ValidationRule<T>[]
): T {
  const validated: Partial<T> = {};
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    try {
      validated[rule.field] = rule.validate(obj[rule.field]);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      } else {
        throw error;
      }
    }
  }

  if (errors.length > 0) {
    const message = errors.map(e => e.message).join(', ');
    throw new ValidationError(message);
  }

  return validated as T;
}