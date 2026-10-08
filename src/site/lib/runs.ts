/**
 * Selecting runs from the index: branches, labels, and the filters every list of runs shares.
 */
import type { RunSummary } from '../../format/store.ts';
import type { Query } from './route.ts';
import type { Columns } from './sort.ts';

/** The prefix of a label filter in a query, such as `label.model=…`. */
const labelPrefix = 'label.';

/** The filters a list of runs reads from its query. */
export interface RunFilters {
  /** Only runs on this branch; every branch when `undefined`. */
  readonly branch?: string | undefined;
  /** Only runs with these label values, by key. */
  readonly labels: Readonly<Record<string, string>>;
  /** Only runs started on or after this day, as `YYYY-MM-DD`. */
  readonly from?: string | undefined;
  /** Only runs started on or before this day, as `YYYY-MM-DD`. */
  readonly to?: string | undefined;
}

/** A value with how many runs have it. */
export interface Counted {
  /** The value. */
  readonly value: string;
  /** How many runs have it. */
  readonly count: number;
}

/**
 * Counts values, most common first, then by name.
 *
 * @param values - The values, one per run; `undefined` ones are left out.
 * @returns Each value with its count.
 */
function countValues(values: readonly (string | undefined)[]): Counted[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value !== undefined) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((first, second) => second.count - first.count || first.value.localeCompare(second.value));
}

/**
 * The branches runs were made on, most runs first.
 *
 * @param runs - The runs.
 * @returns Each branch with its number of runs.
 */
export function branchesOf(runs: readonly RunSummary[]): Counted[] {
  return countValues(runs.map((run) => run.source.branch));
}

/**
 * The branch a view shows by default: the one with the most runs, usually the default branch.
 *
 * @param runs - The runs.
 * @returns The branch, or `undefined` when no run has one.
 */
export function defaultBranch(runs: readonly RunSummary[]): string | undefined {
  return branchesOf(runs)[0]?.value;
}

/**
 * The label keys any run has.
 *
 * @param runs - The runs.
 * @returns The keys, sorted.
 */
export function labelKeysOf(runs: readonly RunSummary[]): string[] {
  return [...new Set(runs.flatMap((run) => Object.keys(run.labels)))].sort();
}

/**
 * The values a label key takes.
 *
 * @param runs - The runs.
 * @param key - The label key, such as `model`.
 * @returns The values, sorted.
 */
export function labelValuesOf(runs: readonly RunSummary[], key: string): string[] {
  return [...new Set(runs.map((run) => run.labels[key]))]
    .filter((value): value is string => value !== undefined)
    .sort();
}

/**
 * Reads the run filters from a query.
 *
 * @param query - The route's query: `branch`, `label.<key>`, `from`, `to`.
 * @param fallbackBranch - The branch when the query names none; `all` in the query means every one.
 * @returns The filters.
 */
export function runFiltersOf(query: Query, fallbackBranch?: string): RunFilters {
  const labels = Object.fromEntries(
    Object.entries(query)
      .filter(([name, value]) => name.startsWith(labelPrefix) && value !== '')
      .map(([name, value]) => [name.slice(labelPrefix.length), value]),
  );
  const branch = query.branch ?? fallbackBranch;
  return { branch: branch === 'all' ? undefined : branch, labels, from: query.from, to: query.to };
}

/**
 * The query name of a label filter.
 *
 * @param key - The label key.
 * @returns Such as `label.model`.
 */
export function labelParameter(key: string): string {
  return `${labelPrefix}${key}`;
}

/**
 * Whether a run passes the filters.
 *
 * @param run - The run.
 * @param filters - The filters.
 * @returns `true` when it does.
 */
export function matchesFilters(run: RunSummary, filters: RunFilters): boolean {
  if (filters.branch !== undefined && run.source.branch !== filters.branch) return false;
  const day = run.startedAt.slice(0, 10);
  if (filters.from !== undefined && filters.from !== '' && day < filters.from) return false;
  if (filters.to !== undefined && filters.to !== '' && day > filters.to) return false;
  return Object.entries(filters.labels).every(([key, value]) => run.labels[key] === value);
}

/**
 * The runs that pass the filters, in their order.
 *
 * @param runs - The runs.
 * @param filters - The filters.
 * @returns The runs that pass.
 */
export function filterRuns(runs: readonly RunSummary[], filters: RunFilters): RunSummary[] {
  return runs.filter((run) => matchesFilters(run, filters));
}

/**
 * The branch to compare a run with: its own, or the default branch for a run on a pull request.
 *
 * @param run - The run.
 * @param mainBranch - The default branch.
 * @returns The branch to find the baseline on.
 */
export function baselineBranchOf(run: RunSummary, mainBranch: string | undefined): string {
  if (run.source.pullRequest !== undefined && mainBranch !== undefined) return mainBranch;
  return run.source.branch ?? mainBranch ?? '';
}

/**
 * A run's labels, written as one line.
 *
 * @param labels - The labels.
 * @returns Such as `model: gemini · temperature: 0`; empty when there are none.
 */
export function labelsText(labels: Readonly<Record<string, string>>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}

/**
 * The run a branch's results page leads with: the newest run of the labels the branch runs most often,
 * so a model that runs now and then never stands for the branch. Ties go to the labels of the
 * newer run.
 *
 * @param runs - The branch's runs, newest first.
 * @returns The run, or `undefined` when there is none.
 */
export function leadRunOf(runs: readonly RunSummary[]): RunSummary | undefined {
  const counts = new Map<string, number>();
  for (const run of runs) {
    const key = labelsKey(run.labels);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const most = Math.max(0, ...counts.values());
  return runs.find((run) => counts.get(labelsKey(run.labels)) === most);
}

/**
 * Labels as one comparable key.
 *
 * @param labels - The labels.
 * @returns The key, the same for the same labels in any order.
 */
function labelsKey(labels: Readonly<Record<string, string>>): string {
  return JSON.stringify(
    Object.entries(labels).sort(([first], [second]) => (first < second ? -1 : 1)),
  );
}

/** The runs table's columns. */
export const runColumns: Columns<RunSummary> = {
  date: (run) => run.startedAt,
  branch: (run) => run.source.branch,
  commit: (run) => run.source.commit,
  labels: (run) => labelsText(run.labels),
  passed: (run) => run.totals.casesPassed,
  flaky: (run) => run.totals.casesFlaky,
  failed: (run) => run.totals.casesFailed,
  passRate: (run) => run.totals.passRate,
  cost: (run) => run.totals.costUsd,
  duration: (run) => run.totals.durationMs,
};

/**
 * Whether one label key's value always follows from another's, as a provider follows from its
 * model: every run with the first key has the second, and each value of the second goes with one
 * value of the first.
 *
 * @param runs - The runs.
 * @param key - The key that may follow.
 * @param from - The key it may follow from.
 * @returns `true` when `key` adds nothing to `from`.
 */
function followsFrom(runs: readonly RunSummary[], key: string, from: string): boolean {
  const seen = new Map<string, string>();
  return runs.every((run) => {
    const value = run.labels[key];
    if (value === undefined) return true;
    const by = run.labels[from];
    if (by === undefined) return false;
    const before = seen.get(by);
    seen.set(by, value);
    return before === undefined || before === value;
  });
}

/**
 * The label keys worth a filter: every key but those whose value follows from another key's, such
 * as `provider` beside `model`. When two keys follow from each other, the one with more values
 * stays, then the first by name.
 *
 * @param runs - The runs.
 * @returns The keys, sorted.
 */
export function filterKeysOf(runs: readonly RunSummary[]): string[] {
  const keys = labelKeysOf(runs);
  const count = (key: string) => labelValuesOf(runs, key).length;
  const outranks = (other: string, key: string) =>
    count(other) > count(key) || (count(other) === count(key) && other < key);
  return keys.filter(
    (key) =>
      !keys.some((other) => other !== key && outranks(other, key) && followsFrom(runs, key, other)),
  );
}
