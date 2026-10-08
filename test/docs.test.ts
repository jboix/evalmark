import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { resultSchema } from '../src/format/result.ts';

test('every JSON example of the result format validates', () => {
  const markdown = readFileSync('docs/result-format.md', 'utf8');
  const examples = [...markdown.matchAll(/```json\n([\s\S]*?)```/g)].map((match) => match[1] ?? '');
  expect(examples.length).toBeGreaterThanOrEqual(2);
  for (const example of examples) {
    const parsed = resultSchema.safeParse(JSON.parse(example));
    expect(parsed.error).toBeUndefined();
  }
});
