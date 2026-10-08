/**
 * Statuses and totals, computed the same way by the action, the comment and the dashboard.
 */
import type { TrialStatus } from './result.ts';
import { type CaseStatus, type Totals, trialLetters } from './store.ts';

/** What the totals are computed from: a trial's status, usage and duration. */
interface CountedTrial {
  /** Its status. */
  readonly status: TrialStatus;
  /** Its duration. */
  readonly durationMs?: number | undefined;
  /** Its usage. */
  readonly usage?:
    | {
        readonly inputTokens?: number | undefined;
        readonly outputTokens?: number | undefined;
        readonly costUsd?: number | undefined;
      }
    | undefined;
}

/**
 * A case's status from its trials' letters: `skip` when every trial was skipped, `pass` when every
 * other trial passed, `fail` when none did, `flaky` otherwise.
 *
 * @param letters - The trials' letters, as a run summary keeps them, such as `PPF`.
 * @returns The status.
 */
export function statusOfLetters(letters: string): CaseStatus {
  const ran = letters.replaceAll(trialLetters.skip, '');
  if (ran.length === 0) return 'skip';
  const passed = ran.split('').filter((letter) => letter === trialLetters.pass).length;
  if (passed === ran.length) return 'pass';
  return passed === 0 ? 'fail' : 'flaky';
}

/**
 * The letters of a case's trials.
 *
 * @param trials - The trials.
 * @returns One letter per trial, in order.
 */
export function lettersOf(trials: readonly { readonly status: TrialStatus }[]): string {
  return trials.map((trial) => trialLetters[trial.status]).join('');
}

/**
 * The totals of a run.
 *
 * @param cases - Its cases, each with its trials.
 * @param durationMs - The run's own duration, when the result gave one.
 * @returns The totals.
 */
export function totalsOf(
  cases: readonly { readonly trials: readonly CountedTrial[] }[],
  durationMs?: number,
): Totals {
  const trials = cases.flatMap((entry) => entry.trials);
  const statuses = cases.map((entry) => statusOfLetters(lettersOf(entry.trials)));
  const count = (status: TrialStatus) => trials.filter((trial) => trial.status === status).length;
  const sum = (pick: (trial: CountedTrial) => number | undefined) =>
    trials.reduce((total, trial) => total + (pick(trial) ?? 0), 0);
  const skipped = count('skip');
  const passed = count('pass');
  const ran = trials.length - skipped;
  return {
    cases: cases.length,
    casesPassed: statuses.filter((status) => status === 'pass').length,
    casesFlaky: statuses.filter((status) => status === 'flaky').length,
    casesFailed: statuses.filter((status) => status === 'fail').length,
    trials: trials.length,
    passed,
    failed: count('fail'),
    errored: count('error'),
    skipped,
    passRate: ran === 0 ? null : passed / ran,
    inputTokens: sum((trial) => trial.usage?.inputTokens),
    outputTokens: sum((trial) => trial.usage?.outputTokens),
    costUsd: sum((trial) => trial.usage?.costUsd),
    durationMs: durationMs ?? sum((trial) => trial.durationMs),
  };
}
