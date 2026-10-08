/**
 * What a view shows while it loads, when it fails, and when it has nothing to show.
 */
import type { ComponentChildren } from 'preact';
import type { Resource } from '../hooks/use-resource.ts';
import { MissingFileError } from '../lib/data.ts';

/**
 * A loading placeholder.
 *
 * @param props - What is loading.
 * @returns The placeholder.
 */
export function Loading(props: { readonly what?: string }) {
  return (
    <div class="state state-loading" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      Loading {props.what ?? ''}…
    </div>
  );
}

/**
 * A failure to read data.
 *
 * @param props - The error, and what was being read.
 * @returns The message.
 */
export function Failure(props: { readonly error: Error; readonly what: string }) {
  const missing = props.error instanceof MissingFileError;
  return (
    <div class="state state-error" role="alert">
      <strong>{missing ? `No ${props.what} here.` : `The ${props.what} could not be read.`}</strong>
      <p>{props.error.message}</p>
      {missing ? null : (
        <button type="button" class="button" onClick={() => location.reload()}>
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * An empty state: a title and what to do about it.
 *
 * @param props - The title and the explanation.
 * @returns The empty state.
 */
export function Empty(props: { readonly title: string; readonly children?: ComponentChildren }) {
  return (
    <div class="state state-empty">
      <strong>{props.title}</strong>
      {props.children === undefined ? null : <div>{props.children}</div>}
    </div>
  );
}

/**
 * Renders a resource: its loading and failure states, or its value.
 *
 * @param props - The resource, what it is, and how to render its value.
 * @returns The rendered state.
 */
export function Loaded<T>(props: {
  readonly resource: Resource<T>;
  readonly what: string;
  readonly children: (value: T) => ComponentChildren;
}) {
  const { resource } = props;
  if (resource.state === 'loading') return <Loading what={props.what} />;
  if (resource.state === 'error') return <Failure error={resource.error} what={props.what} />;
  return <>{props.children(resource.value)}</>;
}

/**
 * What a table shows when its filters keep no row: what happened and how to undo it.
 *
 * @param props - What the rows are, and the link that clears the filters.
 * @returns The empty state.
 */
export function NoMatch(props: { readonly what: string; readonly clear: string }) {
  return (
    <div class="state state-empty">
      <strong>No {props.what} match these filters.</strong>
      <a href={props.clear}>Clear the filters</a>
    </div>
  );
}
