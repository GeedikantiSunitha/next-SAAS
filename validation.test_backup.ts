/**
 * Validation Utilities Tests
 *
 * TDD approach for proper validation throughout the application
 */

import {
  ValidationError,
  validateRequired,
  validateEmail,
  validateUUID,
  validateEnum,
  validateArrayNotEmpty,
  validateDateString,
  validatePositiveNumber,
} from '../../utils/validation';

describe('Validation Utilities', () => {
  describe('ValidationError', () => {
    it('should create a validation error with proper message and field', () => {
      const error = new ValidationError('Email is required', 'email');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Email is required');
      expect(error.field).toBe('email');
      expect(error.statusCode).toBe(400);
    });

    it('should have a name property for better debugging', () => {
      const error = new ValidationError('Invalid input');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('validateRequired', () => {
    it('should pass for valid non-empty values', () => {
      expect(() => validateRequired('test', 'field')).not.toThrow();
      expect(() => validateRequired(123, 'field')).not.toThrow();
      expect(() => validateRequired(['item'], 'field')).not.toThrow();
      expect(() => validateRequired({ key: 'value' }, 'field')).not.toThrow();
    });

    it('should throw for null values', () => {
      expect(() => validateRequired(null, 'username'))
        .toThrow(new ValidationError('username is required', 'username'));
    });

    it('should throw for undefined values', () => {
      expect(() => validateRequired(undefined, 'password'))
        .toThrow(new ValidationError('password is required', 'password'));
    });

    it('should throw for empty strings', () => {
      expect(() => validateRequired('', 'email'))
        .toThrow(new ValidationError('email is required', 'email'));
    });

    it('should throw for whitespace-only strings', () => {
      expect(() => validateRequired('   ', 'name'))
        .toThrow(new ValidationError('name is required', 'name'));
    });

    it('should accept custom error message', () => {
      expect(() => validateRequired(null, 'field', 'Custom error message'))
        .toThrow(new ValidationError('Custom error message', 'field'));
    });
  });

  describe('validateEmail', () => {
    it('should pass for valid email addresses', () => {
      expect(() => validateEmail('user@example.com')).not.toThrow();
      expect(() => validateEmail('test.user@domain.co.uk')).not.toThrow();
      expect(() => validateEmail('user+tag@example.org')).not.toThrow();
    });

    it('should throw for invalid email addresses', () => {
      expect(() => validateEmail('notanemail'))
        .toThrow(new ValidationError('Invalid email format', 'email'));
      expect(() => validateEmail('missing@domain'))
        .toThrow(new ValidationError('Invalid email format', 'email'));
      expect(() => validateEmail('@example.com'))
        .toThrow(new ValidationError('Invalid email format', 'email'));
    });

    it('should throw for null or undefined', () => {
      expect(() => validateEmail(null as any))
        .toThrow(new ValidationError('Email is required', 'email'));
      expect(() => validateEmail(undefined as any))
        .toThrow(new ValidationError('Email is required', 'email'));
    });
  });

  describe('validateUUID', () => {
    it('should pass for valid UUIDs', () => {
      expect(() => validateUUID('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
      expect(() => validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).not.toThrow();
    });

    it('should throw for invalid UUIDs', () => {
      expect(() => validateUUID('not-a-uuid', 'userId'))
        .toThrow(new ValidationError('Invalid userId format', 'userId'));
      expect(() => validateUUID('12345', 'id'))
        .toThrow(new ValidationError('Invalid id format', 'id'));
    });

    it('should throw for null or undefined', () => {
      expect(() => validateUUID(null as any, 'id'))
        .toThrow(new ValidationError('id is required', 'id'));
    });
  });

  describe('validateEnum', () => {
    enum TestEnum {
      OPTION_A = 'OPTION_A',
      OPTION_B = 'OPTION_B',
      OPTION_C = 'OPTION_C',
    }

    it('should pass for valid enum values', () => {
      expect(() => validateEnum('OPTION_A', TestEnum, 'status')).not.toThrow();
      expect(() => validateEnum('OPTION_B', TestEnum, 'status')).not.toThrow();
      expect(() => validateEnum('OPTION_C', TestEnum, 'status')).not.toThrow();
    });

    it('should throw for invalid enum values', () => {
      expect(() => validateEnum('INVALID', TestEnum, 'status'))
        .toThrow(new ValidationError('Invalid status value. Must be one of: OPTION_A, OPTION_B, OPTION_C', 'status'));
    });

    it('should throw for null or undefined', () => {
      expect(() => validateEnum(null, TestEnum, 'type'))
        .toThrow(new ValidationError('type is required', 'type'));
    });
  });

  describe('validateArrayNotEmpty', () => {
    it('should pass for non-empty arrays', () => {
      expect(() => validateArrayNotEmpty(['item'], 'items')).not.toThrow();
      expect(() => validateArrayNotEmpty([1, 2, 3], 'numbers')).not.toThrow();
    });

    it('should throw for empty arrays', () => {
      expect(() => validateArrayNotEmpty([], 'tags'))
        .toThrow(new ValidationError('tags cannot be empty', 'tags'));
    });

    it('should throw for non-array values', () => {
      expect(() => validateArrayNotEmpty('not-an-array' as any, 'items'))
        .toThrow(new ValidationError('items must be an array', 'items'));
      expect(() => validateArrayNotEmpty(null as any, 'items'))
        .toThrow(new ValidationError('items is required', 'items'));
    });
  });

  describe('validateDateString', () => {
    it('should pass for valid ISO date strings', () => {
      expect(() => validateDateString('2024-01-20T10:30:00Z', 'date')).not.toThrow();
      expect(() => validateDateString('2024-01-20', 'date')).not.toThrow();
    });

    it('should throw for invalid date strings', () => {
      expect(() => validateDateString('not-a-date', 'startDate'))
        .toThrow(new ValidationError('Invalid date format for startDate', 'startDate'));
      expect(() => validateDateString('2024-13-40', 'date'))
        .toThrow(new ValidationError('Invalid date format for date', 'date'));
    });

    it('should throw for null or undefined', () => {
      expect(() => validateDateString(null as any, 'date'))
        .toThrow(new ValidationError('date is required', 'date'));
    });
  });

  describe('validatePositiveNumber', () => {
    it('should pass for positive numbers', () => {
      expect(() => validatePositiveNumber(1, 'count')).not.toThrow();
      expect(() => validatePositiveNumber(100, 'amount')).not.toThrow();
      expect(() => validatePositiveNumber(0.5, 'rate')).not.toThrow();
    });

    it('should throw for zero', () => {
      expect(() => validatePositiveNumber(0, 'count'))
        .toThrow(new ValidationError('count must be a positive number', 'count'));
    });

    it('should throw for negative numbers', () => {
      expect(() => validatePositiveNumber(-1, 'amount'))
        .toThrow(new ValidationError('amount must be a positive number', 'amount'));
    });

    it('should throw for non-numeric values', () => {
      expect(() => validatePositiveNumber('not-a-number' as any, 'value'))
        .toThrow(new ValidationError('value must be a number', 'value'));
      expect(() => validatePositiveNumber(null as any, 'value'))
        .toThrow(new ValidationError('value is required', 'value'));
    });
  });
});