import { describe, it, expect } from 'vitest';
import { diffJSON, flattenDiff } from '../index';

describe('diffJSON', () => {
  it('should detect added properties', () => {
    const result = diffJSON({ a: 1 }, { a: 1, b: 2 });
    expect(result.hasChanges).toBe(true);
    expect(result.stats.added).toBe(1);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: 'b', type: 'added', newValue: 2 })
    );
  });

  it('should detect removed properties', () => {
    const result = diffJSON({ a: 1, b: 2 }, { a: 1 });
    expect(result.hasChanges).toBe(true);
    expect(result.stats.removed).toBe(1);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: 'b', type: 'removed', oldValue: 2 })
    );
  });

  it('should detect modified properties', () => {
    const result = diffJSON({ a: 1 }, { a: 2 });
    expect(result.hasChanges).toBe(true);
    expect(result.stats.modified).toBe(1);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: 'a', type: 'modified', oldValue: 1, newValue: 2 })
    );
  });

  it('should return no changes for identical objects', () => {
    const result = diffJSON({ a: 1, b: 'hello' }, { a: 1, b: 'hello' });
    expect(result.hasChanges).toBe(false);
    expect(result.changes).toHaveLength(0);
    expect(result.stats).toEqual({ added: 0, removed: 0, modified: 0 });
  });

  it('should track nested object changes with path', () => {
    const result = diffJSON(
      { user: { name: 'Alice', age: 30 } },
      { user: { name: 'Bob', age: 30 } }
    );
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: 'user.name', type: 'modified' })
    );
  });

  it('should detect array index changes', () => {
    const result = diffJSON([1, 2, 3], [1, 4, 3]);
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: '[1]', type: 'modified', oldValue: 2, newValue: 4 })
    );
  });

  it('should detect array additions', () => {
    const result = diffJSON([1, 2], [1, 2, 3]);
    expect(result.stats.added).toBe(1);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: '[2]', type: 'added', newValue: 3 })
    );
  });

  it('should detect array removals', () => {
    const result = diffJSON([1, 2, 3], [1, 2]);
    expect(result.stats.removed).toBe(1);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: '[2]', type: 'removed', oldValue: 3 })
    );
  });

  it('should detect primitive-to-object type changes', () => {
    const result = diffJSON({ a: 'string' }, { a: { nested: true } });
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toContainEqual(
      expect.objectContaining({
        path: 'a',
        type: 'modified',
        oldValue: 'string',
        newValue: { nested: true },
      })
    );
  });

  it('should handle null values', () => {
    const result = diffJSON({ a: null }, { a: 'value' });
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: 'a', type: 'modified', oldValue: null, newValue: 'value' })
    );
  });

  it('should handle null to object change', () => {
    const result = diffJSON({ a: null }, { a: { b: 1 } });
    expect(result.hasChanges).toBe(true);
    expect(result.stats.modified).toBe(1);
  });

  it('should handle deeply nested changes', () => {
    const old = { a: { b: { c: { d: 1 } } } };
    const now = { a: { b: { c: { d: 2 } } } };
    const result = diffJSON(old, now);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: 'a.b.c.d', type: 'modified' })
    );
  });

  it('should handle keys with special characters', () => {
    const result = diffJSON({ 'my-key': 1 }, { 'my-key': 2 });
    expect(result.changes).toContainEqual(
      expect.objectContaining({ path: '["my-key"]', type: 'modified' })
    );
  });

  it('should diff primitive values at root', () => {
    const result = diffJSON(1, 2);
    expect(result.hasChanges).toBe(true);
    expect(result.stats.modified).toBe(1);
  });

  it('should return no changes for identical primitives', () => {
    const result = diffJSON('hello', 'hello');
    expect(result.hasChanges).toBe(false);
  });
});

describe('flattenDiff', () => {
  it('should return changes as-is when no children', () => {
    const changes = [
      { path: 'a', type: 'added' as const, newValue: 1 },
      { path: 'b', type: 'removed' as const, oldValue: 2 },
    ];
    expect(flattenDiff(changes)).toEqual(changes);
  });

  it('should flatten children recursively', () => {
    const changes = [
      {
        path: 'root',
        type: 'modified' as const,
        children: [{ path: 'root.child', type: 'added' as const, newValue: 1 }],
      },
    ];
    const flat = flattenDiff(changes);
    expect(flat).toHaveLength(2);
    expect(flat[1].path).toBe('root.child');
  });
});
