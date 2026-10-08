/**
 * The results table: one row per case over a window of runs, with its latest status, its history,
 * its pass rate and what it costs, and the filters and columns that find a case in it.
 */
import type { CaseInfo, Run, RunSummary, StoredTrial } from '../../format/store.ts';
import { caseHistory, caseIdsOf, type HistoryCell, passRateOfLetters } from './history.ts';
import { type MarkKind, markOfLetters } from './marks.ts';
import type { Query } from './route.ts';
import type { Columns } from './sort.ts';

/** What one case spent in one run, summed over its trials; a value no trial reported is left out. */
export interface CaseUsage {
  /** The cost, in US dollars. */
  readonly costUsd?: number;
  /** The time its trials took, in milliseconds. */
  readonly durationMs?: number;
}

/** What each case spent, by run id, then by case id. */
export type UsageByRun = ReadonlyMap<string, ReadonlyMap<string, CaseUsage>>;

/** One row of the results table. */
export interface CaseRow {
  /** The case's id. */
  readonly id: string;
  /** Its title, or its id when it has none. */
  readonly title: string;
  /** Its tags. */
  readonly tags: readonly string[];
  /** Its mark in the newest run of the window; `skip` when that run did not have it. */
  readonly latest: MarkKind;
  /** Its trials in the newest run, as letters. */
  readonly latestLetters: string | undefined;
  /** Its history over the window, oldest first. */
  readonly cells: readonly HistoryCell[];
  /** Passed trials over trials that ran in the window; `null` when none ran. */
  readonly passRate: number | null;
  /** Its average cost per run that reported one; `null` when none did, or not loaded yet. */
  readonly costUsd: number | null;
  /** Its average duration per run that reported one; `null` when none did, or not loaded yet. */
  readonly durationMs: number | null;
}

/**
 * Sums one value over trials.
 *
 * @param trials - The trials.
 * @param pick - Reads the value of a trial.
 * @returns The sum, or `undefined` when no trial has the value.
 */
function sumOf(
  trials: readonly StoredTrial[],
  pick: (trial: StoredTrial) => number | undefined,
): number | undefined {
  const values = trials.map(pick).filter((value) => value !== undefined);
  return values.length === 0 ? undefined : values.reduce((total, value) => total + value, 0);
}

/**
 * What each case of each run spent.
 *
 * @param runs - The run files.
 * @returns The usage, by run and case.
 */
export function usageByRun(runs: readonly Run[]): UsageByRun {
  return new Map(
    runs.map((run) => [
      run.id,
      new Map(
        run.cases.map((stored) => {
          const costUsd = sumOf(stored.trials, (trial) => trial.usage?.costUsd);
          const durationMs = sumOf(stored.trials, (trial) => trial.durationMs);
          return [
            stored.id,
            {
              ...(costUsd === undefined ? {} : { costUsd }),
              ...(durationMs === undefined ? {} : { durationMs }),
            },
          ];
        }),
      ),
    ]),
  );
}

/**
 * The mean of the values that are there.
 *
 * @param values - The values.
 * @returns The mean, or `null` when none is there.
 */
export function averageOf(values: readonly (number | undefined)[]): number | null {
  const known = values.filter((value) => value !== undefined);
  return known.length === 0
    ? null
    : known.reduce((total, value) => total + value, 0) / known.length;
}

/**
 * A case's average usage per run over a window.
 *
 * @param runs - The window's runs.
 * @param caseId - The case.
 * @param usage - What each case spent, if loaded.
 * @returns The average cost and duration; `null` where unknown.
 */
export function averageUsage(
  runs: readonly RunSummary[],
  caseId: string,
  usage: UsageByRun | undefined,
): { costUsd: number | null; durationMs: number | null } {
  const spent = runs.map((run) => usage?.get(run.id)?.get(caseId));
  return {
    costUsd: averageOf(spent.map((entry) => entry?.costUsd)),
    durationMs: averageOf(spent.map((entry) => entry?.durationMs)),
  };
}

/**
 * The results table's rows.
 *
 * @param runs - The window's runs, newest first.
 * @param cases - What the index knows of each case.
 * @param usage - What each case spent, once the run files are loaded.
 * @returns One row per case any of the runs has, by title.
 */
export function caseRows(
  runs: readonly RunSummary[],
  cases: Readonly<Record<string, CaseInfo>>,
  usage: UsageByRun | undefined,
): CaseRow[] {
  return caseIdsOf(runs, cases).map((id) => {
    const latestLetters = runs[0]?.cases[id];
    return {
      id,
      title: cases[id]?.title ?? id,
      tags: cases[id]?.tags ?? [],
      latest: markOfLetters(latestLetters),
      latestLetters,
      cells: caseHistory(runs, id),
      passRate: passRateOfLetters(runs.map((run) => run.cases[id])),
      ...averageUsage(runs, id, usage),
    };
  });
}

/** The status filters, about the newest run. */
export const statusFilters = ['all', 'failing', 'flaky', 'passing', 'not-run'] as const;

/** One of the status filters. */
export type StatusFilter = (typeof statusFilters)[number];

/** The marks each status filter keeps. */
const statusMarks: Readonly<Record<StatusFilter, readonly MarkKind[]>> = {
  all: ['pass', 'fail', 'flaky', 'error', 'skip'],
  failing: ['fail', 'error'],
  flaky: ['flaky'],
  passing: ['pass'],
  'not-run': ['skip'],
};

/** The case filters: status, tag and text. */
export interface CaseFilters {
  /** Only cases with this latest status. */
  readonly status: StatusFilter;
  /** Only cases with this tag; every case when empty. */
  readonly tag: string;
  /** Text to find in a case's title, id or tags. */
  readonly search: string;
}

/**
 * Reads the case filters from a query.
 *
 * @param query - The query: `status`, `tag`, `q`.
 * @returns The filters.
 */
export function caseFiltersOf(query: Query): CaseFilters {
  const status = statusFilters.find((filter) => filter === query.status) ?? 'all';
  return { status, tag: query.tag ?? '', search: query.q ?? '' };
}

/**
 * Whether a case passes the filters.
 *
 * @param row - The case's id, title and tags.
 * @param marks - Its latest marks: one, or one per label value; any one may match the status.
 * @param filters - The filters.
 * @returns `true` when it does.
 */
export function matchesCase(
  row: { readonly id: string; readonly title: string; readonly tags: readonly string[] },
  marks: readonly MarkKind[],
  filters: CaseFilters,
): boolean {
  if (filters.tag !== '' && !row.tags.includes(filters.tag)) return false;
  if (!marks.some((mark) => statusMarks[filters.status].includes(mark))) return false;
  const needle = filters.search.trim().toLowerCase();
  if (needle === '') return true;
  return [row.id, row.title, ...row.tags].some((text) => text.toLowerCase().includes(needle));
}

/**
 * Every tag the cases have.
 *
 * @param cases - The index's cases.
 * @returns The tags, sorted.
 */
export function tagsOf(cases: Readonly<Record<string, CaseInfo>>): string[] {
  return [...new Set(Object.values(cases).flatMap((info) => info.tags ?? []))].sort();
}

/** The order marks sort in, worst first. */
export const markRank: Readonly<Record<MarkKind, number>> = {
  error: 0,
  fail: 1,
  flaky: 2,
  pass: 3,
  skip: 4,
};

/**
 * How many runs of a history did not pass.
 *
 * @param cells - The history.
 * @returns The runs that failed, were flaky or ended in an error.
 */
export function brokenRuns(cells: readonly HistoryCell[]): number {
  return cells.filter((cell) => cell.status === 'fail' || cell.status === 'flaky').length;
}

/** The results table's columns. */
export const caseColumns: Columns<CaseRow> = {
  case: (row) => row.title,
  latest: (row) => markRank[row.latest],
  history: (row) => brokenRuns(row.cells),
  passRate: (row) => row.passRate,
  cost: (row) => row.costUsd,
  duration: (row) => row.durationMs,
};
