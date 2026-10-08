/**
 * Cases by label values: with a label set to every value, each case gets one column per value, so a
 * value that does worse stands out next to the others. Each value has its totals too.
 */
import type { CaseInfo, RunSummary } from '../../format/store.ts';
import { averageOf } from './case-rows.ts';
import { caseIdsOf, passRateOfLetters } from './history.ts';
import { type MarkKind, markOfLetters } from './marks.ts';
import type { Columns } from './sort.ts';

/** The name of the column of runs without the label. */
export const noValue = '(none)';

/** One case under one value. */
export interface MatrixCell {
  /** The value. */
  readonly value: string;
  /** The case's mark in the value's newest run; `skip` when that run did not have it. */
  readonly latest: MarkKind;
  /** The value's newest run, if any. */
  readonly run: RunSummary | undefined;
  /** The case's trials in that run, as letters. */
  readonly letters: string | undefined;
  /** Passed trials over trials that ran in the value's runs; `null` when none ran. */
  readonly passRate: number | null;
}

/** One case across the values. */
export interface MatrixRow {
  /** The case's id. */
  readonly id: string;
  /** Its title, or its id. */
  readonly title: string;
  /** Its tags. */
  readonly tags: readonly string[];
  /** One cell per value, in the values' order. */
  readonly cells: readonly MatrixCell[];
}

/** Cases by values. */
export interface Matrix {
  /** The label key. */
  readonly key: string;
  /** Its values, sorted; runs without it under `(none)`. */
  readonly values: readonly string[];
  /** One row per case, by title. */
  readonly rows: readonly MatrixRow[];
}

/**
 * The value of a run's label, or `(none)`.
 *
 * @param run - The run.
 * @param key - The label key.
 * @returns The value.
 */
function labelValueOf(run: RunSummary, key: string): string {
  return run.labels[key] ?? noValue;
}

/**
 * Groups runs by a label's value.
 *
 * @param runs - The runs, newest first.
 * @param key - The label key.
 * @returns The runs of each value, newest first, values sorted.
 */
export function runsByValue(runs: readonly RunSummary[], key: string): Map<string, RunSummary[]> {
  const groups = new Map<string, RunSummary[]>();
  for (const run of runs) {
    const value = labelValueOf(run, key);
    groups.set(value, [...(groups.get(value) ?? []), run]);
  }
  return new Map([...groups].sort(([first], [second]) => first.localeCompare(second)));
}

/**
 * Cases by the values of a label.
 *
 * @param runs - The runs to look at, newest first.
 * @param key - The label key.
 * @param cases - What the index knows of each case.
 * @returns The matrix.
 */
export function matrixOf(
  runs: readonly RunSummary[],
  key: string,
  cases: Readonly<Record<string, CaseInfo>>,
): Matrix {
  const groups = runsByValue(runs, key);
  const rows = caseIdsOf(runs, cases).map((id) => ({
    id,
    title: cases[id]?.title ?? id,
    tags: cases[id]?.tags ?? [],
    cells: [...groups].map(([value, group]): MatrixCell => {
      const run = group[0];
      const letters = run?.cases[id];
      return {
        value,
        latest: markOfLetters(letters),
        run,
        letters,
        passRate: passRateOfLetters(group.map((entry) => entry.cases[id])),
      };
    }),
  }));
  return { key, values: [...groups.keys()], rows };
}

/**
 * The matrix's columns: the case, then each value by its pass rate.
 *
 * @param values - The values.
 * @returns The columns; a value's key is `v:<value>`.
 */
export function matrixColumns(values: readonly string[]): Columns<MatrixRow> {
  const columns: Record<string, (row: MatrixRow) => number | string | null> = {
    case: (row) => row.title,
  };
  values.forEach((value, index) => {
    columns[`v:${value}`] = (row) => row.cells[index]?.passRate ?? null;
  });
  return columns;
}

/** One value's totals over its runs. */
export interface ValueTotals {
  /** The value. */
  readonly value: string;
  /** How many runs it has. */
  readonly runs: number;
  /** Passed trials over trials that ran, over its runs; `null` when none ran. */
  readonly passRate: number | null;
  /** Its average cost per run. */
  readonly costPerRun: number | null;
  /** Its average duration per run. */
  readonly durationPerRun: number | null;
}

/**
 * Each value's totals.
 *
 * @param runs - The runs, newest first.
 * @param key - The label key.
 * @returns One entry per value, sorted.
 */
export function valueTotals(runs: readonly RunSummary[], key: string): ValueTotals[] {
  return [...runsByValue(runs, key)].map(([value, group]) => {
    const passed = group.reduce((total, run) => total + run.totals.passed, 0);
    const ran = group.reduce((total, run) => total + run.totals.trials - run.totals.skipped, 0);
    return {
      value,
      runs: group.length,
      passRate: ran === 0 ? null : passed / ran,
      costPerRun: averageOf(group.map((run) => run.totals.costUsd)),
      durationPerRun: averageOf(group.map((run) => run.totals.durationMs)),
    };
  });
}
