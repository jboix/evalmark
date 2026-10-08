import { describe, expect, test } from 'vitest';
import type { Run, StoredCase } from '../../src/format/store.ts';
import { totalsOf } from '../../src/format/totals.ts';
import {
  averageOf,
  caseColumns,
  caseFiltersOf,
  caseRows,
  matchesCase,
  tagsOf,
  usageByRun,
} from '../../src/site/lib/case-rows.ts';
import { checkCounts } from '../../src/site/lib/checks.ts';
import { sortTable } from '../../src/site/lib/sort.ts';
import { summaryLineOf } from '../../src/site/lib/summary.ts';
import { summary } from './summaries.ts';

/** A window of three runs, newest first. */
const runs = [
  summary({ id: 'r3', startedAt: '2026-10-03T00:00:00Z', cases: { a: 'PP', b: 'PF', c: 'FF' } }),
  summary({ id: 'r2', startedAt: '2026-10-02T00:00:00Z', cases: { a: 'PP', b: 'PP', c: 'FE' } }),
  summary({ id: 'r1', startedAt: '2026-10-01T00:00:00Z', cases: { a: 'PS', b: 'PP', d: 'PP' } }),
];

/** What the index knows of the cases. */
const cases = {
  a: { title: 'Alpha', tags: ['sql'] },
  b: { title: 'Bravo', tags: ['prometheus'] },
  c: { title: 'Charlie', tags: ['sql'] },
  d: { title: 'Delta' },
};

/**
 * A run file with some cases.
 *
 * @param id - Its id.
 * @param stored - Its cases.
 * @returns The run.
 */
function runFile(id: string, stored: StoredCase[]): Run {
  return {
    version: 1,
    id,
    suite: 's',
    recordedAt: '2026-10-01T00:00:00Z',
    startedAt: '2026-10-01T00:00:00Z',
    labels: {},
    source: {},
    totals: totalsOf([]),
    cases: stored,
  };
}

describe('the results rows', () => {
  test('give each case its latest mark, history and pass rate over the window', () => {
    const rows = caseRows(runs, cases, undefined);
    expect(rows.map((row) => [row.id, row.title, row.latest])).toEqual([
      ['a', 'Alpha', 'pass'],
      ['b', 'Bravo', 'flaky'],
      ['c', 'Charlie', 'fail'],
      ['d', 'Delta', 'skip'],
    ]);
    expect(rows[0]?.passRate).toBe(1);
    expect(rows[1]?.passRate).toBeCloseTo(5 / 6);
    expect(rows[2]?.cells.map((cell) => cell.run.id)).toEqual(['r1', 'r2', 'r3']);
    expect(rows[0]?.costUsd).toBeNull();
  });

  test('average what each case spent per run, once the run files are loaded', () => {
    const usage = usageByRun([
      runFile('r3', [
        { id: 'a', status: 'pass', trials: [{ status: 'pass', usage: { costUsd: 0.1 } }] },
      ]),
      runFile('r2', [
        {
          id: 'a',
          status: 'pass',
          trials: [
            { status: 'pass', usage: { costUsd: 0.2 }, durationMs: 1000 },
            { status: 'pass', usage: { costUsd: 0.1 }, durationMs: 3000 },
          ],
        },
      ]),
    ]);
    const alpha = caseRows(runs, cases, usage)[0];
    expect(alpha?.costUsd).toBeCloseTo(0.2);
    expect(alpha?.durationMs).toBe(4000);
    expect(averageOf([undefined, undefined])).toBeNull();
  });

  test('filter by latest status, tag and text', () => {
    const rows = caseRows(runs, cases, undefined);
    const ids = (query: Record<string, string>) =>
      rows
        .filter((row) => matchesCase(row, [row.latest], caseFiltersOf(query)))
        .map((row) => row.id);
    expect(ids({})).toEqual(['a', 'b', 'c', 'd']);
    expect(ids({ status: 'failing' })).toEqual(['c']);
    expect(ids({ status: 'flaky' })).toEqual(['b']);
    expect(ids({ status: 'passing' })).toEqual(['a']);
    expect(ids({ status: 'not-run' })).toEqual(['d']);
    expect(ids({ tag: 'sql' })).toEqual(['a', 'c']);
    expect(ids({ q: 'PROM' })).toEqual(['b']);
    expect(ids({ q: 'char', tag: 'sql' })).toEqual(['c']);
    expect(caseFiltersOf({ status: 'odd' }).status).toBe('all');
    expect(tagsOf(cases)).toEqual(['prometheus', 'sql']);
  });

  test('sort by every column, empty values last', () => {
    const rows = caseRows(runs, cases, undefined);
    const ids = (key: string, direction: 'asc' | 'desc' = 'asc') =>
      sortTable(rows, caseColumns, { key, direction }).map((row) => row.id);
    expect(ids('case', 'desc')).toEqual(['d', 'c', 'b', 'a']);
    expect(ids('latest')).toEqual(['c', 'b', 'a', 'd']);
    expect(ids('history', 'desc')).toEqual(['c', 'b', 'a', 'd']);
    expect(ids('passRate')).toEqual(['c', 'b', 'a', 'd']);
    expect(ids('passRate', 'desc')).toEqual(['a', 'd', 'b', 'c']);
    expect(ids('cost')).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('check counts', () => {
  test('count the trials that failed each check, declared ones first', () => {
    const files = [
      runFile('r2', [
        {
          id: 'a',
          status: 'flaky',
          trials: [
            {
              status: 'fail',
              checks: [
                { id: 'units', pass: false },
                { id: 'extra', pass: true },
              ],
            },
            { status: 'pass', checks: [{ id: 'units', pass: true }] },
          ],
        },
      ]),
      runFile('r1', [{ id: 'a', status: 'fail', trials: [{ status: 'error' }] }]),
    ];
    expect(
      checkCounts([{ id: 'built' }, { id: 'units', description: 'Units' }], files, 'a'),
    ).toEqual({
      checks: [
        { id: 'built', description: undefined, failed: 0, trials: 0 },
        { id: 'units', description: 'Units', failed: 1, trials: 2 },
        { id: 'extra', description: undefined, failed: 0, trials: 1 },
      ],
      errored: 1,
      trials: 3,
    });
  });
});

describe('the summary line', () => {
  test('is the newest run, with the change since the previous run of its labels', () => {
    const labelled = [
      summary({
        id: 'n',
        startedAt: '2026-10-03T00:00:00Z',
        cases: { a: 'PP' },
        labels: { m: 'x' },
      }),
      summary({
        id: 'o',
        startedAt: '2026-10-02T00:00:00Z',
        cases: { a: 'FF' },
        labels: { m: 'y' },
      }),
      summary({
        id: 'p',
        startedAt: '2026-10-01T00:00:00Z',
        cases: { a: 'PF' },
        labels: { m: 'x' },
      }),
    ];
    const line = summaryLineOf(labelled);
    expect(line?.run.id).toBe('n');
    expect(line?.previous?.id).toBe('p');
    expect(line?.passRateDelta).toBeCloseTo(0.5);
    expect(summaryLineOf(labelled.slice(0, 2))?.passRateDelta).toBeNull();
    expect(summaryLineOf([])).toBeUndefined();
  });
});
