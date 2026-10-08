import { describe, expect, test } from 'vitest';
import type { Run } from '../../src/format/store.ts';
import { totalsOf } from '../../src/format/totals.ts';
import {
  caseUsage,
  checkRows,
  failingChecks,
  runCaseColumns,
  runCaseRows,
} from '../../src/site/lib/run.ts';
import { sortTable } from '../../src/site/lib/sort.ts';

describe('a run', () => {
  test('names the failing checks, most often first, errors included', () => {
    const checks = failingChecks([
      {
        status: 'fail',
        checks: [
          { id: 'units', pass: false, message: 'Wrong unit' },
          { id: 'built', pass: true },
        ],
      },
      {
        status: 'fail',
        checks: [
          { id: 'units', pass: false },
          { id: 'query', pass: false },
        ],
      },
      { status: 'error', error: 'Timed out' },
      { status: 'pass', checks: [{ id: 'units', pass: true }] },
    ]);
    expect(checks).toEqual([
      { id: 'units', count: 2, message: 'Wrong unit' },
      { id: 'error', count: 1, message: 'Timed out' },
      { id: 'query', count: 1, message: undefined },
    ]);
  });

  test('joins declared checks with results', () => {
    const rows = checkRows(
      [{ id: 'built', description: 'Built' }, { id: 'units' }],
      [
        { id: 'units', pass: false, message: 'Wrong' },
        { id: 'extra', pass: true },
      ],
    );
    expect(rows).toEqual([
      { id: 'built', description: 'Built', state: 'none', message: undefined },
      { id: 'units', description: undefined, state: 'fail', message: 'Wrong' },
      { id: 'extra', description: undefined, state: 'pass', message: undefined },
    ]);
  });

  test('sums a case usage', () => {
    expect(
      caseUsage([
        { status: 'pass', durationMs: 1000, usage: { costUsd: 0.5 } },
        { status: 'skip' },
      ]),
    ).toEqual({ costUsd: 0.5, durationMs: 1000 });
  });
});

describe("a run's table", () => {
  const run: Run = {
    version: 1,
    id: 'r',
    suite: 's',
    recordedAt: '2026-10-01T00:00:00Z',
    startedAt: '2026-10-01T00:00:00Z',
    labels: {},
    source: {},
    totals: totalsOf([]),
    cases: [
      {
        id: 'b',
        title: 'Bravo',
        status: 'fail',
        trials: [
          {
            status: 'fail',
            durationMs: 2000,
            usage: { costUsd: 0.2 },
            checks: [{ id: 'units', pass: false, message: 'Wrong unit' }],
          },
        ],
      },
      { id: 'a', status: 'pass', trials: [{ status: 'pass', durationMs: 500 }] },
      { id: 'c', status: 'fail', trials: [{ status: 'error', error: 'Timed out' }] },
    ],
  };

  test('has one row per case with its mark, failing checks and usage', () => {
    const rows = runCaseRows(run);
    expect(rows.map((row) => [row.id, row.title, row.mark, row.letters])).toEqual([
      ['b', 'Bravo', 'fail', 'F'],
      ['a', 'a', 'pass', 'P'],
      ['c', 'c', 'error', 'E'],
    ]);
    expect(rows[0]?.failing).toEqual([{ id: 'units', count: 1, message: 'Wrong unit' }]);
    expect(rows[0]?.costUsd).toBe(0.2);
    expect(rows[1]?.durationMs).toBe(500);
  });

  test('sorts by status, worst first, and by failing check', () => {
    const rows = runCaseRows(run);
    const ids = (key: string, direction: 'asc' | 'desc') =>
      sortTable(rows, runCaseColumns, { key, direction }).map((row) => row.id);
    expect(ids('status', 'asc')).toEqual(['c', 'b', 'a']);
    expect(ids('checks', 'asc')).toEqual(['c', 'b', 'a']);
    expect(ids('case', 'desc')).toEqual(['c', 'b', 'a']);
  });
});
