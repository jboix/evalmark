import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Run, StoreIndex } from '../../src/format/store.ts';
import {
  cloneRef,
  commitsOf,
  filesUnder,
  gitIn,
  result,
  runAction,
  type Sandbox,
  sandbox,
  token,
  writeEvent,
  writeResult,
} from './helpers.ts';

let box: Sandbox;
beforeEach(() => {
  box = sandbox();
});
afterEach(() => box.cleanup());

/**
 * Reads the index from a clone.
 *
 * @param clone - The clone.
 * @param folder - The folder.
 * @returns The index.
 */
function indexIn(clone: string, folder = 'evalmark'): StoreIndex {
  return JSON.parse(readFileSync(join(clone, folder, 'data/index.json'), 'utf8'));
}

describe('recording', () => {
  test('the first run creates the orphan branch with the dashboard and the data', async () => {
    const file = writeResult(box, 'result.json', result('2026-10-08T10:00:00Z'));
    const outcome = await runAction(box, { result: file });
    expect(outcome.code).toBe(0);
    expect(outcome.log).not.toContain('::warning::');
    expect(outcome.outputs['run-id']).toBe('20261008T100000Z-1000-1');
    expect(outcome.outputs.recorded).toBe('true');
    expect(outcome.outputs['pass-rate']).toBe('0.5');
    expect(commitsOf(box)).toEqual(['chore(evalmark): record 20261008T100000Z-1000-1 [skip ci]']);
    const clone = cloneRef(box);
    expect(existsSync(join(clone, 'evalmark/index.html'))).toBe(true);
    expect(existsSync(join(clone, 'evalmark/badges/pass-rate.svg'))).toBe(true);
    expect(existsSync(join(clone, 'evalmark/badges/cost.json'))).toBe(true);
    const index = indexIn(clone);
    expect(index.suite).toBe('agent');
    expect(index.runs.map((entry) => entry.id)).toEqual(['20261008T100000Z-1000-1']);
    expect(index.runs[0]?.cases).toEqual({ q1: 'P', q2: 'F' });
    const run: Run = JSON.parse(
      readFileSync(join(clone, 'evalmark/data/runs/20261008T100000Z-1000-1.json'), 'utf8'),
    );
    const failing = run.cases[1]?.trials[0];
    expect(failing?.transcript).toBe('data/transcripts/20261008T100000Z-1000-1/q2/0.json.gz');
    expect(run.cases[0]?.trials[0]?.transcript).toBeUndefined();
    expect(run.cases[0]?.trials[0]?.transcriptMessages).toBe(2);
    const transcript = JSON.parse(
      gunzipSync(readFileSync(join(clone, 'evalmark', failing?.transcript ?? ''))).toString(),
    );
    expect(transcript[1].content).toBe('Using [redacted] and Bearer [redacted]');
    expect(outcome.summary).toContain('<!-- evalmark:agent model=m1 -->');
  });

  test('a second run adds a run on top of the first', async () => {
    await runAction(box, { result: writeResult(box, 'a.json', result('2026-10-08T10:00:00Z')) });
    const second = await runAction(
      box,
      {
        result: writeResult(
          box,
          'b.json',
          result('2026-10-08T11:00:00Z', { q1: 'fail', q2: 'pass' }),
        ),
      },
      { GITHUB_RUN_ID: '1001' },
    );
    expect(second.code).toBe(0);
    expect(commitsOf(box)).toHaveLength(2);
    const index = indexIn(cloneRef(box));
    expect(index.runs.map((entry) => entry.id)).toEqual([
      '20261008T110000Z-1001-1',
      '20261008T100000Z-1000-1',
    ]);
    expect(second.summary).toContain('**Regressed (1)**');
    expect(second.summary).toContain('`q1`: pass → fail');
  });

  test('retention prunes and squashes the history into one commit', async () => {
    for (const [hour, runId] of [
      ['10', '1'],
      ['11', '2'],
      ['12', '3'],
    ] as const) {
      const file = writeResult(box, `${runId}.json`, result(`2026-10-08T${hour}:00:00Z`));
      const outcome = await runAction(
        box,
        { result: file, 'keep-runs': '2' },
        { GITHUB_RUN_ID: runId },
      );
      expect(outcome.code).toBe(0);
    }
    expect(commitsOf(box)).toEqual(['chore(evalmark): record 20261008T120000Z-3-1 [skip ci]']);
    const clone = cloneRef(box);
    expect(indexIn(clone).runs.map((entry) => entry.id)).toEqual([
      '20261008T120000Z-3-1',
      '20261008T110000Z-2-1',
    ]);
    expect(existsSync(join(clone, 'evalmark/data/runs/20261008T100000Z-1-1.json'))).toBe(false);
    expect(existsSync(join(clone, 'evalmark/data/transcripts/20261008T100000Z-1-1'))).toBe(false);
  });

  test('history auto keeps the history and the other files of a gh-pages branch', async () => {
    const seed = cloneSeed(box, 'gh-pages');
    const pages = await runAction(box, {
      result: writeResult(box, 'a.json', result('2026-10-08T10:00:00Z')),
      branch: 'gh-pages',
      'keep-runs': '1',
    });
    expect(pages.code).toBe(0);
    const second = await runAction(
      box,
      {
        result: writeResult(box, 'b.json', result('2026-10-08T11:00:00Z')),
        branch: 'gh-pages',
        'keep-runs': '1',
      },
      { GITHUB_RUN_ID: '1001' },
    );
    expect(second.code).toBe(0);
    expect(commitsOf(box, 'refs/heads/gh-pages')).toHaveLength(3);
    const clone = cloneRef(box, 'refs/heads/gh-pages');
    expect(readFileSync(join(clone, 'index.html'), 'utf8')).toBe(seed);
    expect(indexIn(clone).runs).toHaveLength(1);
  });

  test('two runs recorded at once both land', async () => {
    const [first, second] = await Promise.all([
      runAction(box, { result: writeResult(box, 'a.json', result('2026-10-08T10:00:00Z')) }),
      runAction(
        box,
        { result: writeResult(box, 'b.json', result('2026-10-08T10:00:01Z')) },
        { GITHUB_RUN_ID: '1001' },
      ),
    ]);
    expect([first.code, second.code]).toEqual([0, 0]);
    expect([first.outputs.recorded, second.outputs.recorded]).toEqual(['true', 'true']);
    expect(indexIn(cloneRef(box)).runs).toHaveLength(2);
  });

  test('a full ref such as refs/evalmark/data', async () => {
    const outcome = await runAction(box, {
      result: writeResult(box, 'a.json', result('2026-10-08T10:00:00Z')),
      branch: 'refs/evalmark/data',
    });
    expect(outcome.code).toBe(0);
    expect(commitsOf(box, 'refs/evalmark/data')).toHaveLength(1);
    expect(gitIn(box.bare, 'branch', '--list').trim()).toBe('');
    expect(indexIn(cloneRef(box, 'refs/evalmark/data')).runs).toHaveLength(1);
  });

  test('a pull request from a fork pushes nothing and still reports', async () => {
    const event = writeEvent(box, {
      pull_request: {
        number: 7,
        base: { ref: 'main', repo: { full_name: 'owner/repo' } },
        head: { sha: 'b'.repeat(40), repo: { full_name: 'someone/repo' } },
      },
    });
    const outcome = await runAction(
      box,
      { result: writeResult(box, 'a.json', result('2026-10-08T10:00:00Z')), comment: 'false' },
      { GITHUB_EVENT_NAME: 'pull_request', GITHUB_EVENT_PATH: event, GITHUB_HEAD_REF: 'feature' },
    );
    expect(outcome.code).toBe(0);
    expect(outcome.outputs.recorded).toBe('false');
    expect(outcome.summary).toContain('No earlier run on `main`');
    expect(gitIn(box.bare, 'for-each-ref').trim()).toBe('');
  });

  test('a broken result file is a warning, or an error with fail-on-error', async () => {
    const file = writeResult(box, 'broken.json', { version: 1, cases: [] });
    const lenient = await runAction(box, { result: file });
    expect(lenient.code).toBe(0);
    expect(lenient.log).toContain('::warning::');
    expect(lenient.log).toContain('cases');
    expect(lenient.outputs.recorded).toBe('false');
    const strict = await runAction(box, { result: file, 'fail-on-error': 'true' });
    expect(strict.code).toBe(1);
    expect(strict.log).toContain('::error::');
  });

  test('export copies the folder into a path', async () => {
    const target = join(box.root, 'site');
    const empty = await runAction(box, { mode: 'export', path: target });
    expect(empty.code).toBe(0);
    expect(empty.log).toContain('::warning::Nothing to export');
    await runAction(box, { result: writeResult(box, 'a.json', result('2026-10-08T10:00:00Z')) });
    const exported = await runAction(box, { mode: 'export', path: target });
    expect(exported.code).toBe(0);
    expect(existsSync(join(target, 'index.html'))).toBe(true);
    expect(existsSync(join(target, 'data/index.json'))).toBe(true);
  });

  test('the token never appears in a stored file, an output or the log unmasked', async () => {
    const outcome = await runAction(box, {
      result: writeResult(box, 'a.json', result('2026-10-08T10:00:00Z')),
      transcripts: 'all',
    });
    expect(outcome.code).toBe(0);
    const clone = cloneRef(box);
    for (const path of filesUnder(clone)) {
      const content = path.endsWith('.gz') ? gunzipSync(readFileSync(path)) : readFileSync(path);
      expect(content.toString()).not.toContain(token);
    }
    expect(JSON.stringify(outcome.outputs)).not.toContain(token);
    expect(outcome.summary).not.toContain(token);
    const unmasked = outcome.log.replace(`::add-mask::${token}`, '');
    expect(unmasked).not.toContain(token);
    expect(gitIn(box.bare, 'cat-file', '--batch-all-objects', '--batch')).not.toContain(token);
  });
});

/**
 * Seeds the bare repository with a branch holding a site's own `index.html`.
 *
 * @param target - The sandbox.
 * @param branch - The branch.
 * @returns The page's content.
 */
function cloneSeed(target: Sandbox, branch: string): string {
  const directory = join(target.root, 'seed');
  gitIn(target.root, 'init', '-q', directory);
  const page = '<p>My site</p>\n';
  writeFileSync(join(directory, 'index.html'), page);
  gitIn(directory, 'add', '.');
  gitIn(directory, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'site');
  gitIn(directory, 'push', '-q', target.bare, `HEAD:refs/heads/${branch}`);
  return page;
}
