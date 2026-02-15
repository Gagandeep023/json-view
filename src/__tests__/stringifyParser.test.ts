import { describe, it, expect } from 'vitest';
import { parseStringified } from '../index';

describe('parseStringified', () => {
  it('should parse single-level stringified JSON', () => {
    const input = JSON.stringify(JSON.stringify({ key: 'value' }));
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({ key: 'value' });
    expect(result.nestingLevel).toBe(1);
  });

  it('should parse double-stringified JSON', () => {
    const inner = { key: 'value' };
    const input = JSON.stringify(JSON.stringify(JSON.stringify(inner)));
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual(inner);
    expect(result.nestingLevel).toBe(2);
  });

  it('should parse triple-stringified JSON', () => {
    const inner = { a: 1 };
    const input = JSON.stringify(JSON.stringify(JSON.stringify(JSON.stringify(inner))));
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual(inner);
    expect(result.nestingLevel).toBe(3);
  });

  it('should pass through non-stringified JSON with nesting 0', () => {
    const input = '{"key": "value"}';
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({ key: 'value' });
    expect(result.nestingLevel).toBe(0);
  });

  it('should handle stringified arrays', () => {
    const input = JSON.stringify(JSON.stringify([1, 2, 3]));
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual([1, 2, 3]);
    expect(result.nestingLevel).toBe(1);
  });

  it('should handle stringified primitives', () => {
    const input = JSON.stringify(JSON.stringify(42));
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toBe(42);
    expect(result.nestingLevel).toBe(1);
  });

  it('should return error for invalid input', () => {
    const result = parseStringified('not valid json at all');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for empty input', () => {
    const result = parseStringified('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Input is empty');
  });

  it('should stop unwrapping when string is not valid JSON', () => {
    const input = JSON.stringify('just a plain string');
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toBe('just a plain string');
    expect(result.nestingLevel).toBe(0);
  });

  it('should handle already-parsed objects', () => {
    const input = '{"name": "test", "count": 5}';
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.nestingLevel).toBe(0);
  });

  it('should handle null value', () => {
    const result = parseStringified('null');
    expect(result.success).toBe(true);
    expect(result.parsed).toBe(null);
    expect(result.nestingLevel).toBe(0);
  });
});
