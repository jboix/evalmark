/**
 * `evalmark record`: records a result into a local folder with the action's store, without git, and
 * copies the dashboard next to the data.
 */
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { loadAttachments } from '../action/attachment-files.ts';
import type { RunDraft } from '../action/build-run.ts';
import { type Inputs, parseLabels, readInputs } from '../action/inputs.ts';
import { missingText } from '../action/record.ts';
import { createRedactor } from '../action/redact.ts';
import { readResult } from '../action/result-file.ts';
import { defaultSiteDir } from '../action/site.ts';
import { runIdOf } from '../action/source.ts';
import { type StoreOutcome, storeRun } from '../action/store.ts';
import type { Source } from '../format/store.ts';

/** How `evalmark record` is called. */
export const recordUsage =
  'evalmark record --result <file> --dir <dir> [--labels key=value ...] [--suite name]';

/**
 * Runs git in the current directory.
 *
 * @param args - The arguments.
 * @returns What git printed, trimmed, or `undefined` when it failed.
 */
function gitOutput(args: string[]): string | undefined {
  const done = spawnSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return done.status === 0 ? done.stdout.trim() : undefined;
}

/**
 * Where a local run comes from: the current clone's commit and branch, when there is one.
 *
 * @returns The source.
 */
function localSource(): Source {
  const commit = gitOutput(['rev-parse', 'HEAD']);
  const branch = gitOutput(['rev-parse', '--abbrev-ref', 'HEAD']);
  return {
    ...(commit ? { commit } : {}),
    ...(branch && branch !== 'HEAD' ? { branch } : {}),
    event: 'local',
  };
}

/** The command's options, as parsed. */
interface RecordValues {
  /** The result file. */
  readonly result: string;
  /** The folder to record into. */
  readonly dir: string;
  /** Labels, `key=value`. */
  readonly labels?: string[] | undefined;
  /** The suite's name. */
  readonly suite?: string | undefined;
}

/**
 * Reads the result and drafts the run, with the action's defaults for the policies. Missing
 * attachment files are reported on standard error.
 *
 * @param values - The command's options.
 * @param inputs - The action's defaults.
 * @param now - The current time.
 * @returns The draft.
 */
async function draftOf(values: RecordValues, inputs: Inputs, now: Date): Promise<RunDraft> {
  const labels = parseLabels(values.labels ?? []);
  const result = await readResult(values.result, labels, createRedactor([]));
  const loaded = await loadAttachments(result, dirname(values.result));
  if (loaded.missing.length > 0) process.stderr.write(`${missingText(loaded.missing)}\n`);
  return {
    result,
    id: runIdOf(result.startedAt ?? now.toISOString(), {}),
    suite: values.suite ?? result.suite ?? 'evals',
    source: localSource(),
    recordedAt: now.toISOString(),
    transcripts: inputs.transcripts,
    attachments: inputs.attachments,
    attachmentFiles: loaded.files,
  };
}

/**
 * Records a result into a folder.
 *
 * @param args - The command's arguments.
 * @param siteDir - The built dashboard's folder.
 * @returns What recording did, and the folder it recorded into.
 * @throws When an argument is missing or the result is invalid.
 */
export async function recordCommand(
  args: string[],
  siteDir = defaultSiteDir(),
): Promise<StoreOutcome & { readonly dir: string }> {
  const { values } = parseArgs({
    args,
    options: {
      result: { type: 'string' },
      dir: { type: 'string' },
      labels: { type: 'string', multiple: true },
      suite: { type: 'string' },
    },
  });
  const { result, dir } = values;
  if (!result || !dir) throw new Error(`Usage: ${recordUsage}`);
  const defaults = readInputs({});
  const now = new Date();
  const draft = await draftOf({ ...values, result, dir }, defaults, now);
  const outcome = await storeRun(dir, draft, {
    ...defaults,
    defaultBranch: undefined,
    siteDir,
    now,
  });
  return { ...outcome, dir };
}
