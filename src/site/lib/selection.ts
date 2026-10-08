/**
 * Which runs a view looks at: a branch, a value or every value of each label key, and a window of
 * the newest runs. Every choice lives in the route's query, so the view is a permanent link.
 */
import type { RunSummary } from '../../format/store.ts';
import type { Query } from './route.ts';
import {
  defaultBranch,
  filterKeysOf,
  labelParameter,
  leadRunOf,
  matchesFilters,
  type RunFilters,
} from './runs.ts';

/** The query value that means every branch, or every value of a label. */
export const every = 'all';

/** The windows a reader can pick, in runs; `all` keeps every run. */
export const windows = ['10', '20', '50', every] as const;

/** The window when the query names none. */
const defaultWindow = 20;

/** What a view looks at. */
export interface Selection {
  /** The branch; `undefined` for every branch. */
  readonly branch: string | undefined;
  /** Each label key's chosen value, for keys set to one value. */
  readonly labels: Readonly<Record<string, string>>;
  /** The label keys set to every value, in key order. */
  readonly open: readonly string[];
  /** How many runs of each label combination to keep; `undefined` keeps them all. */
  readonly window: number | undefined;
}

/**
 * Reads a window from a query value.
 *
 * @param value - The query's `window`: `10`, `20`, `50` or `all`.
 * @returns The number of runs, `undefined` for every run, 20 for anything else.
 */
export function windowOf(value: string | undefined): number | undefined {
  if (value === every) return undefined;
  const size = Number(value);
  return windows.includes(value as (typeof windows)[number]) ? size : defaultWindow;
}

/**
 * The query value of a window.
 *
 * @param window - The window.
 * @returns Such as `20`, or `all`.
 */
export function windowValue(window: number | undefined): string {
  return window === undefined ? every : String(window);
}

/**
 * Reads a selection from a query. A label key the query does not name takes the value of the
 * branch's lead run, the labels the branch runs most often.
 *
 * @param query - The query: `branch`, `label.<key>` and `window`.
 * @param runs - Every run, newest first.
 * @returns The selection.
 */
export function selectionOf(query: Query, runs: readonly RunSummary[]): Selection {
  const named = query.branch ?? defaultBranch(runs);
  const branch = named === every ? undefined : named;
  const lead = leadRunOf(
    runs.filter((run) => branch === undefined || run.source.branch === branch),
  );
  const labels: Record<string, string> = {};
  const open: string[] = [];
  for (const key of filterKeysOf(runs)) {
    const value = query[labelParameter(key)] ?? lead?.labels[key] ?? every;
    if (value === every) open.push(key);
    else labels[key] = value;
  }
  return { branch, labels, open, window: windowOf(query.window) };
}

/**
 * The query that keeps a selection, for links to other views.
 *
 * @param selection - The selection.
 * @returns The query values: branch, each label, and the window.
 */
export function selectionQuery(selection: Selection): Record<string, string> {
  const query: Record<string, string> = {
    branch: selection.branch ?? every,
    window: windowValue(selection.window),
  };
  for (const [key, value] of Object.entries(selection.labels)) query[labelParameter(key)] = value;
  for (const key of selection.open) query[labelParameter(key)] = every;
  return query;
}

/**
 * The query that selects a run's branch and labels, for a link from the run to a case.
 *
 * @param run - The run: its branch and labels.
 * @returns The query values.
 */
export function runSelectionQuery(run: {
  readonly labels: Readonly<Record<string, string>>;
  readonly source: { readonly branch?: string | undefined };
}): Record<string, string> {
  const query: Record<string, string> = { branch: run.source.branch ?? every };
  for (const [key, value] of Object.entries(run.labels)) query[labelParameter(key)] = value;
  return query;
}

/**
 * The runs a selection keeps: those on its branch with its label values, the newest of each
 * combination of the open keys' values, up to the window.
 *
 * @param runs - Every run, newest first.
 * @param selection - The selection.
 * @returns The runs, newest first.
 */
export function selectRuns(runs: readonly RunSummary[], selection: Selection): RunSummary[] {
  const filters: RunFilters = { branch: selection.branch, labels: selection.labels };
  const matching = runs.filter((run) => matchesFilters(run, filters));
  const window = selection.window;
  if (window === undefined) return matching;
  const counts = new Map<string, number>();
  return matching.filter((run) => {
    const group = selection.open.map((key) => run.labels[key] ?? '').join('\u0000');
    const count = (counts.get(group) ?? 0) + 1;
    counts.set(group, count);
    return count <= window;
  });
}
