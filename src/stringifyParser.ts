import type { ParseStringifiedResult } from './types';

const MAX_NESTING = 10;

export function parseStringified(input: string): ParseStringifiedResult {
  if (!input.trim()) {
    return { success: false, error: 'Input is empty' };
  }

  let current: unknown;
  try {
    current = JSON.parse(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    return { success: false, error: message };
  }

  let nestingLevel = 0;

  while (typeof current === 'string' && nestingLevel < MAX_NESTING) {
    try {
      current = JSON.parse(current);
      nestingLevel++;
    } catch {
      // The string is not valid JSON, so we stop unwrapping
      break;
    }
  }

  return {
    success: true,
    parsed: current,
    nestingLevel,
  };
}
