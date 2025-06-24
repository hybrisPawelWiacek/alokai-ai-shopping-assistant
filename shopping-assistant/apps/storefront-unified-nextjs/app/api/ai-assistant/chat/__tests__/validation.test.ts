import { describe, it, expect } from '@jest/globals';
import { validateRequest, sanitizeInput } from '../validation';

describe('Request Validation', () => {
  describe('validateRequest', () => {
    it('should validate valid request', () => {
      const result = validateRequest({
        message: 'Find me a laptop',
        stream: true,
        locale: 'en-US',
        currency: 'USD'
      });

      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.message).toBe('Find me a laptop');
    });

    it('should reject empty message', () => {
      const result = validateRequest({
        message: '',
        stream: true
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].field).toBe('message');
    });

    it('should reject too long message', () => {
      const result = validateRequest({
        message: 'a'.repeat(4001),
        stream: true
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject invalid locale format', () => {
      const result = validateRequest({
        message: 'Test',
        locale: 'invalid-locale-format'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(e => e.field === 'locale')).toBe(true);
    });

    it('should reject invalid currency code', () => {
      const result = validateRequest({
        message: 'Test',
        currency: 'INVALID'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(e => e.field === 'currency')).toBe(true);
    });

    it('should reject malicious content', () => {
      const result = validateRequest({
        message: 'Hello <script>alert("xss")</script>'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(e => e.message.includes('malicious'))).toBe(true);
    });

    it('should validate timeout range', () => {
      const tooShort = validateRequest({
        message: 'Test',
        timeout: 500
      });

      expect(tooShort.isValid).toBe(false);

      const tooLong = validateRequest({
        message: 'Test',
        timeout: 70000
      });

      expect(tooLong.isValid).toBe(false);

      const valid = validateRequest({
        message: 'Test',
        timeout: 30000
      });

      expect(valid.isValid).toBe(true);
    });

    it('should handle non-object input', () => {
      const result = validateRequest('not an object');

      expect(result.isValid).toBe(false);
      expect(result.errors?.[0].message).toBe('Request body must be an object');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00World\x1F';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('HelloWorld');
    });

    it('should normalize whitespace', () => {
      const input = 'Hello   \t\n  World';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World');
    });

    it('should remove zero-width characters', () => {
      const input = 'Hello\u200BWorld\uFEFF';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('HelloWorld');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World');
    });
  });
});