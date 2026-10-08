/**
 * Comparing runs: which run a run is compared with, and what changed between them. The pull request
 * comment and the dashboard's comparison use the same functions, so they always agree.
 */
import type { CaseStatus, RunSummary } from './store.ts';
import { statusOfLetters } from './totals.ts';

/** A case whose status changed, or stayed failing, between two runs. */
export interface CaseChange {
  /** The case's id. */
  readonly id: string;
  /** Its status in the base run; `undefined` when the base run did not have it. */
  readonly before: CaseStatus | undefined;
  /** Its status in the head run. */
  readonly after: CaseStatus;
}

/** What changed from a base run to a head run. */
export interface RunDiff {
  /** The run compared against. */
  readonly base: RunSummary;
  /** The run compared. */
  readonly head: RunSummary;
  /** The head's pass rate minus the base's; `null` when either has none. */
  readonly passRateDelta: number | null;
  /** The head's cost minus the base's, in US dollars. */
  readonly costDelta: number;
  /** The head's tokens minus the base's, input and output together. */
  readonly tokensDelta: number;
  /** The head's duration minus the base's. */
  readonly durationDelta: number;
  /** Cases that passed in the base and fail or are flaky in the head. */
  readonly regressed: readonly CaseChange[];
  /** Cases that failed or were flaky in the base and pass in the head. */
  readonly fixed: readonly CaseChange[];
  /** Cases that fail in both. */
  readonly stillFailing: readonly CaseChange[];
  /** Cases the head has and the base has not. */
  readonly added: readonly CaseChange[];
  /** Ids of cases the base has and the head has not. */
  readonly removed: readonly string[];
}

/** Statuses that count as not passing. */
const broken: ReadonlySet<CaseStatus> = new Set(['fail', 'flaky']);

/**
 * Whether two runs have the same labels.
 *
 * @param first - One run's labels.
 * @param second - The other's.
 * @returns `true` when both have the same keys with the same values.
 */
export function sameLabels(
  first: Readonly<Record<string, string>>,
  second: Readonly<Record<string, string>>,
): boolean {
  const keys = Object.keys(first);
  if (keys.length !== Object.keys(second).length) return false;
  return keys.every((key) => first[key] === second[key]);
}

/**
 * The run to compare a run with: the newest other run on the branch with the same labels, or else
 * the newest other run on the branch.
 *
 * @param runs - The runs, newest first.
 * @param head - The run to compare.
 * @param branch - The branch to look on, such as the pull request's base branch.
 * @returns The base run, or `undefined` when the branch has no other run.
 */
export function baselineOf(
  runs: readonly RunSummary[],
  head: RunSummary,
  branch: string,
): RunSummary | undefined {
  const candidates = runs.filter(
    (run) => run.id !== head.id && run.source.branch === branch && run.startedAt <= head.startedAt,
  );
  return candidates.find((run) => sameLabels(run.labels, head.labels)) ?? candidates[0];
}

/**
 * The case changes between two runs, sorted into the diff's groups.
 *
 * @param base - The base run.
 * @param head - The head run.
 * @returns The groups.
 */
function caseChanges(base: RunSummary, head: RunSummary) {
  const changes = Object.entries(head.cases).map(([id, letters]): CaseChange => {
    const before = base.cases[id];
    return {
      id,
      before: before === undefined ? undefined : statusOfLetters(before),
      after: statusOfLetters(letters),
    };
  });
  const known = changes.filter((change) => change.before !== undefined);
  return {
    regressed: known.filter((change) => change.before === 'pass' && broken.has(change.after)),
    fixed: known.filter(
      (change) =>
        change.before !== undefined && broken.has(change.before) && change.after === 'pass',
    ),
    stillFailing: known.filter((change) => change.before === 'fail' && change.after === 'fail'),
    added: changes.filter((change) => change.before === undefined),
    removed: Object.keys(base.cases).filter((id) => head.cases[id] === undefined),
  };
}

/**
 * What changed from one run to another.
 *
 * @param base - The run compared against.
 * @param head - The run compared.
 * @returns The diff.
 */
export function diffRuns(base: RunSummary, head: RunSummary): RunDiff {
  const [before, after] = [base.totals, head.totals];
  return {
    base,
    head,
    passRateDelta:
      before.passRate === null || after.passRate === null ? null : after.passRate - before.passRate,
    costDelta: after.costUsd - before.costUsd,
    tokensDelta:
      after.inputTokens + after.outputTokens - (before.inputTokens + before.outputTokens),
    durationDelta: after.durationMs - before.durationMs,
    ...caseChanges(base, head),
  };
}
