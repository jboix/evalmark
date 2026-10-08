/**
 * Cases across runs: each case's history over a window of runs, and its pass rate there.
 */
import type { CaseStatus, RunSummary } from '../../format/store.ts';
import { statusOfLetters } from '../../format/totals.ts';

/** One run in a case's history. */
export interface HistoryCell {
  /** The run. */
  readonly run: RunSummary;
  /** The case's trials in that run, as letters; `undefined` when the run did not have it. */
  readonly letters: string | undefined;
  /** The case's status in that run. */
  readonly status: CaseStatus | undefined;
}

/**
 * A case's history over runs.
 *
 * @param runs - The runs, newest first.
 * @param caseId - The case's id.
 * @returns One cell per run, oldest first.
 */
export function caseHistory(runs: readonly RunSummary[], caseId: string): HistoryCell[] {
  return runs
    .map((run) => {
      const letters = run.cases[caseId];
      return { run, letters, status: letters === undefined ? undefined : statusOfLetters(letters) };
    })
    .reverse();
}

/**
 * The pass rate of trials given as letters: passed trials over trials that ran, skipped ones left
 * out.
 *
 * @param letters - Each run's letters; `undefined` for a run without the case.
 * @returns From 0 to 1, or `null` when no trial ran.
 */
export function passRateOfLetters(letters: readonly (string | undefined)[]): number | null {
  const ran = letters.join('').replaceAll('S', '');
  if (ran.length === 0) return null;
  return ran.replaceAll(/[^P]/g, '').length / ran.length;
}

/**
 * The trial a link to a case in a run opens: the first one that did not pass, or else the first.
 *
 * @param letters - The case's trials, as letters.
 * @returns The trial's index.
 */
export function trialToOpen(letters: string | undefined): number {
  const index = letters?.search(/[FE]/) ?? -1;
  return index === -1 ? 0 : index;
}

/**
 * Every case id the runs have, ordered by the index's titles, then by id.
 *
 * @param runs - The runs.
 * @param titles - The cases' titles, by id.
 * @returns The ids.
 */
export function caseIdsOf(
  runs: readonly RunSummary[],
  titles: Readonly<Record<string, { readonly title?: string | undefined }>>,
): string[] {
  const ids = new Set(runs.flatMap((run) => Object.keys(run.cases)));
  const name = (id: string) => titles[id]?.title ?? id;
  return [...ids].sort((first, second) => name(first).localeCompare(name(second)));
}
