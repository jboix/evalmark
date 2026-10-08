/**
 * `evalmark import`: converts another tool's eval output (promptfoo, Inspect AI, JUnit XML) to result
 * files, one per model, so the conversion can be read before it is recorded.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import type { Result } from '../format/result.ts';
import { type ImportFormat, importFormats, importResults } from '../import/import-results.ts';

/** How `evalmark import` is called. */
export const importUsage = `evalmark import --from <file> --out <folder> [--format auto|${importFormats.join('|')}]`;

/**
 * The file name of the n-th converted result: its number and its model, safe in a path.
 *
 * @param result - The result.
 * @param index - Its position, from 0.
 * @returns The file name, such as `1-gpt-5-mini.json`.
 */
export function fileNameOf(result: Result, index: number): string {
  const name = result.labels?.model ?? result.suite ?? 'result';
  const safe = name.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|-+$/g, '') || 'result';
  return `${index + 1}-${safe}.json`;
}

/**
 * Reads the `--format` option.
 *
 * @param value - The option, if given.
 * @returns The format, or `auto`.
 * @throws When it is not a known format.
 */
function formatOf(value: string | undefined): ImportFormat | 'auto' {
  if (value === undefined || value === 'auto') return 'auto';
  const format = importFormats.find((known) => known === value);
  if (format === undefined) throw new Error(`Unknown format ${value}. Usage: ${importUsage}`);
  return format;
}

/**
 * Converts a file and writes each result into a folder.
 *
 * @param args - The command's arguments.
 * @returns The paths written, in order.
 * @throws When an argument is missing, or the file does not convert.
 */
export async function importCommand(args: string[]): Promise<string[]> {
  const { values } = parseArgs({
    args,
    options: {
      from: { type: 'string' },
      out: { type: 'string' },
      format: { type: 'string' },
    },
  });
  if (!values.from || !values.out) throw new Error(`Usage: ${importUsage}`);
  const results = await importResults(values.from, formatOf(values.format));
  await mkdir(values.out, { recursive: true });
  const paths = results.map((result, index) => join(values.out ?? '', fileNameOf(result, index)));
  await Promise.all(
    results.map((result, index) =>
      writeFile(paths[index] ?? '', `${JSON.stringify(result, null, 2)}\n`),
    ),
  );
  return paths;
}
