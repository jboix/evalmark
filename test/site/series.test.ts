import { describe, expect, test } from 'vitest';
import { isMetric, metricValue, seriesOf, trendOf } from '../../src/site/lib/series.ts';
import { summary } from './summaries.ts';

const runs = [
  summary({
    id: 'r3',
    startedAt: '2026-10-03T00:00:00Z',
    labels: { model: 'b' },
    cases: { q: 'PF' },
    costUsd: 2,
  }),
  summary({
    id: 'r2',
    startedAt: '2026-10-02T00:00:00Z',
    labels: { model: 'a' },
    cases: { q: 'PP' },
    costUsd: 1,
  }),
  summary({
    id: 'r1',
    startedAt: '2026-10-01T00:00:00Z',
    labels: { model: 'a' },
    cases: { q: 'SS' },
  }),
  summary({ id: 'r0', startedAt: '2026-09-30T00:00:00Z', cases: { q: 'FF' } }),
];

describe('seriesOf', () => {
  test('makes one series of every run when not split, oldest first, without empty runs', () => {
    const [all] = seriesOf(runs, 'passRate');
    expect(all?.name).toBe('all');
    expect(all?.points.map((point) => point.run.id)).toEqual(['r0', 'r2', 'r3']);
    expect(all?.points.map((point) => point.value)).toEqual([0, 1, 0.5]);
  });

  test('splits by a label, with `none` for runs without it', () => {
    const series = seriesOf(runs, 'cost', 'model');
    expect(series.map((line) => line.name)).toEqual(['a', 'b', 'none']);
    expect(series[0]?.points.map((point) => point.value)).toEqual([0, 1]);
  });

  test('reads every metric', () => {
    const totals = runs[0]!.totals;
    expect(metricValue(totals, 'tokens')).toBe(0);
    expect(metricValue(totals, 'duration')).toBe(2000);
    expect(isMetric('cost')).toBe(true);
    expect(isMetric('nope')).toBe(false);
  });
});

describe('trendOf', () => {
  test('defaults to the pass rate, one line per value of the split key', () => {
    const trend = trendOf({}, runs, runs, 'model');
    expect(trend.metric).toBe('passRate');
    expect(trend.split).toBe('model');
    expect(trend.names).toEqual(['a', 'b']);
  });

  test('reads the metric from the query, one line without a split', () => {
    const trend = trendOf({ metric: 'cost' }, runs, runs, undefined);
    expect(trend.metric).toBe('cost');
    expect(trend.split).toBeUndefined();
    expect(trend.series).toHaveLength(1);
  });
});
