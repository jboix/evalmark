import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Result } from '../../src/format/result.ts';
import type { Run, StoredMessage } from '../../src/format/store.ts';
import {
  cloneRef,
  commitsOf,
  filesUnder,
  gitIn,
  result,
  runAction,
  type Sandbox,
  sandbox,
  writeResult,
} from './helpers.ts';

let box: Sandbox;
beforeEach(() => {
  box = sandbox();
});
afterEach(() => box.cleanup());

/**
 * A result whose failing trial attaches the given files, at the end and in its transcript.
 *
 * @param startedAt - When it started.
 * @param paths - The attachment paths, relative to the result file.
 * @returns The result.
 */
function attachedResult(startedAt: string, paths: readonly string[]): Result {
  const base = result(startedAt);
  const attachments = paths.map((path) => ({ path, mediaType: 'image/png' as const }));
  const cases = base.cases.map((entry) => ({
    ...entry,
    trials: entry.trials.map((trial) => ({
      ...trial,
      attachments,
      transcript: [...(trial.transcript ?? []), { role: 'assistant' as const, attachments }],
    })),
  }));
  return { ...base, cases };
}

/**
 * Reads a stored transcript from a clone.
 *
 * @param clone - The clone.
 * @param path - The transcript's path, relative to the folder.
 * @returns Its messages.
 */
function transcriptIn(clone: string, path: string): StoredMessage[] {
  return JSON.parse(gunzipSync(readFileSync(join(clone, 'evalmark', path))).toString());
}

describe('attachments', () => {
  test('are stored once by content, for the trials that did not pass', async () => {
    writeFileSync(join(box.root, 'a.png'), 'same image');
    writeFileSync(join(box.root, 'b.png'), 'same image');
    const file = writeResult(
      box,
      'r.json',
      attachedResult('2026-10-08T10:00:00Z', ['a.png', 'b.png', 'gone.png']),
    );
    const outcome = await runAction(box, { result: file });
    expect(outcome.code).toBe(0);
    expect(outcome.log).toContain(
      '::warning::The result names 1 attachment file(s) that are not there',
    );
    const clone = cloneRef(box);
    expect(readdirSync(join(clone, 'evalmark/data/attachments'))).toHaveLength(1);
    const run: Run = JSON.parse(
      readFileSync(join(clone, 'evalmark/data/runs/20261008T100000Z-1000-1.json'), 'utf8'),
    );
    const stored = run.attachmentFiles?.[0] ?? '';
    expect(stored).toMatch(/^data\/attachments\/[0-9a-f]{64}\.png$/);
    expect(run.cases[0]?.trials[0]?.attachments).toEqual([
      { mediaType: 'image/png', bytes: 10 },
      { mediaType: 'image/png', bytes: 10 },
      { mediaType: 'image/png', bytes: 0, missing: true },
    ]);
    const failing = run.cases[1]?.trials[0];
    expect(failing?.attachments?.[0]).toEqual({ mediaType: 'image/png', bytes: 10, file: stored });
    const messages = transcriptIn(clone, failing?.transcript ?? '');
    expect(messages[2]?.attachments?.[1]?.file).toBe(stored);
    expect(Number(outcome.outputs['evalmark-size'])).toBeGreaterThan(0);
    expect(outcome.summary.trimEnd().split('\n').at(-1)).toMatch(
      /^The `evalmark` folder is .+ \(warning above 100 MB\)\. This run added .+\. Retention pruned nothing\.$/,
    );
  });

  test('are pruned after keep-attachments runs, transcripts rewritten and orphans deleted', async () => {
    writeFileSync(join(box.root, 'one.png'), 'first image');
    writeFileSync(join(box.root, 'two.png'), 'second image');
    const inputs = { 'keep-attachments': '1', 'keep-runs': '0' };
    const first = writeResult(box, '1.json', attachedResult('2026-10-08T10:00:00Z', ['one.png']));
    await runAction(box, { ...inputs, result: first }, { GITHUB_RUN_ID: '1' });
    const second = writeResult(box, '2.json', attachedResult('2026-10-08T11:00:00Z', ['two.png']));
    const outcome = await runAction(box, { ...inputs, result: second }, { GITHUB_RUN_ID: '2' });
    expect(outcome.code).toBe(0);
    expect(commitsOf(box)).toHaveLength(1);
    expect(outcome.summary).toContain(
      'Retention pruned the attachments of 1 run, 1 attachment file.',
    );
    const clone = cloneRef(box);
    const newest: Run = JSON.parse(
      readFileSync(join(clone, 'evalmark/data/runs/20261008T110000Z-2-1.json'), 'utf8'),
    );
    expect(
      readdirSync(join(clone, 'evalmark/data/attachments')).map(
        (name) => `data/attachments/${name}`,
      ),
    ).toEqual([...(newest.attachmentFiles ?? [])]);
    const old: Run = JSON.parse(
      readFileSync(join(clone, 'evalmark/data/runs/20261008T100000Z-1-1.json'), 'utf8'),
    );
    expect(old.attachmentFiles).toBeUndefined();
    const trial = old.cases[1]?.trials[0];
    expect(trial?.attachments).toEqual([{ mediaType: 'image/png', bytes: 11 }]);
    expect(transcriptIn(clone, trial?.transcript ?? '')[2]?.attachments).toEqual([
      { mediaType: 'image/png', bytes: 11 },
    ]);
  });

  test('a folder above warn-size-mb is a warning, and evalmark-size is its size', async () => {
    writeFileSync(join(box.root, 'big.png'), randomBytes(1_100_000));
    const file = writeResult(box, 'r.json', attachedResult('2026-10-08T10:00:00Z', ['big.png']));
    const outcome = await runAction(box, { result: file, 'warn-size-mb': '1' });
    expect(outcome.code).toBe(0);
    expect(outcome.log).toMatch(
      /::warning::The `evalmark` folder is 1\.\d MB, above `warn-size-mb` \(1 MB\)/,
    );
    const clone = cloneRef(box);
    const sizes = filesUnder(join(clone, 'evalmark')).map((path) => statSync(path).size);
    expect(Number(outcome.outputs['evalmark-size'])).toBe(
      sizes.reduce((total, size) => total + size, 0),
    );
    const quiet = await runAction(
      box,
      { result: file, 'warn-size-mb': '0' },
      { GITHUB_RUN_ID: '1001' },
    );
    expect(quiet.log).not.toContain('warn-size-mb');
  });

  test('a path out of the result folder is refused and nothing is recorded', async () => {
    const file = writeResult(
      box,
      'r.json',
      attachedResult('2026-10-08T10:00:00Z', ['../secret.png']),
    );
    const outcome = await runAction(box, { result: file });
    expect(outcome.code).toBe(0);
    expect(outcome.log).toContain('- ../secret.png');
    expect(outcome.outputs.recorded).toBe('false');
    expect(gitIn(box.bare, 'for-each-ref').trim()).toBe('');
  });
});
