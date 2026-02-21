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

describe('parseStringified - JSON extraction from log lines', () => {
  it('should extract JSON from text with prefix', () => {
    const input = '[thread_abc123] INFO response {"data": {"key": "value"}}';
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({ data: { key: 'value' } });
    expect(result.jsonExtracted).toBe(true);
  });

  it('should extract JSON from log line with emoji prefix', () => {
    const input = '[thread_abc] 🟢 [thread_abc] Received response {"data": {"url": "https://example.com"}}';
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect((result.parsed as Record<string, unknown>).data).toEqual({ url: 'https://example.com' });
    expect(result.jsonExtracted).toBe(true);
  });

  it('should not set jsonExtracted for valid JSON input', () => {
    const input = '{"key": "value"}';
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.jsonExtracted).toBe(false);
  });

  it('should extract JSON array from text with prefix', () => {
    const input = 'DEBUG output: [1, 2, 3]';
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual([1, 2, 3]);
    expect(result.jsonExtracted).toBe(true);
  });

  it('should return error when no JSON found in text', () => {
    const result = parseStringified('just some random text without json');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle log line with trailing text after JSON', () => {
    const input = 'prefix {"key": "value"} suffix';
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({ key: 'value' });
    expect(result.jsonExtracted).toBe(true);
  });
});

describe('parseStringified - deep parse stringified values', () => {
  it('should deep parse stringified JSON values in object', () => {
    const input = JSON.stringify({
      level: 'info',
      body: '{"context":{"version":"2.0.0","action":"cancel"}}',
    });
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({
      level: 'info',
      body: {
        context: {
          version: '2.0.0',
          action: 'cancel',
        },
      },
    });
  });

  it('should deep parse nested stringified values recursively', () => {
    const input = JSON.stringify({
      outer: '{"inner": "{\\"deep\\": \\"value\\"}"}',
    });
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({
      outer: {
        inner: {
          deep: 'value',
        },
      },
    });
  });

  it('should not modify non-JSON string values', () => {
    const input = JSON.stringify({
      name: 'hello world',
      url: 'https://example.com',
      count: 42,
    });
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({
      name: 'hello world',
      url: 'https://example.com',
      count: 42,
    });
  });

  it('should deep parse stringified arrays', () => {
    const input = JSON.stringify({
      items: '[1, 2, 3]',
    });
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({
      items: [1, 2, 3],
    });
  });

  it('should deep parse values inside arrays', () => {
    const input = JSON.stringify({
      logs: ['{"level": "info"}', '{"level": "error"}'],
    });
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    expect(result.parsed).toEqual({
      logs: [{ level: 'info' }, { level: 'error' }],
    });
  });

  it('should handle the real-world log line with stringified body', () => {
    const input = JSON.stringify({
      level: 'info',
      subscriber_id: 'ubc-bpp.pulseenergy.io',
      method: 'POST',
      url: '/bpp/receiver/cancel',
      body: '{"context":{"version":"2.0.0","action":"cancel"},"message":{"order":{"@type":"beckn:Order","beckn:id":"gpzx5k3b2t"}},"error":{}}',
      time: '2026-02-18T09:01:49Z',
    });
    const result = parseStringified(input);
    expect(result.success).toBe(true);
    const parsed = result.parsed as Record<string, unknown>;
    expect(parsed.level).toBe('info');
    expect(typeof parsed.body).toBe('object');
    const body = parsed.body as Record<string, unknown>;
    expect(body.context).toEqual({ version: '2.0.0', action: 'cancel' });
    expect((body.message as Record<string, unknown>).order).toEqual({
      '@type': 'beckn:Order',
      'beckn:id': 'gpzx5k3b2t',
    });
  });
});
