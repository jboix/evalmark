import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { parse } from 'yaml';

/** An input or output as `action.yml` declares it. */
interface Declared {
  readonly description: string;
  readonly default?: string;
}

const action = parse(readFileSync('action.yml', 'utf8')) as {
  readonly inputs: Record<string, Declared>;
  readonly outputs: Record<string, Declared>;
};
const readme = readFileSync('README.md', 'utf8');

/**
 * The README's table row for a name, as its cells.
 *
 * @param name - The input's or output's name.
 * @returns The cells, trimmed, or `undefined` when no row has that name.
 */
function rowOf(name: string): string[] | undefined {
  const line = readme.split('\n').find((entry) => entry.startsWith(`| \`${name}\` `));
  return line
    ?.split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

test('the README lists every input with its default', () => {
  for (const [name, input] of Object.entries(action.inputs)) {
    const row = rowOf(name);
    expect(row, name).toBeDefined();
    expect(row?.[1], name).toBe(input.default === undefined ? '' : `\`${input.default}\``);
  }
});

test('the README lists every output with its description', () => {
  for (const [name, output] of Object.entries(action.outputs)) {
    expect(rowOf(name)?.[1], name).toBe(output.description);
  }
});
