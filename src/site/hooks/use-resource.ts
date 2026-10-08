/**
 * Loading data in a component: a promise's state, kept until its key changes.
 */
import { useEffect, useState } from 'preact/hooks';

/** The state of a load. */
export type Resource<T> =
  | { readonly state: 'loading' }
  | { readonly state: 'error'; readonly error: Error }
  | { readonly state: 'ready'; readonly value: T };

/**
 * Loads a value, and loads it again when the key changes.
 *
 * @param key - What identifies the value, such as a path; `undefined` loads nothing.
 * @param load - Loads the value for the key: a stable function, such as a module's loader.
 * @returns The load's state.
 */
export function useResource<T>(
  key: string | undefined,
  load: (key: string) => Promise<T>,
): Resource<T> {
  const [resource, setResource] = useState<Resource<T>>({ state: 'loading' });
  useEffect(() => {
    if (key === undefined) return;
    let current = true;
    setResource({ state: 'loading' });
    load(key).then(
      (value) => current && setResource({ state: 'ready', value }),
      (error: unknown) =>
        current &&
        setResource({
          state: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    );
    return () => {
      current = false;
    };
  }, [key, load]);
  return resource;
}
