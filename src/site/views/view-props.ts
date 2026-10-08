/**
 * What every view receives from the app.
 */
import type { StoreIndex } from '../../format/store.ts';
import type { Route } from '../lib/route.ts';

/** A view's props: the index, its route and the raw hash, for filters. */
export interface ViewProps<V extends Route['view']> {
  /** The index. */
  readonly index: StoreIndex;
  /** The route, narrowed to the view. */
  readonly route: Extract<Route, { view: V }>;
  /** The location's hash, which filters change. */
  readonly hash: string;
}
