/**
 * The current route, following the location's hash.
 */
import { useEffect, useState } from 'preact/hooks';
import { parseRoute, type Route } from '../lib/route.ts';

/**
 * The current route and hash, updated on every hash change.
 *
 * @returns The route and the raw hash it came from.
 */
export function useRoute(): { route: Route; hash: string } {
  const [hash, setHash] = useState(() => location.hash);
  useEffect(() => {
    const update = () => setHash(location.hash);
    addEventListener('hashchange', update);
    return () => removeEventListener('hashchange', update);
  }, []);
  return { route: parseRoute(hash), hash };
}

/**
 * Goes to a link without adding a history entry: the way a filter changes the view.
 *
 * @param href - The link, starting with `#`.
 */
export function replaceRoute(href: string): void {
  location.replace(href);
}
