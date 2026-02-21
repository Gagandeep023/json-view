import type { ParseStringifiedResult } from './types';

const MAX_NESTING = 10;

/**
 * Try to extract a JSON substring from text that contains non-JSON prefixes
 * (e.g. log lines like "[timestamp] INFO response {...}")
 */
function extractJsonFromText(input: string): string | null {
  const firstBrace = input.indexOf('{');
  const firstBracket = input.indexOf('[');

  const candidates: number[] = [];
  if (firstBrace !== -1) candidates.push(firstBrace);
  if (firstBracket !== -1) candidates.push(firstBracket);

  if (candidates.length === 0) return null;

  // Try from earliest JSON-like character
  candidates.sort((a, b) => a - b);

  for (const start of candidates) {
    const substring = input.substring(start).trim();
    try {
      JSON.parse(substring);
      return substring;
    } catch {
      // Try to find the matching closing bracket from the end
      const opener = input[start];
      const closer = opener === '{' ? '}' : ']';
      const lastClose = input.lastIndexOf(closer);
      if (lastClose > start) {
        const bounded = input.substring(start, lastClose + 1);
        try {
          JSON.parse(bounded);
          return bounded;
        } catch {
          // continue to next candidate
        }
      }
    }
  }

  return null;
}

/**
 * Recursively walk through a parsed object/array and parse any string values
 * that are themselves valid JSON objects or arrays.
 */
function deepParseValues(value: unknown, depth: number = 0): unknown {
  if (depth > MAX_NESTING) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return deepParseValues(parsed, depth + 1);
      } catch {
        return value;
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepParseValues(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = deepParseValues(val, depth + 1);
    }
    return result;
  }

  return value;
}

export function parseStringified(input: string): ParseStringifiedResult {
  if (!input.trim()) {
    return { success: false, error: 'Input is empty' };
  }

  let current: unknown;
  let jsonExtracted = false;

  try {
    current = JSON.parse(input);
  } catch {
    // Try to extract JSON from text with non-JSON prefix (e.g. log lines)
    const extracted = extractJsonFromText(input);
    if (extracted) {
      try {
        current = JSON.parse(extracted);
        jsonExtracted = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid JSON';
        return { success: false, error: message };
      }
    } else {
      // Try original parse again to get the actual error message
      try {
        JSON.parse(input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid JSON';
        return { success: false, error: message };
      }
    }
  }

  let nestingLevel = 0;

  // Unwrap top-level stringified JSON
  while (typeof current === 'string' && nestingLevel < MAX_NESTING) {
    try {
      current = JSON.parse(current);
      nestingLevel++;
    } catch {
      break;
    }
  }

  // Deep parse: recursively parse stringified JSON values within the object
  current = deepParseValues(current);

  return {
    success: true,
    parsed: current,
    nestingLevel,
    jsonExtracted,
  };
}
