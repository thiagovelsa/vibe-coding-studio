import { describe, it, expect } from 'vitest';
import { 
  classNames, 
  formatDate, 
  truncateString
} from '../../frontend/src/lib/utils';

describe('utility functions', () => {
  describe('classNames', () => {
    it('should join string arguments', () => {
      const result = classNames('foo', 'bar', 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should filter out falsy values', () => {
      const result = classNames('foo', null, undefined, 'bar', false, 0, 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle conditional classes with objects', () => {
      const result = classNames(
        'base-class',
        { 'active': true, 'disabled': false, 'hidden': true }
      );
      expect(result).toBe('base-class active hidden');
    });

    it('should handle mixed arguments types', () => {
      const result = classNames(
        'base-class',
        { 'active': true, 'disabled': false },
        'fixed',
        undefined,
        { 'dark': true }
      );
      expect(result).toBe('base-class active fixed dark');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-05-15T14:30:00Z');
      const result = formatDate(date);
      
      // This will depend on your actual implementation
      // Adjust the expected output accordingly
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle invalid dates', () => {
      const result = formatDate(new Date('invalid-date'));
      expect(result).toBe('Invalid Date');
    });
  });

  describe('truncateString', () => {
    it('should truncate string longer than maxLength', () => {
      const result = truncateString('This is a long string that needs truncation', 20);
      expect(result).toBe('This is a long stri...');
    });

    it('should not truncate string shorter than maxLength', () => {
      const shortString = 'Short string';
      const result = truncateString(shortString, 20);
      expect(result).toBe(shortString);
    });

    it('should use custom suffix if provided', () => {
      const result = truncateString('This is a long string that needs truncation', 20, '…');
      expect(result).toBe('This is a long stri…');
    });
  });
}); 