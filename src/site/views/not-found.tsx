/**
 * The view for an address that matches no page.
 */
import { links } from '../lib/route.ts';

/**
 * The not-found view.
 *
 * @param props - The path that matched nothing.
 * @returns The view.
 */
export function NotFound(props: { readonly path: string }) {
  return (
    <p class="not-found">
      Nothing lives at <span class="mono">#{props.path}</span>.{' '}
      <a href={links.results()}>Go to the results</a>
    </p>
  );
}
