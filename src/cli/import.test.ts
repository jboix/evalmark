import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, test } from 'vitest';
import { resultSchema } from '../format/result.ts';
import { fileNameOf, importCommand } from './import.ts';

const directory = mkdtempSync(join(tmpdir(), 'evalmark-cli-import-'));
afterAll(() => rmSync(directory, { recursive: true, force: true }));

test('writes one numbered file per model', async () => {
  const out = join(directory, 'promptfoo');
  const paths = await importCommand([
    '--from',
    'test/import/fixtures/promptfoo-results.json',
    '--out',
    out,
  ]);
  expect(paths).toEqual([join(out, '1-gpt-5-mini.json'), join(out, '2-sonnet.json')]);
  for (const path of paths) {
    expect(resultSchema.safeParse(JSON.parse(readFileSync(path, 'utf8'))).success).toBe(true);
  }
});

test('takes the format and checks the arguments', async () => {
  const out = join(directory, 'junit');
  const paths = await importCommand([
    '--from',
    'test/import/fixtures/junit.xml',
    '--format',
    'junit',
    '--out',
    out,
  ]);
  expect(paths).toHaveLength(2);
  await expect(importCommand(['--from', 'x.json'])).rejects.toThrow('Usage');
  await expect(
    importCommand(['--from', 'x.json', '--out', out, '--format', 'csv']),
  ).rejects.toThrow('Unknown format csv');
});

test('names files safely', () => {
  const result = { version: 1 as const, cases: [] };
  expect(fileNameOf({ ...result, labels: { model: 'openai/gpt 5:mini' } }, 0)).toBe(
    '1-openai-gpt-5-mini.json',
  );
  expect(fileNameOf({ ...result, suite: '../..' }, 2)).toBe('3-result.json');
  expect(fileNameOf(result, 1)).toBe('2-result.json');
});
