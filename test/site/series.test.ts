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

describe('the positions of the runs', () => {
  /**
   * A passing run of a model, from a workflow run.
   *
   * @param id - Its id.
   * @param startedAt - Its start time.
   * @param model - Its model.
   * @param workflow - The number of the workflow run it came from, if it says.
   * @returns The summary.
   */
  function job(id: string, startedAt: string, model: string, workflow?: number) {
    const run = summary({ id, startedAt, labels: { model }, cases: { q: 'P' } });
    if (workflow === undefined) return run;
    return { ...run, source: { runUrl: `https://github.com/o/r/actions/runs/${workflow}` } };
  }

  /**
   * Each run's position, by id.
   *
   * @param series - The series.
   * @returns The positions.
   */
  function slots(series: ReturnType<typeof seriesOf>): Record<string, number> {
    return Object.fromEntries(
      series.flatMap((line) => line.points.map((point) => [point.run.id, point.slot])),
    );
  }

  test('follow the order the runs started in, one step apart whatever the gap', () => {
    const series = seriesOf(
      [
        job('late', '2026-11-12T10:00:00Z', 'a'),
        job('first', '2026-10-01T10:00:00Z', 'a'),
        job('second', '2026-10-01T11:00:00Z', 'a'),
      ],
      'passRate',
    );
    expect(slots(series)).toEqual({ first: 0, second: 1, late: 2 });
  });

  test('are shared by the jobs of one workflow run, one per series', () => {
    const series = seriesOf(
      [
        job('a1', '2026-10-01T10:00:00Z', 'a', 1),
        job('b1', '2026-10-01T10:00:09Z', 'b', 1),
        job('a2', '2026-10-01T10:30:00Z', 'a', 2),
        job('b2', '2026-10-01T10:30:07Z', 'b', 2),
      ],
      'passRate',
      'model',
    );
    expect(slots(series)).toEqual({ a1: 0, b1: 0, a2: 1, b2: 1 });
  });

  test('are not shared by two runs of one series, nor by two workflow runs', () => {
    const unsplit = seriesOf(
      [job('a1', '2026-10-01T10:00:00Z', 'a', 1), job('b1', '2026-10-01T10:00:09Z', 'b', 1)],
      'passRate',
    );
    expect(slots(unsplit)).toEqual({ a1: 0, b1: 1 });
    const apart = seriesOf(
      [job('b1', '2026-10-01T10:00:00Z', 'b', 1), job('a2', '2026-10-01T10:30:00Z', 'a', 2)],
      'passRate',
      'model',
    );
    expect(slots(apart)).toEqual({ b1: 0, a2: 1 });
  });

  test('are shared by runs that name no workflow and started within hours', () => {
    const series = seriesOf(
      [
        job('a1', '2026-10-01T10:00:00Z', 'a'),
        job('b1', '2026-10-01T12:00:00Z', 'b'),
        job('b2', '2026-10-02T12:00:00Z', 'b'),
      ],
      'passRate',
      'model',
    );
    expect(slots(series)).toEqual({ a1: 0, b1: 0, b2: 1 });
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
