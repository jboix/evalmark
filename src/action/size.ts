/**
 * The folder's size: measured after each recording, reported in the job summary, and warned
 * about above `warn-size-mb`, with the inputs that make it smaller.
 */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pruned } from './retention.ts';

/** What the size line reports. */
export interface SizeReport {
  /** The folder, as the inputs name it. */
  readonly folder: string;
  /** Its size in bytes after recording. */
  readonly folderBytes: number;
  /** The bytes this run added. */
  readonly addedBytes: number;
  /** The size in megabytes above which the action warns; `0` never warns. */
  readonly warnSizeMb: number;
  /** What retention pruned. */
  readonly pruned: Pruned;
}

/** A megabyte, as disks count it. */
const megabyte = 1_000_000;

/**
 * The size of every file under a folder, in bytes.
 *
 * @param folder - The folder.
 * @returns The sum of the sizes of its files, `0` when it does not exist.
 */
export async function folderSize(folder: string): Promise<number> {
  const entries = await readdir(folder, { recursive: true, withFileTypes: true }).catch(() => []);
  let total = 0;
  for (const entry of entries.filter((item) => item.isFile())) {
    total += (await stat(join(entry.parentPath, entry.name))).size;
  }
  return total;
}

/**
 * A size in bytes, for a reader: `950 B`, `12.3 kB`, `4.5 MB`, `1.2 GB`.
 *
 * @param bytes - The size.
 * @returns The text.
 */
export function formatBytes(bytes: number): string {
  const units = ['kB', 'MB', 'GB', 'TB'];
  if (bytes < 1000) return `${bytes} B`;
  let value = bytes / 1000;
  let unit = 0;
  for (; value >= 1000 && unit < units.length - 1; unit += 1) value /= 1000;
  return `${value >= 100 ? Math.round(value) : Number(value.toFixed(1))} ${units[unit]}`;
}

/**
 * A count with its noun, singular or plural.
 *
 * @param count - The count.
 * @param noun - The noun, singular.
 * @returns The text, such as `1 run` or `3 runs`.
 */
function counted(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * What retention pruned, in words.
 *
 * @param pruned - What it pruned.
 * @returns The text, such as `2 runs, the transcripts of 1 run`, or `nothing`.
 */
export function prunedText(pruned: Pruned): string {
  const parts = [
    pruned.runs > 0 ? counted(pruned.runs, 'run') : '',
    pruned.transcripts > 0 ? `the transcripts of ${counted(pruned.transcripts, 'run')}` : '',
    pruned.attachments > 0 ? `the attachments of ${counted(pruned.attachments, 'run')}` : '',
    pruned.files > 0 ? counted(pruned.files, 'attachment file') : '',
  ].filter((part) => part !== '');
  return parts.length === 0 ? 'nothing' : parts.join(', ');
}

/**
 * The summary's last line: the folder's size, the threshold, what the run added and what
 * retention pruned.
 *
 * @param report - What it reports.
 * @returns The line.
 */
export function sizeLine(report: SizeReport): string {
  const threshold =
    report.warnSizeMb === 0
      ? 'no size warning'
      : `warning above ${formatBytes(report.warnSizeMb * megabyte)}`;
  return [
    `The \`${report.folder}\` folder is ${formatBytes(report.folderBytes)} (${threshold}).`,
    `This run added ${formatBytes(report.addedBytes)}.`,
    `Retention pruned ${prunedText(report.pruned)}.`,
  ].join(' ');
}

/**
 * The warning when the folder is above the threshold.
 *
 * @param report - What the size line reports.
 * @returns The warning, or `undefined` when the folder is within it or the threshold is `0`.
 */
export function sizeWarning(report: SizeReport): string | undefined {
  const limit = report.warnSizeMb * megabyte;
  if (limit === 0 || report.folderBytes <= limit) return undefined;
  return [
    `The \`${report.folder}\` folder is ${formatBytes(report.folderBytes)}, above \`warn-size-mb\` (${formatBytes(limit)}).`,
    'To make it smaller, lower `keep-runs`, `keep-transcripts` or `keep-attachments`, or set `attachments: none`.',
  ].join(' ');
}
