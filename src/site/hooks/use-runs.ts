/**
 * Loading the run files of a list of runs, such as a window's.
 */
import type { Run } from '../../format/store.ts';
import { loadRunList, runListKey } from '../lib/data.ts';
import { type Resource, useResource } from './use-resource.ts';

/**
 * Loads the run files of runs, again when the list changes.
 *
 * @param runIds - The runs' ids.
 * @returns The load's state; the runs in the list's order once ready.
 */
export function useRuns(runIds: readonly string[]): Resource<Run[]> {
  return useResource(runListKey(runIds), loadRunList);
}
