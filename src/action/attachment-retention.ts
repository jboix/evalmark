/**
 * Retention of attachment files. A run past `keep-attachments` loses its files: its trials and
 * transcripts keep each attachment's media type, caption and size, without `file`. Files are
 * shared by content across runs, so a file is deleted only once no kept run points to it.
 */
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { attachmentsFolder, type Run, type StoredMessage } from '../format/store.ts';
import { transcriptWithoutFiles, unattached } from './attachment-store.ts';

/**
 * Whether a run still points to attachment files.
 *
 * @param run - The run.
 * @returns `true` when its trials or transcripts point to one.
 */
export function hasAttachmentFiles(run: Run): boolean {
  return (run.attachmentFiles?.length ?? 0) > 0;
}

/**
 * The attachment files a run's trials point to, transcripts left out.
 *
 * @param run - The run.
 * @returns The files, each once, sorted.
 */
export function trialAttachmentFiles(run: Run): string[] {
  const files = run.cases.flatMap((entry) =>
    entry.trials.flatMap((trial) => (trial.attachments ?? []).map((attachment) => attachment.file)),
  );
  return [...new Set(files.filter((file) => file !== undefined))].sort();
}

/**
 * A run whose attachments no longer point to files.
 *
 * @param run - The run.
 * @returns The run, every trial attachment without `file`, and no `attachmentFiles`.
 */
export function withoutAttachmentFiles(run: Run): Run {
  const { attachmentFiles: _dropped, ...rest } = run;
  return {
    ...rest,
    cases: run.cases.map((entry) => ({
      ...entry,
      trials: entry.trials.map(unattached),
    })),
  };
}

/**
 * Rewrites a run's kept transcripts so their attachments no longer point to files.
 *
 * @param folder - The action's folder on disk.
 * @param run - The run, as it is kept.
 * @returns When every transcript is rewritten. A transcript that cannot be read is left as it is.
 */
export async function unattachTranscripts(folder: string, run: Run): Promise<void> {
  const paths = run.cases.flatMap((entry) => entry.trials.map((trial) => trial.transcript));
  for (const path of paths.filter((entry) => entry !== undefined)) {
    try {
      const file = join(folder, path);
      const messages = JSON.parse(gunzipSync(await readFile(file)).toString()) as StoredMessage[];
      await writeFile(file, gzipSync(JSON.stringify(transcriptWithoutFiles(messages))));
    } catch {
      // A missing or broken transcript has no files to unlink.
    }
  }
}

/**
 * Deletes every attachment file no kept run points to.
 *
 * @param folder - The action's folder on disk.
 * @param kept - The runs kept, as they are kept.
 * @returns How many files it deleted.
 */
export async function sweepAttachments(folder: string, kept: readonly Run[]): Promise<number> {
  const used = new Set(kept.flatMap((run) => run.attachmentFiles ?? []));
  const names = await readdir(join(folder, attachmentsFolder)).catch(() => [] as string[]);
  const unused = names.filter((name) => !used.has(`${attachmentsFolder}/${name}`));
  for (const name of unused) {
    await rm(join(folder, attachmentsFolder, name), { force: true, recursive: true });
  }
  return unused.length;
}
