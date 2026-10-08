import { describe, expect, test } from 'vitest';
import {
  baselineBranchOf,
  branchesOf,
  defaultBranch,
  filterKeysOf,
  filterRuns,
  labelKeysOf,
  labelParameter,
  labelsText,
  labelValuesOf,
  leadRunOf,
  runFiltersOf,
} from '../../src/site/lib/runs.ts';
import { summary } from './summaries.ts';

const runs = [
  summary({
    id: 'c',
    startedAt: '2026-10-03T10:00:00Z',
    branch: 'feat',
    pullRequest: 4,
    labels: { model: 'a' },
    cases: { q: 'P' },
  }),
  summary({
    id: 'b',
    startedAt: '2026-10-02T10:00:00Z',
    branch: 'main',
    labels: { model: 'b' },
    cases: { q: 'F' },
  }),
  summary({
    id: 'a',
    startedAt: '2026-10-01T10:00:00Z',
    branch: 'main',
    labels: { model: 'a', temp: '0' },
    cases: { q: 'P' },
  }),
];

describe('branches and labels', () => {
  test('the most common branch is the default', () => {
    expect(branchesOf(runs)).toEqual([
      { value: 'main', count: 2 },
      { value: 'feat', count: 1 },
    ]);
    expect(defaultBranch(runs)).toBe('main');
    expect(defaultBranch([])).toBeUndefined();
  });

  test('label keys and values are sorted and distinct', () => {
    expect(labelKeysOf(runs)).toEqual(['model', 'temp']);
    expect(labelValuesOf(runs, 'model')).toEqual(['a', 'b']);
    expect(labelsText({ model: 'a', temp: '0' })).toBe('model: a · temp: 0');
  });

  test('a pull request is compared with the default branch', () => {
    expect(baselineBranchOf(runs[0]!, 'main')).toBe('main');
    expect(baselineBranchOf(runs[1]!, 'main')).toBe('main');
  });
});

describe('filters', () => {
  test('come from the query, with a fallback branch and `all` for every branch', () => {
    expect(runFiltersOf({ [labelParameter('model')]: 'a', from: '2026-10-02' }, 'main')).toEqual({
      branch: 'main',
      labels: { model: 'a' },
      from: '2026-10-02',
      to: undefined,
    });
    expect(runFiltersOf({ branch: 'all' }, 'main').branch).toBeUndefined();
  });

  test('keep the runs that match every filter', () => {
    const ids = (query: Record<string, string>) =>
      filterRuns(runs, runFiltersOf(query)).map((run) => run.id);
    expect(ids({})).toEqual(['c', 'b', 'a']);
    expect(ids({ branch: 'main' })).toEqual(['b', 'a']);
    expect(ids({ 'label.model': 'a' })).toEqual(['c', 'a']);
    expect(ids({ from: '2026-10-02', to: '2026-10-02' })).toEqual(['b']);
  });
});

describe('leadRunOf', () => {
  test('leads with the newest run of the labels the branch runs most often', () => {
    const branch = [
      summary({ id: 'rare', startedAt: '2026-10-07T12:00:00Z', cases: {}, labels: { model: 'q' } }),
      summary({
        id: 'often',
        startedAt: '2026-10-07T11:00:00Z',
        cases: {},
        labels: { model: 'g' },
      }),
      summary({
        id: 'older',
        startedAt: '2026-10-06T11:00:00Z',
        cases: {},
        labels: { model: 'g' },
      }),
    ];
    expect(leadRunOf(branch)?.id).toBe('often');
  });

  test('takes the newest run on a tie, and nothing without runs', () => {
    const branch = [
      summary({ id: 'b', startedAt: '2026-10-07T12:00:00Z', cases: {}, labels: { model: 'b' } }),
      summary({ id: 'a', startedAt: '2026-10-07T11:00:00Z', cases: {}, labels: { model: 'a' } }),
    ];
    expect(leadRunOf(branch)?.id).toBe('b');
    expect(leadRunOf([])).toBeUndefined();
  });
});

describe('filterKeysOf', () => {
  const run = (id: string, labels: Record<string, string>) =>
    summary({ id, startedAt: '2026-10-07T12:00:00Z', cases: {}, labels });

  test('drops a key that follows from another, as a provider from its model', () => {
    const runs = [
      run('a', { model: 'gpt', provider: 'openai' }),
      run('b', { model: 'mini', provider: 'openai' }),
      run('c', { model: 'sonnet', provider: 'anthropic' }),
    ];
    expect(filterKeysOf(runs)).toEqual(['model']);
  });

  test('keeps the first by name when two keys follow from each other', () => {
    const runs = [
      run('a', { model: 'gpt', provider: 'openai' }),
      run('b', { model: 's', provider: 'x' }),
    ];
    expect(filterKeysOf(runs)).toEqual(['model']);
  });

  test('keeps keys that vary on their own', () => {
    const runs = [
      run('a', { model: 'gpt', temperature: '0' }),
      run('b', { model: 'gpt', temperature: '1' }),
      run('c', { model: 's', temperature: '0' }),
    ];
    expect(filterKeysOf(runs)).toEqual(['model', 'temperature']);
  });
});
