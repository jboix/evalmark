/**
 * Building a stored run from a result: statuses, totals, transcripts moved out of the trials into
 * their own files as the transcript policy keeps them, and attachments pointing to files named by
 * their content as the attachments policy keeps them.
 */
import type { Case, Result, Trial } from '../format/result.ts';
import {
  type Run,
  type Source,
  type StoredCase,
  type StoredMessage,
  type StoredTrial,
  storeVersion,
  transcriptPath,
} from '../format/store.ts';
import { lettersOf, statusOfLetters, totalsOf } from '../format/totals.ts';
import type { AttachmentFiles } from './attachment-files.ts';
import {
  type AttachmentContext,
  type AttachmentCopies,
  keepsAttachments,
  storedAttachments,
  storedTranscript,
} from './attachment-store.ts';
import type { AttachmentPolicy, TranscriptPolicy } from './inputs.ts';

/** Everything a run is built from. */
export interface RunDraft {
  /** The result, validated, labelled and redacted. */
  readonly result: Result;
  /** The run's id. The store adds a suffix when the branch has a run with that id already. */
  readonly id: string;
  /** The suite's name. */
  readonly suite: string;
  /** Where it came from. */
  readonly source: Source;
  /** When it is recorded, as an ISO time. */
  readonly recordedAt: string;
  /** Which transcripts to keep. */
  readonly transcripts: TranscriptPolicy;
  /** Which trials keep their attachment files. */
  readonly attachments: AttachmentPolicy;
  /** The attachment files found next to the result, by path. */
  readonly attachmentFiles: AttachmentFiles;
}

/** A transcript to write, gzipped, at its path. */
export interface TranscriptFile {
  /** Its path, relative to the folder. */
  readonly path: string;
  /** The trial's messages. */
  readonly messages: readonly StoredMessage[];
}

/** An attachment file to copy into the folder. */
export interface AttachmentCopy {
  /** Its path, relative to the folder. */
  readonly path: string;
  /** The file on disk it is copied from. */
  readonly source: string;
}

/** A run ready to store: the run file's content, the transcripts and the attachments to write. */
export interface BuiltRun {
  /** The run. */
  readonly run: Run;
  /** Its kept transcripts. */
  readonly transcripts: readonly TranscriptFile[];
  /** Its kept attachment files, each once. */
  readonly attachments: readonly AttachmentCopy[];
}

/** What building the cases collects besides them. */
interface Collected {
  /** The kept transcripts. */
  readonly transcripts: TranscriptFile[];
  /** The kept attachment files. */
  readonly copies: AttachmentCopies;
}

/**
 * Whether a trial's transcript is kept.
 *
 * @param trial - The trial.
 * @param policy - The transcript policy.
 * @returns `true` when it has a transcript the policy keeps.
 */
export function keepsTranscript(trial: Trial, policy: TranscriptPolicy): boolean {
  if (!trial.transcript || trial.transcript.length === 0) return false;
  if (policy === 'all') return true;
  return policy === 'failed' && trial.status !== 'pass';
}

/**
 * Builds a trial as stored, collecting its kept transcript and attachment files.
 *
 * @param trial - The trial.
 * @param path - Where its transcript goes when it is kept.
 * @param draft - The draft, for the policies and the files.
 * @param collected - Where the transcripts and the files are added.
 * @returns The stored trial.
 */
function storedTrial(
  trial: Trial,
  path: string,
  draft: RunDraft,
  collected: Collected,
): StoredTrial {
  const { transcript, attachments, ...rest } = trial;
  const context: AttachmentContext = {
    files: draft.attachmentFiles,
    keep: keepsAttachments(trial, draft.attachments),
    copies: collected.copies,
  };
  const own =
    attachments === undefined
      ? rest
      : { ...rest, attachments: storedAttachments(attachments, context) };
  if (transcript === undefined) return own;
  if (!keepsTranscript(trial, draft.transcripts)) {
    return { ...own, transcriptMessages: transcript.length };
  }
  collected.transcripts.push({ path, messages: storedTranscript(transcript, context) });
  return { ...own, transcript: path, transcriptMessages: transcript.length };
}

/**
 * Builds a case as stored, collecting the transcripts and attachment files it keeps.
 *
 * @param entry - The case.
 * @param draft - The draft, for the id, the policies and the files.
 * @param collected - Where the transcripts and the files are added.
 * @returns The stored case.
 */
function storedCase(entry: Case, draft: RunDraft, collected: Collected): StoredCase {
  const trials = entry.trials.map((trial, index) =>
    storedTrial(trial, transcriptPath(draft.id, entry.id, index), draft, collected),
  );
  return { ...entry, trials, status: statusOfLetters(lettersOf(entry.trials)) };
}

/**
 * Builds the run from its draft.
 *
 * @param draft - The draft.
 * @returns The run, and the transcripts and attachment files to write.
 */
export function buildRun(draft: RunDraft): BuiltRun {
  const { result } = draft;
  const collected: Collected = { transcripts: [], copies: new Map() };
  const cases = result.cases.map((entry) => storedCase(entry, draft, collected));
  const files = [...collected.copies.keys()].sort();
  const run: Run = {
    version: storeVersion,
    id: draft.id,
    suite: draft.suite,
    recordedAt: draft.recordedAt,
    startedAt: new Date(result.startedAt ?? draft.recordedAt).toISOString(),
    labels: result.labels ?? {},
    source: draft.source,
    totals: totalsOf(result.cases, result.durationMs),
    cases,
    ...(files.length === 0 ? {} : { attachmentFiles: files }),
  };
  const attachments = files.map((path) => ({ path, source: collected.copies.get(path) ?? '' }));
  return { run, transcripts: collected.transcripts, attachments };
}
