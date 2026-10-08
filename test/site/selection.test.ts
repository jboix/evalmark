import { describe, expect, test } from 'vitest';
import {
  runSelectionQuery,
  selectionOf,
  selectionQuery,
  selectRuns,
  windowOf,
} from '../../src/site/lib/selection.ts';
import { summary } from './summaries.ts';

/** Runs on main with two models, flash the most often, and one on a feature branch. */
const runs = [
  summary({
    id: 'f2',
    startedAt: '2026-10-06T00:00:00Z',
    cases: {},
    branch: 'main',
    labels: { model: 'flash' },
  }),
  summary({
    id: 'p1',
    startedAt: '2026-10-05T00:00:00Z',
    cases: {},
    branch: 'main',
    labels: { model: 'pro' },
  }),
  summary({
    id: 'f1',
    startedAt: '2026-10-04T00:00:00Z',
    cases: {},
    branch: 'main',
    labels: { model: 'flash' },
  }),
  summary({
    id: 'f0',
    startedAt: '2026-10-03T00:00:00Z',
    cases: {},
    branch: 'main',
    labels: { model: 'flash' },
  }),
  summary({
    id: 'x1',
    startedAt: '2026-10-07T00:00:00Z',
    cases: {},
    branch: 'x',
    labels: { model: 'pro' },
  }),
];

describe('windowOf', () => {
  test('reads 10, 20, 50 and all, 20 for anything else', () => {
    expect(windowOf('10')).toBe(10);
    expect(windowOf('50')).toBe(50);
    expect(windowOf('all')).toBeUndefined();
    expect(windowOf(undefined)).toBe(20);
    expect(windowOf('7')).toBe(20);
  });
});

describe('selectionOf', () => {
  test('defaults to the busiest branch and the labels it runs most often', () => {
    expect(selectionOf({}, runs)).toEqual({
      branch: 'main',
      labels: { model: 'flash' },
      open: [],
      window: 20,
    });
  });

  test('reads every branch and every value from the query', () => {
    const selection = selectionOf({ branch: 'all', 'label.model': 'all', window: '10' }, runs);
    expect(selection).toEqual({ branch: undefined, labels: {}, open: ['model'], window: 10 });
  });

  test('takes the default labels from the chosen branch', () => {
    expect(selectionOf({ branch: 'x' }, runs).labels).toEqual({ model: 'pro' });
  });
});

describe('selectRuns', () => {
  test('keeps the branch and label values, newest first, up to the window', () => {
    const selection = { branch: 'main', labels: { model: 'flash' }, open: [], window: 2 };
    expect(selectRuns(runs, selection).map((run) => run.id)).toEqual(['f2', 'f1']);
    expect(selectRuns(runs, { ...selection, window: undefined }).map((run) => run.id)).toEqual([
      'f2',
      'f1',
      'f0',
    ]);
  });

  test('applies the window to each value of an open key', () => {
    const selection = { branch: 'main', labels: {}, open: ['model'], window: 1 };
    expect(selectRuns(runs, selection).map((run) => run.id)).toEqual(['f2', 'p1']);
  });
});

describe('selection queries', () => {
  test('keep the branch, the labels and the window for links', () => {
    expect(
      selectionQuery({ branch: undefined, labels: { a: 'b' }, open: ['model'], window: 10 }),
    ).toEqual({ branch: 'all', window: '10', 'label.a': 'b', 'label.model': 'all' });
  });

  test("select a run's branch and labels", () => {
    const run = runs[0];
    if (run === undefined) throw new Error('No run.');
    expect(runSelectionQuery(run)).toEqual({ branch: 'main', 'label.model': 'flash' });
  });
});
