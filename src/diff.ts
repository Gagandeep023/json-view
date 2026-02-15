import type { DiffNode, DiffResult, DiffChangeType } from './types';

const MAX_DEPTH = 50;

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function buildPath(parent: string, key: string | number): string {
  if (typeof key === 'number') {
    return parent === '' ? `[${key}]` : `${parent}[${key}]`;
  }
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return parent === '' ? key : `${parent}.${key}`;
  }
  return parent === '' ? `["${key}"]` : `${parent}["${key}"]`;
}

function diffValues(
  oldVal: unknown,
  newVal: unknown,
  path: string,
  depth: number
): DiffNode[] {
  if (depth > MAX_DEPTH) return [];

  const oldType = typeOf(oldVal);
  const newType = typeOf(newVal);

  if (oldType !== newType) {
    return [{ path, type: 'modified', oldValue: oldVal, newValue: newVal }];
  }

  if (oldType === 'object' && oldVal !== null && newVal !== null) {
    return diffObjects(
      oldVal as Record<string, unknown>,
      newVal as Record<string, unknown>,
      path,
      depth
    );
  }

  if (oldType === 'array') {
    return diffArrays(oldVal as unknown[], newVal as unknown[], path, depth);
  }

  // Primitives and null
  if (oldVal !== newVal) {
    return [{ path, type: 'modified', oldValue: oldVal, newValue: newVal }];
  }

  return [];
}

function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  path: string,
  depth: number
): DiffNode[] {
  const changes: DiffNode[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const childPath = buildPath(path, key);
    const inOld = key in oldObj;
    const inNew = key in newObj;

    if (inOld && !inNew) {
      changes.push({ path: childPath, type: 'removed', oldValue: oldObj[key] });
    } else if (!inOld && inNew) {
      changes.push({ path: childPath, type: 'added', newValue: newObj[key] });
    } else {
      const childChanges = diffValues(oldObj[key], newObj[key], childPath, depth + 1);
      changes.push(...childChanges);
    }
  }

  return changes;
}

function diffArrays(
  oldArr: unknown[],
  newArr: unknown[],
  path: string,
  depth: number
): DiffNode[] {
  const changes: DiffNode[] = [];
  const maxLen = Math.max(oldArr.length, newArr.length);

  for (let i = 0; i < maxLen; i++) {
    const childPath = buildPath(path, i);
    if (i >= oldArr.length) {
      changes.push({ path: childPath, type: 'added', newValue: newArr[i] });
    } else if (i >= newArr.length) {
      changes.push({ path: childPath, type: 'removed', oldValue: oldArr[i] });
    } else {
      const childChanges = diffValues(oldArr[i], newArr[i], childPath, depth + 1);
      changes.push(...childChanges);
    }
  }

  return changes;
}

function countStats(changes: DiffNode[]): { added: number; removed: number; modified: number } {
  const stats = { added: 0, removed: 0, modified: 0 };
  for (const change of changes) {
    stats[change.type]++;
  }
  return stats;
}

export function diffJSON(oldVal: unknown, newVal: unknown): DiffResult {
  const changes = diffValues(oldVal, newVal, '', 0);
  return {
    hasChanges: changes.length > 0,
    changes,
    stats: countStats(changes),
  };
}

export function flattenDiff(changes: DiffNode[]): DiffNode[] {
  const flat: DiffNode[] = [];
  for (const change of changes) {
    flat.push(change);
    if (change.children) {
      flat.push(...flattenDiff(change.children));
    }
  }
  return flat;
}
