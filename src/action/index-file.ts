/**
 * The index, `data/index.json`, rebuilt from every run file in the folder. As it never merges, two
 * runs recorded at once never conflict: each adds its own file and the index follows.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type CaseInfo,
  dataFolder,
  type Run,
  type RunSummary,
  type StoreIndex,
  storeVersion,
} from '../format/store.ts';
import { lettersOf } from '../format/totals.ts';

/**
 * Writes a file as JSON, creating its folder.
 *
 * @param path - The file's path.
 * @param data - What to write.
 * @returns When it is written.
 */
export async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data)}\n`);
}

/**
 * Sorts runs newest first by start time, then by id.
 *
 * @param runs - The runs.
 * @returns A sorted copy.
 */
export function newestFirst<Entry extends { readonly startedAt: string; readonly id: string }>(
  runs: readonly Entry[],
): Entry[] {
  return [...runs].sort(
    (first, second) =>
      second.startedAt.localeCompare(first.startedAt) || second.id.localeCompare(first.id),
  );
}

/**
 * Reads every run file in the folder. A file that is not JSON is skipped.
 *
 * @param folder - The action's folder on disk.
 * @returns The runs, newest first.
 */
export async function readRuns(folder: string): Promise<Run[]> {
  const runsFolder = join(folder, dataFolder, 'runs');
  const names = await readdir(runsFolder).catch(() => [] as string[]);
  const runs: Run[] = [];
  for (const name of names.filter((entry) => entry.endsWith('.json'))) {
    try {
      runs.push(JSON.parse(await readFile(join(runsFolder, name), 'utf8')) as Run);
    } catch {
      // A broken file is left as it is and out of the index.
    }
  }
  return newestFirst(runs);
}

/**
 * A run's summary for the index.
 *
 * @param run - The run.
 * @returns Its summary.
 */
export function summaryOf(run: Run): RunSummary {
  return {
    id: run.id,
    recordedAt: run.recordedAt,
    startedAt: run.startedAt,
    labels: run.labels,
    source: run.source,
    totals: run.totals,
    cases: Object.fromEntries(run.cases.map((entry) => [entry.id, lettersOf(entry.trials)])),
    transcripts: run.cases.some((entry) => entry.trials.some((trial) => trial.transcript)),
  };
}

/**
 * Every case's title and tags, from the newest run that has the case.
 *
 * @param runs - The runs, newest first.
 * @returns The cases, by id.
 */
function casesOf(runs: readonly Run[]): Record<string, CaseInfo> {
  const cases: Record<string, CaseInfo> = {};
  for (const entry of runs.flatMap((run) => run.cases)) {
    if (cases[entry.id] !== undefined) continue;
    cases[entry.id] = {
      ...(entry.title === undefined ? {} : { title: entry.title }),
      ...(entry.tags === undefined ? {} : { tags: entry.tags }),
    };
  }
  return cases;
}

/**
 * Builds the index from the runs.
 *
 * @param runs - The runs, in any order.
 * @param suite - The suite's name.
 * @param updatedAt - When the index is written, as an ISO time.
 * @returns The index.
 */
export function buildIndex(runs: readonly Run[], suite: string, updatedAt: string): StoreIndex {
  const sorted = newestFirst(runs);
  return {
    version: storeVersion,
    suite,
    updatedAt,
    runs: sorted.map(summaryOf),
    cases: casesOf(sorted),
  };
}
