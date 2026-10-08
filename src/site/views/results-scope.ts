/**
 * What the parts of the results page share: the index, the window's runs and the filters.
 */
import type { RunSummary, StoreIndex } from '../../format/store.ts';
import type { CaseFilters } from '../lib/case-rows.ts';
import type { Query } from '../lib/route.ts';
import type { Selection } from '../lib/selection.ts';

/** The results page's data and filters. */
export interface ResultsScope {
  /** The index. */
  readonly index: StoreIndex;
  /** The window's runs, newest first. */
  readonly runs: readonly RunSummary[];
  /** The branch, labels and window. */
  readonly selection: Selection;
  /** The status, tag and search filters. */
  readonly filters: CaseFilters;
  /** The route's query. */
  readonly query: Query;
  /** The location's hash. */
  readonly hash: string;
}
