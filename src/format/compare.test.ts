import { describe, expect, test } from 'vitest';
import { baselineOf, diffRuns, sameLabels } from './compare.ts';
import type { RunSummary } from './store.ts';
import { totalsOf } from './totals.ts';

/**
 * A run summary for the tests.
 *
 * @param id - Its id.
 * @param cases - Its cases' letters.
 * @param extra - Fields to override.
 * @returns The summary.
 */
function run(
  id: string,
  cases: Record<string, string>,
  extra: Partial<RunSummary> = {},
): RunSummary {
  return {
    id,
    recordedAt: '2026-10-01T00:00:00Z',
    startedAt: '2026-10-01T00:00:00Z',
    labels: {},
    source: { branch: 'main' },
    totals: totalsOf([]),
    cases,
    transcripts: false,
    ...extra,
  };
}

describe('sameLabels', () => {
  test('compares keys and values', () => {
    expect(sameLabels({ model: 'a' }, { model: 'a' })).toBe(true);
    expect(sameLabels({ model: 'a' }, { model: 'b' })).toBe(false);
    expect(sameLabels({ model: 'a' }, { model: 'a', provider: 'x' })).toBe(false);
  });
});

describe('baselineOf', () => {
  const head = run('head', {}, { startedAt: '2026-10-03T00:00:00Z', labels: { model: 'a' } });

  test('prefers the newest earlier run on the branch with the same labels', () => {
    const runs = [
      run('other-branch', {}, { source: { branch: 'x' }, labels: { model: 'a' } }),
      run('other-model', {}, { startedAt: '2026-10-02T00:00:00Z', labels: { model: 'b' } }),
      run('same-model', {}, { startedAt: '2026-10-01T00:00:00Z', labels: { model: 'a' } }),
    ];
    expect(baselineOf([head, ...runs], head, 'main')?.id).toBe('same-model');
  });

  test('falls back to the newest earlier run on the branch', () => {
    const runs = [run('other-model', {}, { labels: { model: 'b' } })];
    expect(baselineOf(runs, head, 'main')?.id).toBe('other-model');
  });

  test('finds nothing on an empty branch', () => {
    expect(baselineOf([head], head, 'main')).toBeUndefined();
  });
});

describe('diffRuns', () => {
  test('sorts the cases into regressed, fixed, still failing, added and removed', () => {
    const base = run('base', { a: 'PP', b: 'FF', c: 'FF', d: 'PF', gone: 'P' });
    const head = run('head', { a: 'PF', b: 'PP', c: 'FF', d: 'PP', fresh: 'F' });
    const diff = diffRuns(base, head);
    expect(diff.regressed.map((change) => change.id)).toEqual(['a']);
    expect(diff.fixed.map((change) => change.id)).toEqual(['b', 'd']);
    expect(diff.stillFailing.map((change) => change.id)).toEqual(['c']);
    expect(diff.added).toEqual([{ id: 'fresh', before: undefined, after: 'fail' }]);
    expect(diff.removed).toEqual(['gone']);
  });

  test('computes the deltas', () => {
    const base = run('base', {}, { totals: totalsOf([{ trials: [{ status: 'fail' }] }]) });
    const head = run(
      'head',
      {},
      { totals: totalsOf([{ trials: [{ status: 'pass', usage: { costUsd: 1 } }] }]) },
    );
    const diff = diffRuns(base, head);
    expect(diff.passRateDelta).toBe(1);
    expect(diff.costDelta).toBe(1);
  });
});
