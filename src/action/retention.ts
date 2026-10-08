/**
 * Retention: which runs the folder keeps, and which of them keep their transcripts and their
 * attachment files. The run just recorded is always kept.
 */
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { type Run, runPath, transcriptsFolder } from '../format/store.ts';
import {
  hasAttachmentFiles,
  sweepAttachments,
  trialAttachmentFiles,
  unattachTranscripts,
  withoutAttachmentFiles,
} from './attachment-retention.ts';
import { writeJson } from './index-file.ts';

/** How much the folder keeps. */
export interface RetentionOptions {
  /** How many runs to keep; `0` keeps every run. */
  readonly keepRuns: number;
  /** How many days of runs to keep; `0` keeps every day. */
  readonly keepDays: number;
  /** How many of the newest runs keep their transcripts; `0` keeps them on every run. */
  readonly keepTranscripts: number;
  /** How many of the newest runs keep their attachment files; `0` keeps them on every run. */
  readonly keepAttachments: number;
}

/** What retention does to the runs. */
export interface RetentionPlan {
  /** The runs kept, newest first, transcripts stripped where they are pruned. */
  readonly kept: readonly Run[];
  /** The runs removed. */
  readonly removed: readonly Run[];
  /** The kept runs whose transcripts are pruned, as they were before. */
  readonly stripped: readonly Run[];
  /** The kept runs whose attachment files are pruned, as they were before. */
  readonly unattached: readonly Run[];
}

/** What retention pruned. */
export interface Pruned {
  /** How many runs it removed. */
  readonly runs: number;
  /** How many kept runs lost their transcripts. */
  readonly transcripts: number;
  /** How many kept runs lost their attachment files. */
  readonly attachments: number;
  /** How many attachment files it deleted. */
  readonly files: number;
}

/** A day, in milliseconds. */
const day = 86_400_000;

/**
 * Whether a run has any transcript kept.
 *
 * @param run - The run.
 * @returns `true` when one of its trials points to a transcript.
 */
function hasTranscripts(run: Run): boolean {
  return run.cases.some((entry) => entry.trials.some((trial) => trial.transcript !== undefined));
}

/**
 * A run without its transcript paths. The message counts stay, and the run's attachment files
 * are only those its trials point to.
 *
 * @param run - The run.
 * @returns The run, its trials pointing to no transcript.
 */
export function withoutTranscripts(run: Run): Run {
  const { attachmentFiles: _files, ...rest } = run;
  const stripped: Run = {
    ...rest,
    cases: run.cases.map((entry) => ({
      ...entry,
      trials: entry.trials.map(({ transcript: _dropped, ...trial }) => trial),
    })),
  };
  const files = trialAttachmentFiles(stripped);
  return files.length === 0 ? stripped : { ...stripped, attachmentFiles: files };
}

/**
 * The runs past the newest ones that still have something to prune.
 *
 * @param runs - The kept runs, newest first.
 * @param limit - How many of the newest runs keep it; `0` keeps it on every run.
 * @param has - Whether a run still has it.
 * @returns The runs to prune it from.
 */
function pastLimit(runs: readonly Run[], limit: number, has: (run: Run) => boolean): Run[] {
  return runs.filter((run, position) => limit > 0 && position >= limit && has(run));
}

/**
 * Applies a pruning to the runs it names.
 *
 * @param runs - The runs.
 * @param pruned - The runs to prune.
 * @param prune - The pruning.
 * @returns The runs, the named ones pruned.
 */
function pruneSome(runs: readonly Run[], pruned: readonly Run[], prune: (run: Run) => Run): Run[] {
  const ids = new Set(pruned.map((run) => run.id));
  return runs.map((run) => (ids.has(run.id) ? prune(run) : run));
}

/**
 * Plans the retention.
 *
 * @param runs - Every run, newest first.
 * @param recordedId - The run just recorded, which is always kept.
 * @param options - How much to keep.
 * @param now - The current time.
 * @returns The plan.
 */
export function planRetention(
  runs: readonly Run[],
  recordedId: string,
  options: RetentionOptions,
  now: Date,
): RetentionPlan {
  const cutoff = now.getTime() - options.keepDays * day;
  const keeps = (run: Run, position: number) =>
    run.id === recordedId ||
    ((options.keepRuns === 0 || position < options.keepRuns) &&
      (options.keepDays === 0 || Date.parse(run.startedAt) >= cutoff));
  const kept = runs.filter(keeps);
  const removed = runs.filter((run, position) => !keeps(run, position));
  const stripped = pastLimit(kept, options.keepTranscripts, hasTranscripts);
  const withTranscripts = pruneSome(kept, stripped, withoutTranscripts);
  const unattached = pastLimit(withTranscripts, options.keepAttachments, hasAttachmentFiles);
  return {
    kept: pruneSome(withTranscripts, unattached, withoutAttachmentFiles),
    removed,
    stripped,
    unattached,
  };
}

/**
 * Applies a plan to the folder: deletes removed runs and their transcripts, deletes or rewrites the
 * pruned transcripts, rewrites the pruned runs, and deletes the attachment files no kept run uses.
 *
 * @param folder - The action's folder on disk.
 * @param plan - The plan.
 * @returns What it pruned.
 */
export async function applyRetention(folder: string, plan: RetentionPlan): Promise<Pruned> {
  for (const run of plan.removed) {
    await rm(join(folder, runPath(run.id)), { force: true });
    await rm(join(folder, transcriptsFolder(run.id)), { recursive: true, force: true });
  }
  for (const run of plan.stripped) {
    await rm(join(folder, transcriptsFolder(run.id)), { recursive: true, force: true });
  }
  const changed = new Set([...plan.stripped, ...plan.unattached].map((run) => run.id));
  const unattached = new Set(plan.unattached.map((run) => run.id));
  for (const run of plan.kept.filter((entry) => changed.has(entry.id))) {
    if (unattached.has(run.id)) await unattachTranscripts(folder, run);
    await writeJson(join(folder, runPath(run.id)), run);
  }
  return {
    runs: plan.removed.length,
    transcripts: plan.stripped.length,
    attachments: plan.unattached.length,
    files: await sweepAttachments(folder, plan.kept),
  };
}

/**
 * Whether retention pruned anything, which lets `history: auto` squash the history.
 *
 * @param pruned - What it pruned.
 * @returns `true` when it removed or rewrote anything.
 */
export function prunedAnything(pruned: Pruned): boolean {
  return pruned.runs + pruned.transcripts + pruned.attachments + pruned.files > 0;
}
