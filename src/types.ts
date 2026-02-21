export interface FormatOptions {
  indent?: number;
  sortKeys?: boolean;
}

export interface FormatResult {
  success: boolean;
  formatted?: string;
  error?: string;
  errorLocation?: { line: number; column: number };
}

export type DiffChangeType = 'added' | 'removed' | 'modified';

export interface DiffNode {
  path: string;
  type: DiffChangeType;
  oldValue?: unknown;
  newValue?: unknown;
  children?: DiffNode[];
}

export interface DiffResult {
  hasChanges: boolean;
  changes: DiffNode[];
  stats: { added: number; removed: number; modified: number };
}

export interface ParseStringifiedResult {
  success: boolean;
  parsed?: unknown;
  error?: string;
  nestingLevel?: number;
  jsonExtracted?: boolean;
}
