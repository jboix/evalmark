/**
 * The store: records a run into the action's folder on disk. It writes the run file and its
 * transcripts, applies retention, rebuilds the index, writes the badges and copies the dashboard.
 * It knows nothing of git, so the CLI records into any local folder with it.
 */
import { existsSync } from 'node:fs';
import { copyFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  defaultBranding,
  indexPath,
  type Run,
  type RunSummary,
  runPath,
  type StoreIndex,
} from '../format/store.ts';
import { badgeRun, writeBadges } from './badges.ts';
import { type BrandingInput, writeBranding } from './branding.ts';
import { type BuiltRun, buildRun, type RunDraft } from './build-run.ts';
import { buildIndex, readRuns, summaryOf, writeJson } from './index-file.ts';
import {
  applyRetention,
  type Pruned,
  planRetention,
  prunedAnything,
  type RetentionOptions,
} from './retention.ts';
import { copySite } from './site.ts';
import { folderSize } from './size.ts';

/** How the store records a run. */
export interface StoreOptions extends RetentionOptions {
  /** Whether to write the badges. */
  readonly badges: boolean;
  /** The default branch, whose newest run the badges show; the newest run when unknown. */
  readonly defaultBranch: string | undefined;
  /** The built dashboard's folder. */
  readonly siteDir: string;
  /** The current time. */
  readonly now: Date;
  /** The dashboard's title, subtitle and logo; the defaults when not given. */
  readonly branding?: BrandingInput;
}

/** What recording a run did. */
export interface StoreOutcome {
  /** The run as stored, with its final id. */
  readonly run: Run;
  /** The index after recording. */
  readonly index: StoreIndex;
  /** Whether retention removed or rewrote anything. */
  readonly pruned: boolean;
  /** What retention pruned. */
  readonly retention: Pruned;
  /** The folder's size on disk after recording, in bytes, every file counted. */
  readonly folderBytes: number;
  /** The bytes of the files this run added: its run file, transcripts and new attachments. */
  readonly addedBytes: number;
}

/**
 * A run id the folder does not have yet: the draft's, or the draft's with `-2`, `-3`, and so on.
 *
 * @param folder - The action's folder on disk.
 * @param id - The draft's id.
 * @returns The free id.
 */
function freeId(folder: string, id: string): string {
  let candidate = id;
  for (let count = 2; existsSync(join(folder, runPath(candidate))); count += 1) {
    candidate = `${id}-${count}`;
  }
  return candidate;
}

/**
 * Copies a run's attachment files into the folder. A file the folder has already, from another
 * trial or an earlier run, is the same content and is not copied again.
 *
 * @param folder - The action's folder on disk.
 * @param built - The run and its attachment files.
 * @returns The bytes of the files it copied.
 */
async function copyAttachments(folder: string, built: BuiltRun): Promise<number> {
  let added = 0;
  for (const attachment of built.attachments) {
    const path = join(folder, attachment.path);
    if (existsSync(path)) continue;
    await mkdir(dirname(path), { recursive: true });
    await copyFile(attachment.source, path);
    added += (await stat(path)).size;
  }
  return added;
}

/**
 * Writes a built run's file, its gzipped transcripts and its attachment files.
 *
 * @param folder - The action's folder on disk.
 * @param built - The run, its transcripts and its attachments.
 * @returns The bytes of the files it added.
 */
async function writeRun(folder: string, built: BuiltRun): Promise<number> {
  let added = await copyAttachments(folder, built);
  for (const transcript of built.transcripts) {
    const path = join(folder, transcript.path);
    const content = gzipSync(JSON.stringify(transcript.messages));
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
    added += content.length;
  }
  const runFile = join(folder, runPath(built.run.id));
  await writeJson(runFile, built.run);
  return added + (await stat(runFile)).size;
}

/**
 * Records a run into the folder.
 *
 * @param folder - The action's folder on disk; created when missing.
 * @param draft - The run's draft.
 * @param options - Retention, badges, the dashboard and the time.
 * @returns The stored run, the index, what was pruned, and the folder's size.
 */
export async function storeRun(
  folder: string,
  draft: RunDraft,
  options: StoreOptions,
): Promise<StoreOutcome> {
  await mkdir(folder, { recursive: true });
  const built = buildRun({ ...draft, id: freeId(folder, draft.id) });
  const addedBytes = await writeRun(folder, built);
  const plan = planRetention(await readRuns(folder), built.run.id, options, options.now);
  const retention = await applyRetention(folder, plan);
  const index = buildIndex(plan.kept, draft.suite, options.now.toISOString());
  await writeJson(join(folder, indexPath), index);
  const shown = badgeRun(index.runs, options.defaultBranch);
  if (options.badges && shown) await writeBadges(folder, shown);
  await copySite(options.siteDir, folder);
  await writeBranding(folder, options.branding ?? { ...defaultBranding, logo: undefined });
  const folderBytes = await folderSize(folder);
  return {
    run: built.run,
    index,
    pruned: prunedAnything(retention),
    retention,
    folderBytes,
    addedBytes,
  };
}

/**
 * The index summary of the stored run, as the index has it.
 *
 * @param outcome - What recording did.
 * @returns The run's summary.
 */
export function recordedSummary(outcome: StoreOutcome): RunSummary {
  return outcome.index.runs.find((run) => run.id === outcome.run.id) ?? summaryOf(outcome.run);
}
