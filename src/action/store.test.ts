import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Run, StoreIndex } from '../format/store.ts';
import { loadAttachments, noAttachmentFiles } from './attachment-files.ts';
import type { RunDraft } from './build-run.ts';
import { type StoreOptions, storeRun } from './store.ts';

let root: string;
let site: string;
let folder: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'evalmark-store-'));
  site = join(root, 'site');
  folder = join(root, 'folder');
  mkdirSync(site);
  writeFileSync(join(site, 'index.html'), '<html></html>');
  writeFileSync(join(site, 'app-new.js'), '');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/**
 * A draft for the tests.
 *
 * @param id - The run's id.
 * @param startedAt - When it started.
 * @param branch - Its branch.
 * @returns The draft.
 */
function draft(id: string, startedAt: string, branch = 'main'): RunDraft {
  return {
    result: {
      version: 1,
      startedAt,
      cases: [
        { id: 'c', trials: [{ status: 'fail', transcript: [{ role: 'user', content: 'x' }] }] },
      ],
    },
    id,
    suite: 'suite',
    source: { branch },
    recordedAt: startedAt,
    transcripts: 'failed',
    attachments: 'failed',
    attachmentFiles: noAttachmentFiles,
  };
}

/**
 * Store options for the tests.
 *
 * @param extra - Options to override.
 * @returns The options.
 */
function options(extra: Partial<StoreOptions> = {}): StoreOptions {
  return {
    keepRuns: 0,
    keepDays: 0,
    keepTranscripts: 0,
    keepAttachments: 0,
    badges: true,
    defaultBranch: 'main',
    siteDir: site,
    now: new Date('2026-10-08T00:00:00Z'),
    ...extra,
  };
}

describe('storeRun', () => {
  test('writes the run, its transcript, the index, the badges and the dashboard', async () => {
    mkdirSync(folder);
    writeFileSync(join(folder, 'app-old.js'), '');
    const outcome = await storeRun(folder, draft('r1', '2026-10-01T00:00:00Z'), options());
    expect(outcome.pruned).toBe(false);
    expect(existsSync(join(folder, 'data/runs/r1.json'))).toBe(true);
    expect(existsSync(join(folder, 'data/transcripts/r1/c/0.json.gz'))).toBe(true);
    const index: StoreIndex = JSON.parse(readFileSync(join(folder, 'data/index.json'), 'utf8'));
    expect(index.suite).toBe('suite');
    expect(index.runs[0]?.transcripts).toBe(true);
    expect(existsSync(join(folder, 'badges/pass-rate.svg'))).toBe(true);
    expect(existsSync(join(folder, 'app-new.js'))).toBe(true);
    expect(existsSync(join(folder, 'app-old.js'))).toBe(false);
  });

  test('gives a run a free id when the folder has one with the same id', async () => {
    await storeRun(folder, draft('r1', '2026-10-01T00:00:00Z'), options());
    const second = await storeRun(folder, draft('r1', '2026-10-01T00:00:00Z'), options());
    expect(second.run.id).toBe('r1-2');
    expect(second.index.runs).toHaveLength(2);
  });

  test('prunes runs and transcripts and says so', async () => {
    await storeRun(folder, draft('r1', '2026-10-01T00:00:00Z'), options());
    await storeRun(folder, draft('r2', '2026-10-02T00:00:00Z'), options());
    const outcome = await storeRun(
      folder,
      draft('r3', '2026-10-03T00:00:00Z'),
      options({ keepRuns: 2, keepTranscripts: 1 }),
    );
    expect(outcome.pruned).toBe(true);
    expect(outcome.index.runs.map((run) => run.id)).toEqual(['r3', 'r2']);
    expect(existsSync(join(folder, 'data/runs/r1.json'))).toBe(false);
    expect(existsSync(join(folder, 'data/transcripts/r2'))).toBe(false);
    const stripped: Run = JSON.parse(readFileSync(join(folder, 'data/runs/r2.json'), 'utf8'));
    expect(stripped.cases[0]?.trials[0]).toEqual({ status: 'fail', transcriptMessages: 1 });
    expect(outcome.index.runs[1]?.transcripts).toBe(false);
  });

  test('writes no badges without a run on the default branch', async () => {
    await storeRun(folder, draft('r1', '2026-10-01T00:00:00Z', 'feature'), options());
    expect(existsSync(join(folder, 'badges'))).toBe(false);
  });

  test('fails when the dashboard is not built', async () => {
    const missing = options({ siteDir: join(root, 'nowhere') });
    await expect(storeRun(folder, draft('r1', '2026-10-01T00:00:00Z'), missing)).rejects.toThrow(
      'not built',
    );
  });

  test('stores an attachment once, prunes its files after keepAttachments runs, and deletes orphans', async () => {
    const results = join(root, 'results');
    mkdirSync(results);
    writeFileSync(join(results, 'shared.png'), 'shared');
    writeFileSync(join(results, 'own.png'), 'own');
    const attached = async (id: string, startedAt: string, paths: string[]): Promise<RunDraft> => {
      const base = draft(id, startedAt);
      const attachments = paths.map((path) => ({ path, mediaType: 'image/png' as const }));
      const [trial] = base.result.cases[0]?.trials ?? [];
      const transcript = [{ role: 'assistant' as const, attachments }];
      const result = {
        ...base.result,
        cases: [
          { id: 'c', trials: [{ ...trial, status: 'fail' as const, attachments, transcript }] },
        ],
      };
      const { files } = await loadAttachments(result, results);
      return { ...base, result, attachmentFiles: files };
    };
    const first = await storeRun(
      folder,
      await attached('r1', '2026-10-01T00:00:00Z', ['shared.png', 'own.png']),
      options({ keepAttachments: 1 }),
    );
    expect(first.run.attachmentFiles).toHaveLength(2);
    expect(readdirSync(join(folder, 'data/attachments'))).toHaveLength(2);
    expect(first.addedBytes).toBeGreaterThan(9);
    expect(first.folderBytes).toBeGreaterThan(first.addedBytes);
    const second = await storeRun(
      folder,
      await attached('r2', '2026-10-02T00:00:00Z', ['shared.png']),
      options({ keepAttachments: 1 }),
    );
    expect(second.pruned).toBe(true);
    expect(second.retention).toEqual({ runs: 0, transcripts: 0, attachments: 1, files: 1 });
    const [kept] = readdirSync(join(folder, 'data/attachments'));
    expect(second.run.attachmentFiles).toEqual([`data/attachments/${kept}`]);
    const old: Run = JSON.parse(readFileSync(join(folder, 'data/runs/r1.json'), 'utf8'));
    expect(old.attachmentFiles).toBeUndefined();
    expect(old.cases[0]?.trials[0]?.attachments?.every((entry) => entry.file === undefined)).toBe(
      true,
    );
    const transcript = JSON.parse(
      gunzipSync(readFileSync(join(folder, 'data/transcripts/r1/c/0.json.gz'))).toString(),
    );
    expect(transcript[0].attachments).toEqual([
      { mediaType: 'image/png', bytes: 6 },
      { mediaType: 'image/png', bytes: 3 },
    ]);
  });
});
