import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, test } from 'vitest';
import { recordCommand } from './record.ts';

const root = mkdtempSync(join(tmpdir(), 'evalmark-cli-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

test('evalmark record stores a run with its labels into a folder', async () => {
  const site = join(root, 'site');
  mkdirSync(site);
  writeFileSync(join(site, 'index.html'), '');
  const result = join(root, 'result.json');
  writeFileSync(
    result,
    JSON.stringify({ version: 1, cases: [{ id: 'a', trials: [{ status: 'pass' }] }] }),
  );
  const dir = join(root, 'out');
  const args = ['--result', result, '--dir', dir, '--labels', 'model=x', '--labels', 'k=v'];
  const outcome = await recordCommand([...args, '--suite', 'mine'], site);
  expect(outcome.run.labels).toEqual({ model: 'x', k: 'v' });
  expect(outcome.index.suite).toBe('mine');
  expect(existsSync(join(dir, 'index.html'))).toBe(true);
  expect(existsSync(join(dir, 'data', 'runs', `${outcome.run.id}.json`))).toBe(true);
  await expect(recordCommand(['--dir', dir], site)).rejects.toThrow('Usage');
});
