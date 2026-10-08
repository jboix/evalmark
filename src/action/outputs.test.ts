import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { outputsText, writeOutputs, writeSummary } from './outputs.ts';

const folder = mkdtempSync(join(tmpdir(), 'evalmark-outputs-'));
afterAll(() => rmSync(folder, { recursive: true, force: true }));

describe('outputs', () => {
  test('writes each value between delimiters', () => {
    const text = outputsText({ 'run-id': 'r1', recorded: 'true' });
    expect(text).toMatch(
      /^run-id<<(evalmark_[0-9a-f]+)\nr1\n\1\nrecorded<<(evalmark_[0-9a-f]+)\ntrue\n\2\n$/,
    );
  });

  test('appends to the files GitHub names, and skips them when unset', async () => {
    const output = join(folder, 'output');
    const summary = join(folder, 'summary');
    writeFileSync(output, 'before=1\n');
    await writeOutputs(output, {
      'run-id': 'r',
      'pass-rate': '0.5',
      recorded: 'true',
      'run-url': '',
      'evalmark-size': '',
    });
    await writeSummary(summary, '### hello');
    await writeSummary(undefined, 'ignored');
    await writeOutputs(undefined, {
      'run-id': '',
      'pass-rate': '',
      recorded: '',
      'run-url': '',
      'evalmark-size': '',
    });
    expect(readFileSync(output, 'utf8').startsWith('before=1\nrun-id<<')).toBe(true);
    expect(readFileSync(output, 'utf8')).toContain('\n0.5\n');
    expect(readFileSync(summary, 'utf8')).toBe('### hello\n');
  });
});
