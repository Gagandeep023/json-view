import type { FormatOptions, FormatResult } from './types';

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function extractErrorLocation(
  message: string,
  input: string
): { line: number; column: number } | undefined {
  const posMatch = message.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    let line = 1;
    let column = 1;
    for (let i = 0; i < pos && i < input.length; i++) {
      if (input[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    return { line, column };
  }
  return undefined;
}

export function validateJSON(input: string): FormatResult {
  if (!input.trim()) {
    return { success: false, error: 'Input is empty' };
  }
  try {
    JSON.parse(input);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    return {
      success: false,
      error: message,
      errorLocation: extractErrorLocation(message, input),
    };
  }
}

export function formatJSON(input: string, options?: FormatOptions): FormatResult {
  if (!input.trim()) {
    return { success: false, error: 'Input is empty' };
  }
  const indent = options?.indent ?? 2;
  const shouldSortKeys = options?.sortKeys ?? false;

  try {
    let parsed = JSON.parse(input);
    if (shouldSortKeys) {
      parsed = sortKeysDeep(parsed);
    }
    const formatted = JSON.stringify(parsed, null, indent);
    return { success: true, formatted };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    return {
      success: false,
      error: message,
      errorLocation: extractErrorLocation(message, input),
    };
  }
}

export function minifyJSON(input: string): FormatResult {
  if (!input.trim()) {
    return { success: false, error: 'Input is empty' };
  }
  try {
    const parsed = JSON.parse(input);
    const formatted = JSON.stringify(parsed);
    return { success: true, formatted };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    return {
      success: false,
      error: message,
      errorLocation: extractErrorLocation(message, input),
    };
  }
}
