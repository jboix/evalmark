/**
 * The results page's summary line and trend: the newest run the filters keep, as a test runner's
 * footer, and a metric over the window's runs.
 */
import type { RunSummary } from '../../format/store.ts';
import { Segmented } from '../components/filters.tsx';
import { CaseCounts } from '../components/status.tsx';
import { TrendChart } from '../components/trend-chart.tsx';
import { Commit, Delta, RunFigures, When } from '../components/values.tsx';
import {
  formatCost,
  formatCostTick,
  formatCount,
  formatDuration,
  formatPercent,
  formatPointsDelta,
} from '../lib/format.ts';
import { links } from '../lib/route.ts';
import { labelsText } from '../lib/runs.ts';
import { type Metric, metricNames, metrics, trendOf } from '../lib/series.ts';
import { summaryLineOf } from '../lib/summary.ts';
import type { ResultsScope } from './results-scope.ts';

/**
 * The summary line of the newest run.
 *
 * @param props - The window's runs, newest first.
 * @returns The line, or nothing without a run.
 */
export function SummaryText(props: { readonly runs: readonly RunSummary[] }) {
  const line = summaryLineOf(props.runs);
  if (line === undefined) return null;
  const { run } = line;
  const labels = labelsText(run.labels);
  return (
    <p class="facts summary">
      <span class="visually-hidden">Newest run:</span>
      <a href={links.run(run.id)}>
        <When iso={run.startedAt} />
      </a>
      {labels === '' ? null : <span>{labels}</span>}
      <Commit source={run.source} />
      <CaseCounts totals={run.totals} />
      <RunFigures totals={run.totals} />
      {line.passRateDelta === null ? null : (
        <span>
          <Delta value={line.passRateDelta} format={formatPointsDelta} better="higher" /> since the
          previous run
        </span>
      )}
    </p>
  );
}

/** How each metric's values and ticks are written, and the highest value its axis shows. */
const metricFormats: Readonly<
  Record<Metric, { value: (value: number) => string; tick?: (value: number) => string }>
> = {
  passRate: { value: formatPercent },
  cost: { value: formatCost, tick: formatCostTick },
  duration: { value: formatDuration },
  tokens: { value: formatCount },
};

/**
 * The trend over the window: one line, or one per value of the label set to every value.
 *
 * @param props - The page's scope and the label key to split by, if any.
 * @returns The trend.
 */
export function ResultsTrend(props: {
  readonly scope: ResultsScope;
  readonly split: string | undefined;
}) {
  const { scope } = props;
  const trend = trendOf(scope.query, scope.runs, scope.index.runs, props.split);
  const format = metricFormats[trend.metric];
  return (
    <section class="trend" aria-label="Trend">
      <Segmented
        label="Metric"
        name="metric"
        value={trend.metric}
        options={metrics.map((metric) => ({ value: metric, text: metricNames[metric] }))}
        hash={scope.hash}
      />
      <TrendChart
        series={trend.series}
        names={trend.names}
        format={format.value}
        {...(format.tick === undefined ? {} : { tickFormat: format.tick })}
        {...(trend.metric === 'passRate' ? { ceiling: 1 } : {})}
        label={`${metricNames[trend.metric]} of the window's runs`}
      />
    </section>
  );
}
