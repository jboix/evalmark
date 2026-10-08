/**
 * Trend series: one metric of the runs over time, one line per label value.
 */
import type { RunSummary, Totals } from '../../format/store.ts';
import type { Query } from './route.ts';
import { labelValuesOf } from './runs.ts';

/** The metrics a trend can show. */
export const metrics = ['passRate', 'cost', 'tokens', 'duration'] as const;

/** One of the metrics. */
export type Metric = (typeof metrics)[number];

/** A metric's name, as the switch shows it. */
export const metricNames: Readonly<Record<Metric, string>> = {
  passRate: 'Pass rate',
  cost: 'Cost',
  tokens: 'Tokens',
  duration: 'Duration',
};

/** One run on a trend line. */
export interface SeriesPoint {
  /** The run. */
  readonly run: RunSummary;
  /** When it started, in milliseconds since the epoch. */
  readonly time: number;
  /** The metric's value. */
  readonly value: number;
}

/** One line of a trend. */
export interface Series {
  /** The label value it follows, or `all` when the trend is not split. */
  readonly name: string;
  /** Its points, oldest first. */
  readonly points: readonly SeriesPoint[];
}

/**
 * Reads a metric from a run's totals.
 *
 * @param totals - The totals.
 * @param metric - The metric.
 * @returns The value, or `null` when the run has none (no trial ran).
 */
export function metricValue(totals: Totals, metric: Metric): number | null {
  if (metric === 'passRate') return totals.passRate;
  if (metric === 'cost') return totals.costUsd;
  if (metric === 'tokens') return totals.inputTokens + totals.outputTokens;
  return totals.durationMs;
}

/**
 * Whether a query value names a metric.
 *
 * @param value - The value.
 * @returns `true` when it is one of the metrics.
 */
export function isMetric(value: string | undefined): value is Metric {
  return metrics.some((metric) => metric === value);
}

/**
 * The trend of a metric: one series per value of the split key, or one series of every run.
 *
 * @param runs - The runs, in any order.
 * @param metric - The metric.
 * @param splitKey - The label key to split by; runs without it go to a series named `none`.
 * @returns The series, sorted by name, each oldest first.
 */
export function seriesOf(runs: readonly RunSummary[], metric: Metric, splitKey?: string): Series[] {
  const groups = new Map<string, SeriesPoint[]>();
  for (const run of runs) {
    const value = metricValue(run.totals, metric);
    if (value === null) continue;
    const name = splitKey === undefined ? 'all' : (run.labels[splitKey] ?? 'none');
    const points = groups.get(name) ?? [];
    points.push({ run, time: Date.parse(run.startedAt), value });
    groups.set(name, points);
  }
  return [...groups]
    .map(([name, points]) => ({
      name,
      points: points.sort((first, second) => first.time - second.time),
    }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

/** What a trend shows. */
export interface TrendSettings {
  /** The metric. */
  readonly metric: Metric;
  /** The label key it splits by, if any. */
  readonly split: string | undefined;
  /** Its series. */
  readonly series: readonly Series[];
  /** Every name a series could have, for stable colours and dashes. */
  readonly names: readonly string[];
}

/**
 * A trend: the metric from the query (`metric`, the pass rate by default), one line per value of
 * the split key, or one line.
 *
 * @param query - The query.
 * @param runs - The runs to chart.
 * @param allRuns - Every run, for the names.
 * @param split - The label key to split by, if any.
 * @returns The settings and the series.
 */
export function trendOf(
  query: Query,
  runs: readonly RunSummary[],
  allRuns: readonly RunSummary[],
  split: string | undefined,
): TrendSettings {
  const metric: Metric = isMetric(query.metric) ? query.metric : 'passRate';
  return {
    metric,
    split,
    series: seriesOf(runs, metric, split),
    names: split === undefined ? ['all'] : labelValuesOf(allRuns, split),
  };
}
