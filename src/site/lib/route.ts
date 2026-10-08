/**
 * Hash routes: every view and its filters live in the address after `#`, so each one is a permanent
 * link and the site works in any folder of any static host.
 */

/** A route's query: its filters, by name. */
export type Query = Readonly<Record<string, string>>;

/** A parsed route: which view, its ids, and its query. */
export type Route =
  | { readonly view: 'results'; readonly query: Query }
  | { readonly view: 'runs'; readonly query: Query }
  | { readonly view: 'run'; readonly runId: string; readonly query: Query }
  | {
      readonly view: 'trial';
      readonly runId: string;
      readonly caseId: string;
      readonly trial: number;
      readonly query: Query;
    }
  | { readonly view: 'case'; readonly caseId: string; readonly query: Query }
  | { readonly view: 'compare'; readonly query: Query }
  | { readonly view: 'not-found'; readonly path: string; readonly query: Query };

/**
 * Splits a hash into its path segments, decoded, and its query.
 *
 * @param hash - The location's hash, with or without the leading `#`.
 * @returns The segments and the query.
 */
function splitHash(hash: string): { segments: string[]; query: Query; path: string } {
  const raw = hash.replace(/^#/, '');
  const mark = raw.indexOf('?');
  const path = mark === -1 ? raw : raw.slice(0, mark);
  const search = mark === -1 ? '' : raw.slice(mark + 1);
  const segments = path
    .split('/')
    .filter((segment) => segment !== '')
    .map(safeDecode);
  return { segments, query: Object.fromEntries(new URLSearchParams(search)), path: path || '/' };
}

/**
 * Decodes one path segment, keeping it as it is when it is not valid percent-encoding.
 *
 * @param segment - The segment.
 * @returns The decoded segment.
 */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Parses a trial's index from its segment.
 *
 * @param segment - The segment, such as `2`.
 * @returns The index, or `undefined` when it is not a non-negative integer.
 */
function trialIndex(segment: string): number | undefined {
  return /^\d+$/.test(segment) ? Number(segment) : undefined;
}

/**
 * Parses the routes under `#/runs`.
 *
 * @param rest - The segments after `runs`.
 * @param query - The query.
 * @returns The route, or `undefined` when the segments match none.
 */
function runsRoute(rest: readonly string[], query: Query): Route | undefined {
  const [runId, caseId, trial, ...extra] = rest;
  if (runId === undefined) return { view: 'runs', query };
  if (caseId === undefined) return { view: 'run', runId, query };
  const index = trial === undefined ? undefined : trialIndex(trial);
  if (index === undefined || extra.length > 0) return undefined;
  return { view: 'trial', runId, caseId, trial: index, query };
}

/**
 * Parses the routes with one optional id after their name.
 *
 * @param name - The first segment.
 * @param rest - The segments after it.
 * @param query - The query.
 * @returns The route, or `undefined` when the segments match none.
 */
function namedRoute(name: string, rest: readonly string[], query: Query): Route | undefined {
  const [id, ...extra] = rest;
  if (extra.length > 0) return undefined;
  if (name === 'cases' && id !== undefined) return caseRoute(id, query);
  if (name === 'compare' && id === undefined) return { view: 'compare', query };
  return undefined;
}

/**
 * The route of one case.
 *
 * @param caseId - The case's id.
 * @param query - The query.
 * @returns The route.
 */
function caseRoute(caseId: string, query: Query): Route {
  return { view: 'case', caseId, query };
}

/**
 * Parses a location's hash into a route.
 *
 * @param hash - The hash, such as `#/runs/abc?branch=main`.
 * @returns The route; `not-found` when it matches no view. Old addresses are redirected first,
 *   with `redirectOf`.
 */
export function parseRoute(hash: string): Route {
  const { segments, query, path } = splitHash(hash);
  const [name, ...rest] = segments;
  if (name === undefined) return { view: 'results', query };
  const route = name === 'runs' ? runsRoute(rest, query) : namedRoute(name, rest, query);
  return route ?? { view: 'not-found', path, query };
}

/**
 * Builds a link to a path with a query, dropping empty values.
 *
 * @param segments - The path's segments, encoded here.
 * @param query - The query; empty and `undefined` values are left out.
 * @returns The link, such as `#/runs/abc?branch=main`.
 */
export function hrefOf(
  segments: readonly (string | number)[],
  query: Readonly<Record<string, string | undefined>> = {},
): string {
  const path = segments.map((segment) => encodeURIComponent(String(segment))).join('/');
  const entries = Object.entries(query).filter(
    (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '',
  );
  const search = new URLSearchParams(entries).toString();
  return `#/${path}${search === '' ? '' : `?${search}`}`;
}

/**
 * The link to a route with some query values changed: the way a filter changes the view.
 *
 * @param hash - The current hash.
 * @param changes - The values to set; empty or `undefined` removes one.
 * @returns The new link.
 */
export function withQuery(
  hash: string,
  changes: Readonly<Record<string, string | undefined>>,
): string {
  const { segments, query } = splitHash(hash);
  return hrefOf(segments, { ...query, ...changes });
}

/**
 * Where an address of an earlier dashboard now lives: the case list is the results page, and a
 * label's comparison is the compare page's models mode.
 *
 * @param hash - The location's hash.
 * @returns The new link, or `undefined` when the address is current.
 */
export function redirectOf(hash: string): string | undefined {
  const { segments, query } = splitHash(hash);
  const [name, key, ...extra] = segments;
  if (extra.length > 0) return undefined;
  if (name === 'cases' && key === undefined) return hrefOf([], query);
  if (name === 'labels' && key !== undefined) {
    return hrefOf(['compare'], { ...query, mode: 'models', key });
  }
  return undefined;
}

/** A query for a link, values left out when `undefined`. */
type LinkQuery = Readonly<Record<string, string | undefined>>;

/** Links to each view, so no component builds a path by hand. */
export const links = {
  results: (query?: LinkQuery) => hrefOf([], query),
  runs: (query?: LinkQuery) => hrefOf(['runs'], query),
  run: (runId: string, query?: LinkQuery) => hrefOf(['runs', runId], query),
  trial: (runId: string, caseId: string, trial: number) => hrefOf(['runs', runId, caseId, trial]),
  case: (caseId: string, query?: LinkQuery) => hrefOf(['cases', caseId], query),
  compare: (query?: LinkQuery) => hrefOf(['compare'], query),
};
