/**
 * The stored format: what the action keeps on the data branch and the dashboard reads. Inside the
 * folder the action owns, `data/index.json` lists every run with a compact summary, each run lives
 * in `data/runs/<id>.json`, kept transcripts in `data/transcripts/`, gzipped, and kept attachments
 * in `data/attachments/`, named by their content. The index is
 * always rebuilt from the run files, so two runs recorded at once never conflict.
 */
import type { Attachment, Case, Message, ToolCall, Trial } from './result.ts';

/** The version of the stored format this code writes and reads. */
export const storeVersion = 1;

/** Where a run came from: the commit, the branch and the workflow run, when known. */
export interface Source {
  /** The repository, as `owner/name`. */
  readonly repository?: string;
  /** The commit's full SHA. */
  readonly commit?: string;
  /** The branch the run tested: the head branch for a pull request. */
  readonly branch?: string;
  /** The pull request's number, for a run on a pull request. */
  readonly pullRequest?: number;
  /** The event that started the workflow, such as `push`. */
  readonly event?: string;
  /** The address of the workflow run. */
  readonly runUrl?: string;
  /** Who started it. */
  readonly actor?: string;
}

/** The totals of a run, computed from its cases. */
export interface Totals {
  /** How many cases ran. */
  readonly cases: number;
  /** How many cases passed every trial that ran. */
  readonly casesPassed: number;
  /** How many cases both passed and failed trials. */
  readonly casesFlaky: number;
  /** How many cases passed no trial. */
  readonly casesFailed: number;
  /** How many trials ran, skipped ones included. */
  readonly trials: number;
  /** How many trials passed. */
  readonly passed: number;
  /** How many trials failed a check. */
  readonly failed: number;
  /** How many trials ended in an error. */
  readonly errored: number;
  /** How many trials were skipped. */
  readonly skipped: number;
  /** Passed trials over trials that ran and were not skipped, from 0 to 1; `null` when none ran. */
  readonly passRate: number | null;
  /** Input tokens over all trials. */
  readonly inputTokens: number;
  /** Output tokens over all trials. */
  readonly outputTokens: number;
  /** Cost in US dollars over all trials. */
  readonly costUsd: number;
  /** The run's duration: the result's own, or else the sum of its trials'. */
  readonly durationMs: number;
}

/** A case's status over its trials. */
export type CaseStatus = 'pass' | 'fail' | 'flaky' | 'skip';

/**
 * An attachment as stored. The file is named by the SHA-256 of its content, so an image repeated
 * across trials and runs is stored once. `file` is gone once retention prunes it; the rest stays.
 */
export interface StoredAttachment {
  /** The file's path, relative to the folder, while it is kept. */
  readonly file?: string;
  /** Its media type. */
  readonly mediaType: Attachment['mediaType'];
  /** Its caption. */
  readonly caption?: string;
  /** Its size in bytes; `0` when the file was missing. */
  readonly bytes: number;
  /** Set when the result named a file that was not there, so no file was ever stored. */
  readonly missing?: true;
}

/** A tool call as stored: its attachments are stored ones. */
export type StoredToolCall = Omit<ToolCall, 'attachments'> & {
  /** Its attachments. */
  readonly attachments?: readonly StoredAttachment[];
};

/** A message as stored, in a transcript file: its tool calls and attachments are stored ones. */
export type StoredMessage = Omit<Message, 'attachments' | 'toolCalls'> & {
  /** Its tool calls. */
  readonly toolCalls?: readonly StoredToolCall[];
  /** Its attachments. */
  readonly attachments?: readonly StoredAttachment[];
};

/** A trial as stored: its transcript moves to its own file, or is dropped by retention. */
export type StoredTrial = Omit<Trial, 'transcript' | 'attachments'> & {
  /** Its own attachments, such as the final screenshot. */
  readonly attachments?: readonly StoredAttachment[];
  /** The transcript's path, relative to the folder, while it is kept. */
  readonly transcript?: string;
  /** How many messages the transcript had, kept after the transcript itself is pruned. */
  readonly transcriptMessages?: number;
};

/** A case as stored, with its status. */
export type StoredCase = Omit<Case, 'trials'> & {
  /** Its trials. */
  readonly trials: readonly StoredTrial[];
  /** Its status over them. */
  readonly status: CaseStatus;
};

/** One recorded run: `data/runs/<id>.json`. */
export interface Run {
  /** The stored format's version. */
  readonly version: typeof storeVersion;
  /** Its id, unique on the branch and safe in a path. */
  readonly id: string;
  /** The suite's name. */
  readonly suite: string;
  /** When the action recorded it. */
  readonly recordedAt: string;
  /** When it started: the result's own time, or else the time it was recorded. */
  readonly startedAt: string;
  /** Labels to group and compare runs by, such as `model`. */
  readonly labels: Readonly<Record<string, string>>;
  /** Where it came from. */
  readonly source: Source;
  /** Its totals. */
  readonly totals: Totals;
  /** Its cases. */
  readonly cases: readonly StoredCase[];
  /**
   * Every attachment file its trials and kept transcripts point to, while they are kept. Retention
   * reads it to know which files a run still uses, without opening its transcripts.
   */
  readonly attachmentFiles?: readonly string[];
}

/**
 * A run in the index: everything but the cases' details. Each case keeps one letter per trial, `P`
 * pass, `F` fail, `E` error, `S` skip, which is enough for trends, histories and flaky cases.
 */
export interface RunSummary {
  /** The run's id. */
  readonly id: string;
  /** When it was recorded. */
  readonly recordedAt: string;
  /** When it started. */
  readonly startedAt: string;
  /** Its labels. */
  readonly labels: Readonly<Record<string, string>>;
  /** Where it came from. */
  readonly source: Source;
  /** Its totals. */
  readonly totals: Totals;
  /** Each case's trials, as letters, by case id. */
  readonly cases: Readonly<Record<string, string>>;
  /** Whether any of its transcripts are still kept. */
  readonly transcripts: boolean;
}

/** What the index knows of a case, from the latest run that had it. */
export interface CaseInfo {
  /** Its title. */
  readonly title?: string;
  /** Its tags. */
  readonly tags?: readonly string[];
}

/** `data/index.json`: every run, newest first. */
export interface StoreIndex {
  /** The stored format's version. */
  readonly version: typeof storeVersion;
  /** The suite's name. */
  readonly suite: string;
  /** When the index was last written. */
  readonly updatedAt: string;
  /** Every kept run, newest first by start time. */
  readonly runs: readonly RunSummary[];
  /** Every case seen in a kept run, by id. */
  readonly cases: Readonly<Record<string, CaseInfo>>;
}

/** The letter for each trial status in a run summary. */
export const trialLetters = { pass: 'P', fail: 'F', error: 'E', skip: 'S' } as const;

/** The folder, inside the action's folder, that holds the data. */
export const dataFolder = 'data';

/** The index's path, relative to the action's folder. */
export const indexPath = `${dataFolder}/index.json`;

/**
 * A run file's path, relative to the action's folder.
 *
 * @param runId - The run's id.
 * @returns The path.
 */
export function runPath(runId: string): string {
  return `${dataFolder}/runs/${runId}.json`;
}

/**
 * Turns any id into a name safe in a path and a URL: letters, digits, dot, dash and underscore stay,
 * anything else becomes `_` followed by its code point, so different ids never share a name.
 *
 * @param id - The id, such as a case id.
 * @returns The safe name.
 */
export function pathSafe(id: string): string {
  return Array.from(id, (character) =>
    /[A-Za-z0-9.-]/.test(character) ? character : `_${character.codePointAt(0)?.toString(16)}`,
  ).join('');
}

/**
 * The folder holding a run's transcripts, relative to the action's folder.
 *
 * @param runId - The run's id.
 * @returns The path.
 */
export function transcriptsFolder(runId: string): string {
  return `${dataFolder}/transcripts/${runId}`;
}

/**
 * A transcript's path, relative to the action's folder. The file is gzipped JSON: the trial's
 * messages (`StoredMessage[]`), as the result file had them but with stored attachments.
 *
 * @param runId - The run's id.
 * @param caseId - The case's id.
 * @param trial - The trial's index, from 0.
 * @returns The path.
 */
export function transcriptPath(runId: string, caseId: string, trial: number): string {
  return `${transcriptsFolder(runId)}/${pathSafe(caseId)}/${trial}.json.gz`;
}

/** The file extension of each attachment type. */
const attachmentExtensions: Readonly<Record<Attachment['mediaType'], string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** The folder holding the attachment files, relative to the action's folder. */
export const attachmentsFolder = `${dataFolder}/attachments`;

/**
 * An attachment's path, relative to the action's folder: one file per distinct content.
 *
 * @param sha256 - The SHA-256 of its content, in lowercase hex.
 * @param mediaType - Its media type.
 * @returns The path.
 */
export function attachmentPath(sha256: string, mediaType: Attachment['mediaType']): string {
  return `${attachmentsFolder}/${sha256}.${attachmentExtensions[mediaType]}`;
}

/**
 * How the dashboard names itself: `data/branding.json`, written on every run from the action's
 * inputs, so changing them takes effect on the next run.
 */
export interface Branding {
  /** The name in the header and the browser tab, such as `evalmark`. */
  readonly title: string;
  /** The line under the name, such as `eval dashboard`. */
  readonly subtitle: string;
  /** The logo's path, relative to the folder, when the project gave one. */
  readonly logo?: string;
}

/** The branding the dashboard shows when the project gives none. */
export const defaultBranding: Branding = { title: 'evalmark', subtitle: 'eval dashboard' };

/** The branding file's path, relative to the action's folder. */
export const brandingPath = `${dataFolder}/branding.json`;

/** The folder the project's logo is copied into, relative to the action's folder. */
export const brandingFolder = `${dataFolder}/branding`;
