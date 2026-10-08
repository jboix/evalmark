import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { resultJsonSchema, schemaPath } from './write-schema.ts';

test('the committed JSON Schema matches the result format (run `pnpm run schema`)', () => {
  const committed = JSON.parse(readFileSync(schemaPath, 'utf8'));
  expect(committed).toEqual(resultJsonSchema());
});

test('the JSON Schema has an id and a title', () => {
  const schema = resultJsonSchema();
  expect(schema.$id).toBeTypeOf('string');
  expect(schema.title).toBe('evalmark result, version 1');
  expect(schema.$id).toBe('https://jboix.github.io/evalmark/schema/result.v1.json');
  expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
});

test('dates read as date-time, without the long pattern', () => {
  expect(JSON.stringify(resultJsonSchema())).not.toContain('"pattern"');
});
