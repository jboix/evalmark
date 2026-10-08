/**
 * Two runs compared case by case: each case's status in both, and how it changed.
 */
import type { CaseStatus, RunSummary } from '../../format/store.ts';
import { statusOfLetters } from '../../format/totals.ts';
import { markRank } from './case-rows.ts';
import { type MarkKind, markOfLetters } from './marks.ts';
import type { Columns } from './sort.ts';

/** How a case changed from the base run to the head run. */
export type Change = 'regressed' | 'fixed' | 'same' | 'added' | 'removed';

/** One case of the comparison. */
export interface ChangeRow {
  /** The case's id. */
  readonly id: string;
  /** Its title, or its id. */
  readonly title: string;
  /** Its trials in the base run, as letters. */
  readonly baseLetters: string | undefined;
  /** Its trials in the head run, as letters. */
  readonly headLetters: string | undefined;
  /** Its mark in the base run, if it ran there. */
  readonly base: MarkKind | undefined;
  /** Its mark in the head run, if it ran there. */
  readonly head: MarkKind | undefined;
  /** How it changed. */
  readonly change: Change;
}

/** How good each case status is: a lower rank in the head than in the base is a regression. */
const statusRank: Readonly<Record<CaseStatus, number | undefined>> = {
  fail: 0,
  flaky: 1,
  pass: 2,
  skip: undefined,
};

/**
 * How a case changed.
 *
 * @param base - Its letters in the base run.
 * @param head - Its letters in the head run.
 * @returns The change; a case skipped in either run counts as the same.
 */
export function changeOf(base: string | undefined, head: string | undefined): Change {
  if (base === undefined) return 'added';
  if (head === undefined) return 'removed';
  const before = statusRank[statusOfLetters(base)];
  const after = statusRank[statusOfLetters(head)];
  if (before === undefined || after === undefined || before === after) return 'same';
  return after < before ? 'regressed' : 'fixed';
}

/**
 * Every case of two runs, compared.
 *
 * @param base - The run compared against.
 * @param head - The run compared.
 * @param titles - The cases' titles, by id.
 * @returns One row per case either run has, by title.
 */
export function changeRows(
  base: RunSummary,
  head: RunSummary,
  titles: Readonly<Record<string, { readonly title?: string | undefined }>>,
): ChangeRow[] {
  const ids = [...new Set([...Object.keys(base.cases), ...Object.keys(head.cases)])];
  return ids
    .map((id) => {
      const [baseLetters, headLetters] = [base.cases[id], head.cases[id]];
      return {
        id,
        title: titles[id]?.title ?? id,
        baseLetters,
        headLetters,
        base: baseLetters === undefined ? undefined : markOfLetters(baseLetters),
        head: headLetters === undefined ? undefined : markOfLetters(headLetters),
        change: changeOf(baseLetters, headLetters),
      };
    })
    .sort((first, second) => first.title.localeCompare(second.title));
}

/** The order changes sort in, worst first. */
const changeRank: Readonly<Record<Change, number>> = {
  regressed: 0,
  removed: 1,
  added: 2,
  fixed: 3,
  same: 4,
};

/** The comparison's columns. */
export const changeColumns: Columns<ChangeRow> = {
  case: (row) => row.title,
  base: (row) => (row.base === undefined ? null : markRank[row.base]),
  head: (row) => (row.head === undefined ? null : markRank[row.head]),
  change: (row) => changeRank[row.change],
};

/**
 * How many cases changed each way.
 *
 * @param rows - The comparison's rows.
 * @returns The count of each change.
 */
export function changeCounts(rows: readonly ChangeRow[]): Record<Change, number> {
  const counts: Record<Change, number> = { regressed: 0, fixed: 0, same: 0, added: 0, removed: 0 };
  for (const row of rows) counts[row.change] += 1;
  return counts;
}
