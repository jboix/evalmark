/**
 * Small run summaries for the dashboard's unit tests.
 */
import type { RunSummary } from '../../src/format/store.ts';
import { totalsOf } from '../../src/format/totals.ts';

/** What a test summary is made from. */
interface SummaryParts {
  /** Its id. */
  readonly id: string;
  /** Its start time. */
  readonly startedAt: string;
  /** Its cases' letters, by id. */
  readonly cases: Readonly<Record<string, string>>;
  /** Its branch. */
  readonly branch?: string;
  /** Its labels. */
  readonly labels?: Readonly<Record<string, string>>;
  /** Its commit. */
  readonly commit?: string;
  /** Its pull request. */
  readonly pullRequest?: number;
  /** Its cost. */
  readonly costUsd?: number;
}

/** Trial statuses by letter. */
const statuses = { P: 'pass', F: 'fail', E: 'error', S: 'skip' } as const;

/**
 * A run summary whose totals match its letters.
 *
 * @param parts - What it is made from.
 * @returns The summary.
 */
export function summary(parts: SummaryParts): RunSummary {
  const cases = Object.values(parts.cases).map((letters) => ({
    trials: [...letters].map((letter) => ({
      status: statuses[letter as keyof typeof statuses],
      usage: {
        costUsd:
          (parts.costUsd ?? 0) / Math.max(1, letters.length * Object.keys(parts.cases).length),
      },
      durationMs: 1000,
    })),
  }));
  return {
    id: parts.id,
    recordedAt: parts.startedAt,
    startedAt: parts.startedAt,
    labels: parts.labels ?? {},
    source: {
      ...(parts.branch === undefined ? {} : { branch: parts.branch }),
      ...(parts.commit === undefined ? {} : { commit: parts.commit }),
      ...(parts.pullRequest === undefined ? {} : { pullRequest: parts.pullRequest }),
    },
    totals: totalsOf(cases),
    cases: parts.cases,
    transcripts: false,
  };
}
