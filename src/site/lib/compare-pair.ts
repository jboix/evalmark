/**
 * The two runs a comparison shows: picked from the runs of one branch and one set of labels, so a
 * model is compared with itself unless the reader asks otherwise.
 */
import { baselineOf } from '../../format/compare.ts';
import type { RunSummary, StoreIndex } from '../../format/store.ts';
import type { Query } from './route.ts';
import { filterRuns } from './runs.ts';
import type { Selection } from './selection.ts';

/**
 * The runs the selection keeps, newest first: those on its branch with its label values.
 *
 * @param index - The index.
 * @param selection - The selection.
 * @returns The runs to pick from.
 */
export function candidatesOf(index: StoreIndex, selection: Selection): RunSummary[] {
  return filterRuns(index.runs, { branch: selection.branch, labels: selection.labels });
}

/**
 * The runs the query names when they are among the candidates, or else the newest candidate and
 * the run before it with the same labels.
 *
 * @param candidates - The runs to pick from, newest first.
 * @param query - The query: `base` and `head`.
 * @returns The two runs, either `undefined` when there is none.
 */
export function pairOf(candidates: readonly RunSummary[], query: Query) {
  const find = (id: string | undefined) => candidates.find((run) => run.id === id);
  const head = find(query.head) ?? candidates[0];
  if (head === undefined) return { base: undefined, head: undefined };
  const branch = head.source.branch ?? '';
  return { base: find(query.base) ?? baselineOf(candidates, head, branch), head };
}
