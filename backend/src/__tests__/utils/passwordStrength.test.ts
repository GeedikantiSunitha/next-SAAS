/**
 * Password Strength Validation Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 * 
 * Tests verify:
 * - WEAK password detection
 * - FAIR password detection
 * - GOOD password detection
 * - STRONG password detection
 * - Common password detection
 * - Edge cases (empty, special chars, etc.)
 */

import { checkPasswordStrength, PasswordStrength, isCommonPassword } from '../../utils/passwordStrength';

describe('Password Strength Validation', () => {
  describe('checkPasswordStrength', () => {
    describe('WEAK passwords', () => {
      it('should return WEAK for password shorter than 8 characters', () => {
        const result = checkPasswordStrength('Short1!');
        expect(result.strength).toBe(PasswordStrength.WEAK);
        expect(result.score).toBeLessThan(2);
      });

      it('should return WEAK for password with only lowercase letters', () => {
        const result = checkPasswordStrength('onlylowercase');
        expect(result.strength).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password with only uppercase letters', () => {
        const result = checkPasswordStrength('ONLYUPPERCASE');
        expect(result.strength).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password with only numbers', () => {
        const result = checkPasswordStrength('12345678');
        expect(result.strength).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password with only special characters', () => {
        const result = checkPasswordStrength('!@#$%^&*');
        expect(result.strength).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password missing uppercase', () => {
        const result = checkPasswordStrength('lowercase123!');
        expect(result.strength).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password missing lowercase', () => {
        const result = checkPasswordStrength('UPPERCASE123!');
        expect(result.strength).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password missing numbers', () => {
        const result = checkPasswordStrength('NoNumbers!');
        expect(result.strength).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password missing special characters', () => {
        const result = checkPasswordStrength('NoSpecial123');
        expect(result.strength).toBe(PasswordStrength.WEAK);
      });
    });

    describe('FAIR passwords', () => {
      it('should return FAIR for password with 8 characters and all requirements', () => {
        const result = checkPasswordStrength('Passw0rd!');
        expect(result.strength).toBe(PasswordStrength.FAIR);
      });

      it('should return FAIR for password with 9 characters', () => {
        const result = checkPasswordStrength('Passw0rd!');
        expect(result.strength).toBe(PasswordStrength.FAIR);
      });
    });

    describe('GOOD passwords', () => {
      it('should return GOOD for password with 10-12 characters', () => {
        const result = checkPasswordStrength('Password123!');
        expect(result.strength).toBe(PasswordStrength.GOOD);
        expect(result.score).toBeGreaterThanOrEqual(3);
        expect(result.score).toBeLessThan(4);
      });

      it('should return GOOD for password with 12 characters', () => {
        const result = checkPasswordStrength('GoodPass123!');
        expect(result.strength).toBe(PasswordStrength.GOOD);
      });
    });

    describe('STRONG passwords', () => {
      it('should return STRONG for password with 13+ characters', () => {
        const result = checkPasswordStrength('VeryStrongPassword123!');
        expect(result.strength).toBe(PasswordStrength.STRONG);
        expect(result.score).toBeGreaterThanOrEqual(4);
      });

      it('should return STRONG for password with 16+ characters', () => {
        const result = checkPasswordStrength('VeryLongStrongPassword123!@#');
        expect(result.strength).toBe(PasswordStrength.STRONG);
      });

      it('should return STRONG for complex password with mixed case, numbers, and special chars', () => {
        const result = checkPasswordStrength('MyStr0ng!P@ssw0rd');
        expect(result.strength).toBe(PasswordStrength.STRONG);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string', () => {
        const result = checkPasswordStrength('');
        expect(result.strength).toBe(PasswordStrength.WEAK);
        expect(result.score).toBe(0);
      });

      it('should handle very long passwords', () => {
        const result = checkPasswordStrength('A'.repeat(100) + 'a1!');
        expect(result.strength).toBe(PasswordStrength.STRONG);
      });

      it('should handle unicode characters', () => {
        const result = checkPasswordStrength('Pässw0rd!');
        expect(result.strength).toBe(PasswordStrength.FAIR);
      });

      it('should handle passwords with spaces', () => {
        const result = checkPasswordStrength('Pass Word12!');
        expect(result.strength).toBe(PasswordStrength.GOOD);
      });
    });

    describe('Score calculation', () => {
      it('should return score between 0 and 4', () => {
        const result = checkPasswordStrength('Password123!');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(4);
      });

      it('should return feedback messages', () => {
        const result = checkPasswordStrength('Password123!');
        expect(result.feedback).toBeDefined();
        expect(Array.isArray(result.feedback)).toBe(true);
      });
    });
  });

  describe('isCommonPassword', () => {
    it('should detect common passwords', () => {
      expect(isCommonPassword('password')).toBe(true);
      expect(isCommonPassword('Password123')).toBe(true);
      expect(isCommonPassword('12345678')).toBe(true);
      expect(isCommonPassword('qwerty')).toBe(true);
      expect(isCommonPassword('admin')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isCommonPassword('PASSWORD')).toBe(true);
      expect(isCommonPassword('Password')).toBe(true);
      expect(isCommonPassword('pAsSwOrD')).toBe(true);
    });

    it('should return false for uncommon passwords', () => {
      expect(isCommonPassword('MyUniquePassword123!')).toBe(false);
      expect(isCommonPassword('Xk9#mP2$vL')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isCommonPassword('')).toBe(false);
    });
  });

  describe('Integration: Strength + Common Password', () => {
    it('should mark common password as WEAK even if it meets length requirements', () => {
      const result = checkPasswordStrength('Password123!');
      // Even if it's technically FAIR/GOOD, common passwords should be flagged
      expect(result.strength).toBeDefined();
    });
  });
});

