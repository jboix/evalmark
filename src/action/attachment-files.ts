/**
 * Finding a result's attachment files on disk. A path is relative to the result file and must
 * stay inside its folder, symbolic links included. A file that is not there is reported, not
 * fatal: the run is recorded without it.
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import type { Attachment, Message, Result } from '../format/result.ts';

/** An attachment file found next to the result. */
export interface FoundAttachment {
  /** Its real path on disk, symbolic links resolved. */
  readonly source: string;
  /** Its size in bytes. */
  readonly bytes: number;
  /** The SHA-256 of its content, in lowercase hex. */
  readonly sha256: string;
}

/** Each attachment path of a result, with its file, or `undefined` when the file is missing. */
export type AttachmentFiles = ReadonlyMap<string, FoundAttachment | undefined>;

/** What looking for a result's attachments found. */
export interface LoadedAttachments {
  /** Every path, with its file when it was found. */
  readonly files: AttachmentFiles;
  /** The paths whose file is missing. */
  readonly missing: readonly string[];
}

/** No attachment at all, for a result that has none or a caller that stores none. */
export const noAttachmentFiles: AttachmentFiles = new Map();

/**
 * Every attachment of a list of messages, their tool calls' included.
 *
 * @param messages - The messages.
 * @returns The attachments.
 */
function messageAttachments(messages: readonly Message[]): Attachment[] {
  return messages.flatMap((message) => [
    ...(message.attachments ?? []),
    ...(message.toolCalls ?? []).flatMap((call) => call.attachments ?? []),
  ]);
}

/**
 * Every attachment path of a result, each once.
 *
 * @param result - The result.
 * @returns The paths, in the order they first appear.
 */
export function attachmentPathsOf(result: Result): string[] {
  const attachments = result.cases.flatMap((entry) =>
    entry.trials.flatMap((trial) => [
      ...(trial.attachments ?? []),
      ...messageAttachments(trial.transcript ?? []),
    ]),
  );
  return [...new Set(attachments.map((attachment) => attachment.path))];
}

/**
 * Whether a path, written relative to a folder, names something inside it.
 *
 * @param folder - The folder, absolute.
 * @param path - The path, as written.
 * @returns `false` when it is absolute or climbs out of the folder.
 */
export function staysInside(folder: string, path: string): boolean {
  if (isAbsolute(path) || /^[A-Za-z]:|^[\\/]/.test(path)) return false;
  const inside = relative(folder, resolve(folder, path));
  return inside !== '' && inside !== '..' && !inside.startsWith(`..${sep}`) && !isAbsolute(inside);
}

/**
 * The SHA-256 of a file's content, read as a stream so a large file is never held in memory.
 *
 * @param path - The file.
 * @returns The hash, in lowercase hex.
 */
export async function sha256Of(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

/** What looking for one path found. */
type Lookup =
  | { readonly kind: 'found'; readonly file: FoundAttachment }
  | { readonly kind: 'missing' | 'unsafe' };

/**
 * Looks for one attachment's file.
 *
 * @param folder - The result file's folder, absolute and real.
 * @param path - The attachment's path, as written.
 * @returns The file, or why there is none.
 */
async function lookUp(folder: string, path: string): Promise<Lookup> {
  if (!staysInside(folder, path)) return { kind: 'unsafe' };
  const source = await realpath(resolve(folder, path)).catch(() => undefined);
  if (source === undefined) return { kind: 'missing' };
  if (!staysInside(folder, relative(folder, source))) return { kind: 'unsafe' };
  const info = await stat(source);
  if (!info.isFile()) return { kind: 'missing' };
  return { kind: 'found', file: { source, bytes: info.size, sha256: await sha256Of(source) } };
}

/**
 * Finds every attachment file of a result.
 *
 * @param result - The result.
 * @param folder - The result file's folder.
 * @returns Each path's file, and the paths whose file is missing.
 * @throws When a path is absolute or leads outside the folder, with every such path listed.
 */
export async function loadAttachments(result: Result, folder: string): Promise<LoadedAttachments> {
  const real = await realpath(resolve(folder));
  const files = new Map<string, FoundAttachment | undefined>();
  const missing: string[] = [];
  const unsafe: string[] = [];
  for (const path of attachmentPathsOf(result)) {
    const found = await lookUp(real, path);
    if (found.kind === 'unsafe') unsafe.push(path);
    if (found.kind === 'missing') missing.push(path);
    files.set(path, found.kind === 'found' ? found.file : undefined);
  }
  if (unsafe.length > 0) {
    const list = unsafe.map((path) => `- ${path}`).join('\n');
    throw new Error(
      `These attachment paths are not inside the result file's folder (${folder}). Write them relative to it, without \`..\` or links that lead out:\n${list}`,
    );
  }
  return { files, missing };
}
