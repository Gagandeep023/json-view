# @gagandeep023/json-view

Zero-dependency JSON tools for formatting, diffing, and un-stringifying JSON. Works in Node.js and the browser.

[![npm version](https://img.shields.io/npm/v/@gagandeep023/json-view.svg)](https://www.npmjs.com/package/@gagandeep023/json-view)
[![license](https://img.shields.io/npm/l/@gagandeep023/json-view.svg)](https://github.com/Gagandeep023/json-view/blob/main/LICENSE)

## Installation

npm:

    npm install @gagandeep023/json-view

yarn:

    yarn add @gagandeep023/json-view

pnpm:

    pnpm add @gagandeep023/json-view

## Quick Start

```typescript
import { formatJSON, diffJSON, parseStringified } from '@gagandeep023/json-view';

// Format JSON with 2-space indent
const result = formatJSON('{"name":"Alice","age":30}');
console.log(result.formatted);

// Diff two objects
const diff = diffJSON({ a: 1 }, { a: 2, b: 3 });
console.log(diff.stats); // { added: 1, removed: 0, modified: 1 }

// Un-stringify nested JSON
const parsed = parseStringified('"{\\"key\\":\\"value\\"}"');
console.log(parsed.parsed); // { key: "value" }
```

## API Reference

### `formatJSON(input, options?)`

Parse and beautify a JSON string with configurable indentation and optional key sorting.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `input` | `string` | Yes | - | Raw JSON string to format |
| `options.indent` | `number` | No | `2` | Number of spaces for indentation |
| `options.sortKeys` | `boolean` | No | `false` | Sort object keys alphabetically (recursive) |

**Returns:** `FormatResult`

```typescript
const result = formatJSON('{"z":3,"a":1}', { indent: 4, sortKeys: true });
// result.success === true
// result.formatted === '{\n    "a": 1,\n    "z": 3\n}'
```

### `minifyJSON(input)`

Compact a JSON string into a single line with no whitespace.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `string` | Yes | JSON string to minify |

**Returns:** `FormatResult`

```typescript
const result = minifyJSON('{\n  "a": 1,\n  "b": 2\n}');
// result.formatted === '{"a":1,"b":2}'
```

### `validateJSON(input)`

Check if a string is valid JSON. Returns error details with line/column on failure.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `string` | Yes | JSON string to validate |

**Returns:** `FormatResult`

```typescript
const result = validateJSON('{"a": }');
// result.success === false
// result.error === "Expected value at line 1, column 7"
// result.errorLocation === { line: 1, column: 7 }
```

### `diffJSON(oldVal, newVal)`

Deep recursive comparison of two parsed JSON values. Handles objects, arrays, primitives, null, and type mismatches. Max depth: 50 levels.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `oldVal` | `unknown` | Yes | Original parsed JSON value |
| `newVal` | `unknown` | Yes | Modified parsed JSON value |

**Returns:** `DiffResult`

```typescript
const diff = diffJSON(
  { user: { name: 'Alice', role: 'admin' } },
  { user: { name: 'Bob', role: 'admin', active: true } }
);
// diff.hasChanges === true
// diff.stats === { added: 1, removed: 0, modified: 1 }
// diff.changes[0] === { path: 'user.name', type: 'modified', oldValue: 'Alice', newValue: 'Bob' }
// diff.changes[1] === { path: 'user.active', type: 'added', newValue: true }
```

### `flattenDiff(changes)`

Flatten a tree of `DiffNode` children into a linear array.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `changes` | `DiffNode[]` | Yes | Array of diff nodes (potentially with children) |

**Returns:** `DiffNode[]`

### `parseStringified(input)`

Iteratively `JSON.parse` a value until it stops being a string. Useful for un-escaping double/triple-stringified JSON from logs, APIs, or databases. Max nesting depth: 10.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `string` | Yes | Stringified JSON to unwrap |

**Returns:** `ParseStringifiedResult`

```typescript
// Double-stringified JSON (common in logs)
const input = JSON.stringify(JSON.stringify({ key: 'value' }));
const result = parseStringified(input);
// result.parsed === { key: 'value' }
// result.nestingLevel === 1
```

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  FormatOptions,
  FormatResult,
  DiffChangeType,
  DiffNode,
  DiffResult,
  ParseStringifiedResult,
} from '@gagandeep023/json-view';
```

## License

MIT
