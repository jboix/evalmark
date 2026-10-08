import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import type { StoreIndex } from '../format/store.ts';
import { recordDemo } from './demo.ts';

const folders: string[] = [];

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe('recordDemo', () => {
  test('records the whole history with the store', async () => {
    const root = mkdtempSync(join(tmpdir(), 'evalmark-demo-'));
    folders.push(root);
    const site = join(root, 'site');
    mkdirSync(site);
    writeFileSync(join(site, 'index.html'), '<!doctype html>');
    const folder = join(root, 'demo');
    const count = await recordDemo(folder, site);
    const index = JSON.parse(readFileSync(join(folder, 'data/index.json'), 'utf8')) as StoreIndex;
    expect(index.runs).toHaveLength(count);
    expect(new Set(index.runs.map((run) => run.source.branch))).toContain('main');
    expect(readFileSync(join(folder, 'index.html'), 'utf8')).toBe('<!doctype html>');
    expect(readFileSync(join(folder, 'badges/pass-rate.svg'), 'utf8')).toContain('<svg');
  }, 60_000); // The whole history: 41 runs with their screenshots, slow on a busy machine.
});
