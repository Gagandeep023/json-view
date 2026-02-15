import { describe, it, expect } from 'vitest';
import { validateJSON, formatJSON, minifyJSON } from '../index';

describe('validateJSON', () => {
  it('should validate correct JSON', () => {
    const result = validateJSON('{"key": "value"}');
    expect(result.success).toBe(true);
  });

  it('should reject invalid JSON with error', () => {
    const result = validateJSON('{key: "value"}');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for empty input', () => {
    const result = validateJSON('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Input is empty');
  });

  it('should return error for whitespace-only input', () => {
    const result = validateJSON('   ');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Input is empty');
  });

  it('should validate primitive JSON values', () => {
    expect(validateJSON('"hello"').success).toBe(true);
    expect(validateJSON('42').success).toBe(true);
    expect(validateJSON('true').success).toBe(true);
    expect(validateJSON('null').success).toBe(true);
  });

  it('should validate arrays', () => {
    expect(validateJSON('[1, 2, 3]').success).toBe(true);
  });

  it('should extract error location when available', () => {
    const result = validateJSON('{"a": 1, "b": }');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('formatJSON', () => {
  it('should beautify with default indent (2 spaces)', () => {
    const result = formatJSON('{"a":1,"b":2}');
    expect(result.success).toBe(true);
    expect(result.formatted).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it('should beautify with custom indent (4 spaces)', () => {
    const result = formatJSON('{"a":1}', { indent: 4 });
    expect(result.success).toBe(true);
    expect(result.formatted).toBe('{\n    "a": 1\n}');
  });

  it('should sort keys alphabetically when option set', () => {
    const result = formatJSON('{"c":3,"a":1,"b":2}', { sortKeys: true });
    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.formatted!);
    expect(Object.keys(parsed)).toEqual(['a', 'b', 'c']);
  });

  it('should sort keys in nested objects', () => {
    const result = formatJSON('{"z":{"b":2,"a":1},"a":0}', { sortKeys: true });
    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.formatted!);
    expect(Object.keys(parsed)).toEqual(['a', 'z']);
    expect(Object.keys(parsed.z)).toEqual(['a', 'b']);
  });

  it('should return error for invalid JSON', () => {
    const result = formatJSON('not json');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for empty input', () => {
    const result = formatJSON('');
    expect(result.success).toBe(false);
  });

  it('should handle arrays', () => {
    const result = formatJSON('[1,2,3]');
    expect(result.success).toBe(true);
    expect(result.formatted).toBe('[\n  1,\n  2,\n  3\n]');
  });

  it('should handle unicode content', () => {
    const result = formatJSON('{"emoji":"\\u2764","text":"hello"}');
    expect(result.success).toBe(true);
    expect(result.formatted).toContain('hello');
  });

  it('should handle primitive values', () => {
    expect(formatJSON('"hello"').formatted).toBe('"hello"');
    expect(formatJSON('42').formatted).toBe('42');
    expect(formatJSON('null').formatted).toBe('null');
  });
});

describe('minifyJSON', () => {
  it('should remove all whitespace', () => {
    const input = '{\n  "a": 1,\n  "b": 2\n}';
    const result = minifyJSON(input);
    expect(result.success).toBe(true);
    expect(result.formatted).toBe('{"a":1,"b":2}');
  });

  it('should return error for invalid JSON', () => {
    const result = minifyJSON('not json');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for empty input', () => {
    const result = minifyJSON('');
    expect(result.success).toBe(false);
  });

  it('should handle already minified JSON', () => {
    const result = minifyJSON('{"a":1}');
    expect(result.success).toBe(true);
    expect(result.formatted).toBe('{"a":1}');
  });
});
