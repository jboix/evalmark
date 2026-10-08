/**
 * The results page's summary line: the newest run the filters keep, as a test runner's footer, and
 * the change of its pass rate since the run before it with the same labels.
 */
import { sameLabels } from '../../format/compare.ts';
import type { RunSummary } from '../../format/store.ts';

/** The figures of the summary line. */
export interface SummaryLine {
  /** The newest run. */
  readonly run: RunSummary;
  /** The run before it with the same labels, if any. */
  readonly previous: RunSummary | undefined;
  /** Its pass rate minus the previous run's; `null` without a previous run or a pass rate. */
  readonly passRateDelta: number | null;
}

/**
 * The summary line of a list of runs.
 *
 * @param runs - The runs, newest first.
 * @returns The figures, or `undefined` when there is no run.
 */
export function summaryLineOf(runs: readonly RunSummary[]): SummaryLine | undefined {
  const [run, ...older] = runs;
  if (run === undefined) return undefined;
  const previous = older.find((candidate) => sameLabels(candidate.labels, run.labels));
  const [now, before] = [run.totals.passRate, previous?.totals.passRate ?? null];
  return {
    run,
    previous,
    passRateDelta: now === null || before === null ? null : now - before,
  };
}
