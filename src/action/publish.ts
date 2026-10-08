/**
 * Publishing a run: fetch the branch's tip, record into its folder, commit and push. A rejected
 * push is redone on the new tip, so runs recorded at once all land.
 */
import { join } from 'node:path';
import {
  checkoutTip,
  commitAll,
  push,
  type Remote,
  removeDirectory,
  temporaryDirectory,
  trackedFiles,
} from './git.ts';
import type { HistoryPolicy } from './inputs.ts';
import type { Logger } from './log.ts';
import type { StoreOutcome } from './store.ts';

/** What to publish, and where. */
export interface PublishRequest {
  /** The remote and its ref. */
  readonly remote: Remote;
  /** The folder the action owns on the branch. */
  readonly folder: string;
  /** How the history is kept. */
  readonly history: HistoryPolicy;
  /** Whether to push; `false` on a pull request from a fork, where the run is only compared. */
  readonly push: boolean;
  /** Records the run into the folder on disk. */
  readonly record: (folder: string) => Promise<StoreOutcome>;
  /** The log. */
  readonly log: Logger;
  /** How many times to try; 5 by default. */
  readonly attempts?: number;
}

/** What publishing did. */
export interface PublishOutcome {
  /** What recording did, on the tip it was pushed onto. */
  readonly outcome: StoreOutcome;
  /** Whether the run was pushed. */
  readonly pushed: boolean;
}

/** A push the remote refused, most often because another run moved the tip. */
class PushRejected extends Error {}

/**
 * Whether the branch has files outside the folder, such as a site's own pages.
 *
 * @param files - The branch's files.
 * @param folder - The action's folder.
 * @returns `true` when one of them is outside.
 */
export function hasFilesOutside(files: readonly string[], folder: string): boolean {
  return files.some((path) => !path.startsWith(`${folder}/`));
}

/**
 * Whether the commit replaces the history with a single orphan commit.
 *
 * @param history - The history policy.
 * @param pruned - Whether retention pruned anything.
 * @param otherFiles - Whether the branch has files outside the folder.
 * @returns `true` to squash.
 */
export function shouldSquash(
  history: HistoryPolicy,
  pruned: boolean,
  otherFiles: boolean,
): boolean {
  if (history === 'squash') return true;
  return history === 'auto' && pruned && !otherFiles;
}

/**
 * One attempt: a fresh repository on the current tip, the run recorded, committed and pushed.
 *
 * @param request - What to publish.
 * @param directory - An empty directory for the repository.
 * @returns What publishing did.
 * @throws When git fails, the push included.
 */
async function attempt(request: PublishRequest, directory: string): Promise<PublishOutcome> {
  const tip = await checkoutTip(directory, request.remote);
  const otherFiles = hasFilesOutside(await trackedFiles(directory), request.folder);
  const outcome = await request.record(join(directory, request.folder));
  if (!request.push) return { outcome, pushed: false };
  const squash = shouldSquash(request.history, outcome.pruned, otherFiles);
  const message = `chore(evalmark): record ${outcome.run.id} [skip ci]`;
  const commit = await commitAll(directory, message, squash ? undefined : tip);
  await push(directory, request.remote, commit, squash ? { expected: tip } : undefined).catch(
    (error: unknown) => {
      throw new PushRejected(String(error));
    },
  );
  return { outcome, pushed: true };
}

/**
 * Waits a little longer on each attempt, with jitter, so racing runs spread out.
 *
 * @param attemptNumber - The attempt that failed, from 1.
 * @returns When the wait is over.
 */
function backoff(attemptNumber: number): Promise<void> {
  const delay = (100 + Math.random() * 400) * attemptNumber;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * One attempt in a fresh temporary directory, removed afterwards.
 *
 * @param request - What to publish.
 * @returns What publishing did.
 * @throws When the attempt fails.
 */
async function attemptInTemporaryDirectory(request: PublishRequest): Promise<PublishOutcome> {
  const directory = await temporaryDirectory('evalmark-');
  try {
    return await attempt(request, directory);
  } finally {
    await removeDirectory(directory);
  }
}

/**
 * Publishes a run, trying again on the new tip when the push loses a race.
 *
 * @param request - What to publish.
 * @returns What publishing did.
 * @throws A failure other than a rejected push, or the last rejection when every attempt was.
 */
export async function publish(request: PublishRequest): Promise<PublishOutcome> {
  const attempts = request.attempts ?? 5;
  for (let number = 1; ; number += 1) {
    try {
      return await attemptInTemporaryDirectory(request);
    } catch (error) {
      if (!(error instanceof PushRejected) || number >= attempts) throw error;
      request.log.info(`The push was rejected (${error.message}). Trying again on the new tip.`);
      await backoff(number);
    }
  }
}
