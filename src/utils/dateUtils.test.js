import { describe, it, expect } from 'vitest';
import { formatDate } from './dateUtils';

describe('dateUtils', () => {
  it('should format valid date strings properly', () => {
    const result = formatDate('2023-10-15T10:00:00Z');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should handle null or undefined dates gracefully', () => {
    // We expect the util to return "N/A" or similar, or at least not throw
    expect(() => formatDate(null)).not.toThrow();
  });
});
