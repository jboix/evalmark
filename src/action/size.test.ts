import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  folderSize,
  formatBytes,
  prunedText,
  type SizeReport,
  sizeLine,
  sizeWarning,
} from './size.ts';

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'evalmark-size-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const nothing = { runs: 0, transcripts: 0, attachments: 0, files: 0 };

/**
 * A size report for the tests.
 *
 * @param extra - Fields to override.
 * @returns The report.
 */
function report(extra: Partial<SizeReport> = {}): SizeReport {
  return {
    folder: 'evalmark',
    folderBytes: 12_345_678,
    addedBytes: 4567,
    warnSizeMb: 100,
    pruned: nothing,
    ...extra,
  };
}

describe('folderSize', () => {
  test('adds up every file under the folder', async () => {
    mkdirSync(join(root, 'a/b'), { recursive: true });
    writeFileSync(join(root, 'one'), '12345');
    writeFileSync(join(root, 'a/b/two'), '123');
    expect(await folderSize(root)).toBe(8);
    expect(await folderSize(join(root, 'missing'))).toBe(0);
  });
});

describe('formatBytes', () => {
  test('uses decimal units', () => {
    expect(formatBytes(950)).toBe('950 B');
    expect(formatBytes(12_300)).toBe('12.3 kB');
    expect(formatBytes(4_500_000)).toBe('4.5 MB');
    expect(formatBytes(250_000_000)).toBe('250 MB');
    expect(formatBytes(1_200_000_000)).toBe('1.2 GB');
  });
});

describe('the size line and warning', () => {
  test('the line says the size, the threshold, what the run added and what was pruned', () => {
    expect(sizeLine(report())).toBe(
      'The `evalmark` folder is 12.3 MB (warning above 100 MB). This run added 4.6 kB. Retention pruned nothing.',
    );
    expect(sizeLine(report({ warnSizeMb: 0 }))).toContain('(no size warning)');
  });

  test('names what retention pruned', () => {
    expect(prunedText({ runs: 1, transcripts: 2, attachments: 1, files: 3 })).toBe(
      '1 run, the transcripts of 2 runs, the attachments of 1 run, 3 attachment files',
    );
  });

  test('warns above the threshold only, never at 0', () => {
    expect(sizeWarning(report())).toBeUndefined();
    const warning = sizeWarning(report({ warnSizeMb: 10 }));
    expect(warning).toContain('12.3 MB, above `warn-size-mb` (10 MB)');
    expect(warning).toContain('`keep-attachments`');
    expect(warning).toContain('`attachments: none`');
    expect(sizeWarning(report({ warnSizeMb: 0, folderBytes: 10 ** 12 }))).toBeUndefined();
  });
});
