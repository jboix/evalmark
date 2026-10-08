/**
 * What the demo's synthetic history is made of: the models it compares, the data sources its agent
 * reads, and the eval cases of an agent that builds dashboards from a chat.
 */
import type { CheckDefinition } from '../format/result.ts';

/** A model the demo compares, with its quality, price and speed. */
export interface DemoModel {
  /** The `model` label. */
  readonly name: string;
  /** The `provider` label. */
  readonly provider: string;
  /** How good it is, from 0 to 1: it raises every case's chance to pass. */
  readonly skill: number;
  /** US dollars per million input tokens. */
  readonly inputPrice: number;
  /** US dollars per million output tokens. */
  readonly outputPrice: number;
  /** Seconds one of its turns takes, on average. */
  readonly secondsPerTurn: number;
}

/** A data source the agent can query. */
export interface DemoDataSource {
  /** Its id, as the agent's tools name it. */
  readonly id: string;
  /** Its kind, such as `prometheus`. */
  readonly kind: string;
  /** What `describe_source` returns for it. */
  readonly schema: Readonly<Record<string, unknown>>;
}

/** One eval case of the demo suite. */
export interface DemoCase {
  /** Its id. */
  readonly id: string;
  /** Its title. */
  readonly title: string;
  /** The user's question. */
  readonly input: string;
  /** Its tags. */
  readonly tags: readonly string[];
  /** The id of the source it needs. */
  readonly source: string;
  /** The query a good answer runs. */
  readonly query: string;
  /** The panel type a good answer writes. */
  readonly panel: string;
  /** A wrong first query the agent sometimes runs, and the error the source returns. */
  readonly mistake: { readonly query: string; readonly error: string };
  /** The check only this case makes, and the message it gives when it fails. */
  readonly check: CheckDefinition & { readonly failure: string };
  /** How hard it is, from 0 to 1. */
  readonly difficulty: number;
  /** Whether it passes about half the time whatever the model: a chronically flaky case. */
  readonly flaky?: boolean;
  /** The index of the first `main` commit that has it, for a case added later. */
  readonly since?: number;
}

/** The models compared: one cheap and fast, one strong and costly, one self-hosted. */
export const demoModels: readonly DemoModel[] = [
  {
    name: 'gemini-3.8-flash',
    provider: 'google',
    skill: 0.74,
    inputPrice: 0.3,
    outputPrice: 2.5,
    secondsPerTurn: 3,
  },
  {
    name: 'claude-sonnet-5',
    provider: 'anthropic',
    skill: 0.9,
    inputPrice: 3,
    outputPrice: 15,
    secondsPerTurn: 5,
  },
  {
    name: 'qwen-4-32b',
    provider: 'self-hosted',
    skill: 0.52,
    inputPrice: 0.05,
    outputPrice: 0.2,
    secondsPerTurn: 8,
  },
];

/** The sources the agent can read. */
export const demoSources: readonly DemoDataSource[] = [
  {
    id: 'prom',
    kind: 'prometheus',
    schema: {
      metrics: ['http_requests_total', 'http_request_duration_seconds', 'node_cpu_seconds_total'],
    },
  },
  {
    id: 'pg',
    kind: 'postgres',
    schema: {
      tables: [
        { name: 'orders', columns: ['id', 'customer_id', 'created_at', 'total_cents', 'country'] },
        { name: 'signups', columns: ['id', 'created_at', 'step'] },
      ],
    },
  },
  { id: 'loki', kind: 'loki', schema: { labels: ['service', 'level', 'namespace'] } },
  {
    id: 'ch',
    kind: 'clickhouse',
    schema: { tables: [{ name: 'events', columns: ['ts', 'customer', 'kind', 'bytes'] }] },
  },
];

/** The two checks every case makes, before its own. */
export const commonChecks: readonly CheckDefinition[] = [
  { id: 'built', description: 'A dashboard was built' },
  { id: 'query-runs', description: "Every panel's query runs without an error" },
];

/** The cases of the demo suite. */
export const demoCases: readonly DemoCase[] = [
  {
    id: 'http-errors-by-route',
    title: 'HTTP errors by route',
    input: 'Show me the HTTP error rate by route over the last day',
    tags: ['prometheus', 'timeseries'],
    source: 'prom',
    query:
      'sum by (route) (rate(http_requests_total{status=~"5.."}[5m])) / sum by (route) (rate(http_requests_total[5m]))',
    panel: 'timeseries',
    mistake: {
      query: 'sum by (route) (rate(http_requests_total{status=~"5.."}[5m])',
      error: 'parse error at char 61: unclosed left parenthesis',
    },
    check: {
      id: 'grouped-by-route',
      description: 'The panel has one series per route',
      failure: 'The panel has one series in all, not one per route.',
    },
    difficulty: 0.15,
  },
  {
    id: 'p95-latency',
    title: 'p95 latency',
    input: 'What is our p95 latency per service this week?',
    tags: ['prometheus', 'timeseries', 'histogram'],
    source: 'prom',
    query:
      'histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))',
    panel: 'timeseries',
    mistake: {
      query: 'quantile(0.95, http_request_duration_seconds)',
      error: 'expected type instant vector in aggregation expression, got range vector',
    },
    check: {
      id: 'uses-histogram-quantile',
      description: 'The query uses histogram_quantile over the buckets',
      failure: 'The query averages the durations instead of reading the histogram.',
    },
    difficulty: 0.3,
  },
  {
    id: 'cpu-by-node',
    title: 'CPU by node',
    input: 'CPU usage of every node, as a percentage',
    tags: ['prometheus', 'timeseries'],
    source: 'prom',
    query: '100 * (1 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])))',
    panel: 'timeseries',
    mistake: {
      query: 'avg by (instance) (node_cpu_seconds_total{mode="idle"})',
      error: 'The query returned a counter: use rate() over it.',
    },
    check: {
      id: 'unit-percent',
      description: 'The panel shows a percentage',
      failure: 'The panel shows a ratio from 0 to 1 with no unit.',
    },
    difficulty: 0.1,
  },
  {
    id: 'orders-per-day',
    title: 'Orders per day',
    input: 'How many orders did we get each day this month?',
    tags: ['postgres', 'bar'],
    source: 'pg',
    query:
      "select date_trunc('day', created_at) as day, count(*) from orders where created_at >= date_trunc('month', now()) group by 1 order by 1",
    panel: 'bar',
    mistake: {
      query:
        "select created_at, count(*) from order where created_at >= date_trunc('month', now())",
      error: 'relation "order" does not exist',
    },
    check: {
      id: 'daily-buckets',
      description: 'The query groups by day',
      failure: "The query groups by created_at itself, not by date_trunc('day', created_at).",
    },
    difficulty: 0.2,
  },
  {
    id: 'revenue-by-country',
    title: 'Revenue by country',
    input: 'Revenue by country for the last quarter, biggest first',
    tags: ['postgres', 'table'],
    source: 'pg',
    query:
      "select country, sum(total_cents) / 100.0 as revenue from orders where created_at >= now() - interval '3 months' group by 1 order by 2 desc",
    panel: 'table',
    mistake: {
      query: 'select country, sum(total) from orders group by 1',
      error: 'column "total" does not exist',
    },
    check: {
      id: 'in-currency',
      description: 'Revenue is in currency units, not cents',
      failure: 'The revenue column is in cents.',
    },
    difficulty: 0.25,
  },
  {
    id: 'slowest-queries',
    title: 'Slowest database queries',
    input: 'Which queries are the slowest on the main database?',
    tags: ['postgres', 'table'],
    source: 'pg',
    query:
      'select query, mean_exec_time from pg_stat_statements order by mean_exec_time desc limit 20',
    panel: 'table',
    mistake: {
      query: 'select query, mean_time from pg_stat_statements order by 2 desc',
      error: 'column "mean_time" does not exist',
    },
    check: {
      id: 'sorted',
      description: 'The slowest query comes first',
      failure: 'The table is sorted by query text.',
    },
    difficulty: 0.35,
  },
  {
    id: 'signup-funnel',
    title: 'Sign-up funnel',
    input: 'Show the sign-up funnel: how many people reach each step',
    tags: ['postgres', 'bar', 'funnel'],
    source: 'pg',
    query: 'select step, count(distinct id) from signups group by step order by step',
    panel: 'bar',
    mistake: {
      query: 'select step, count(*) from signup group by step',
      error: 'relation "signup" does not exist',
    },
    check: {
      id: 'ordered-steps',
      description: 'The steps are in funnel order',
      failure: 'The steps are sorted by count, not by their order in the funnel.',
    },
    difficulty: 0.45,
  },
  {
    id: 'error-logs-by-service',
    title: 'Error logs by service',
    input: 'Graph the error logs per service over the last six hours',
    tags: ['loki', 'timeseries', 'logs'],
    source: 'loki',
    query: 'sum by (service) (count_over_time({level="error"}[5m]))',
    panel: 'timeseries',
    mistake: {
      query: 'sum by (service) (count_over_time({level=~".*"}[5m]))',
      error: 'queries require at least one regexp or equality matcher that does not match empty',
    },
    check: {
      id: 'errors-only',
      description: 'Only error logs are counted',
      failure: 'The query counts every log line, not only errors.',
    },
    difficulty: 0.3,
    flaky: true,
  },
  {
    id: 'top-customers',
    title: 'Top customers by traffic',
    input: 'Who are our ten biggest customers by traffic this week?',
    tags: ['clickhouse', 'table'],
    source: 'ch',
    query:
      'select customer, sum(bytes) as traffic from events where ts >= now() - interval 7 day group by customer order by traffic desc limit 10',
    panel: 'table',
    mistake: {
      query: 'select user, sum(bytes) from events group by user',
      error: "Code: 47. DB::Exception: Missing columns: 'user'",
    },
    check: {
      id: 'ten-rows',
      description: 'The table has ten rows',
      failure: 'The table has every customer, with no limit.',
    },
    difficulty: 0.2,
    flaky: true,
  },
  {
    id: 'events-per-minute',
    title: 'Events per minute',
    input: 'Events per minute by kind, for the last hour',
    tags: ['clickhouse', 'timeseries'],
    source: 'ch',
    query:
      'select toStartOfMinute(ts) as minute, kind, count() from events where ts >= now() - interval 1 hour group by minute, kind order by minute',
    panel: 'timeseries',
    mistake: {
      query: 'select minute(ts), kind, count() from events group by 1, 2',
      error: 'Code: 46. DB::Exception: Unknown function minute',
    },
    check: {
      id: 'by-kind',
      description: 'The panel has one series per kind',
      failure: 'The panel sums every kind into one series.',
    },
    difficulty: 0.15,
  },
  {
    id: 'disk-forecast',
    title: 'Disk full forecast',
    input: 'When will each disk be full at the current rate?',
    tags: ['prometheus', 'stat', 'forecast'],
    source: 'prom',
    query: 'node_filesystem_avail_bytes / -deriv(node_filesystem_avail_bytes[6h]) / 86400 > 0',
    panel: 'stat',
    mistake: {
      query: 'predict_linear(node_filesystem_avail_bytes[6h])',
      error: 'expected 2 arguments in call to "predict_linear", got 1',
    },
    check: {
      id: 'days-left',
      description: 'The stat shows days left per disk',
      failure: 'The stat shows bytes free, not days left.',
    },
    difficulty: 0.7,
  },
  {
    id: 'latency-heatmap',
    title: 'Latency heatmap',
    input: 'A heatmap of request latency for the checkout service',
    tags: ['prometheus', 'heatmap', 'histogram'],
    source: 'prom',
    query: 'sum by (le) (rate(http_request_duration_seconds_bucket{service="checkout"}[5m]))',
    panel: 'heatmap',
    mistake: {
      query: 'http_request_duration_seconds{service="checkout"}',
      error: 'The metric is a histogram: query its _bucket series.',
    },
    check: {
      id: 'heatmap-buckets',
      description: 'The heatmap reads the histogram buckets',
      failure: 'The panel is a time series, not a heatmap.',
    },
    difficulty: 0.4,
    since: 6,
  },
];
