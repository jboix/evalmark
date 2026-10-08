/**
 * Reading one run: each case's row, which checks failed in it, and what it spent.
 */
import type { CheckDefinition, CheckResult } from '../../format/result.ts';
import type { Run, StoredTrial } from '../../format/store.ts';
import { lettersOf } from '../../format/totals.ts';
import { markRank } from './case-rows.ts';
import { type MarkKind, markOfLetters } from './marks.ts';
import type { Columns } from './sort.ts';

/** A check that failed in some of a case's trials. */
export interface FailingCheck {
  /** The check's id, or `error` for trials that ended in an error. */
  readonly id: string;
  /** How many trials it failed in. */
  readonly count: number;
  /** The first message it gave, if any. */
  readonly message?: string | undefined;
}

/**
 * The checks that failed in a case's trials, most often first. Errors count as their own entry.
 *
 * @param trials - The case's trials.
 * @returns The failing checks.
 */
export function failingChecks(trials: readonly StoredTrial[]): FailingCheck[] {
  const found = new Map<string, { count: number; message?: string | undefined }>();
  for (const [id, message] of trials.flatMap(failuresOf)) {
    const known = found.get(id);
    found.set(id, { count: (known?.count ?? 0) + 1, message: known?.message ?? message });
  }
  return [...found]
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((first, second) => second.count - first.count || first.id.localeCompare(second.id));
}

/**
 * What failed in one trial: its error, and each failed check.
 *
 * @param trial - The trial.
 * @returns Each failure's id and message.
 */
function failuresOf(trial: StoredTrial): [string, string | undefined][] {
  const checks = (trial.checks ?? [])
    .filter((check) => !check.pass)
    .map((check): [string, string | undefined] => [check.id, check.message]);
  return trial.status === 'error' ? [['error', trial.error], ...checks] : checks;
}

/**
 * Sums a case's usage over its trials.
 *
 * @param trials - The trials.
 * @returns The cost and the duration.
 */
export function caseUsage(trials: readonly StoredTrial[]): { costUsd: number; durationMs: number } {
  return {
    costUsd: trials.reduce((total, trial) => total + (trial.usage?.costUsd ?? 0), 0),
    durationMs: trials.reduce((total, trial) => total + (trial.durationMs ?? 0), 0),
  };
}

/** A check of one trial: its declaration and its result together. */
export interface CheckRow {
  /** The check's id. */
  readonly id: string;
  /** What it checks, as the case declares it. */
  readonly description?: string | undefined;
  /** What it found: `none` when the trial has no result for it. */
  readonly state: 'pass' | 'fail' | 'none';
  /** The result's message. */
  readonly message?: string | undefined;
}

/**
 * Joins a case's declared checks with a trial's results: declared ones first, then undeclared.
 *
 * @param declared - The case's declared checks.
 * @param results - The trial's results.
 * @returns One row per check.
 */
export function checkRows(
  declared: readonly CheckDefinition[],
  results: readonly CheckResult[],
): CheckRow[] {
  const ids = [
    ...new Set([...declared.map((check) => check.id), ...results.map((check) => check.id)]),
  ];
  return ids.map((id) => {
    const result = results.find((check) => check.id === id);
    const state = result === undefined ? 'none' : result.pass ? 'pass' : 'fail';
    return {
      id,
      description: declared.find((check) => check.id === id)?.description,
      state,
      message: result?.message,
    };
  });
}

/** One case of a run's table. */
export interface RunCaseRow {
  /** The case's id. */
  readonly id: string;
  /** Its title, or its id. */
  readonly title: string;
  /** Its tags. */
  readonly tags: readonly string[];
  /** Its mark in the run. */
  readonly mark: MarkKind;
  /** Its trials, as letters. */
  readonly letters: string;
  /** The checks that failed, most often first. */
  readonly failing: readonly FailingCheck[];
  /** What its trials cost, in US dollars. */
  readonly costUsd: number;
  /** How long its trials took. */
  readonly durationMs: number;
}

/**
 * A run's table: one row per case, in the run's order.
 *
 * @param run - The run.
 * @returns The rows.
 */
export function runCaseRows(run: Run): RunCaseRow[] {
  return run.cases.map((stored) => {
    const letters = lettersOf(stored.trials);
    return {
      id: stored.id,
      title: stored.title ?? stored.id,
      tags: stored.tags ?? [],
      mark: markOfLetters(letters),
      letters,
      failing: failingChecks(stored.trials),
      ...caseUsage(stored.trials),
    };
  });
}

/** A run's table's columns. */
export const runCaseColumns: Columns<RunCaseRow> = {
  case: (row) => row.title,
  status: (row) => markRank[row.mark],
  checks: (row) => row.failing[0]?.id,
  cost: (row) => row.costUsd,
  duration: (row) => row.durationMs,
};
