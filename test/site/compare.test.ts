import { describe, expect, test } from 'vitest';
import {
  changeColumns,
  changeCounts,
  changeOf,
  changeRows,
} from '../../src/site/lib/compare-cases.ts';
import { matrixColumns, matrixOf, noValue, valueTotals } from '../../src/site/lib/matrix.ts';
import { sortTable } from '../../src/site/lib/sort.ts';
import { summary } from './summaries.ts';

describe('two runs', () => {
  const base = summary({
    id: 'b',
    startedAt: '2026-10-01T00:00:00Z',
    cases: { a: 'PP', b: 'FF', c: 'PF', gone: 'P' },
  });
  const head = summary({
    id: 'h',
    startedAt: '2026-10-02T00:00:00Z',
    cases: { a: 'PF', b: 'PP', c: 'PF', fresh: 'F' },
  });

  test('say how each case changed', () => {
    expect(changeOf('PP', 'PF')).toBe('regressed');
    expect(changeOf('PF', 'FF')).toBe('regressed');
    expect(changeOf('FF', 'PF')).toBe('fixed');
    expect(changeOf('PP', 'PP')).toBe('same');
    expect(changeOf('SS', 'FF')).toBe('same');
    expect(changeOf(undefined, 'P')).toBe('added');
    expect(changeOf('P', undefined)).toBe('removed');
  });

  test('list every case of both, with marks, and count the changes', () => {
    const rows = changeRows(base, head, { a: { title: 'Alpha' } });
    expect(rows.map((row) => [row.id, row.base, row.head, row.change])).toEqual([
      ['a', 'pass', 'flaky', 'regressed'],
      ['b', 'fail', 'pass', 'fixed'],
      ['c', 'flaky', 'flaky', 'same'],
      ['fresh', undefined, 'fail', 'added'],
      ['gone', 'pass', undefined, 'removed'],
    ]);
    expect(changeCounts(rows)).toEqual({ regressed: 1, fixed: 1, same: 1, added: 1, removed: 1 });
    const byChange = sortTable(rows, changeColumns, { key: 'change', direction: 'asc' });
    expect(byChange.map((row) => row.id)).toEqual(['a', 'gone', 'fresh', 'b', 'c']);
    const byHead = sortTable(rows, changeColumns, { key: 'head', direction: 'desc' });
    expect(byHead.at(-1)?.id).toBe('gone');
  });
});

describe('cases by label values', () => {
  const runs = [
    summary({
      id: 'f2',
      startedAt: '2026-10-03T00:00:00Z',
      cases: { a: 'PP', b: 'FF' },
      labels: { model: 'flash' },
      costUsd: 0.4,
    }),
    summary({
      id: 'p1',
      startedAt: '2026-10-02T00:00:00Z',
      cases: { a: 'PP', b: 'PP' },
      labels: { model: 'pro' },
      costUsd: 1,
    }),
    summary({
      id: 'f1',
      startedAt: '2026-10-01T00:00:00Z',
      cases: { a: 'PF', b: 'PP' },
      labels: { model: 'flash' },
      costUsd: 0.2,
    }),
    summary({ id: 'n1', startedAt: '2026-09-30T00:00:00Z', cases: { a: 'PP' } }),
  ];

  test('give each case a cell per value: its newest mark and its pass rate', () => {
    const matrix = matrixOf(runs, 'model', { a: { title: 'Alpha' } });
    expect(matrix.values).toEqual([noValue, 'flash', 'pro']);
    const [alpha, bravo] = matrix.rows;
    expect(alpha?.title).toBe('Alpha');
    expect(alpha?.cells.map((cell) => [cell.value, cell.latest, cell.run?.id])).toEqual([
      [noValue, 'pass', 'n1'],
      ['flash', 'pass', 'f2'],
      ['pro', 'pass', 'p1'],
    ]);
    expect(alpha?.cells[1]?.passRate).toBeCloseTo(3 / 4);
    expect(bravo?.cells.map((cell) => cell.latest)).toEqual(['skip', 'fail', 'pass']);
    expect(bravo?.cells[0]?.passRate).toBeNull();
  });

  test('sort by any value column', () => {
    const matrix = matrixOf(runs, 'model', {});
    const columns = matrixColumns(matrix.values);
    const ids = (key: string) =>
      sortTable(matrix.rows, columns, { key, direction: 'asc' }).map((row) => row.id);
    expect(ids('v:flash')).toEqual(['b', 'a']);
    expect(ids('v:pro')).toEqual(['a', 'b']);
    expect(ids(`v:${noValue}`)).toEqual(['a', 'b']);
  });

  test('total each value: runs, pass rate, cost and duration per run', () => {
    const totals = valueTotals(runs, 'model');
    const flash = totals.find((entry) => entry.value === 'flash');
    expect(totals.map((entry) => entry.value)).toEqual([noValue, 'flash', 'pro']);
    expect(flash?.runs).toBe(2);
    expect(flash?.passRate).toBeCloseTo(5 / 8);
    expect(flash?.costPerRun).toBeCloseTo(0.3);
    expect(flash?.durationPerRun).toBe(4000);
  });
});
