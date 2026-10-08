/**
 * A case's checks over a window of runs: how many trials failed each one, read from the run files.
 */
import type { CheckDefinition } from '../../format/result.ts';
import type { Run, StoredTrial } from '../../format/store.ts';

/** One check over the window. */
export interface CheckCount {
  /** The check's id. */
  readonly id: string;
  /** What it checks, as the case declares it. */
  readonly description?: string | undefined;
  /** How many trials failed it. */
  readonly failed: number;
  /** How many trials have a result for it. */
  readonly trials: number;
}

/** A case's checks over the window. */
export interface CheckCounts {
  /** Each check, declared ones first in their order, then any other the trials reported. */
  readonly checks: readonly CheckCount[];
  /** How many trials ended in an error. */
  readonly errored: number;
  /** How many trials the window's runs have for the case. */
  readonly trials: number;
}

/**
 * The trials of one case in runs.
 *
 * @param runs - The run files.
 * @param caseId - The case.
 * @returns Every trial of the case, in the runs' order.
 */
function trialsOf(runs: readonly Run[], caseId: string): StoredTrial[] {
  return runs.flatMap((run) => run.cases.find((stored) => stored.id === caseId)?.trials ?? []);
}

/**
 * How many trials failed each of a case's checks.
 *
 * @param declared - The checks the case declares.
 * @param runs - The window's run files.
 * @param caseId - The case.
 * @returns The counts.
 */
export function checkCounts(
  declared: readonly CheckDefinition[],
  runs: readonly Run[],
  caseId: string,
): CheckCounts {
  const trials = trialsOf(runs, caseId);
  const results = trials.flatMap((trial) => trial.checks ?? []);
  const ids = [
    ...new Set([...declared.map((check) => check.id), ...results.map((result) => result.id)]),
  ];
  const checks = ids.map((id) => {
    const own = results.filter((result) => result.id === id);
    return {
      id,
      description: declared.find((check) => check.id === id)?.description,
      failed: own.filter((result) => !result.pass).length,
      trials: own.length,
    };
  });
  const errored = trials.filter((trial) => trial.status === 'error').length;
  return { checks, errored, trials: trials.length };
}
