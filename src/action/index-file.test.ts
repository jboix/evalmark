import { describe, expect, test } from 'vitest';
import type { Run } from '../format/store.ts';
import { totalsOf } from '../format/totals.ts';
import { buildIndex, newestFirst, summaryOf } from './index-file.ts';

/**
 * A stored run for the tests.
 *
 * @param id - Its id.
 * @param startedAt - When it started.
 * @param title - The case's title.
 * @returns The run.
 */
function storedRun(id: string, startedAt: string, title: string): Run {
  return {
    version: 1,
    id,
    suite: 's',
    recordedAt: startedAt,
    startedAt,
    labels: { model: 'm' },
    source: { branch: 'main' },
    totals: totalsOf([]),
    cases: [
      {
        id: 'c1',
        title,
        status: 'flaky',
        trials: [{ status: 'pass' }, { status: 'fail', transcript: 'x.json.gz' }],
      },
      { id: `only-${id}`, tags: ['t'], status: 'skip', trials: [{ status: 'skip' }] },
    ],
  };
}

describe('index', () => {
  test('sorts newest first, then by id', () => {
    const entries = [
      { id: 'a', startedAt: '2026-10-01' },
      { id: 'c', startedAt: '2026-10-02' },
      { id: 'b', startedAt: '2026-10-02' },
    ];
    expect(newestFirst(entries).map((entry) => entry.id)).toEqual(['c', 'b', 'a']);
  });

  test('summarizes a run with letters and the transcript flag', () => {
    const summary = summaryOf(storedRun('r1', '2026-10-01T00:00:00.000Z', 'T'));
    expect(summary.cases).toEqual({ c1: 'PF', 'only-r1': 'S' });
    expect(summary.transcripts).toBe(true);
    expect(summary).not.toHaveProperty('suite');
  });

  test('rebuilds the index with each case from its newest run', () => {
    const index = buildIndex(
      [
        storedRun('old', '2026-10-01T00:00:00.000Z', 'Old title'),
        storedRun('new', '2026-10-02T00:00:00.000Z', 'New title'),
      ],
      's',
      '2026-10-03T00:00:00.000Z',
    );
    expect(index.version).toBe(1);
    expect(index.updatedAt).toBe('2026-10-03T00:00:00.000Z');
    expect(index.runs.map((run) => run.id)).toEqual(['new', 'old']);
    expect(index.cases).toEqual({
      c1: { title: 'New title' },
      'only-new': { tags: ['t'] },
      'only-old': { tags: ['t'] },
    });
  });
});
